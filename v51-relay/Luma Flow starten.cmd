@echo off
setlocal
title Luma Flow V5.1 - Home Sweet Home
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-luma.ps1"
if errorlevel 1 (
 echo.
 echo Start nicht erfolgreich. Pruefe die Meldung oben.
 pause
)
endlocal
