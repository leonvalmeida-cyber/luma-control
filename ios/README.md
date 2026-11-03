# Luma Control iOS – Entwicklungsstart

Status: Erste Swift-Bausteine erstellt. Noch keine installierbare App und kein getesteter Hue Entertainment Stream.

## Bedienung
Nur All und Wohnzimmer. Die Web-App v0.17 zeigt beide Optionen. Alte gespeicherte Gruppen bleiben als Sicherheitskopie im lokalen Browser erhalten, werden aber nicht angezeigt.

## Architektur
1. In der Hue App Entertainment-Bereiche für passende Lampen konfigurieren. Ein gewöhnlicher Hue-Raum ist nicht automatisch ein Entertainment-Bereich. Für All prüfen, welche Lampen Entertainment unterstützen.
2. Native iOS App mit SwiftUI und AVAudioEngine entwickeln.
3. Bridge finden, über Pushlink koppeln, application key und client key sicher im Keychain halten. Keine Schlüssel ins Repository.
4. Entertainment-Konfiguration über CLIP API v2 starten und HueStream via DTLS-PSK/UDP übertragen.
5. LatestFrameMailbox puffert ausschließlich den jüngsten Audioframe. Sender verwirft überholte Zustände, statt eine Warteschlange abzuarbeiten.
6. Audioalter, Senderate und Verbindungszustand getrennt anzeigen; Unterbrechungen explizit behandeln.

## Installation
Für iOS-Installation ist ein macOS-Build mit Xcode und gültiger App-Signierung nötig. Windows und GitHub Pages allein können keine native iOS-App ausliefern.

## Test
Zunächst eine kompatible Entertainment-Lampe mit einem stabilen Testframe ansteuern, danach Audio und übrige Lampen. Angestrebte Reaktion unter 200 ms, erst nach Hardwaremessung bestätigbar.

Referenzen:
https://github.com/music-assistant/hue-entertainment
https://apple-docs.everest.mt/docs/packages/adeze/hueentertainmentkit/
