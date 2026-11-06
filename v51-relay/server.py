"""Luma Flow V5.1 – one integrated home UI with secure-to-Bridge Hue DTLS.
The iPhone analyzes a local file. Only nine RGB frames reach this PC relay.
HTTP access to the private LAN relay is intended for trusted home networks only.
"""
import asyncio
from contextlib import suppress
import os
from pathlib import Path
import secrets
import re
import socket
import time

import aiohttp
from aiohttp import web
from hue_entertainment import EntertainmentSession, LightColorCommand

AREA_ID = "f24e7871-0282-42c2-99e0-147439c13759"
PORT = 8765
MAX_STREAM_SECONDS = 65
FRAME_IDLE_SECONDS = 3.0
ARM_SECONDS = 20.0

class Relay:
    def __init__(self):
        self.host = os.environ["LUMA_BRIDGE"]
        self.app_key = os.environ["LUMA_APP_KEY"]
        self.client_key = os.environ["LUMA_CLIENT_KEY"]
        # Optional stable, DPAPI-protected Windows token from start-luma.ps1.
        # Fallback remains a random per-run token for the manual test workflow.
        saved_token = os.environ.get("LUMA_ACCESS_TOKEN", "")
        if saved_token and not re.fullmatch(r"[A-Za-z0-9_-]{40,128}", saved_token):
            raise ValueError("LUMA_ACCESS_TOKEN muss ein sicherer Base64-URL-Token sein")
        self.token = saved_token or secrets.token_urlsafe(32)
        self.lock = asyncio.Lock()
        self.session = None
        self.channel_ids = []
        self.started = 0.0
        self.last_frame = None
        self.last_accepted = 0.0
        self.count = 0
        self.last_reason = "Bereit"
        self.watchdog_task = None

    async def stop(self, reason):
        async with self.lock:
            await self._stop_locked(reason)

    async def _stop_locked(self, reason):
        old = self.session
        self.session = None
        self.channel_ids = []
        self.last_frame = None
        self.last_reason = reason
        if old is not None:
            try:
                await old.aclose()
                print("Stream beendet:", reason, flush=True)
            except Exception as exc:
                print("Warnung beim Schließen:", type(exc).__name__, str(exc)[:160], flush=True)

    async def watchdog(self):
        while True:
            await asyncio.sleep(0.5)
            now = time.monotonic()
            if self.session is not None:
                age = now - self.started
                stale = (self.last_frame is None and age > ARM_SECONDS) or (
                    self.last_frame is not None and now - self.last_frame > FRAME_IDLE_SECONDS
                )
                if age >= MAX_STREAM_SECONDS or stale:
                    await self.stop("Zeitlimit oder Datenpause")

def protected(request):
    relay = request.app["relay"]
    token = request.headers.get("X-Luma-Token") or request.query.get("t", "")
    if not secrets.compare_digest(token, relay.token):
        raise web.HTTPForbidden(text="Kein Zugriff")
    return relay

async def home(request):
    relay = protected(request)
    # A protected per-user manifest preserves the token in a Home Screen launch.
    # Never put the token into a public static manifest.
    source = Path(__file__).resolve().parents[1] / "flow-v50" / "index.html"
    html = source.read_text(encoding="utf-8")
    original_manifest = '<link rel="manifest" href="../app.webmanifest">'
    if original_manifest not in html:
        raise web.HTTPInternalServerError(text="V5.0-Manifest-Verknüpfung nicht gefunden")
    html = html.replace(
        original_manifest,
        '<link rel="manifest" href="/app-v51.webmanifest?t=' + relay.token + '">',
        1,
    )
    response = web.Response(text=html, content_type="text/html", charset="utf-8")
    response.headers["Cache-Control"] = "no-store"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self' blob:; connect-src 'self'; "
        "media-src 'self' blob:; script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
        "object-src 'none'; base-uri 'self'"
    )
    return response

async def manifest(request):
    relay = protected(request)
    response = web.json_response(
        {
            "id": "/luma-flow-v51",
            "name": "Luma Flow V5.1",
            "short_name": "Luma",
            "start_url": "/?t=" + relay.token,
            "scope": "/",
            "display": "standalone",
            "background_color": "#0b0e18",
            "theme_color": "#101322",
            "icons": [
                {
                    "src": "/icon.svg",
                    "sizes": "any",
                    "type": "image/svg+xml",
                    "purpose": "any"
                }
            ]
        },
        content_type="application/manifest+json",
    )
    response.headers["Cache-Control"] = "no-store"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response

async def start(request):
    relay = protected(request)
    async with relay.lock:
        if relay.session is not None:
            raise web.HTTPConflict(text="Stream läuft bereits")
        session = EntertainmentSession(relay.host, relay.app_key, relay.client_key)
        try:
            areas = await session.get_entertainment_areas()
            area = next((a for a in areas if a.id == AREA_ID), None)
            if area is None:
                raise web.HTTPNotFound(text="Hue-Musikbereich nicht gefunden")
            channel_ids = [channel.channel_id for channel in area.channels]
            if len(channel_ids) != 9:
                raise web.HTTPConflict(text="Erwartet 9 Hue-Kanäle, gefunden: " + str(len(channel_ids)))
            await session.start(area.id)
        except Exception:
            await session.aclose()
            raise
        relay.session = session
        relay.channel_ids = channel_ids
        relay.started = time.monotonic()
        relay.last_frame = None
        relay.last_accepted = 0.0
        relay.count = 0
        relay.last_reason = "Aktiv"
    print("Entertainment-Stream aktiviert: 9 Kanäle", flush=True)
    return web.json_response({"ok": True, "channels": 9, "limitSeconds": 60})

async def frame(request):
    relay = protected(request)
    if relay.session is None:
        raise web.HTTPConflict(text="Stream nicht gestartet")
    try:
        data = await request.json()
        colors = data["colors"]
        if not isinstance(colors, list) or len(colors) != len(relay.channel_ids):
            raise ValueError("Falsche Kanalzahl")
        triples = []
        for rgb in colors:
            if not isinstance(rgb, list) or len(rgb) != 3:
                raise ValueError("RGB muss 3 Werte haben")
            if not all(type(value) is int and 0 <= value <= 65535 for value in rgb):
                raise ValueError("RGB außerhalb 0–65535")
            triples.append(rgb)
    except (ValueError, TypeError, KeyError, web.HTTPBadRequest):
        raise web.HTTPBadRequest(text="Ungültige Farbdaten")
    now = time.monotonic()
    async with relay.lock:
        if relay.session is None:
            raise web.HTTPConflict(text="Stream beendet")
        if now - relay.started >= MAX_STREAM_SECONDS:
            await relay._stop_locked("Zeitlimit")
            raise web.HTTPConflict(text="Zeitlimit erreicht")
        if now - relay.last_accepted >= 0.028:
            commands = [
                LightColorCommand(channel_id=channel, red=rgb[0], green=rgb[1], blue=rgb[2])
                for channel, rgb in zip(relay.channel_ids, triples)
            ]
            relay.session.send(commands)
            relay.last_accepted = now
            relay.count += 1
        relay.last_frame = now
    return web.json_response({"ok": True})

async def stop(request):
    relay = protected(request)
    await relay.stop("Vom iPhone gestoppt")
    return web.json_response({"ok": True})

async def status(request):
    relay = protected(request)
    return web.json_response({"active": relay.session is not None, "frames": relay.count, "reason": relay.last_reason})

async def bridge_info(request):
    relay = protected(request)
    return web.json_response({"bridge": relay.host, "mode": "local-relay"})

async def bridge_proxy(request):
    relay = protected(request)
    tail = request.match_info["tail"]
    if request.method == "GET":
        if tail not in ("lights", "groups", "config"):
            raise web.HTTPForbidden(text="Dieser Lesepfad ist gesperrt")
        payload = None
    elif request.method == "PUT":
        import re
        if not re.fullmatch(r"lights/[0-9]{1,3}/state", tail):
            raise web.HTTPForbidden(text="Dieser Schreibpfad ist gesperrt")
        try:
            payload = await request.json()
            if not isinstance(payload, dict):
                raise ValueError("Ungültiger Befehlsinhalt")
        except (ValueError, TypeError):
            raise web.HTTPBadRequest(text="Ungültige JSON-Daten")
    else:
        raise web.HTTPMethodNotAllowed(request.method, ["GET", "PUT"])
    address = "https://" + relay.host + "/api/" + relay.app_key + "/" + tail
    try:
        timeout = aiohttp.ClientTimeout(total=9)
        async with aiohttp.ClientSession(timeout=timeout) as client:
            async with client.request(request.method, address, json=payload, ssl=False) as response:
                if response.status >= 400:
                    raise web.HTTPBadGateway(text="Bridge HTTP " + str(response.status))
                data = await response.json(content_type=None)
        if isinstance(data, list) and any("error" in x for x in data if isinstance(x, dict)):
            raise web.HTTPBadGateway(text="Hue hat einen Fehler zurückgemeldet")
        return web.json_response(data)
    except web.HTTPException:
        raise
    except Exception as exc:
        print("Bridge-Proxy-Fehler:", type(exc).__name__, flush=True)
        raise web.HTTPBadGateway(text="Lokaler Hue-Bridge-Zugriff fehlgeschlagen")

async def setup(app):
    relay = app["relay"]
    relay.watchdog_task = asyncio.create_task(relay.watchdog())

async def cleanup(app):
    relay = app["relay"]
    if relay.watchdog_task:
        relay.watchdog_task.cancel()
        with suppress(asyncio.CancelledError):
            await relay.watchdog_task
    await relay.stop("Server beendet")

def local_ip(bridge):
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.connect((bridge, 80))
        return s.getsockname()[0]

def main():
    relay = Relay()
    ip = local_ip(relay.host)
    static_root = Path(__file__).resolve().parents[1]
    if not (static_root / "flow-v50" / "index.html").is_file() or not (static_root / "flow-live" / "v51-digital.js").is_file():
        raise RuntimeError("V5.0-Original oder V5.1-Musikmodul fehlen. Vollständiges V5.1-Paket nötig.")
    app = web.Application(client_max_size=4096)
    app["relay"] = relay
    app.router.add_get("/", home)
    app.router.add_get("/app-v51.webmanifest", manifest)
    app.router.add_post("/api/start", start)
    app.router.add_post("/api/frame", frame)
    app.router.add_post("/api/stop", stop)
    app.router.add_get("/api/status", status)
    app.router.add_get("/api/bridge-info", bridge_info)
    app.router.add_route("GET", "/api/hue/{tail:.*}", bridge_proxy)
    app.router.add_route("PUT", "/api/hue/{tail:.*}", bridge_proxy)
    app.router.add_static("/", path=static_root, show_index=False)
    app.on_startup.append(setup)
    app.on_cleanup.append(cleanup)
    print("\nLUMA FLOW V5.1 – auf Original V5.0 Home Sweet Home aufgebaut")
    print("Nur im privaten WLAN verwenden. Keine Audiodatei wird übertragen.")
    test_url = "http://%s:%s/?t=%s" % (ip, PORT, relay.token)
    print("V5.1 auf iPhone in Safari: " + test_url, flush=True)
    try:
        import qrcode
        from qrcode.image.svg import SvgPathImage
        qr_path = Path(__file__).with_name("v51-iphone-link.svg")
        qrcode.make(test_url, image_factory=SvgPathImage).save(str(qr_path))
        print("QR-Code für iPhone-Kamera: " + str(qr_path), flush=True)
    except Exception:
        print("QR-Code optional nicht verfügbar; URL oben verwenden.", flush=True)
    if os.environ.get("LUMA_ACCESS_TOKEN"):
        print("Link bleibt nach einem Neustart gleich, solange die PC-IP unverändert ist.", flush=True)
    print("Windows-PC und iPhone müssen im selben WLAN sein.")
    print("Abbrechen: STRG+C. Musik-Stream stoppt spätestens nach 65 Sekunden.\n", flush=True)
    web.run_app(app, host=ip, port=PORT, print=None)

if __name__ == "__main__":
    main()
