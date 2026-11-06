# Luma Flow V5.1 - one-click local launcher. Windows PowerShell 5.1.
# Hue credentials and the stable session token remain encrypted by Windows DPAPI.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Python = Join-Path $env:LOCALAPPDATA "LumaFlow\stream-test\.venv\Scripts\python.exe"
$Credentials = Join-Path $env:LOCALAPPDATA "LumaFlow\hue-entertainment-credentials.json"
$TokenFile = Join-Path $env:LOCALAPPDATA "LumaFlow\stable-launch-token.dpapi"
$Server = Join-Path $PSScriptRoot "server.py"

Write-Host ""
Write-Host "=== LUMA FLOW V5.1 | HOME SWEET HOME ===" -ForegroundColor Cyan
Write-Host "Einmal starten, dann auf dem iPhone den gespeicherten Link verwenden."
Write-Host "Nur im privaten Heim-WLAN. Kein Internet-Portforwarding." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path $Python)) { throw "Python-Testumgebung fehlt: $Python" }
if (-not (Test-Path $Credentials)) { throw "Hue-Zugangsdaten fehlen. Die frueheren Entertainment-Zugangsdaten werden benoetigt." }
if (-not (Test-Path $Server)) { throw "Server-Datei fehlt. Bitte das ganze V5.1-Paket installieren." }
if (-not (Test-Path (Join-Path $Root "flow-v50\index.html"))) { throw "Original V5.0 Home Sweet Home fehlt." }

$Busy = Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue
if ($Busy) {
    Write-Host "Port 8765 ist bereits belegt." -ForegroundColor Yellow
    Write-Host "Wenn Luma schon laeuft, brauchst du nichts neu zu starten."
    Write-Host "Sonst im alten PowerShell-Fenster Strg+C druecken und erneut starten."
    exit 2
}

$NewToken = $false
if (Test-Path $TokenFile) {
    $Cipher = (Get-Content $TokenFile -Raw).Trim()
    $Secure = ConvertTo-SecureString $Cipher
    $Token = [System.Net.NetworkCredential]::new("", $Secure).Password
    Write-Host "Gespeicherten iPhone-Link wiederverwenden." -ForegroundColor Green
} else {
    $Bytes = New-Object byte[] 32
    $Generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $Generator.GetBytes($Bytes) } finally { $Generator.Dispose() }
    $Token = [Convert]::ToBase64String($Bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
    $Secure = ConvertTo-SecureString -String $Token -AsPlainText -Force
    $Encrypted = ConvertFrom-SecureString -SecureString $Secure
    New-Item -ItemType Directory -Force -Path (Split-Path $TokenFile) | Out-Null
    Set-Content -Path $TokenFile -Value $Encrypted -Encoding ASCII
    $NewToken = $true
    Write-Host "Persoenlichen iPhone-Link einmalig erstellt und verschluesselt gespeichert." -ForegroundColor Green
}

if ($Token -notmatch '^[A-Za-z0-9_-]{40,128}$') { throw "Gespeicherter Token ist ungueltig. Bitte Token-Datei pruefen." }
$Saved = Get-Content $Credentials -Raw | ConvertFrom-Json
try {
    $env:LUMA_BRIDGE = $Saved.bridge
    $env:LUMA_APP_KEY = [System.Net.NetworkCredential]::new("", (ConvertTo-SecureString $Saved.applicationKey)).Password
    $env:LUMA_CLIENT_KEY = [System.Net.NetworkCredential]::new("", (ConvertTo-SecureString $Saved.clientKey)).Password
    $env:LUMA_ACCESS_TOKEN = $Token
    if ($NewToken) { $env:LUMA_SHOW_QR = "1" } else { $env:LUMA_SHOW_QR = "0" }

    Write-Host "Luma Flow wird gestartet ..." -ForegroundColor Cyan
    Write-Host "Dieses Fenster offen lassen. Strg+C beendet den Server." -ForegroundColor Yellow
    & $Python $Server
    if ($LASTEXITCODE -ne 0) { throw "Luma-Server beendet mit Fehlercode $LASTEXITCODE." }
} finally {
    Remove-Item Env:LUMA_BRIDGE,Env:LUMA_APP_KEY,Env:LUMA_CLIENT_KEY,Env:LUMA_ACCESS_TOKEN,Env:LUMA_SHOW_QR -ErrorAction SilentlyContinue
}
