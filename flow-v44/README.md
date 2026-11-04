# Luma Flow V4.4 — Kompaktparken & magnetisches Helligkeits-Docking

**Neue separate Vorschau:** https://leonvalmeida-cyber.github.io/luma-control/flow-v44/

Nur V4.4-Dateien unter `flow-v44/` werden ausgetauscht. Der produktive
Einstieg, `flow-live/`, V4, V4.1, V4.2 und V4.3 bleiben unverändert.

## Umsetzung

- Die eingefahrene Lampe sitzt weiter oben am rechten (oder linken) Rand,
  und das gesamte Lampen-SVG wird auf 73 % verkleinert. Das Klickziel bleibt
  zugänglich, die Führungsschiene ist im Parkzustand nur schwach angedeutet.
- Sobald Quick-Control geöffnet ist und dessen oberer Gesamthelligkeits-
  Regler auf ähnlicher Bildschirmhöhe sichtbar ist, fährt die echte Lampe
  **magnetisch** an den vorgesehenen Bereich am rechten Ende der Reglerkarte.
- **Es gibt keine zweite Lampe.** Die echte Stange teleskopiert horizontal
  zurück zur fest verankerten Schiene, der echte Schirm folgt nach rechts,
  und ein kleiner, dekorativer Sockel leuchtet unter dem Schirm.
  Die SVG-Schienen- und Wandgruppen bewegen sich weiterhin nicht.
- Der rechte Bereich der Reglerkarte ist bewusst 88 px breit freigehalten:
  der normale Touchbereich des Haupthelligkeitsreglers bleibt frei.
  Der magnetische Sockel ist unabhängig bedienbar.
- **Tippen auf den Schirm im geöffneten Zustand oder auf den Sockel**
  aktiviert den vorhandenen oberen Helligkeitsregler (Fokus und leuchtende
  Umrandung). Ein Tippen schaltet keine Lampe und ändert nicht den Helligkeitswert.
- Nur wenn der Nutzer anschließend wirklich den Regler bewegt und loslässt,
  wird der bestehende Hue-Steuerbefehl verwendet. Die Helligkeit einzelner
  Lampen bleibt weiterhin auf den Lampenkarten separat zugänglich.
- Horizontales Zurückziehen des Schirms bleibt die gewohnte Schließgeste.
  Tap und Drag werden getrennt: Ein voller Drag schließt das Menü,
  und ein Tap setzt lediglich den Fokus.
- Wenn der obere Regler durch Scrollen aus dem Bereich verschwindet,
  löst sich die Andockung. Die Lampe fährt entlang der Schiene nach oben
  und zeigt wieder die Luma-Form. Zurückscrollen kann erneut andocken.
- Lichtkegel, Hue-Szenenfarben im Stoff, vier Designs und Linkshändermodus
  bleiben wie in V4.3.

## Testpunkte auf dem iPhone

1. Eingefahrene Lampe testen: die Einstellungen sollten leichter erreichbar
   sein. Vor allem die rechte obere Ecke prüfen.
2. Herausziehen: der Schirm soll physisch rechts neben dem
   Gesamthelligkeitsregler einrasten statt über ihm.
3. Schirm **antippen**: der Regler wird hervorgehoben und fokussiert,
   ohne dass Lampen unerwartet heller werden.
4. Dann den normalen oberen Regler **ziehen und loslassen**: erst jetzt
   sollte sich Hue-Helligkeit ändern.
5. Schirm seitlich zurückziehen: Quick-Control schließt weiterhin.
6. Im geöffneten Menü nach unten scrollen und anschließend nach oben:
   die Lampe löst sich vom Dock und fährt am unbewegten Wandhalter.
7. Einzellampen-Sonnen und die vier Designs kontrollieren.

## Sicherheit / Testabdeckung

Die lokal ausführbaren Tests liegen unter
`flow-v44/tests/v44.test.cjs`.

Die Vorschau verwendet weiterhin ausschließlich den vorhandenen,
vom Nutzer eingerichteten Hue-Zugang. Es gibt weder neue Musik-/
Entertainment-Befehle noch zusätzliche Lampen-Netzwerkanfragen durch
Andocken, Tippen oder Scrollen. Automatische Code- und DOM-Kontrakttests
ersetzen keinen echten iPhone- oder Hue-Hardwaretest.
