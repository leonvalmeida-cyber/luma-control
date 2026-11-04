# Luma Flow V4.5 — Licht direkt in den Gruppen einstellen

**Testseite:** https://leonvalmeida-cyber.github.io/luma-control/flow-v45/

## Änderungen nach dem iPhone-Screenshot vom 4. November 2026

- **Einfacher Lampenstart:** Die eingefahrene Lampe ist wieder in
  Originalgröße und hat eine größere transparente, zuverlässige
  Touch-Zielzone. Ein kurzer Fingertipp öffnet Quick Control direkt,
  statt sich ausschließlich auf ein verzögertes Safari-Klickereignis
  zu verlassen. Ziehen zum Öffnen und Zurückwischen zum Schließen
  bleiben möglich. Die Einstellungs-Schaltfläche ist priorisiert;
  während ein Einstellungs-Menü offen ist, fängt die geparkte Lampe
  dort keine Touchs ab.
- **Helligkeit direkt bei All/Wohnzimmer:** Die alte, oben angeordnete
  Gesamthelligkeitskarte **und der magnetische Doppel-Sockel entfallen**.
  Stattdessen bekommt **die jeweils ausgewählte Gruppe** unmittelbar
  innerhalb ihrer violetten Karte einen nativen horizontalen
  Helligkeitsregler und eine Prozentanzeige. Für nicht ausgewählte
  Gruppen bleibt die kompakte Originaldarstellung.
- **Nur beim Loslassen:** Der Gruppenregler sendet erst nach der
  `change`-Aktion Hue-REST-Kommandos für die erreichbaren Lichter
  der ausgewählten Gruppe; bis zu 3 Lampen gleichzeitig. Bewegung
  (`input`) aktualisiert nur Farbe/Prozent, nicht die Bridge.
  Einzelhelligkeit und Ein-/Ausschalter innerhalb der Lampenkarten
  bleiben vollständig erhalten. Alle manuellen Eingriffe stoppen
  gegebenenfalls laufende Musikanimationen wie zuvor.
- **Echte Wohnzimmerszene:** Der freie Platz oben im Quick-Control
  zeigt jetzt einen sanften, illustrierten Wohnbereich mit Fenster,
  Sofa, Teppich und Pflanze. Die **wirkliche bewegliche Luma-Lampe**
  schwebt dort im oberen Bereich; es wird keine zweite Lampe gezeichnet.
  Die Szene lässt sich nicht anklicken und verdeckt keine Knöpfe.
- **Schönere Lichtkegel:** Der obere und der symmetrische untere
  Kegel setzen direkt an der tatsächlichen Schirmposition an. Die
  Lichtfelder sind schmaler, stärker weichgezeichnet und dezenter,
  damit sie Text und Lampenkarten nicht überstrahlen. Die
  Szene-/Musikfarbe im Schirm bleibt erhalten.
- **Schienenführung bleibt:** Der bewegliche Schlitten und die
  Luma-Schrift für alle vier Designs (Vintage Linen, Art Déco,
  Washi, Halo) bleiben samt Linkshändermodus erhalten. Beim Scrollen
  fährt die Lampe weiterhin sanft nach oben und wieder zurück.
- **Schirm antippen im offenen Zustand:** Der bereits sichtbare
  Gruppen-Helligkeitsregler wird hervorgehoben/fokussiert.
  **Kein Hue-Befehl durch bloßes Tippen.**

## Sicherheit / Test

Nur Dateien unter `flow-v45/` sowie die neue isolierte
Testkonfiguration `.github/workflows/flow-v45-tests.yml` wurden
angelegt. Die produktive Haupt-App, `flow-live/`, frühere
Flow-Vorschauen und die Musikengine wurden **nicht verändert**.

Offline: `node --test flow-v45/tests/v45.test.cjs`, inklusive
vorheriger Regressionen im separaten CI-Workflow. Die automatischen
Tests sind **keine Bestätigung echter iPhone-Safari-Gesten oder
physischer Hue-Bridge-Kommandos**.

### Kurztest am iPhone

1. Im normalen Luma-Hauptbildschirm die **eingefahrene** Lampe
   mehrmals antippen. Sie muss sich sofort öffnen und die
   Einstellungs-Schaltfläche darf nicht blockiert werden.
2. Quick-Control geöffnet: oben befindet sich eine eingerichtete
   Zimmeransicht **ohne** die bisherige Helligkeitskarte.
3. `All` auswählen: violette Karte zeigt Prozent und direkten
   horizontalen Slider. Nach rechts/links ziehen; erst beim Loslassen
   ändern sich die Lichter.
4. `Wohnzimmer` auswählen: der Regler erscheint nur dort und
   beeinflusst nur diesen Raum; andere Lampen/Gruppen nicht.
5. Unter einem Einzellampenkärtchen weiterhin ☀ antippen und
   Einzelhelligkeit einstellen.
6. Mit einer bunten Szene testen: Schirm leuchtet von innen,
   Lichtkegel fächern weich nach unten und bleiben beim
   Scrollen am beweglichen Schirm.
7. Linkshänder und die vier Designstile prüfen. Schirm wieder
   einziehen, neu öffnen, wiederholen.

**Bitte noch am echten iPhone gegenprüfen**, ob die geänderte
Parkposition den Einstellungen genug Platz lässt.
