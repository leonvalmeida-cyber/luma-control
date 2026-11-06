# Luma Flow V5.1 corrected integration – genuine V5.0 interface

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
