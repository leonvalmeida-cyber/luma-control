# Luma · erster echter Hue-Entertainment-Streaming-Test (Windows)

**Stand:** unabhängiger Versuchsaufbau; nicht auf echter Bridge oder dem iPhone ausgeführt.
Die stabile Luma Flow Web-App und ihre Lampensteuerung bleiben unverändert.

## Warum ein Windows-Test?
Eine Safari-Webseite kann die verschlüsselte DTLS/UDP-Verbindung zur Hue-Bridge
nicht selbst öffnen. Bevor wir eine native iPhone-App installieren, prüfen wir deshalb
die Streaming-Verbindung mit einem **kurzzeitig laufenden Windows-PC**. Später ist
der PC für die native iOS-Lösung **nicht als Dauergerät vorgesehen**.

Verwendete Bibliothek: [music-assistant/hue-entertainment](https://github.com/music-assistant/hue-entertainment)
(Apache 2.0; unterstützt Hue Bridge Pro und V2; Python 3.11+).

## Voraussetzung

- Python 3.11 oder neuer auf dem Windows-PC
- PC und Bridge im **gleichen Heimnetzwerk**; UDP-Port 2100 zur Bridge erreichbar
- Ein bereits eingerichteter Entertainment-Bereich in der offiziellen Hue-App
- Für das erstmalige Koppeln Zugang zum **Knopf auf der Bridge**
- Keine konkurrierende Hue Sync-Sitzung im gewählten Entertainment-Bereich

## Ausführen (PowerShell)
Im Repository-Ordner:

```powershell
py -3 -m pip install hue-entertainment
py -3 experiments/hue-entertainment-poc/stream_probe.py --host 192.168.X.X --pair
```

Die IP durch die **tatsächliche** Bridge-Adresse ersetzen.
Auf Aufforderung den Knopf auf der Hue Bridge drücken.
Das Programm zeigt anschließend die Entertainment-Bereiche und Kanäle an.
Es schaltet im Standardmodus **keine** Lampe um.

### Freiwilliger Farbtest

```powershell
py -3 experiments/hue-entertainment-poc/stream_probe.py --host 192.168.X.X --pair --area "TV-Bereich" --run
```

Der Test koppelt für die aktuelle Sitzung neu und sendet nach erfolgreich geöffnetem
Stream **neun Sekunden** lang gedämpfte Farben mit sanften Übergängen. Danach wird
die Sitzung wieder freigegeben, auch bei Fehlern. Er stoppt **nicht automatisch**
andere Entertainment-Bereiche. Wenn aktuell ein Stream aktiv ist, diesen regulär
in der ursprünglichen App beenden, bevor du den Test ausführst.

**Hinweis zu Sicherheit:** Die getestete Python-Bibliothek verwendet bei lokalen
HTTPS-Anfragen an die Hue Bridge `ssl=False` (keine Zertifikatsprüfung).
Deshalb ausschließlich im **vertrauenswürdigen Heimnetz** verwenden.
Schlüssel niemals in einen öffentlichen GitHub-Commit, Screenshot oder Chat posten.
Ohne `--pair` kann mit den lokal gesetzten Umgebungsvariablen
`LUMA_HUE_APP_KEY` und `LUMA_HUE_CLIENT_KEY` gearbeitet werden.
Der existierende Luma-Web-App-Schlüssel alleine enthält **keinen Client Key**.

## Messung und Grenzen

- Zeigt Dauer von Bereichsaktivierung + DTLS-Verbindungsaufbau an.
- Zeigt Software-Timing der gesendeten Frames (25 Bilder/Sekunde) an.
- **Misst nicht** die echte Lichtlatenz: dafür wäre ein synchronisiertes Video
  oder ein Lichtsensor nötig.
- Keine Audioanalyse und noch **keine iPhone-App** in diesem Test.
- Bei fehlendem iOS-Buildweg ist die spätere native Installation nicht gelöst.

## Nächste Stufen
1. Hardwaretest: Bereich wählen, neun Sekunden Farbsequenz, Fehler protokollieren.
2. Audio-zu-Licht-Latenz am realen Setup messen und Befehlsstau ausschließen.
3. iOS-native Streaming-App, sichere Schlüsselbund-Speicherung, AudioEngine.
4. Bestehende Luma-Flow-Oberfläche integrieren; V4-Designänderungen separat.
