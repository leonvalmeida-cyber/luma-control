# Luma Control – Architekturplan für reaktive Musikbeleuchtung (2026-11-03)

## Entscheidung
Bestehende GitHub-Pages-Webapp für Szenen, normale Lichtsteuerung und Gruppen behalten. Musik als **separaten nativen iOS-Client (Swift)** entwickeln, der die Hue Entertainment API verwendet. Keine Behauptung über garantierte Ende-zu-Ende-Latenz, bevor am echten Setup gemessen wurde.

## Verifiziert / Voraussetzungen
- Hue Bridge Pro wird von Hue Entertainment DTLS/HueStream-Implementierungen unterstützt.
- Entertainment benötigt einen in der offiziellen Hue-App eingerichteten **Entertainment-Bereich** mit kompatiblen farbfähigen Lampen. Normale Hue-Gruppen sind nicht automatisch Entertainment-Bereiche.
- Start-/Stopp-Steuerung: lokale Hue CLIP API v2, Farbstream: DTLS-PSK über UDP/HueStream (nicht HTTP pro Audiotakt).
- Pairing liefert **application key und client key**; niemals in öffentliche Website oder GitHub committen. Auf iOS im Schlüsselbund speichern.
- Die iOS-App analysiert hörbare Musik via Mikrofon und bekommt damit nicht automatisch den geschützten digitalen Apple-Music-Stream.
- Erstellung einer installierbaren iOS-App erfordert Signieren/Provisioning und Xcode auf macOS (lokal oder Remote-/CI-Mac). Benutzer entwickelt aktuell auf Windows. Daher erst Build-/Signierungsweg festlegen; GitHub Pages allein kann keine native DTLS-iOS-App deployen.

## Module
1. Bridge Discovery und Local Network permission; manuelle IP als Fallback.
2. Pairing (Pushlink) und Keychain credentials inklusive client key.
3. Entertainment-Area-Liste, Kanalzuordnung, Start/Stop und Konfliktbehandlung bei bereits aktivem Stream.
4. Audioengine (AVAudioEngine): Audio-Bänder, Transienten, Gate, Noise-Profil, Intensität.
5. **Latest-frame mailbox**: nur letzter vollständiger Lichtzustand; keine aufholende Queue.
6. Konstanter Frame-Sender mit begrenzter Rate und Wiederholung des letzten gültigen Frames; Messung von Analysealter, Sendetiming und Verbindungsstatus. Kein Senden veralteter Frames.
7. UI: bestehende Farbstimmungen, Fokus, Geschwindigkeit, Mindest-/Max-Helligkeit und Diagnose übernehmen.
8. Stop/Unterbrechung: Stream zuverlässig freigeben, App-Hintergrund und Audiosession-Wechsel sauber handhaben.
9. Begrenzung schneller Blitze / Sicherheitsprofil.

## MVP-Testplan
- iPhone und Bridge im selben lokalen Netzwerk, Entertainment-Area angelegt.
- Musik 20 Minuten mit wiederholtem Wechsel von Neon/Warm/Tempo/Gate; keine kumulierende Verzögerung.
- Wechsel auf Stille, schnelle Beats, wechselnde Lautstärke; Audiopegel und Lichtfeedback stimmen sichtbar überein.
- Flugmodus/WLAN-Verlust, Sperrbildschirm, Hintergrund/Vordergrund und Mikrofonsitzung: nachvollziehbare Statusanzeige, keine hängende Stream-Sitzung.
- Analysealter, Frame-Intervall, Stream-Unterbrechungen messen. **Ziel**: visuelle Reaktion möglichst unter 200 ms; erst mit Hardwaretest bestätigbar.
- Ein-/Ausschalten und normale Szenen funktionieren nach Stoppen des Entertainment-Modus.

## Migrationsreihenfolge
A. Entertainment-Lampenliste und Area-ID am echten Bridge-Pro-Setup prüfen.
B. Swift-Client minimal: verbinden, Area aktivieren, einen Testframe senden, sauber stoppen.
C. Mikrofonsignal und Musikreaktion integrieren.
D. UI/Paletten/Presets aus Webapp übernehmen.
E. TestFlight/Signierung und Installation; Webapp weiterhin unverändert betreiben.

## Alternative, falls native iOS-Verteilung nicht möglich
Dauerhaft laufendes kleines lokales Gerät (z. B. Raspberry Pi) mit DTLS-Streamer + iPhone-Weboberfläche. Das löst kein Hintergrund-Mikrofonproblem von Safari, und erfordert zusätzliche Hardware. Nicht als bevorzugte Route wählen, solange iOS-Build möglich.

## Technische Referenzen
- Philips Hue Developer Support https://developers.meethue.com/support/
- Hue Entertainment Python (Bridge Pro) https://github.com/music-assistant/hue-entertainment
- Swift HueEntertainmentKit https://swiftpackageregistry.com/adeze/HueEntertainmentKit
- Apple iOS signing https://help.apple.com/xcode/mac/current/en.lproj/dev5a825a1ca.html
