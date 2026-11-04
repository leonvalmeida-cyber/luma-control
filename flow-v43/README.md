# Luma Flow V4.3 – fester Wandhalter mit Führungsschiene

## Separate iPhone-Testversion
https://leonvalmeida-cyber.github.io/luma-control/flow-v43/

Die neue Seite **nutzt** dieselbe Hue-/Gruppensteuerung wie V4.2, verändert
aber keine bestehende Version. Nur `flow-v43/` enthält neue Dateien.
Es werden keine neuen Zugangsdaten erstellt und keine Hue-Lampen bei
Scroll- oder Ziehbewegungen automatisch geschaltet.

## Was sich geändert hat

- **Alle vier Designs schreiben Luma mit dem Metallarm:** Vintage,
  Art Déco, Washi und Halo nutzen exakt dieselbe durchgehende
  Wort-Geometrie. Der Schriftzug wird nicht als SVG-Text eingeblendet.
  Die Materialien unterscheiden sich weiterhin.
- **Schiene ist wirklich fix:** Die separate SVG-Gruppe
  `v43FixedRail` beinhaltet den goldenen Führungskanal mit einer
  kleinen Endkappe. `v43FixedWall` hält die dekorative Wandhalterung
  unverändert an ihrem Ort.
- **Nur der Schlitten bewegt sich:** `v43MovingAssembly` umfasst den
  beweglichen Schlitten `v43SlidingCarriage`, den Metallarm,
  dessen Lichtreflexion und den Lampenschirm. Ein einziger SVG-
  Transformationswert verschiebt diese gesamte Einheit entlang
  der festen Führung. Die Schiene selbst bekommt keinen Transform.
- **Gleichmäßiger Scrollverlauf:** Wenn Quick-Control offen ist,
  führt Abwärtsscrollen die Lampe maximal 90px nach oben (durch
  Safe-Area und Schienenlänge begrenzt). Bei Rückwärts-Scrollen
  gleitet die Lampe sanft zurück. Schließen senkt den Schlitten
  synchron mit der Einfahranimation an seine Ausgangsposition.
- **Schirm, Grip und Lichtkegel bleiben ausgerichtet:** Derselbe
  aktuelle Hubwert steuert die SVG-Metallgruppe, den unsichtbaren
  Close-Grip, die oberen und unteren SVG-Strahlen.
- **Linkshändermodus:** Der Schienenaufbau wird mit dem SVG
  gespiegelt. Ein eigener durchgängiger Metallpfad formt die
  Buchstaben in umgekehrter geometrischer Reihenfolge, sodass
  sie nach der Spiegelung in Leserichtung erscheinen.
- **Unverändert:** Innen beleuchteter Leinenschirm, alle Design-
  Alternativen, symmetrische Lichtkegel, Gesamt- und Einzel-
  helligkeitsregler, gesamte Hue-Gruppenstruktur, funktionierende
  Pull-/Zurückwisch-Gesten.

## Tests und Grenzen

Statische Node-Regressionen liegen ausschließlich hier:
`node --test flow-v43/tests/v43.test.cjs`

Die GitHub-Pages-Veröffentlichung prüft die Auslieferung der
Dateien. **Das reale iPhone-Safari-Verhalten und die Verbindung zur
Hue Bridge können damit nicht abschließend bestätigt werden.**
Die produktive Haupt-App, `flow-live/`, `flow-v4/`,
`flow-v41/`, `flow-v42/` und der Musikstreaming-Test
bleiben unangetastet.

## Abnahme am iPhone

1. V4.3 direkt in Safari öffnen und eine Hue-Verbindung nutzen.
2. Alle vier Schirmdesigns anwählen und jeweils die Lampe
   herausziehen: **Luma** muss mit der Stange formbar sein.
3. Bei offener Lampe: an der Stelle des Wandhalters bleibt die
   dekorative feste Platte; die Führungsschiene geht nach oben.
4. Lampenkarten nach unten scrollen: nur Ring/Schlitten und
   Schirm mit Arm gleiten nach oben; die Führungsschiene bleibt.
5. Nach oben zurückscrollen, anschließend Lampe wieder
   zurückwischen; die Mechanik muss ohne Sprung zurückfahren.
6. Für eine farbige Szene prüfen, dass der **Schirm von innen**
   leuchtet und beide Lichtkegel der Schirmposition folgen.
7. Linkshändermodus mit spiegelverkehrtem Schienenaufbau testen.
