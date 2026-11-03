# Luma Control – Szenenbibliothek 1.0
Stand: 03.11.2026 – Designkonzept + Entwicklungsprototyp auf `feature/scenes-v1`.

## Ergebnis der Bestandsaufnahme
Ausgangsversion auf `main`: v0.23. Alle Szenen werden algorithmisch aus 24 Themen × 8 Varianten erzeugt (192 Einträge). Der Star speichert numerische Indizes unter `luma07_favorites`, die aktive Szene unter `luma07_selected` und Stimmung unter `luma07_mood`. Die aktuelle Steuerung verarbeitet pro Lampe sequentielle Hue-REST-v1-`PUT /lights/{id}/state`; Zielgruppen und Musik nutzen dieselbe Verbindung. Hier dürfen wir nicht unkontrolliert zusätzliche Echtzeit-Updates einführen.

## Szenen-UX
1. **Favoriten / Entdecken** als große, sofort verständliche Umschaltung.
2. Favoriten ist der bevorzugte Ausgangspunkt. Leere Ansicht erklärt freundlich die Stern-Funktion.
3. Entdecken enthält 48 handverlesene Lichtwelten aus sechs Kategorien: Neon, Natur, Wärme, Fantasie, Alltag, Atmosphäre.
4. Jede Karte zeigt eine originale atmosphärische SVG-Illustration, Szenenname, Kategorie, Farbstreifen, Favoritenstern und direkten Aktivieren-Button. Die SVGs sind **stilisierten Illustrationen**, keine Fotos, erzeugen keine externen Bildanfragen und sind keine exakten Darstellungen eines Raumes.
5. Horizontale Kategorienfilter und Suchleiste; kein unnötiger Fortschritts-/Diagnosetext.
6. Stimmung (Helligkeit, Sättigung, Kontrast) bleibt als Steuerung mit übernommener aktueller Logik verfügbar. Übergang separat einstellbar.
7. Eigene Szene: vorhandene Szene kopieren, Namen vergeben, sieben Lichtplätze individuell einfärben und Helligkeit einstellen. Eigene Szenen bearbeiten/löschen.
8. Dynamikfunktion bleibt als aufklappbarer Abschnitt vorhanden; keine neue schnellere API-Frequenz.

## Datenmigration
- Bestehende Szenen bleiben im Quellcode als Legacy-Vorlagen hinterlegt.
- Alte Favoriten aus `luma07_favorites` werden bei erstmaliger Einrichtung nach `legacy-N` in den neuen Datenspeicher `luma_scene_v1` übernommen.
- Danach sind ausschließlich v1-Favoriten maßgeblich (sonst würden absichtlich entfernte Legacy-Favoriten nach einem Neustart zurückkehren).
- Alte Favoriten werden in der Favoritenansicht weiterhin dargestellt und können angewendet werden.
- Neue Presets verwenden beständige IDs (`builtin-...`), eigene Szenen `user-...`.
- Keine alten localStorage-Schlüssel werden gelöscht oder überschrieben.
- JSON Export/Import enthält ausschließlich Favoriten und eigene Szenen; niemals Bridge-IP/Key. Ein Import ergänzt Daten und ersetzt vorhandene eigene Szenen mit gleicher ID durch die importierte Version; bestehende nicht vorkommende bleiben.
- Eine geräteübergreifende Synchronisierung benötigt später bewusst ausgewählte lokale/Cloud-Speicherung; wird **nicht** behauptet.

## Technisches Integrationskonzept
Ein separates Script `scenes-v1.js` und CSS `scenes-v1.css` sind auf dem Entwicklungsbranch hinzugefügt. Das bestehende `index.html` gibt nur einen Adapter frei: `window.lumaApplyCuratedScene`. Dieser verwendet unverändert die vorhandene Bridgeverbindung, stoppt laufende Effekte und ruft `paint()` auf. Die Szenenbearbeitung speichert unabhängig von Musik/Gruppen. Musiktransport, Key-Handling und Hue-Connect bleiben unverändert.

## Qualitätssicherung
Bereits geprüft:
- Syntax aller drei Inline-Skripte in der modifizierten HTML-Datei.
- Keine mehrfach belegten DOM-IDs.
- Syntax der neuen Szenenbibliothek.
- Simulierter DOM-Test: 48 Entdecken-Szenen, Migration von 2 alten Favoriten, Hinzufügen eines neuen Favoriten und Persistenz in `luma_scene_v1`.

**Nicht geprüft / Freigabesperre:**
- Tatsächlicher iPhone-Safari-Test und Darstellung auf 320–430px.
- Echte Hue-Bridge und unterschiedliche Lampen-Capabilities.
- Dauerhafte Persistenz nach Browserneustart sowie Import auf zweitem Gerät.
- Visuelle Bewertung der SVG-Illustrationen mit Anwenderfeedback.
- Szenenübergänge, Abbruch bei Gruppenwechsel, Timeout/Fehlernachricht.
- Bedienbarkeit Screenreader, Kontrast, VoiceOver.
- Keine Veröffentlichung/kein Merge auf `main`, bevor diese Tests zufriedenstellend sind.

## Entscheiden vor Release
- Fotos versus eigens gestaltete Illustrationen: erster Entwurf verwendet urheberrechtlich unproblematische Original-SVGs; gewünschte fotografische Variante kann später als optimiertes WebP-Bildpaket gestaltet werden.
- Szenenanzahl nach Bewertung: 48 ist Ausgangspunkt, nicht zwingender Endumfang.
- All/Wohnzimmer/Lampen-Zielauswahl bleibt aus v0.23 erhalten.
