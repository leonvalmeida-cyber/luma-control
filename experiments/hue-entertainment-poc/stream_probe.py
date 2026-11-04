#!/usr/bin/env python3
"""Isolated, opt-in Hue Entertainment prototype for a Windows development PC.

Does not access Luma browser storage, send audio, or edit the production application.
The default action is read-only discovery; --run is required for any light changes.
"""
from __future__ import annotations

import argparse
import asyncio
from dataclasses import dataclass
import ipaddress
import os
import statistics
import time


@dataclass(frozen=True)
class RGB:
    red: int
    green: int
    blue: int


WARM = RGB(17000, 7600, 2600)
TEAL = RGB(1700, 17000, 14000)
VIOLET = RGB(8200, 2000, 16500)
COLORS = (WARM, TEAL, VIOLET)
SECTION_SECONDS = 3.0
FADE_SECONDS = 0.35
FRAME_RATE = 25
TOTAL_SECONDS = SECTION_SECONDS * len(COLORS)


def private_bridge_ip(value: str) -> str:
    try:
        address = ipaddress.ip_address(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("Bridge-IP ist ungültig.") from error
    if address.version != 4 or not address.is_private or address.is_loopback or address.is_link_local:
        raise argparse.ArgumentTypeError("Bitte eine lokale private IPv4-Adresse verwenden.")
    return str(address)


def interpolate(a: RGB, b: RGB, fraction: float) -> RGB:
    t = min(1.0, max(0.0, fraction))
    t = t * t * (3.0 - 2.0 * t)  # Smooth, visually gentle transition.
    return RGB(*(round(start + (end - start) * t) for start, end in
                 zip((a.red, a.green, a.blue), (b.red, b.green, b.blue))))


def color_at(elapsed: float) -> RGB:
    segment = min(int(max(0.0, elapsed) / SECTION_SECONDS), len(COLORS) - 1)
    start = COLORS[max(0, segment - 1)]
    target = COLORS[segment]
    if segment == 0:
        return target
    local = elapsed - segment * SECTION_SECONDS
    return interpolate(start, target, local / FADE_SECONDS)


def read_options() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Luma Hue Entertainment (test only)")
    parser.add_argument("--host", type=private_bridge_ip, required=True, help="Lokale IP der Hue Bridge")
    parser.add_argument("--pair", action="store_true", help="Neuen Entertainment-Zugang mit Bridge-Knopf koppeln")
    parser.add_argument("--area", help="Genauer Name des vorhandenen Entertainment-Bereichs")
    parser.add_argument("--run", action="store_true", help="Opt-in: 9 Sekunden sanfte Farbsequenz streamen")
    options = parser.parse_args()
    if options.run and not options.area:
        parser.error("--run erfordert --area, damit kein anderer Bereich versehentlich verändert wird.")
    return options


async def execute(options: argparse.Namespace) -> None:
    # Import lazily so offline unit tests need no third-party packages.
    from hue_entertainment import EntertainmentSession, HueEntertainmentAPI, LightColorCommand

    if options.pair:
        print("Bitte jetzt den Kopplungsknopf der Bridge drücken.")
        print("Es wird ein neuer Schlüssel nur für diese Laufzeit erzeugt und nicht gespeichert.")
        api = HueEntertainmentAPI(options.host)
        try:
            credentials = await api.pair(device_type="luma_stream_probe#Windows")
        finally:
            await api.close()
        key, client_key = credentials["username"], credentials["clientkey"]
    else:
        key = os.environ.get("LUMA_HUE_APP_KEY", "")
        client_key = os.environ.get("LUMA_HUE_CLIENT_KEY", "")
        if not key or not client_key:
            raise RuntimeError(
                "Keine Schlüssel gefunden: bitte --pair verwenden (Bridge-Knopf) oder "
                "beide Umgebungsvariablen LUMA_HUE_APP_KEY und LUMA_HUE_CLIENT_KEY setzen. "
                "Ein bisheriger Luma-Web-App-Schlüssel alleine reicht für DTLS nicht."
            )

    session = EntertainmentSession(options.host, key, client_key, idle_timeout=0)
    try:
        areas = await session.get_entertainment_areas()
        if not areas:
            print("Keine Entertainment-Bereiche gefunden. In der offiziellen Hue-App prüfen.")
            return

        print("\nEntertainment-Bereiche auf dieser Bridge:")
        for area in areas:
            names = ", ".join(c.name for c in area.channels) or "keine Lampen"
            print(f"  • {area.name}: {len(area.channels)} Kanäle ({names})")

        if not options.run:
            print("\nNur lesend geprüft. Für einen Lichttest zusätzlich --run --area \"TV-Bereich\" verwenden.")
            return

        matches = [area for area in areas if area.name.casefold() == options.area.casefold()]
        if len(matches) != 1:
            raise RuntimeError("Bereich nicht eindeutig gefunden. Die Bezeichnung oben exakt übernehmen.")
        area = matches[0]
        if not area.channels:
            raise RuntimeError("Der gewählte Bereich hat keine Entertainment-Kanäle.")

        print(f"\nTest startet nur im Bereich: {area.name}")
        print("Ein anderer aktiver Entertainment-Stream wird NICHT automatisch gestoppt.")
        print("WARM → TÜRKIS → VIOLETT; sanfte Übergänge, kein Stroboeffekt.")
        handshake_start = time.perf_counter()
        await session.start(area.id, stop_others=False)
        handshake_ms = (time.perf_counter() - handshake_start) * 1000
        print(f"DTLS-Handshake und Aktivierung: {handshake_ms:.0f} ms")

        interval = 1.0 / FRAME_RATE
        times = []
        start = time.perf_counter()
        next_frame = start
        last = start
        total = int(TOTAL_SECONDS * FRAME_RATE)
        try:
            for i in range(total):
                await asyncio.sleep(max(0.0, next_frame - time.perf_counter()))
                sent_at = time.perf_counter()
                if i > 0:
                    times.append((sent_at - last) * 1000)
                last = sent_at
                color = color_at(sent_at - start)
                commands = [
                    LightColorCommand(
                        channel_id=channel.channel_id,
                        red=color.red, green=color.green, blue=color.blue
                    ) for channel in area.channels
                ]
                session.send(commands)
                next_frame += interval
        finally:
            await session.stop()  # Always release the bridge's stream.
        print(f"Gesendet: {total} Frames")
        if times:
            print(f"Frame-Abstand lokal: Mittelwert {statistics.mean(times):.1f} ms, "
                  f"Maximum {max(times):.1f} ms")
        print("WICHTIG: Dies misst nur Software-Timing, NICHT die sichtbare Lampenlatenz.")
        print("Für die echte Reaktionszeit brauchen wir Video-/Lichtsensor-Messung.")
    finally:
        await session.aclose()


def main() -> None:
    options = read_options()
    try:
        asyncio.run(execute(options))
    except KeyboardInterrupt:
        print("\nTest abgebrochen; Stream wird beim Beenden freigegeben.")
    except Exception as error:
        print(f"Test nicht abgeschlossen: {error.__class__.__name__}: {error}")
        raise SystemExit(1) from None


if __name__ == "__main__":
    main()
