# Native iPhone-Mikrofontest

Status: SwiftUI-Quellcode zur Prüfung im Xcode-Projekt, noch nicht gebaut und nicht am iPhone ausgeführt.

## Projekt anlegen
1. In Xcode auf macOS neues iOS App Projekt "LumaApp" (SwiftUI, Swift) erstellen. iOS Deployment Target 17.0 oder höher.
2. Die drei Dateien aus diesem Ordner zum App-Target hinzufügen. Zusätzlich `ios/LumaCore/LatestFrameMailbox.swift` zum Target hinzufügen.
3. In Target > Info die Privacy-Erklärung `NSMicrophoneUsageDescription` setzen, z. B. "Luma analysiert hörbare Musik nur lokal, um Lichtreaktionen zu steuern."
4. Target unter Signing & Capabilities mit eigenem Team signieren und auf dem iPhone starten.
5. Mikrofon starten. Pegeleingang/Impuls/Alter mindestens 10 Minuten lang prüfen, inklusive Wechsel zwischen Stille und Musik.
6. Dieser Test sendet absichtlich noch keine Befehle an die Bridge.

## Zu beachten
- Die ausgewählten All/Wohnzimmer-Segmente sind in diesem frühen Test nur UI. Die tatsächliche Entertainment-Bereichszuordnung folgt später.
- Kein Claim einer funktionierenden Entertainment-Verbindung.
- Die neue HueEntertainmentKit 0.3.0 Bibliothek benötigt laut Projekt iOS 18+ sowie Xcode 27 und Swift 6.4. Deshalb vor späterer Einbindung iPhone-iOS-Version und Build-Möglichkeit verifizieren.
- Audiopegel ist relative RMS-Mikrofonenergie, keine Lautstärke in dB SPL und noch keine Bass/Mitten/Höhen-FFT.
- Beim Hintergrundwechsel kann iOS Audio unterbrechen; ist noch Teil des Testplans.
