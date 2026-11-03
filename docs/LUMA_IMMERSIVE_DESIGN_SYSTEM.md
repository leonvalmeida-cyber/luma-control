# Luma Immersive 1.0 — Designsystem (Entwurf)
**Stand:** 4. November 2026 · **Status:** Designrichtung vom Nutzer positiv bewertet; noch keine endgültige Funktionsfreigabe.

## Verbindliche Produktprinzipien
- **Atmosphäre sichtbar, Bedienung einfach.** Konzept B (Immersive) ist die optische Referenz.
- Drei tägliche Hauptbereiche: **Licht · Szenen · Musik** in einer festen, Safe-Area-konformen unteren Navigation.
- **Gruppen & Lichtbereiche, Bridges & Geräte, Darstellung** in Einstellungen; Gruppenauswahl bleibt auf den Hauptseiten mit einer Berührung erreichbar.
- Die bestätigte Szenenbibliothek aus `feature/scenes-v1` bewahren; sie nicht durch Demo-Karten ersetzen.
- Eingeklappte Experteneinstellungen; sichtbare Regler nur, wenn sie häufig gebraucht werden.
- Gestaltung und Animationen senden *keine* zusätzlichen Hue-Befehle.

## Referenz / aktueller Implementierungsstand
- Klickbarer, **rein lokaler Designprototyp** in `main:immersive-preview/index.html`; eigene Demonstrationsdaten ohne Bridge- und Mikrofonzugriff.
- Produktive Licht- und Musiksteuerung weiterhin in `main:index.html` (Version 0.23).
- Neue Szenenbibliothek als `feature/scenes-v1` und separat zur visuellen Prüfung unter `main:scene-preview/`.
- Native SwiftUI-App in `ios/LumaApp/` ist noch ein Mikrofon-Prototyp, keine fertige iOS-Steuerung.
- Diese Dokumentation und zukünftige Umsetzungsarbeiten erfolgen zunächst unabhängig von der produktiven App.

## Grundlage: Farb- und Oberflächentokens
| Token | Wert | Verwendung |
|---|---|---|
| `--luma-bg` | `#090b18` | Grundfläche, Statusleiste |
| `--luma-card` | `#171b30` | Karten |
| `--luma-card-raised` | `#242441` | angehobene Oberflächen |
| `--luma-fg` | `#faf7ff` | Haupttext |
| `--luma-muted` | `#b1b1c9` | Begleittext |
| `--luma-accent` | `#c6adff` | primärer Akzent |
| `--luma-violet` | `#a882ff` | Licht-Glow, Highlights |
| `--luma-pink` | `#ff91bf` | atmosphärische Akzente |
| `--luma-cyan` | `#80dfff` | atmosphärische Akzente |
| `--luma-good` | `#a5f7d3` | Verbindung bereit |
| `--luma-border` | `#ffffff18` | subtile Trennung |

Farbakzente dürfen dynamisch aus Szenenpaletten kommen; Eingabeelemente und wichtige Beschriftungen behalten konstanten Kontrast. Rot nur für echte Warnungen, nicht als Dekoration.

## Typografie und Abstände
- Systemschrift der Plattform (Web: `-apple-system`; SwiftUI: system).
- Haupttitel 30–42 px / etwa 700–750 Gewicht, kompakte Zeilenhöhe.
- Sektionstitel ca. 20 px, Kartenname 13–15 px, sekundärer Text 11–14 px.
- Horizontale Mobilabstände 19 px, Kartenradius 19–28 px, inneres Padding 13–19 px.
- Touchflächen mindestens 44 × 44 CSS-px.
- Das vom Nutzer bereits akzeptierte Displayseitenverhältnis **nicht** ohne neuen Anlass ändern; responsive Layouts statt fixer Bildhöhe.

## Komponenten und Verhalten
1. **LumaHeader:** Brand links, Einstellungszugriff rechts. Niemals API-Key oder Bridge-IP im Header.
2. **BottomTabs:** Licht, Szenen, Musik; sichtbarer Zustand, screenreader-fähige Bezeichnung, Safe Areas.
3. **AreaPicker:** All / Wohnzimmer, aus realen Bridge-Daten; andere Gruppen über separate Verwaltung erreichbar.
4. **ImmersiveHero:** atmosphärischer Verlauf/Glow; kein zusätzlicher Netzwerkverkehr. Energiesparend und `prefers-reduced-motion` beachten.
5. **LampCard:** sichtbarer Name, Zustand, Farbe/Leuchtbild, ausreichend große Schaltfläche. Aktualisierungen zunächst lokal; Bridge-Senderate außerhalb des Designs regeln.
6. **SceneCard:** existierende 48 Szenen + Benutzerfavoriten; Illustration, *alle* Farben, Stern und Anwenden. Datenmigration aus der Szenenbibliothek erhalten.
7. **MusicPanel:** großer Start/Stop, Audioquelle, Reaktionsmodus, Intensität; fortgeschrittene Regler hinter Expertenansicht. Labels für Apple Music/Spotify nur als „geplant“ bis zu echter Integration.
8. **SettingsSheet:** Gruppen/Bridges/Design getrennt; rückkehrbare Detailansichten und klare Fehlerhinweise ohne Tab-Sprünge.
9. **Toast/Error:** nicht layoutverschiebend, `aria-live`; im Fehlerfall aktivem Bereich treu bleiben.
10. **Slider:** sichtbarer numerischer Wert, min/max, Bedienbarkeit per Touch und Tastatur.

## Navigation
**Modell:** 3 Haupttabs plus Einstellungen (gewählt).
- Licht → Bereich wählen → gesamtes Licht / einzelne Lampen / Helligkeit.
- Szenen → Favoriten oder Entdecken → Szene anwenden → optionale Anpassungen.
- Musik → Quelle → Start → Stimmung → optionale Details.
- Einstellungen → Gruppen & Lichtbereiche / Bridge & Geräte / Darstellung.
Gruppenauswahl bleibt kontextweit erhalten, solange die Bridge-Zugehörigkeit dies erlaubt.

## Animationen und Zugänglichkeit
- 150–300 ms dezente UI-Übergänge; niemals im Takt Netzwerkanfragen erzeugen.
- Musikvisualisierung darf aus lokalem Zustand animieren, aber muss bei Stop sofort enden.
- `prefers-reduced-motion` / native Reduce Motion unterstützen.
- Auf iPhone bei 320–430 CSS-px prüfen; Screenreader, Tastatur-Fokus, Kontrast und große Schrift testen.
- Bei Verbindungsfehlern keine automatische, unerwartete Weiterleitung aus der aktuellen Ansicht.

## Integrationsplan
1. **Gruppenverwaltung:** eigene lokale Gruppen vs. Hue-Räume korrekt unterscheiden; All als virtuelle Gesamtgruppe, Wohnzimmer als reale Room-Gruppe oder klar gekennzeichnete Zuordnung. Keine stillen Änderungen an der Bridge. Safe Export/Import.
2. **Verbindungsassistent:** Bridge-Suche + sichere Kopplung, Lampen-Suche, technische Eingabe optional. Vorher API-Kompatibilität prüfen.
3. **Musikoberfläche:** funktionierende 0.23-Übertragung im Web möglichst unverändert lassen; echtes Entertainment Streaming separat entwickeln.
4. **Szenen:** bereits freigegebene Bibliothek integrieren, Altfavoriten erhalten.
5. **QA:** jede Funktion mit Mock, dann mit echter Bridge/iPhone; Versionsbranch + Review vor Merge auf `main`.

## Freigabekriterien für künftige Arbeiten
- Keine unbeabsichtigten Änderungen an `main:index.html`, Bridge-Credentials oder Geräte-Daten.
- Bestehende Favoriten, Gruppen und Lampenreihenfolgen bleiben erhalten.
- Navigation einschließlich Einstellungen nutzbar.
- Reale Licht- und Musikreaktion in Gerätetests geprüft; keine Latenzbehauptungen ohne Messung.
- Ein separater, anklickbarer iPhone-Testlink je relevanter Entwicklungsversion.
