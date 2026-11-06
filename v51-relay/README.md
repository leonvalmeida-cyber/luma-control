# Luma Flow V5.1 – integrierte Beta (Licht · Szenen · Musik)

**Status:** Separate Beta auf `feature/luma-flow-v51-integrated-20261106`. Nicht in `main` integriert. Sie enthält die bestehende `flow-live`-Oberfläche plus einen zusätzlichen digitalen Musikmodus.

## Was funktioniert – und was noch offen ist

- Bestehende Licht-, Gruppen- und Szenensteuerung wird unverändert wiederverwendet.
- Neuer digitaler Musikmodus im bestehenden Tab **Musik**: ungeschützte lokale Datei auf iPhone wählen; Web Audio FFT, RGB-Vorschau und 9 RGB-Kanäle → Windows-Relay → Hue Entertainment DTLS.
- Kein Mikrofon und kein Upload der Musikdatei nötig.
- Vorhandener Mikrofonmodus bleibt als Altmodus im Code; er benötigt HTTPS und kann bei der **lokalen HTTP-Testadresse** browserseitig gesperrt sein.
- Keine native Apple-Music-Abostream-Analyse; kein PC-unabhängiges Entertainment.
- Genau 60 Sekunden Test pro Start, Relay bis 65 Sekunden, Stop nach Datenpause.
- **Noch kein End-to-End-Test dieser integrierten V5.1 auf dem Nutzergerät.** Einzelprototypen wurden zuvor erfolgreich getestet.

## Einmalig am Windows-PC

Voraussetzung: Python-Testumgebung `%LOCALAPPDATA%\LumaFlow\stream-test\.venv` inklusive `hue-entertainment` und gespeicherte verschlüsselte Credentials in `%LOCALAPPDATA%\LumaFlow\hue-entertainment-credentials.json` aus den früheren erfolgreichen Tests.

1. Den **kompletten GitHub-Branch** als ZIP herunterladen.
2. ZIP entpacken, die Ordner `flow-live/` und `v51-relay/` zusammen in einen **neuen, isolierten Ordner** kopieren.
3. In PowerShell starten:

```powershell
$Root = Join-Path $env:LOCALAPPDATA "LumaFlow\v51-integrated"
$Python = Join-Path $env:LOCALAPPDATA "LumaFlow\stream-test\.venv\Scripts\python.exe"
$File = Join-Path $env:LOCALAPPDATA "LumaFlow\hue-entertainment-credentials.json"
& $Python -m pip install aiohttp
$Saved = Get-Content $File -Raw | ConvertFrom-Json
try {
  $env:LUMA_BRIDGE = $Saved.bridge
  $env:LUMA_APP_KEY = [System.Net.NetworkCredential]::new("", (ConvertTo-SecureString $Saved.applicationKey)).Password
  $env:LUMA_CLIENT_KEY = [System.Net.NetworkCredential]::new("", (ConvertTo-SecureString $Saved.clientKey)).Password
  & $Python (Join-Path $Root "v51-relay\server.py")
}
finally {
  Remove-Item Env:LUMA_BRIDGE,Env:LUMA_APP_KEY,Env:LUMA_CLIENT_KEY -ErrorAction SilentlyContinue
}
```

4. Der Server zeigt eine **lokale, zufällig tokenisierte Adresse** `http://192.168....:8765/?t=...`. Diese im iPhone-Safari auf demselben vertrauenswürdigen WLAN öffnen. **Token-Link nicht öffentlich teilen.**
5. Windows-Firewall, falls nötig, nur für **private Netzwerke** erlauben.
6. Unter **Musik**: lokale ungeschützte Datei auswählen → *Mit Hue verbinden* → *Musik + Licht*. Unter **Licht** und **Szenen** die bisherigen Bedienelemente verwenden.

## Sicherheits- und Architekturhinweise

- Der lokale Browser↔Windows-Test verwendet **HTTP ohne TLS**; nur im eigenen vertrauenswürdigen WLAN testen, nicht im öffentlichen Netz oder über Internet/Port-Forwarding. Hue-Stream Windows↔Bridge verwendet DTLS.
- Der Token wird bei jedem Start neu erstellt; API-Anfragen erfordern denselben Token. Der Stream stoppt nach Timeout, bei Datenpause, beim Tabwechsel und bei Stop.
- Die Hue-Keys bleiben in den verschlüsselten lokalen Windows-Dateien; die neue App erhält die echten Werte nicht. Im Bridge-Einstellungsfeld erscheint ausschließlich ein Platzhalter.
- Für Licht und Szenen ist ein begrenzter Bridge-Proxy eingerichtet (GET lights/groups/config, PUT lights/{ID}/state).
- Die originale Haupt-App, ihre Bridge-Einstellungen und die früheren Testskripte wurden nicht geändert.
- Bei Abbruch des Streams können Lampen den letzten Zustand behalten.
