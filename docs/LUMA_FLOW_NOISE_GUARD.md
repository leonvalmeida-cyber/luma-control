# Luma Flow — optional Störschutz und Gesprächsmodus (Designentscheidung 2026-11-04)

## Entscheidung

Der Nutzer möchte Luma Flow von Grund auf neu entwerfen; wichtiges Zusatzkriterium: Bei Gesprächen mit Freunden und bei Tätigkeiten mit Hintergrundgeräuschen (z. B. Staubsaugen) sollen die Lichter möglichst **auf Musik, nicht auf Gespräche oder Störgeräusche** reagieren. Der Schutz ist **optional und jederzeit abschaltbar**. Verständliche Bedienelemente statt komplexer Fachregler.

## Vorschlag für die Oberfläche
- **Störschutz: AUS | UMGEBUNG | GESPRÄCHE (Beta)**
- **UMGEBUNG**: Vor dem Einschalten der Musik 2–3 Sekunden stationäre Geräusche einmessen (z. B. Lüfter, Staubsauger). Das lokale FFT-Rauschprofil reduziert gleichbleibende Frequenzen, ohne eine Tonaufnahme zu speichern.
- **GESPRÄCHE (Beta)**: Zusätzlich bass- und impulsbetonte Reaktion; mid-/high-Anteile (hier liegt viel Sprachenergie) werden deutlich reduziert. Die Lichter reagieren weiter auf dominante Musiktakte, selbst wenn Personen sprechen. Auch **Gesang, Gitarren und andere Musikanteile** können abgeschwächt werden.
- **AUS**: Bisherige Musikreaktion ohne den neuen optionalen Schutz. Der Nutzer kann die Funktion jederzeit deaktivieren. Ein visueller Indikator zeigt, ob ein eingemessenes Profil tatsächlich aktiv ist. Ohne Profil nie behaupten, man würde Umgebungsgeräusche entfernen.

## Technische Realität
- Mikrofon liefert eine **Überlagerung** von Musik + Sprache + Motorgeräuschen. Eine einfache Lautstärkeschwelle, Frequenzweiche oder Voice Activity Detection kann Musik nicht zuverlässig isolieren.
- Spektrale Rauschsubtraktion hilft bei **stationären** Geräuschen. Staubsauger und Lüfter können jedoch ihre Tonhöhe verändern und die Musik teilweise überdecken.
- Bei Gesprächsbetrieb kann eine bass-/transientengetriebene Reaktion Sprache **weniger stark berücksichtigen**; sie entfernt keine getrennten Sprachspuren. Tiefe Stimmen und percussive Störgeräusche können weiterhin Impulse auslösen.
- Keinesfalls Apples **Voice Isolation** als Lösung bewerben: Dieser Modus priorisiert **Sprache** und unterdrückt andere Klänge, also gerade umgekehrt zu unserem Ziel. Quelle: https://support.apple.com/en-la/101993 und https://developer.apple.com/videos/play/wwdc2023/10235/
- Wenn echte Quellen-Trennung erwünscht ist, eine **kleine optimierte On-Device-ML-Architektur** mit Musik-/Sprache-Klassifizierung oder -Separation untersuchen. Erst nach Messung auf dem Ziel-iPhone entscheiden: Rechenlast, Batterieverbrauch, Latenz und Erkennungsgenauigkeit mit Musikgesang messen; keine externen Audiodienste.
- **Bessere Quellqualität** als Trennung: optional Musik-Audio direkt vom wiedergebenden Gerät/Audio-Interface (nur wenn OS und Rechte es zulassen) statt Raum-Mikrofon. Apple Music ist kein allgemein frei lesbarer Audio-Feed für fremde Apps. Ohne nutzbaren Direkt-Feed bleibt Mikrofon-Modus.
- **Audiofilterung und Lampen-Transport sind verschiedene Baustellen.** Die bisherige REST-basierte Musikbeleuchtung ist für echte schnelle Effekte ungeeignet. Philips Hue empfiehlt für kontinuierliche schnelle Änderungen Entertainment Streaming: https://developers.meethue.com/new-hue-api/

## Implementierter Forschungsstand
- `flow/noise-guard.js`: unabhängig von Audioaufnahme, UI, Storage und Bridge. Enthält OFF/AMBIENT/CONVERSATION, Kalibrierung eines lokalen FFT-Rauschprofils, spektrale Subtraktion, bass-/impulsorientierte Signalgrößen, Schalter und sichere Rücksetzung.
- `tests/flow-noise-guard.test.cjs`: synthetische Tests für Grundsignal, gleichbleibendes Geräusch, zugefügten Bass, Sprachbereich, unpassendes Audioformat und Privacy-Eigenschaften.
- Code **noch nicht in Luma Music LIVE eingeschaltet**, weil die Erkennungsqualität bei echter Musik + Gesprächen zunächst getestet werden muss. Der Stand ist eine technische Grundlage, keine bestätigte Sprachtrennung.

## Nächste Prüfungen
1. In der bestehenden Live-Musikversion mit aktivem Störschutz (standardmäßig AUS) vier Situationen vergleichen: Musik allein; Musik + Unterhaltung; Staubsaugen allein; Musik + Staubsaugen.
2. Auswertung am Gerät: Anteil falscher Lichtimpulse, erkannte Beats, Zeitverzug, CPU/Batterie und Änderungen der Raumprofil-Güte.
3. Keine persönlichen Gespräche aufzeichnen oder hochladen; nur lokal und flüchtig das Frequenzspektrum verarbeiten.
4. Danach entscheiden, ob VAD-/ML-Trennung nützlich ist oder den unmittelbaren Lichtwechsel zu stark verzögert; gegebenenfalls aus der ersten Version entfernen.

**Akzeptanzkriterium:** Filter verbessert das reale Beleuchtungserlebnis beim Gespräch spürbar, ohne dass Musikreaktionen unbrauchbar werden. Sonst nicht als „intelligent“ oder „Gespräche herausfiltern“ vermarkten.
