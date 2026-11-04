# Luma Flow V4.2 – Luma Metall-Logo, Lichtkegel und neue Designvarianten

Test-URL nach GitHub-Pages-Veröffentlichung:
https://leonvalmeida-cyber.github.io/luma-control/flow-v42/

**Isolierte Testversion.** Bestehende Haupt-App, /flow-live/, /flow-v4/
und /flow-v41/ wurden nicht verändert.

## V4.2-Umsetzung

1. **Luma statt Luna:** Der Vintage-Messingarm formt beim Ausziehen
   nun tatsächlich das lesbare Wort **Luma**. Das L ist der vertikale
   Armabschnitt; die folgenden Buchstaben entstehen aus der **einzigen
   durchgängigen SVG-Metalllinie**. Keine text-Objekte oder aufgesetzten
   Beschriftungen. Beim Einziehen flacht die Typografie mechanisch zum
   normalen L-Arm ab. Andere Designvarianten haben eigene Armformen.
2. **Physikalisch plausiblerer Kegel:** Links und rechts des tatsächlich
   beweglichen Schirms breiten sich symmetrische Lichtflächen schräg
   auseinander aus. Kein senkrechter rechter Außenrand mehr. Für die
   vier Schirmtypen berücksichtigt der Ursprung jeweils deren eigene
   Unterkante/Oberkante.
3. **Neue Designrichtungen:** Die akzeptierte cremefarbene
   **Leinen-Vintage-Lampe** bleibt erhalten.
   Neu und deutlich eigenständig sind **Art Déco** (geometrisches
   Facettenglas und Metall), **Washi** (japanische Papierlaterne mit
   Rahmenrippen) und **Halo** (minimalistische leuchtende Ringform).
   Die Stangenformen unterscheiden sich ebenfalls.
4. **Wegklappen beim Scrollen:** Bei offenem Quick-Control wandert die
   Lampe samt Schirm, Arm und Lichtkegel progressiv in den oberen sicheren
   Bildschirmbereich. Der unsichtbare Zurückzieh-Griff bleibt genau beim
   Schirm. Beim Schließen setzt die Position zurück.
5. **Sichtbare Lichtfarben im Stoff:** Ein radialer, von der laufenden
   Hue-/Musik-Ambient-Auswertung gespeister Farbgradient leuchtet
   **innerhalb der Stoffkontur**, nicht nur am Rand. Falten und Textileffekt
   bleiben darüber sichtbar. Bei ausgeschaltetem Licht verschwindet
   die innere Färbung. Bei geöffnetem Quick-Control bleibt der
   Lichtkegel oberhalb des abgedunkelten Overlays sichtbar und ist
   weiterhin nicht klickbar.
6. **Helligkeitssteuerung unverändert:** Gesamthelligkeit oben.
   Einzellampen-Regler per ☀ in ihrer eigenen Lampenkarte.
   Keine zusätzliche Musik-/Entertainment-Entwicklung in dieser Version.

## Tests / Grenzen

- Node-Tests: node --test flow-v42/tests/v42.test.cjs
- Basisprüfung: bestehende Flow-LIVE- und V4.1-Tests unverändert.
- iPhone-Safari und echte Hue-Hardware müssen visuell und funktional
  durch den Nutzer geprüft werden, automatisierte Tests sind dafür
  kein Ersatz.
- V4.2 verwendet für manuelle Helligkeit weiterhin die vorhandene
  Hue-REST-Verbindung; **kein DTLS-Livestreaming** in diesem Designpaket.
- Keine automatische Änderung der Lampen beim Herausziehen oder Scrollen;
  die Ambient-Lampe visualisiert den aktuellen Luma/Hue-Zustand.
- Auf der linken Bedienseite ist das gesamte SVG geometrisch gespiegelt;
  die Lesbarkeit des formenden Luma-Schriftarms auf Linkshänder-Seite
  sollte im Praxistest separat überprüft werden.

## Schnelltest iPhone

1. Die Testseite unter /flow-v42/ in Safari öffnen (Heim-WLAN).
2. Leinen-Schirm ansehen; er soll im angenommenen V4.1-Stil bleiben.
3. Ausziehen: Ist **Luma** tatsächlich als metallische Linie lesbar?
4. Bei geöffnetem Menü nach unten scrollen: Lampe rückt nach oben,
   darunterliegende Lampenkarten sind leichter erreichbar.
5. Nach links/rechts auslaufende Unterkante des Lichtkegels und
   obere Lichtwirkung prüfen.
6. Eine rote, blaue oder violette Szene aktivieren: die **Schirmfläche**
   leuchtet innen farbig, mit sichtbarer Stoffstruktur.
7. In ⚙ Einstellungen jeweils Art Déco, Washi und Halo auswählen,
   öffnen und wieder einziehen. Einzellampen-Dimmer und obere
   Gesamthelligkeit weiterhin prüfen.
