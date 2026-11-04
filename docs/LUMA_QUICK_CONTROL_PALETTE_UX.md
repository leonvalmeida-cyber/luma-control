# Luma Flow · Quick Control + visuelle Musikstimmungen
**UX-Konzept / Implementierungsplan · 04.11.2026**
**Status: Designentwurf; noch keine Änderungen an der Live-Oberfläche.**
**Basis:** \`flow-live/index.html\` auf \`main\` (separater Test-Unterordner); Produktions-\`main/index.html\` v0.23 ist geschützt.

## 1. Korrektur des Missverständnisses

Die derzeitige \`miLampGallery\` mit 7 dynamischen Lampenkarten wurde am falschen Ort integriert. Der Nutzer meinte *visuelle Vorschau der Musikfarbstimmungen* wie Neon/Sonnenuntergang/Ocean/Warm, nicht eine zweite Gerätegalerie neben der bestehenden Gruppenauswahl.

Zwei strikt unterschiedliche Bausteine:

1. **LICHTBEREICH (Geräte + Steuerung):** Baumstruktur mit Zimmern/Untergruppen, kleinen lampentypähnlichen Symbolen, Status, direktem Ein/Aus. Die große, separate Musik-Lampenvorschau entfällt. Lichtbereich ist wie bisher gemeinsames Ziel für Licht/Szenen/Musik.
2. **MUSIKSTIMMUNG (Farbwirkung):** kleine farbige *Vorschaukarten* bei Neon, Sunset, Ocean, Warm. Keine Gerätebilder: kleine abstrakte Glow-Komposition oder Verlauf + 3–5 Farbpunkte zeigen den erwarteten Look.

## 2. Interaktion – maximal 1–2 Taps für die Küchenlampe

**Zwei eindeutige Aktionen pro Gerät:**
- **Tap auf Lampenkarte / Namen:** Nur auswählen (= Ziel für Licht/Szenen/Musik), **nicht** schalten. Sofortige visuelle Hervorhebung des Zielbereichs.
- **Tap auf den separaten Power-Button ⏻:** Nur diese eine Lampe direkt ein/aus; Auswahl bleibt erhalten. Status und mögliche Fehlermeldung erscheinen ohne Layoutsprung. Power hat eine eigene Trefferfläche ≥44×44 pt.

**Aufklappen (getrennt von Auswählen und Schalten):**
- Zimmerzeile hat links Pfeil/Chevron (öffnet), daneben Zimmername (wählt Zimmer), rechts klar beschrifteten Power für Zimmer (schaltet Zimmer-Gruppe nur bei bewusster Betätigung); Gesamtgruppe **All** ohne irrtümlich leicht auslösbares Massen-Aus.
- **Zimmer/Untergruppe aufgeklappt:** Einrückung und feine vertikale Baumlinien bleiben sichtbar. Innerhalb des Raumastes kompakte Lampenkarten mit Mini-SVG (Iris/Twilight/Bulb/Strip) samt **Namen** und dezentem Ein-/Ausstatus. Kleine Bilder **nur** im Baum, nicht in extra-Galerie.
- **Zimmer geschlossen:** Nur eine kompakte Zeile, deren Höhe tatsächlich schrumpft (keine feste min-height). So bleibt Musik-Interface schnell erreichbar.
- Wenn mehrere Zimmer: maximal ein Raum standardmäßig geöffnet; andere Räume bleiben als einzeilige Zeilen sichtbar. Vollständig einklappbarer Gruppenbereich bleibt erhalten.
- **Schnellzugriff:** Eine kurze horizontale „Zuletzt/Favoriten“-Reihe *nur, wenn nützlich* (maximal 3 Einträge), z. B. „Küche · Decke“. Sie dupliziert nicht den ganzen Baum. Klare Power-Aktion immer getrennt von Auswahl.
- Lampe identifizieren: anzeigen des echten Hue-Namens; optionale kurze nutzerdefinierte Bezeichnung „Küche Decke“ / „Über Arbeitsplatte“ und Zuordnung zu Raum. Nicht automatisch behaupten, dass die Lampenposition erkannt wird.
- „Nicht erreichbar“ deutlich anzeigen; Power deaktivieren.

**Schnellweg Beispiel:**
\`Küche ▾\` → sichtbare Karte \`Deckenlampe    ⏻\` → \`⏻\` schaltet direkt nur die Deckenlampe. Ist „Küche/Decke“ zuletzt verwendet, kann der Power-Schnellzugriff ein einziges Tippen sein.

## 3. Mobile Wireframe (konzeptuell)

\`\`\`text
┌──────────────────────────────┐
│ 💡 LICHTBEREICH     Küche  ▾ │   ← geschlossen: ca. 48–56 px
└──────────────────────────────┘

┌──────────────────────────────┐
│ LICHTBEREICH      6 Lampen ▴ │
│ ◈ All                        │
│ │                            │
│ ├─⌄ 🏠 Wohnzimmer      ⏻     │
│ │   ◯ Iris  ● AN   [⏻]     │
│ │   ◯ Twilight      [⏻]     │
│ │                            │
│ └─⌄ 🏠 Küche           ⏻     │
│     ┌────────┐ ┌────────┐   │
│     │ 💡     │ │ 💡     │   │
│     │ Decke  │ │ Küche  │   │
│     │ ● AN ⏻ │ │ ○ AUS⏻ │   │
│     └────────┘ └────────┘   │
└──────────────────────────────┘

  🎵 MUSIK · LIVE
  [ Starten / Stoppen ]
  DEINE FARBSTIMMUNG
  ┌────────────┐ ┌────────────┐
  │ ✨  🟣🔵🩷 │ │ 🌅 🟠🩷🟡 │
  │ NEON       │ │ SUNSET     │
  └────────────┘ └────────────┘
  [OCEAN] [WARM] …
  [Bass-Puls] [Welle] [Flow] …
  [Intensität ━━━━━●━━]
\`\`\`

**Layoutentscheidung:** Nicht alle Lampenkarten gleichzeitig groß darstellen. Im Baum Zimmerstufen als Zeilen, Lampen eines geöffneten Zimmers als **2-Spalten-Mini-Karten**, mit 3 bei breiteren Displays. Die schmalen Linien verbinden die Karten optisch mit dem jeweiligen Zimmer. Bezeichnungen und Erreichbarkeit haben höhere Priorität als Illustrationen.

## 4. Musikstimmungen statt Lampengalerie

- \`Neon\`: dunkel-violett, Magenta, Cyan; intensiver Glow.
- \`Sonnenuntergang\`: Orange, Gelb, Pink; warmweicher Glow.
- \`Ozean\`: Blau, Türkis, kühle hellere Reflexe.
- \`Warm\`: Amber, Bernstein, warmweiß, weniger Farbsättigung.
- Palettekarten zeigen 1) kleine **ästhetische Farbkomposition**, 2) Namen, 3) klaren ausgewählten Zustand, 4) optional 3–5 subtile Farbpunkte. **Keine Produktbilder, keine falschen Lampenpositionen**.
- Horizontal scrollbarer Bereich, typischerweise zwei Karten plus angeschnittene nächste Karte. Tap = Farbpalette wechseln. Kein neues Bestätigungsmenü, kein extra Diagnoseblock.
- Kleine CSS-/SVG-Glow-Grafiken statt externer Fotos; lokale Assets, schnell ladend, wenig Daten und robust bei Dark Mode.
- Die vorhandene Musik-Visualisierung kann die gewählte Palette ergänzend darstellen. Der bisherige große \`miLampGallery\`-Block entfällt vollständig und seine Geräte-Metadaten werden in den Gruppenbaum übernommen.

## 4a. Lampensymbole individuell anpassen – bewusst in Untereinstellungen (neu)

**Nutzerwunsch:** Bei fehlerhafter automatischer Erkennung soll jedes Lampensymbol manuell geändert werden können. Im normalen Gruppenbaum darf dadurch kein zusätzlicher Einstellungsballast entstehen.

**Standard:** Luma wählt ein Symbol automatisch aus dem Hue-Gerätemodell bzw. Typ, z. B. Glühbirne, Iris, Twilight, LED-Strip, Deckenlampe, Tischlampe, Stehlampe, Pendelleuchte, Spot oder indirektes Licht. Ist der Typ unbekannt, neutrales Leuchtmittel verwenden. Diese Zuordnung zeigt nur eine Illustration, keinen behaupteten echten Produktnachweis.

**Bewusst versteckte Anpassung:** `⚙ Einstellungen → Lampen verwalten → [Lampe auswählen] → Darstellung → Symbol ändern`. Alternativ kann ein Kontextmenü/Long-Press auf einer Lampenkarte dorthin führen; kein immer sichtbarer Zahnradknopf auf jeder Karte. Symbolauswahl als kleine, konsistente **SVG-Icon-Bibliothek** (nicht als externer Fotokatalog). Optional lassen sich auch ein verständlicher Kurzname und Raumzuordnung innerhalb von Luma pflegen.

**Einstellungen pro Lampe:** Eingabe `iconOverride` (null = automatisch oder ein Wert aus der erlaubten Icon-Liste), optional `displayNameOverride`, später ggf. Position. Speicherung lokal **pro Bridge-ID + Hue-Lampen-ID**, nicht an veränderliche Lampennamen binden. Produktive Hue-Namen/Typen werden beim bloßen Ändern der Anzeige nicht verändert; keine Bridge-API-Schreibanfrage.

**Verhalten:** Eine Anpassung aktualisiert die kleine Lampenkarte **und den entsprechenden Baumknoten** sofort, ohne die übrigen Knoten neu zu zeichnen. Auch nach Neuladen, Gruppenänderungen oder neuer Lampensuche bleibt sie erhalten. „Zurück auf automatisch“ entfernt nur die Überschreibung. Fehlerhafte Einträge oder neue/gelöschte Lampen dürfen keine anderen Lampensymbole überschreiben.

**Testkriterien:** Iris automatisch → manuell Deckenlampe → Reload → Deckenlampe bleibt → „Automatisch“ → Iris wieder sichtbar. Umbenennung eines Hue-Geräts darf die Einstellung nicht verlieren. Anderen Bridge-Schlüssel/Bridge-ID wählen → keine Übernahme der alten Darstellung. Symbol ändern erzeugt **0** Hue-Light-Befehle.

## 5. Technische Umsetzung – risikoarm, Schritt für Schritt

1. **UI auf Entwicklungsbranch**, bestehende Produktionsseite unverändert. Gruppenauswahl bleibt Engine \`LumaGroupsV1\` + Tree-Modul mit \`selectedTarget\`.
2. \`Tree\` erweitert: pro Geräteknoten Symbol/Kurzname/Status und **separater \`onTogglePower(lightId)\`**. Raum-Knoten bekommen klaren \`onToggleGroupPower(groupId)\`-Handler (mit Anzahl). Diese Handler stehen getrennt von \`onSelect(id)\` und \`toggleExpand(id)\`; keiner darf das Event des anderen auslösen.
3. **Keine vollständige DOM-Neuerstellung** bei Auswahl, Öffnen oder Power-Status. Statusklasse/Aria-Attribute aktualisieren; Scrollposition und Fokus in Safari stabil halten. CSS: dynamische Baumhöhe, keine Mindesthöhe.
4. **Hue-Steuerung:** vorhandene Bridge-Daten \`lights[id].state.on/reachable\` und \`window.lumaRequest('PUT','/lights/'+id+'/state',{on})\`. Vorhandene Gruppen-Auflösung respektieren. Keine Befehle an andere Lampen, keine Gruppenauswahl als Seiteneffekt. Pending-Zustand anzeigen, Doppelbefehle blockieren, Fehler rückmelden. Status nach Erfolg und Refresh aktualisieren.
5. **Musikbetrieb & manuelles Schalten:** Ein/Aus darf nicht sofort vom laufenden Musikmodus überschrieben werden. Erste sichere Version pausiert die Musiksteuerung vor einer direkten manuellen Schaltung und zeigt das an. Später optional **„Lampe aus Musik ausnehmen“**, damit alle anderen weiterreagieren.
6. **Aufräumen:** \`miLampGallery\` aus Musikseite entfernen und die bisherige \`lamps\`-Array-Struktur **für die Audio-/Musikframes behalten**, aber ihre DOM-Elemente in einen nicht sichtbaren internen Host verlagern. Bestehende Musikframe- und Hue-Senderlogik nicht versehentlich entfernen.
7. **Palettenvorschau** in \`miQuickPalettes\` als Karten, deren Farben direkt aus vorhandener \`palettes\`-Konfiguration stammen. Status in \`syncMusicControls\` synchronisieren; keine Duplikate/zusätzliche Musikrequests.
8. Optionale **Zuletzt/Favoriten** getrennt im Live-Namespace speichern; nie ungefragt bestehende produktive gespeicherte Gruppen überschreiben.
9. Erst separat auf \`flow-live\`/eigenem Testpfad veröffentlichen; \`main:index.html\` 0.23 nicht ändern, keine automatischen Gruppenschaltungen beim Laden.

## 6. Prüffälle / Freigabekriterien

- Küche ausklappen → 2 Mini-Karten sichtbar; bei Einklappen **Gesamthöhe kleiner**; Scrollposition/Fokus stabil.
- Lampenkarte auswählen → Ziel ändert sich; **kein Hue PUT**.
- Power auf „Küche Decke“ → **genau ein** adressierter \`/lights/<id>/state\`-Befehl, andere Lampen unverändert; Auswahl unverändert.
- Ist ein Raum gruppiert → Raum-Symbol/Power schaltet ausschließlich die Mitglieder der betreffenden Gruppe; „All“ bewusst gesichert.
- Auswahl von „Küche Decke“ wirkt im Licht-, Szenen- und Musikbereich konsistent.
- Bei 7 Hue-Lampen werden alle sichtbar und eindeutig identifizierbar; keine doppelt in Untergruppe/Elternraum.
- Offline-/nicht erreichbare Lampe zeigt eindeutigen Status, keine irreführende Erfolgsmeldung.
- Musik läuft und User schaltet manuell: **kein Flackern durch konkurrierende Musikupdates**.
- Palette Neon/Sunset/Ocean/Warm besitzt eine auf einen Blick unterscheidbare kleine Farbkarte; Karten sind zugänglich und flüssig auf iPhone.
- Experte-/Audiotests und Störschutz bleiben technisch unverändert; die Nutzeroberfläche soll klar kürzer werden.
- Automatisierte Tests und **echter Bridge-Pro-/iPhone-Test** vor Merge.

## Empfehlung

**Nicht** eine zweite Lampenliste unten mit der Gruppenauswahl synchronisieren. **Stattdessen eine einzige visuelle Quelle für Geräte**: den Gruppenbaum mit Mini-Lampenkarten und direkter Power-Aktion. Und **ein separater visueller Ort für Musiklooks**: kleine Farbpaletten-Karten. Dadurch entsteht Übersicht ohne doppelten Platzbedarf.

Nächster eigentlicher Entwicklungsschritt nach diesem abgestimmten Konzept: die alte Lampengalerie gezielt aus dem Musikbereich herausnehmen, Baum-Power/Auswahl voneinander trennen, und die Palettenkarten in einem isolierten iPhone-Test implementieren.
