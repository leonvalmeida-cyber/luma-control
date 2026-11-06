# Luma Flow V5.1 corrected integration – genuine V5.0 interface

## Vereinfachter Start – V5.1 One-Click (bevorzugt)

Es ist kein tägliches Kopieren langer PowerShell-Befehle mehr nötig.

1. Den **alten** Luma-Server zuerst mit Strg+C beenden (Port 8765).
2. `setup-oneclick.ps1` einmal unter Windows PowerShell ausführen; das Skript lädt die komplette Branch-Quelle neu nach `%LOCALAPPDATA%\LumaFlow\v51-home-sweet-home`, prüft bestehende Python-Pakete und legt die Desktop-Verknüpfung **Luma Flow V5.1** an.
3. Danach jedes Mal auf Windows **Luma Flow V5.1** doppelklicken.
4. Beim ersten Start den ausgegebenen QR-Code aus der Datei `v51-relay\v51-iphone-link.svg` öffnen und mit dem iPhone scannen. In Safari über **Teilen → Zum Home-Bildschirm** eine iPhone-Verknüpfung erstellen.
5. Ab dem zweiten Start den **gleichen iPhone-Link** wiederverwenden, solange die PC-IP nicht wechselt. Die IP-Adresse kann sich nach einem Router- oder Gerätewechsel durch DHCP ändern. Optional im Router eine feste DHCP-Zuweisung für den Windows-PC einstellen.
6. Das Windows-Serverfenster muss geöffnet bleiben. Dies ist eine Verbesserung des Startvorgangs, **kein** Betrieb ohne PC.
7. Test nur im privaten LAN, **kein öffentliches WLAN, keine Portfreigabe**.

**Start-Icon auf dem iPhone:** Der lokale Server liefert bei der gültigen, tokenisierten Safari-Adresse ein **separates geschütztes Web-App-Manifest** aus. Dessen `start_url` enthält denselben gespeicherten Token. Das verhindert, dass das Home-Screen-Symbol durch das alte GitHub-Pages-Manifest beim Öffnen den Zugangscode verliert. Ob iOS auf einer HTTP-LAN-Adresse alle Standalone-/PWA-Funktionen unterstützt, muss praktisch geprüft werden; der Link selbst bleibt unabhängig davon nutzbar.

**Sicherheitsmodell:** `start-luma.ps1` erzeugt beim ersten Start einen kryptografisch zufälligen Zugangstoken und legt ihn per Windows-DPAPI verschlüsselt unter `%LOCALAPPDATA%\LumaFlow\stable-launch-token.dpapi` ab. Beim nächsten Start entschlüsselt nur derselbe Windows-Benutzer den Token. Der Token wird ausschließlich an den lokalen Python-Prozess weitergegeben; Hue-Zugangsdaten bleiben ebenfalls DPAPI-verschlüsselt auf Windows. Auf dem iPhone enthält der URL den Zugangstoken; nicht öffentlich teilen. **Der LAN-Webverkehr ist weiterhin HTTP und nicht verschlüsselt.** Bei kompromittiertem Link den Luma-Server stoppen und `stable-launch-token.dpapi` löschen, um beim nächsten Start einen neuen Token zu erzeugen (danach iPhone-Link neu speichern).



**Base:** `flow-v50/index.html` is the original V5.0 Home Sweet Home dashboard with original V5.0 lamp, slide-out quick controls, groups, scenes, per-lamp controls and its actual dependent CSS/JS under `flow-v4*` and `flow-live`.

**Only new UI:** The digital local-file Music engine is inserted in the existing Music tab by `flow-live/v51-digital.js` + `v51-digital.css`; old microphone controls remain as optional fallback (may be unavailable on HTTP due browser permissions).

**Music processing:** locally decoded unprotected MP3/WAV/M4A on iPhone Safari → Web Audio FFT → nine RGB packets to Windows LAN relay → Philips Hue Entertainment DTLS → 7 Hue lamps. Local file never leaves iPhone. Does not analyze Apple Music subscription audio.

**Windows runtime:** The local HTTP relay serves the real V5.0 file as its root, and all original assets from the full project tree. It handles only authorized Hue API v1 GET and PUT paths and the proven Entertainment streaming endpoints. Never enter/share Hue client keys on the iPhone. Do not port-forward or use public WiFi; relay HTTP is unencrypted.

## Installation

1. Stop any previous relay using port 8765 with Ctrl+C.
2. Download this **whole branch ZIP**, extract **all project folders**, and place in a new folder such as `%LOCALAPPDATA%\LumaFlow\v51-home-sweet-home`.
3. Existing Python 3.13 virtualenv `%LOCALAPPDATA%\LumaFlow\stream-test\.venv` should have `hue-entertainment`, `aiohttp` and optionally `qrcode`. Existing Windows DPAPI credentials `%LOCALAPPDATA%\LumaFlow\hue-entertainment-credentials.json` remain on PC.
4. Use this PowerShell code:

```powershell
$Root = Join-Path $env:LOCALAPPDATA "LumaFlow\v51-home-sweet-home"
$Python = Join-Path $env:LOCALAPPDATA "LumaFlow\stream-test\.venv\Scripts\python.exe"
$Credentials = Join-Path $env:LOCALAPPDATA "LumaFlow\hue-entertainment-credentials.json"
$Saved = Get-Content $Credentials -Raw | ConvertFrom-Json
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

5. Open the URL printed in PowerShell using the same private home WLAN, or scan QR code from the `v51-relay` directory. Token is ephemeral per run; do not post it publicly. Windows firewall if prompted: **private network only**.
6. Compare V5.1 design with the original V5.0; then test Light, Scenes, Music separately. Music test is 60 seconds and auto-stops. Keep Safari foreground.

**Known limitations:** Safari on a local HTTP origin will not grant microphone mode in typical iOS configurations; the digital local-file mode does not use the microphone. Existing in-app browser-local favorites and custom group preferences stored on a previous GitHub Pages origin may not migrate automatically to this local HTTP origin. Music streaming still needs the Windows PC. End-to-end testing of this corrected integration remains pending.
