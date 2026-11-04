# Luma Flow V4 – isolierte Designvorschau

## Einstieg
Nach Veröffentlichung von `main`: https://leonvalmeida-cyber.github.io/luma-control/flow-v4/

**Nicht die produktive Luma-Hauptapp und nicht `flow-live/`.**
Die Vorschau benutzt dieselben vorhandenen Hue-Steuerungsbausteine wie `flow-live/`
und kann bei bestehender Verbindung **echte Lampen schalten**.
Sie hat eigene V4-Dateien und verändert die bestehende Live-Oberfläche nicht.

## Enthalten
- **Plissee** (voreingestellt): oben flach angeschnittener Schirm mit vertikalen Falten,
  **Modern** (reduziert) und **Retro** (sanfte Rundung).
- Elegantere verchromt-rosé L-Stange, stabiles Wandlager.
- Optionaler „Luna“-Schriftzug beim Herausziehen: vorhandener L-Schenkel +
  eingeblendetes „una“, linkshändig gegenläufig lesbar.
- Dezent stärkerer aufsteigender Lichtkegel bei gleichbleibender Konturgeometrie.
- Laufende Szenen-/Musikfarben aus der vorhandenen Ambient-Auswertung,
  Schirm bleibt bei geöffnetem Quick-Control leuchtend, **wenn die Lampen an sind**.
- Kompakter **Gesamthelligkeit**-Regler im Quick-Control (Anwenden beim Loslassen).
- Eingeklappte **Einzellampen-Regler** für bis zu 14 Lampen.
- Einstellungen: Schirmstil und **Linkshänder** mit gespiegelt herausziehbarer Lampe,
  Menü, Bewegungsrichtung, Lichtkegel und Rückwischgesten.
- Einstellungen werden nur lokal unter `luma_v4_lamp_prefs` gespeichert.

## Einschränkungen / Sicherheit
- Die Vorschau nutzt weiterhin **Hue REST** für Helligkeit und die bestehende
  Musiksteuerung. **Kein Hue Entertainment Streaming** in dieser Version;
  hierfür gibt es einen eigenen Windows-Prototyp in Draft-PR #6.
- Schnelles Ziehen am Regler erzeugt noch **keine Hue-Befehle**. Erst beim Loslassen
  erfolgt eine einzelne Anwendung an die ausgewählte Gruppe. Maximal drei gleichzeitige
  Lampenanforderungen, die neueste freigegebene Auswahl ersetzt noch nicht begonnene
  Anforderungen. Laufende Musiksteuerung wird nicht überschrieben.
- Eine Helligkeitsänderung schaltet dabei die ausgewählten Lampen ein.
- Wenn die Zielgruppe unvollständig ist oder noch keine Bridge-Verbindung besteht,
  sind die Helligkeitsregler deaktiviert.
- Lampenfarben beruhen auf Hue-Zuständen aus dem bestehenden Musik-/Lampenmodell.
  Extern in einer anderen App veränderte Farben können ohne erneutes Laden veraltet sein.
- Die bevorzugte Linkshänder-Bedienseite nur bei geschlossenem Quick-Control wechseln,
  um halb vollzogene Gesten nicht umzuschalten.

## Testen
1. Auf dem iPhone **Safari** öffnen, mit der Hue Bridge im selben WLAN.
2. V4-Vorschau öffnen, ggf. unter ⚙ Bridge & Verbindung verbinden.
3. Schirm links herausziehen, Schirm zurückziehen; Licht bleibt sichtbar.
4. Eine Szene anwenden und Schirmfarben kontrollieren.
5. Quick-Control öffnen, Gesamthelligkeit verändern, anschließend Einzellampen.
6. Unter ⚙ die Schirmvarianten sowie Linkshändermodus prüfen (Menü dafür schließen).
7. Prüfen, dass `flow-live/` und die produktive Root-App weiterhin unverändert sind.

## Automatische Tests
`node --test flow-v4/tests/v4.test.cjs` plus alte Flow-LIVE-Regressionen.

**Hardware-/Safari-Test und subjektive Designabnahme stehen noch aus.**
