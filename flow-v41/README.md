# Luma Flow V4.1 – Vintage-Redesign & Helligkeit pro Lampenkarte

**Eigenständige Testversion:** `https://leonvalmeida-cyber.github.io/luma-control/flow-v41/`

Diese Vorschau basiert auf der erprobten `flow-live/`-Oberfläche und nutzt
ihre bestehenden Hue-Lampen- und Gruppendaten.
**Produktive Root-App, `flow-live/` und die bisherige `flow-v4/`-Vorschau werden nicht verändert.**

## Umgesetzte Rückmeldungen

1. **Vintage-Stoffschirm** mit flacher Schnittkante, schräg nach außen verlaufender
   Silhouette, feinen senkrechten Leinenfalten, heller Stoffoberfläche und einem
   dezenten Fransen-Saum. Die Szenenfarbe ist eine sanfte Lichttönung auf dem Stoff,
   keine neonfarbene Plastikfüllung.
2. **Messingfarbener L-Arm** mit durchgehender, geometrisch gebogener Linie:
   bei stärkerem Herausziehen entstehen dezente organische Schwünge im Metall
   (die Luna-Anspielung), **ohne separat eingeblendetes „una“ oder Textobjekt**.
3. **Kieselartiger Wandabschluss** in warmem Metall mit feinem Inlay.
4. **Oberer Lichtkegel bleibt sichtbar, auch wenn die Lampe herausgezogen ist**:
   die Ambient-Lichtfläche wird während des geöffneten Quick-Control vor dessen
   dunklen Hintergrund gesetzt, bleibt aber berührungsdurchlässig.
   Wenn die Lampen wirklich ausgeschaltet sind, bleibt die Lichtabgabe aus.
5. **Gesamthelligkeitsregler bleibt oben** im Quick-Control.
6. **Einzelhelligkeit jetzt in jeder Lampenkarte**: eine kleine Sonne links unten
   öffnet einen Mini-Slider unmittelbar unter der jeweiligen Karte. Der normale
   Ein-/Ausschalter bleibt rechts unten, und Antippen der Karte wählt weiterhin
   nur den Zielbereich. **Kein weiterer Einzelhelligkeitsblock oben.**
7. Vorhandene Schirmvarianten und Linkshändermodus sind unter ⚙ weiterhin
   auswählbar, aber der Vintage-Stil ist der Standard.

## Funktion / Sicherheit

- Die V4.1-Seite kann wie die andere Testversion **echte Hue-Lampen steuern**.
- Der Einzelhelligkeits-Slider sendet erst **beim Loslassen** genau einen
  API-v1-Lichtbefehl an **die eine Lampe**. Beim Ziehen erfolgen keine Hue-Anfragen.
- Der obere Gesamtregler sendet nur beim Loslassen; höchstens drei Lampen parallel.
- Die Steuerung verändert keine Gruppenmitgliedschaft, wechselt bei
  Einzelhelligkeit nicht die aktuelle Gruppe und verwendet keine zusätzlichen API-Keys.
- Die Darstellung basiert auf dem vorhandenen Hue-/Musik-Status. Wenn eine andere
  App die Lichter ohne aktualisierten Status verändert, kann die Farbe kurzfristig
  veraltet erscheinen.
- Kein Entertainment/DTLS in diesem V4.1-Designschritt, der separate Streaming-
  Test bleibt unverändert.

## Prüfpunkte auf dem iPhone (Safari)

- Schirm: cremefarben, rechteckig-flacher oberer Saum, senkrechte Falten,
  goldener Arm, organischer Halter; kein „una“-Text.
- Herausziehen und Zurückschieben funktionieren unverändert.
- Öffnen: sichtbarer farbiger Lichtschein auf dem Stoff sowie der obere
  Lichtkegel (wenn die ausgewählten Lampen eingeschaltet sind).
- Gesamtregler oben funktioniert.
- Im Gruppenbaum eine Lampenkarte öffnen, links auf ☀ tippen,
  Mini-Regler bewegen und erst beim Loslassen anwenden.
- Auswahl anderer Lampen/Gruppen und Ein/Aus daneben bleibt unabhängig.
- Schirmvarianten und Linkshändermodus unter ⚙.
- Die ursprünglichen `flow-v4/` und `flow-live/` unverändert vergleichen.

## Qualitätssicherung

`node --test flow-v41/tests/v41.test.cjs` plus Originaltests
der LIVE- und V4-Version sind im GitHub-Workflow
`.github/workflows/flow-v41-tests.yml` vorgesehen.

**Die automatischen Tests ersetzen keinen visuellen Safari-/Hardwaretest.**
