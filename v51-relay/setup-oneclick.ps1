# Luma Flow V5.1 - one-time installation / desktop shortcut.
# Requires the existing Hue entertainment credential file and Python environment.
$ErrorActionPreference = "Stop"
$Branch = "feature/v51-onetap-launch-20261106"
$Repo = "https://github.com/leonvalmeida-cyber/luma-control"
$Target = Join-Path $env:LOCALAPPDATA "LumaFlow\v51-home-sweet-home"
$Python = Join-Path $env:LOCALAPPDATA "LumaFlow\stream-test\.venv\Scripts\python.exe"
$Credentials = Join-Path $env:LOCALAPPDATA "LumaFlow\hue-entertainment-credentials.json"

if (-not (Test-Path $Python)) { throw "Die Python-Entertainment-Testumgebung fehlt: $Python" }
if (-not (Test-Path $Credentials)) { throw "Deine Hue-Credentials fehlen: $Credentials" }
if (Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue) {
    throw "Bitte den alten Luma-Test zuerst mit Strg+C beenden (Port 8765 ist belegt)."
}

$Temp = Join-Path $env:TEMP ("luma-install-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force $Temp | Out-Null
try {
    $Zip = Join-Path $Temp "source.zip"
    $Extract = Join-Path $Temp "source"
    Write-Host "V5.1 Home Sweet Home herunterladen ..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri "$Repo/archive/refs/heads/$Branch.zip" -UseBasicParsing -OutFile $Zip
    Expand-Archive -Path $Zip -DestinationPath $Extract
    $Source = (Get-ChildItem $Extract -Directory | Select-Object -First 1).FullName
    if (-not $Source) { throw "ZIP-Archiv konnte nicht entpackt werden." }
    New-Item -ItemType Directory -Force $Target | Out-Null
    Copy-Item -Path (Join-Path $Source "*") -Destination $Target -Recurse -Force

    $Launcher = Join-Path $Target "v51-relay\Luma Flow starten.cmd"
    if (-not (Test-Path $Launcher)) { throw "Startdatei fehlt nach der Installation." }
    if (-not (Test-Path (Join-Path $Target "flow-v50\v50.js"))) { throw "Original V5.0 Dateien fehlen." }

    Write-Host "Python-Abhaengigkeiten pruefen ..." -ForegroundColor Cyan
    & $Python -c "import aiohttp, hue_entertainment, qrcode"
    if ($LASTEXITCODE -ne 0) { throw "Ein Python-Modul fehlt. In der bestehenden .venv zuerst 'pip install aiohttp hue-entertainment qrcode' ausfuehren." }

    $Desktop = [Environment]::GetFolderPath("DesktopDirectory")
    $ShortcutFile = Join-Path $Desktop "Luma Flow V5.1.lnk"
    $Shell = New-Object -ComObject WScript.Shell
    $Shortcut = $Shell.CreateShortcut($ShortcutFile)
    $Shortcut.TargetPath = $Launcher
    $Shortcut.WorkingDirectory = Split-Path -Parent $Launcher
    $Shortcut.Description = "Luma Flow – V5.0 Home Sweet Home mit digitalem Musiklicht"
    $Shortcut.Save()

    Write-Host ""
    Write-Host "FERTIG. Auf deinem Windows-Desktop: Luma Flow V5.1" -ForegroundColor Green
    Write-Host "Ab jetzt: Doppelklick startet die App. Safari-Link einmal speichern."
    Write-Host "Der PC muss weiter eingeschaltet bleiben; der QR-Code bleibt bei gleicher IP wiederverwendbar."
} finally {
    Remove-Item $Temp -Recurse -Force -ErrorAction SilentlyContinue
}
