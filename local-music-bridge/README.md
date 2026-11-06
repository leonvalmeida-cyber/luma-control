# Luma Music Engine – local digital file → Hue (experiment)

**Status:** experiment; not merged to main. Does not modify Luma Flow or existing working tests.

Architecture: A selected **unprotected audio file on the iPhone** is played and analyzed via Safari Web Audio API. Only RGB values (nine channels at max ~25 frames/s) are posted to a token-protected local Windows HTTP server, which uses the existing `hue-entertainment` DTLS client. No microphone or audio upload. **Apple Music subscription streams are not supported.**

Prerequisites: Windows and iPhone on same trusted home WLAN, Windows has Python 3.13 + `hue-entertainment` inside `%LOCALAPPDATA%\LumaFlow\stream-test\.venv`, and the existing encrypted pair at `%LOCALAPPDATA%\LumaFlow\hue-entertainment-credentials.json`.

From Windows PowerShell, download `bridge_server.py` and `index.html` into `%LOCALAPPDATA%\LumaFlow\stream-test\local-music-bridge` and launch the Python script with the existing encrypted keys mapped temporarily to `LUMA_BRIDGE`, `LUMA_APP_KEY`, `LUMA_CLIENT_KEY` environment variables (just like the successful Windows test).

PowerShell helper:

```powershell
$Folder = Join-Path $env:LOCALAPPDATA "LumaFlow\stream-test\local-music-bridge"
$Base = "https://raw.githubusercontent.com/leonvalmeida-cyber/luma-control/experiment/luma-direct-file-hue-20261106/local-music-bridge"
New-Item -ItemType Directory -Force -Path $Folder | Out-Null
Invoke-WebRequest "$Base/bridge_server.py" -UseBasicParsing -OutFile (Join-Path $Folder "bridge_server.py")
Invoke-WebRequest "$Base/index.html" -UseBasicParsing -OutFile (Join-Path $Folder "index.html")
$Python = Join-Path $env:LOCALAPPDATA "LumaFlow\stream-test\.venv\Scripts\python.exe"
$File = Join-Path $env:LOCALAPPDATA "LumaFlow\hue-entertainment-credentials.json"
$Saved = Get-Content $File -Raw | ConvertFrom-Json
try {
  $env:LUMA_BRIDGE = $Saved.bridge
  $env:LUMA_APP_KEY = [System.Net.NetworkCredential]::new("", (ConvertTo-SecureString $Saved.applicationKey)).Password
  $env:LUMA_CLIENT_KEY = [System.Net.NetworkCredential]::new("", (ConvertTo-SecureString $Saved.clientKey)).Password
  & $Python (Join-Path $Folder "bridge_server.py")
} finally {
  Remove-Item Env:LUMA_BRIDGE,Env:LUMA_APP_KEY,Env:LUMA_CLIENT_KEY -ErrorAction SilentlyContinue
}
```

The server prints its local HTTP URL with a one-time session token. Open that URL in iPhone Safari (same Wi-Fi). Choose a **local, unprotected file**, then **Mit Hue verbinden**, then **Musik + Licht starten**. The iPhone screen and Safari must stay foregrounded. Max test 60 seconds, server 65-second hard stop; stops automatically after ~3 seconds without frames, or after ~20 seconds armed but not playing. Use Ctrl+C to stop the server.

Use private/trusted Wi-Fi only: browser-to-PC LAN HTTP is unencrypted, although PC-to-Hue Entertainment uses DTLS. The token prevents accidental LAN access but is not a substitute for HTTPS on an untrusted network. The Hue secrets never go to the iPhone. Windows Firewall must allow Python inbound on **private networks only** for port 8765 if prompted.

The experiment has not yet been tested end-to-end on this user's specific Windows/iPhone pairing, so runtime changes may be needed.
