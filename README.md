# Data Analyzer

Einfaches Analyse-Tool für Tabellen-Daten (CSV, TSV, Excel). Läuft direkt im Browser, ohne Installation oder Server. Ziel: Schnell sehen, was in einer Datei steckt.

## Warum dieses Projekt?

Ich habe das Tool gebaut, weil Kollegen oft mehrere CSV-Dateien auf dem Desktop hatten und schnell wissen wollten, was drinsteht. Es sollte so einfach wie möglich sein: HTML öffnen, Datei per Drag & Drop reinziehen, fertig. Keine grossen Extras, sondern schnelle Übersicht.


## Was kann das Tool?

- CSV, TSV, XLSX, XLS laden
- Automatisch erkennen, welche Spalten Zahlen sind
- Wichtige Kennzahlen berechnen (Anzahl, Minimum, Maximum, Mittelwert, Median, Standardabweichung, Summe)
- Verteilung als einfaches Diagramm anzeigen
- Vorschau der ersten 50 Zeilen


## Technik

- HTML, CSS, JavaScript (ohne Framework)
- [SheetJS / xlsx](https://sheetjs.com/) für Excel-Import
- [Chart.js](https://www.chartjs.org/) für Diagramme


## Datenbeispiel

Im Ordner `data/` liegt eine Beispiel-Datei (`example.csv`) mit Testdaten. Es werden keine echten oder vertraulichen Daten gebraucht.


## Wie funktioniert es?

1. Datei `data-analyzer.html` im Browser öffnen
2. Datei auswählen oder per Drag & Drop reinziehen
3. Spalte wählen, Ergebnis anschauen


## Projektstruktur

```text
data-analyzer/
|-- data-analyzer.html        # Ein-Datei-Version für schnelle Nutzung
|-- code/
|   |-- index.html            # Quellcode: Hauptoberfläche
|   |-- styles.css            # Quellcode: Aussehen
|   `-- app.js                # Quellcode: Logik
|-- data/
|   `-- example.csv           # Beispieldaten
|-- LICENSE
|-- README.md
|-- BACKLOG.md                # Ideen für spätere Erweiterungen
`-- CHANGELOG.md              # Änderungen am Projekt
```


## Nutzung

Keine Installation nötig. Einfach `data-analyzer.html` im Browser öffnen und loslegen.

Hinweis: Für Excel und Diagramm braucht das Tool beim ersten Laden Internet (wegen der Bibliotheken). CSV geht auch offline.


## Was bringt das?

Schnell einen Überblick bekommen, ob die Daten passen. Kein Schnickschnack, sondern direkt sehen: Was ist drin? Wie sind die Werte verteilt? Das hilft, Fehler oder Ausreißer früh zu erkennen.


## Was kann ich damit zeigen?

- Daten einlesen und prüfen
- Statistische Kennzahlen berechnen
- Ergebnisse einfach und verständlich darstellen
- Web-Tools bauen, die ohne Installation funktionieren


## Datenschutz

Das Tool läuft komplett im Browser. Es werden keine Daten hochgeladen oder gespeichert. Für Demos und im Portfolio bitte nur Testdaten oder anonymisierte Daten verwenden.


## Ideen für später

Was ich noch machen will, steht in der Datei BACKLOG.md.
