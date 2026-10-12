# KERN-Migration: unabhängige Oberfläche und Release-Vorbereitung

## Stand und Grenze dieses Ausbauschritts

Dieser Stand gehört ausschließlich zum lokalen Branch `restructure-viewer-KERN`.
Er erweitert die Vergleichsvorschau um wiederverwendbare Oberflächenbausteine,
Navigation, Import, Mehrfachfilter, Anforderungen, Komponenten und Mappings sowie
Bibliothek, Druckvorbereitung, Diagrammbedienung und tabellarische Alternativen. Die fachlichen
OSCAL-Parser und die bestehenden Auswahlregeln werden weiterverwendet.

Die KERN-Ansicht ist vollständig von den Legacy-CSS-Dateien getrennt. Native
KERN-Bausteine werden durch eigene fachliche Viewer-Kompositionen ergänzt. Die
technische Umstellung ist damit weitgehend abgeschlossen; Schriftwechsel und
die tatsächliche Screenreader-Abnahme und die fachliche Freigabe bleiben offen. Die technische Inhaltsabnahme und manuelle Tastaturprüfung sind dokumentiert in [KERN-Abnahmeprotokoll](kern-acceptance.md). Dies ist keine Zertifizierung der Barrierefreiheit. Fira Sans bleibt aktiv, bis die separat
bereitgestellten BundesSans-Webfonts importiert werden.

## Komponenten und Zuständigkeiten

| Baustein              | Umsetzung                                                                                                           | Zuständigkeit                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Buttons               | Native `kern-btn` mit Beschriftung, Primary/Secondary, Disabled/Busy und Fokuswiederherstellung                     | `src/shared/ui/kern.js`                                     |
| Eingabefelder         | Native KERN-Klassen, sichtbare Labels; URL-Fehler mit `aria-describedby` und `aria-invalid`                         | `kern.js`, `app/kern-workbench.js`                          |
| Aufklappbereiche      | Native KERN Details auf HTML `details`/`summary`                                                                    | `kern.js`                                                   |
| Mehrfachfilter        | Viewer-Komposition aus KERN Details, Fieldset und Checkboxen; keine zweckentfremdete Select-Komponente              | `shared/ui/multiselect.js`                                  |
| Arbeitsbereiche       | Benannte Navigation mit normalen Buttons und aktuellem Kontext                                                      | `app/kern-workbench.js`                                     |
| Darstellungen         | Eine Tab-Reihe einschließlich Liste, manuelle Aktivierung, Pfeiltasten/Home/End und Roving Tabindex                 | `shared/ui/kern-navigation.js`                              |
| Quellenwahl           | Disclosure mit normalen Aktivieren-/Entfernen-Buttons; bewusst kein ARIA-Listbox-Muster mit verschachtelten Buttons | `features/sources/picker.js`                                |
| Importstatus          | Viewer-Komposition mit KERN-Farbrollen und persistenter Live-Region; parallele Importe werden zusammengefasst       | `shared/ui/import-feedback.js`, `app/loaders.js`            |
| Anforderungsmetadaten | Native KERN Description List auf semantischem `dl`/`dt`/`dd`                                                        | `features/catalog/card.js`                                  |
| JSON-Dialog           | Bestehender Dialog mit Fokusbegrenzung, Escape, Fokusrückgabe und inaktivem Hintergrund                             | `shared/ui/messages.js`                                     |
| Gestaltung            | Semantische KERN-Farbrollen und zentrale Viewer-Abstandstokens; kleine fachliche Kompositionen bleiben separat      | `styles/kern/foundation.css`, `primitives.css`, `shell.css` |

Die gemeinsamen UI-Helfer kennen keine Katalog-, Komponenten- oder Mappingzustände.
Die einmalige Shell-Einrichtung läuft vor der Ereignisbindung im Bootstrap.
Dynamische Ansichten rufen die Bausteine beim Erzeugen auf; es gibt keinen globalen
MutationObserver, der nachträglich beliebiges Markup umschreibt. Ein gezielter
Observer auf den drei Auswahlzusammenfassungen aktualisiert die persistente Live-Region.

## Bedienverhalten

- Primäre Arbeitsbereiche bleiben auch in einer Diagrammansicht erkennbar. Die
  Liste lässt sich über den ersten Darstellungstab wieder aufrufen.
- Pfeiltasten sowie Home/End bewegen den Fokus innerhalb der Darstellungstabs.
  Enter oder Leertaste aktiviert die fokussierte Ansicht. Suche und Filter bleiben
  beim Wechsel zwischen Liste und Diagrammen erhalten.
- Datenimport und Filter können gleichzeitig geöffnet bleiben.
- Filter behalten ihren Namen; der zusätzliche Zähler nennt ausgewählte und
  verfügbare Werte. Bei teilweiser Auswahl ist „Alle auswählen“ indeterminiert.
- Ab elf einzelnen Optionen erscheint eine Suche innerhalb der Filterwerte. Sie
  verändert keine Auswahl. „Alle auswählen“ wirkt auch auf ausgeblendete Optionen.
  Escape schließt den Filter und gibt den Fokus an seine Zusammenfassung zurück.
- Dateien und URLs melden Fortschritt, Erfolg oder Fehler. Ein gemischter Import
  bleibt als teilweise fehlgeschlagen erkennbar, auch wenn die letzte Datei gültig
  ist. Doppelte gleichzeitige Abrufe derselben URL und desselben Dokumenttyps werden
  zusammengefasst. URL-Buttons sind während ihrer Anfrage deaktiviert.
- Vor dem Hinzufügen einer lokalen Quelle wird der OSCAL-Dokumenttyp geprüft.
  Ungültige Dateien verdrängen keinen bereits gültig geladenen Katalog.
- Die Anforderung zeigt „Anforderung“, „Umsetzungshinweise“ und „Anmerkungen“ als
  deutsche UI-Beschriftungen; die zugrunde liegenden OSCAL-Feldnamen und JSON-Daten
  bleiben unverändert. Rich Text, Parameter und Aufwand-Tooltips bleiben erhalten.

## Prüfungen

`tests/e2e/kern-workbench.spec.js` ergänzt die vorhandenen Browserprüfungen um:

- Tastaturnavigation und Rückkehr zur gefilterten Liste;
- Suche innerhalb von Filterwerten, Teil-/Gesamtauswahl und Zurücksetzen;
- verzögerten URL-Abruf, Fehler, Wiederholung und erfolgreiche Wiederherstellung;
- gemischte lokale Dateiimporte und falsche Dokumenttypen;
- Fokus nach Auswahl und Entfernen einer Quelle;
- semantische Metadaten und Hintergrundsperre des JSON-Dialogs;
- Seiten- und Navigationsüberlauf bei 1440, 900, 800, 375 und 320 CSS-Pixeln;
- Zuordnung von Feldfehlern und Fokus nach neu gerenderten Schnellaktionen.

Diese Fälle laufen in Chromium, Firefox und WebKit. Die vorhandenen Prüfungen
für Diagrammgrenzen, 1000 Anforderungen, Mappings, Komponenten, Drucken,
Deep Links und Updateverhalten bleiben Teil der Testreihe. Forced Colors und
Reduced Motion werden zusätzlich in der Fokusprüfung aktiviert. Das ersetzt
keine manuelle Screenreader-Abnahme und keinen vollständigen WCAG-Audit.

Mit `VIEWER_TEST_PORT=4187 npm run test:e2e` kann die Testreihe einen separaten
lokalen Port verwenden. Vorher den aktuellen Build erstellen.

## Abgeschlossene Ausbauschritte – 10. Oktober 2026

### 1. Komponenten und Mapping-Inhalte

Umgesetzt und mit Browserprüfungen abgesichert:

- Die generischen Metadatenrenderer erzeugen in KERN semantische Beschreibungslisten,
  auch für verschachtelte Objekte. `0`, `false`, Zusatzfelder, Suchmarkierungen,
  Properties und sichere Ressourcenlinks bleiben erhalten. Bekannte Feldnamen
  werden deutsch beschriftet; der OSCAL-Schlüssel bleibt als Titelhinweis verfügbar.
- Komponenten, Capabilities, Implementierungen, Dokumentinformationen und
  Link-Metadaten verwenden die gemeinsamen KERN-Bausteine. Fachliche Tabellen
  bekommen Überschriftenzuordnung, Beschriftung und einen eigenen Scrollbereich.
- Die Mapping-Dokumentinformationen zeigen sämtliche vorhandenen Metadaten sowie
  Herkunft/Methodik und Back Matter statt der bisherigen festen Feldauswahl.
- Die horizontale Mapping-Scrollleiste ist mit Pfeiltasten, Home/End und
  PageUp/PageDown bedienbar und ihrem Scrollbereich semantisch zugeordnet.

Die sechs zusätzlichen Browserläufe für diesen Schritt (je zwei Fälle in Chromium,
Firefox und WebKit) prüfen außerdem ungültige Links/HTML, Parametertexte,
Querverweise, Dialogfokus und Komponentenlayout bei 1440, 800, 375 und 320 Pixeln.
Die Legacy-Renderer bleiben als getrennte Vergleichsansicht erhalten.

### 2. Bibliothek, Dialog und Druck – technischer Teil

- Die Bibliothekssuche verwendet ein sichtbares KERN-Label. Laufende
  Repository-Aktualisierungen erhalten nicht abgeschickte Eingaben, Textauswahl
  und Fokus. Suchergebnisse werden über die bestehende Live-Region gemeldet.
- Ladefehler bieten „Bibliothek erneut laden“ und den Einstieg zu eigenen Dateien.
  Leere Suchergebnisse erlauben das Zurücksetzen der Suche. Das Öffnen eines
  Dokuments sperrt die betroffene Schaltfläche während des Imports.
- Hinweise zur Navigation und zu schmalen Ansichten entsprechen der KERN-Testversion.
  Der JSON-Dialog verwendet ebenfalls den gemeinsamen KERN-Button.
- Katalog- und Komponentenexport drucken eine isolierte Kopie der aktuellen
  Auswahl. Alle Details sind dort offen; Navigation, Aktionen und Textkürzungen
  werden ausgeblendet. Tabellen umbrechen im Druck und wiederholen ihre Kopfzeile.
  Die interaktive Ansicht, ihre Aufklappzustände und ihr Fokus bleiben erhalten.
- Kopieraktionen in Implementierungsbefehlen erhalten ihre KERN-Beschriftung auch
  während der Erfolgs- und Fehlermeldung.

`tests/e2e/kern-library-print.spec.js` prüft Fehler/Wiederholung, ungesendete
Sucheingaben beim Nachladen, leere Treffer, schmale Bibliotheksansichten,
Druckvorbereitung/-darstellung und Fokusrückgabe in allen drei Browsern.
Die Druckdarstellung wurde zusätzlich anhand der gerenderten Browserbilder
kontrolliert. Die tatsächlichen PDF-Seitenumbrüche wurden inzwischen mit Echtdokumenten
kontrolliert (Ausbauschritt 4). Eine fachliche Gesamtabnahme und Prüfung mit
assistiven Technologien stehen weiterhin aus.

### 3. Diagrammbedienung und Datentabellen – technischer Teil

- Graphen für Kataloge, Komponenten und Mappings sowie die Zielobjekthierarchie
  haben native KERN-Schaltflächen für Einpassen, Vergrößern, Verkleinern und
  Verschieben in vier Richtungen. Sie stehen außerhalb der Zeichenfläche.
  Eine manuell eingestellte Graphansicht wird beim Ende der Simulation nicht
  erneut automatisch eingepasst. Zoomübergänge beachten Reduced Motion.
- Graph, Sunburst und Balkendiagramm bieten in allen drei Datenkontexten eine
  aufklappbare Datentabelle. Sie verwendet dieselben gefilterten Daten wie das
  Diagramm, einschließlich Gruppenzahlen und Angaben aus den Tooltips.
  Mapping-Sunburst-Tabellen unterscheiden Quellkatalog und Beziehungstyp.
  Graphen unterscheiden Knoten und gerichtete Beziehungen; bei Mehrfachzuordnungen
  kann deren Anzahl von der Anzahl der Mapping-Einträge abweichen.
- Tabellen entstehen erst beim Öffnen. Suche und Seiten mit höchstens 50 Einträgen
  halten auch große Graphen bedienbar. Tabellenzustand, Suchtext und Tastaturfokus
  bleiben bei Größenänderungen erhalten. Die Tabellensuche verändert keine
  fachlichen Filter. Leere Diagrammansichten entfernen zugehörige Tabellen.
- Anforderungen und Implementierungen lassen sich aus Graph-Tabellen öffnen.
  Der Fokus folgt dem geöffneten Inhalt. Kontextanforderungen außerhalb der
  aktuellen Filter öffnen nach dem angekündigten Zurücksetzen dieser Filter.
- Die Zielobjekthierarchie bietet eine Tabelle mit Elternbeziehung, Kategorie,
  Definition und Synonymen. Ihre Details lassen sich sowohl aus dieser Tabelle
  als auch über Enter/Leertaste am Diagrammknoten öffnen.
- Die gemeinsamen Feld- und Tabellenhelfer verwenden jetzt die vollständigen
  nativen KERN-Klassen für Eingaben, Select-Wrapper sowie Kopf- und Datenzellen.

`tests/e2e/kern-chart-access.spec.js` ergänzt 18 Browserprüfungen: alle drei
Datenkontexte, Tastaturzoom und Verschiebung, Größenänderungen bis 320 CSS-Pixel,
Leerzustände, Seitenwechsel/Suche bei 1000 Anforderungen, Quernavigation und
Hierarchiedetails. Die Prüfungen laufen in Chromium, Firefox und WebKit.

Zusätzlich wurde am 10. Oktober 2026 der gebaute KERN-Viewer in Chromium mit zwei
öffentlichen Echtdokumenten aus der BSI-Bibliothek geprüft. Beide stammen aus der
festen Revision `a12831136f4122a4c43854622180a24f2576a41e`:

| Dokument                                                                                                                                                                                                        | Größe           | Geprüfte Daten                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------- |
| [Anwenderkatalog Grundschutz++](https://github.com/BSI-Bund/Stand-der-Technik-Bibliothek/blob/a12831136f4122a4c43854622180a24f2576a41e/control_layer/Grundschutz%2B%2B/Grundschutz%2B%2B-resolved_catalog.json) | 5.400.938 Bytes | 1.000 Anforderungen / Graphknoten                               |
| [IT-GS2023 zu GS++](https://github.com/BSI-Bund/Stand-der-Technik-Bibliothek/blob/a12831136f4122a4c43854622180a24f2576a41e/control_layer/Mappings/IT-GS2023-zu-GSpp/ITGS-to-GS%2B%2B-mapping_collection.json)   | 2.775.310 Bytes | 1.185 Mappings, 1.163 Graphknoten, 1.185 gerichtete Beziehungen |

Für beide Dokumente stimmen die Summen aller Sunburst- und Balkengruppen mit den
importierten Einträgen überein. Graph und Tabellen funktionieren bei 1440, 800 und
375 CSS-Pixeln ohne Seitenüberlauf oder JavaScript-Laufzeitfehler. Ein unabhängig
aufrufbares Skript hält diese Prüfung reproduzierbar:

```sh
npm run build
node scripts/check-kern-real-data.mjs /pfad/katalog.json /pfad/mapping.json
```

Es lädt keine externen Daten nach, benötigt die beiden lokalen Dateien und
verwendet standardmäßig Port 4188 (`VIEWER_REAL_DATA_PORT` überschreibt ihn).
Prüfbericht mit SHA-256-Dateihashes und Bildschirmbilder liegen danach unter
`test-results/kern-real-data/`. Die Quelldokumente werden nicht ins Repository
übernommen. Eine manuelle Screenreader-Prüfung steht weiterhin aus.

### 4. Eigenständige Styles, Release-Einstieg und Druckabnahme

- Die KERN-Ansicht lädt ausschließlich native KERN-Styles und eigene Layoutdateien.
  Fachliche Layouts für Inhalte, Bibliothek, Mapping, Diagramme und Quellen liegen
  im KERN-Verzeichnis. Ein Architekturtest schützt diese Importgrenze.
- Der normale Einstieg enthält keine Vergleichsleiste. Demoansichten werden nur
  bei explizitem `preview`-Parameter geladen. `build:release` entfernt zusätzlich
  Legacy-CSS, Vergleichsmodul und synthetische Datensatzmodule aus den Artefakten.
  Release-Tests prüfen auch, dass Vergleichsparameter dort wirkungslos bleiben.
- Der Workflow im Testbranch prüft und paketiert den separaten Release-Build.
  Es wurde nichts veröffentlicht, gepusht oder mit `main` zusammengeführt.
- Zwölf feste Chromium-Bildreferenzen sichern sechs Ansichten auf Desktop und
  Mobilgeräten ab. Sie gelten für macOS, die festgelegte Playwright-Version und
  Fira Sans. Separate Linux-Referenzen sind nicht als geprüft ausgewiesen; der
  Ubuntu-Workflow führt die funktionalen Tests aus.
- Die Sichtprüfung korrigierte Legendenfarbfelder, das Startseitensymbol, die
  Beziehungsspalte der Mapping-Tabelle, Überschriftenumbrüche bei 320 Pixeln und
  das mobile Suchfeld. Schmale Fachtabellen bleiben horizontal scrollbar.
- Die Druckansicht nutzt A4 mit 15-mm-Rändern, lesbare 10-pt-Inhaltstexte,
  vollständige Langtexte und wiederholte Tabellenköpfe. Tabellenzeilen bleiben
  möglichst zusammen; eine zusätzliche leere Katalogschlussseite wurde beseitigt.
  Umfangreiche Metadaten erscheinen einspaltig, damit Textblöcke zuverlässig umbrechen.

Die tatsächlichen PDFs wurden in Chromium aus dem oben genannten Grundschutz++-
Katalog (Suche `GC.1.1`, eine Anforderung einschließlich Dokumentmetadaten: drei
Seiten) und der öffentlichen
[Keycloak-Komponentendefinition](https://github.com/BSI-Bund/Stand-der-Technik-Bibliothek/blob/a12831136f4122a4c43854622180a24f2576a41e/implementation_layer/Keycloak/Keycloak-component_definition.json)
(54.724 Bytes, 18 Seiten) erzeugt. Alle Seiten wurden gerendert und visuell
kontrolliert. Diese Stichprobe ist eine technische Layoutprüfung, keine fachliche
Freigabe der Quelldokumente oder Zusage für jeden Druckertreiber.

Reproduzieren nach dem aktuellen Build:

```sh
node scripts/check-kern-print.mjs /pfad/grundschutz-katalog.json /pfad/keycloak.json GC.1.1
```

Das Skript nutzt standardmäßig Port 4191 (`VIEWER_PRINT_TEST_PORT` überschreibt
ihn), die echte Druckkopie-Aktion und ausschließlich lokale Quelldokumente.
PDFs, Vergleichstexte und ein Bericht mit SHA-256-Hashes entstehen unter
`test-results/kern-print/`. Sie werden nicht ins Repository übernommen. Der volle
E2E-Lauf bereinigt `test-results`; diese Sonderprüfung daher anschließend ausführen.

### 5. Technische Inhaltsabnahme und manuelle Tastaturprüfung

Die native Safari-Prüfung deckte einen per Tab unerreichbaren JSON-Inhalt und
unzutreffende Statusangaben bei leerer Filterauswahl auf. Der fachliche Ablauf
zeigte außerdem eine falsche Katalogwahl bei identischen IDs und ein durch Filter
verdecktes Querverweisziel. Diese Fehler sind korrigiert; vier neue Testfälle
laufen in allen drei Browsern. Der JSON-Dialog hat nun einen benannten,
fokussierbaren Scrollbereich. Der Ergebnisstatus meldet die sichtbaren Treffer,
und leere Auswahlen werden ausdrücklich gekennzeichnet.

Ein zusätzlicher Quellenabgleich prüft unabhängig von den Viewer-Parsern alle
1.000 Anforderungs-IDs/Titel, alle 1.185 Mapping-Beziehungstypen und alle 43
Keycloak-Umsetzungstexte. JSON-Inhalte und Mapping-Richtung wurden zusätzlich
stichprobenweise abgeglichen. Skript: `scripts/check-kern-content.mjs`.

**Die tatsächliche VoiceOver-Ausgabe konnte trotz Aktivierungsversuch nicht
verlässlich beobachtet werden; die Screenreader-Abnahme ist weiterhin offen.**
VoiceOver wurde wieder ausgeschaltet. Die belegten Safari-Bedienschritte,
Prüfgrenzen, Quelldateihashes und verbleibenden manuellen Abnahmeschritte stehen
im [Abnahmeprotokoll](kern-acceptance.md).

### 6. Übergabepunkte: Normalansicht, Inhaltsfokus und kompakte Filter – 11. Oktober 2026

- Der lokale Starter nennt jetzt den normalen Einstieg ohne `preview`-Parameter.
  Dort erscheinen keine Test-/Schrifthinweise oder Vergleichslinks. Die bewusst
  angeforderten Entwicklungsvergleiche bleiben separat verfügbar und sind im
  Release-Build weiterhin vollständig ausgeschlossen. Auch der Hinweis
  „Responsive Testversion“ in der Nutzungshilfe heißt jetzt „Responsive Darstellung“.
- Die dunkle Umrandung stammte vom fokussierten gesamten Tabpanel. Die Panels
  dienen jetzt nur als programmgesteuerte Leseanker nach einem Import und sind
  keine zusätzlichen Tabstopps. Ihr Außenrahmen entfällt; Buttons, Filter,
  Suchfelder und übrige bedienbare Elemente behalten ihre Fokusmarkierung.
- Filter verwenden eine gemeinsame Zeile für Pfeil, Name und rechts stehende
  Auswahlzahl. Die Desktop-Seitenleiste wächst von 288 auf 344 CSS-Pixel.
  Lange Namen dürfen bei schmalen Fenstern innerhalb der Namensspalte umbrechen;
  Zahlen bleiben rechts daneben und werden nicht abgeschnitten.
- Die Zielobjekt-Hilfe liegt innerhalb des gleich breiten Filterrahmens als
  eigenständiger Button, ohne verschachtelte Interaktion im Summary. Der Hilfetext
  bleibt auch bei 320 Pixeln innerhalb des Fensters. Escape schließt ihn unter
  Erhalt des Fokus; die nächsten Tastatureingaben bleiben vorhersehbar.
- Ein verzögerter Filterstatus darf beim Wechsel zur Startseite deren
  Bibliotheksmeldung nicht mehr überschreiben. Die bestehende Wiederholungsprüfung
  deckt jetzt auch das Zeitfenster der verzögerten Meldung ab.

Zwei neue Testfälle in Chromium, Firefox und WebKit prüfen normale Einstiege,
Import/Fokus, gleiche Filterbreiten, Zahlenposition, Hilfe und Seitenüberlauf bei
1440, 1000, 800, 375 und 320 CSS-Pixeln. Die Darstellung wurde zusätzlich mit dem
Echtdokument Grundschutz++ kontrolliert. Fünf Desktop-Bildreferenzen wurden wegen
der geänderten Inhaltsbreite nach Sichtprüfung erneuert; die mobilen Referenzen
bleiben unverändert. Echte Screenreader-Abnahme und BundesSans bleiben offen.

## Prüfstand dieser Ausbaustufe

- 180 erfolgreiche Browserprüfungen in Chromium, Firefox und WebKit.
- Drei zusätzliche Release-Prüfungen, eine je Browser.
- 43 erfolgreiche Unit- und Architekturtests.
- Zwölf KERN-Bildreferenzen in zwei Chromium-Testfällen (macOS).
- Zehn Legacy-Vergleichsansichten pixelgleich zur eingefrorenen Referenz.
- ESLint, Formatprüfung, TypeScript-Prüfung und beide Builds mit Artefaktprüfung.
- Responsive Inhaltsprüfung bis 320 CSS-Pixel und Echtdatenprüfung der Diagramme.
- Gerenderte PDF-Stichprobe: drei Katalogseiten und 18 Komponentenseiten.

## Ausbauschritt 7 – Diagramme, Mappings und Einstieg (11. Oktober 2026)

- **Hierarchietabelle:** Lesbare Spaltenbreiten für Bezeichnung, Elternkategorie,
  Kategorie, Definition, Synonyme und Aktion. Wörter werden nicht beliebig zerlegt;
  „Öffnen“ bleibt einzeilig. Schmale Fenster scrollen die Tabelle horizontal.
- **Hierarchie-Details:** Teil des normalen Seitenflusses. Das Mausrad scrollt dort
  die Seite; Zoom bleibt auf die SVG-Diagrammfläche beschränkt.
- **Sunburst:** Beschriftungen berücksichtigen tatsächliche SVG-Textlänge, radiale
  Breite und Platz an den inneren Textecken. Der pauschale Grenzwert für die
  Bogenlänge entfällt in KERN. Nur unlesbar kleine Segmente bleiben unbeschriftet;
  Legende und Datentabelle enthalten weiterhin alle Werte.
- **Mapping-Informationen:** Kompakte Stammdaten in zwei Spalten, lange Texte über
  die volle Breite und Eigenschaften direkt als beschriftete Listen. Die sichere
  Text-/Linkdarstellung und Ressourcenauflösung bleiben erhalten, einschließlich
  zusätzlicher Eigenschaften und Anmerkungen.
- **Relationship:** Überschrift, Symbol und Wert zentriert. Begriffshilfe mit
  deutschen Übersetzungen aller sechs Definitionen aus der
  [OSCAL-1.2.3-Referenz](https://pages.nist.gov/OSCAL-Reference/models/v1.2.3/mapping/json-reference/#/mapping-collection/mappings/mapping/maps/relationship).
  Bedienung per Hover, Fokus und Antippen; Escape und Klick außerhalb schließen.
  Das Hilfefenster bleibt im Viewport und wird nicht vom Tabellenrahmen abgeschnitten.
- **Einstieg:** Titel „Stand der Technik-Viewer“. Ein frischer normaler Einstieg
  oder Reload beginnt auf der Startseite, auch bei alten `primary_tab`- oder
  `secondary_tab`-Parametern. Explizite OSCAL-Dokumentlinks und bewusst aufgerufene
  Vergleichsszenarien behalten ihr Ziel. Das Vergleichsdesign bleibt unverändert.

**Prüfung:** 192 Browserprüfungen in Chromium, Firefox und WebKit (darunter zwölf
neue Prüfungen), 43 Unit-/Architekturtests und drei Release-Prüfungen bestanden.
Lint, Format, Typprüfung, beide Builds und Release-Isolation bestanden. Große
Echtdaten (1.000 Anforderungen, 1.185 Mapping-Beziehungen) und unabhängiger
Inhaltsabgleich bestanden. Die bereitgestellte CyFun-Datei mit 227 Beziehungen
und GS++ mit 39 Hierarchiekategorien zusätzlich lokal betrachtet. Zwölf
KERN-Bildreferenzen geprüft; acht Änderungen durch Titel-/Zeilenhöhe bzw.
Relationship-Schaltflächen übernommen. Nutzerdokumente wurden nicht als
Testfixtures oder öffentliche Assets hinzugefügt.

## Ausbauschritt 8: Kompakter Katalogkopf und saubere Quellenfelder (12. Oktober 2026)

- **Beschreibung:** Der kurze Startseitentext nennt lokale Dateien und Online-Quellen.
- **Importfelder:** Die redundanten sichtbaren Feldüberschriften entfallen im
  Importbereich; zugeordnete, visuell ausgeblendete Labels erhalten die zugänglichen
  Namen. Native Selects haben einen gleichmäßigen Rahmen ohne schwarze Unterkante
  oder springende Höhe beim Hover. Tastaturfokus bleibt sichtbar.
- **Seitenleisten:** Versteckte interne Quellen-Selects werden nicht mehr als
  sichtbare KERN-Felder eingerahmt. Die Quellen-Auswahl steht unmittelbar unter
  ihrem Label, in Katalog-, Komponenten- und Mappingansicht.
- **Kataloganalyse:** Kennzahlen stehen kompakt neben dem Titel, Aktionen darunter.
  Aktive Einschränkungen werden weiterhin angezeigt; die redundante Leeranzeige
  entfällt. Ohne Treffer bleibt die Erklärung sichtbar. In der geprüften
  Desktopansicht benötigt die Übersicht 112 CSS-Pixel Höhe.
- **Dokumenttitel:** Unter „Katalog Informationen“ erscheint der Titel des aktiven
  Dokuments mit dem kleinen Label „Geladener Katalog“. Quellenwechsel aktualisieren
  ihn; geschlossene Metadaten verbergen ihn nicht. Sichere Inline-Formatierung bleibt
  erhalten.
- **Mappings:** Die linke Trennlinie jeder Target-ID bleibt auch in Folgezeilen
  von 1:n-Beziehungen erhalten. Nur Source-Prose-Zellen verzichten auf einen
  zusätzlichen linken Innenrahmen.

**Prüfung:** 201 Browserprüfungen in Chromium, Firefox und WebKit bestanden
(192 bestehende und neun neue Prüfungen; die neuen Quellenwechsel-Tests wurden
nach Ergänzung des Aufklappens der Seitenleiste erneut ausgeführt). 43 Unit-/
Architekturtests, drei Release-Prüfungen, Lint, Format, Typprüfung, beide Builds,
Release-Isolation sowie Echtdaten- und Inhaltsabgleich bestanden. Mobile Breiten
von 320 und 375 CSS-Pixeln geprüft. Zwölf KERN-Bildreferenzen kontrolliert;
Startseite, Import, Anforderung und Mapping jeweils für Desktop/Mobil aktualisiert.
Quellenfelder und kompakter Kopf zusätzlich im Browser mit GS++ betrachtet.
Zehn Legacy-Bildvergleiche sichern das unveränderte Vergleichsdesign ab.

## Ausbauschritt 9: Überschrift über den Anforderungen (12. Oktober 2026)

Die Katalogansicht zeigt nach den Kataloginformationen und dem Trennstrich immer
„Anforderungen“ als semantische H2-Überschrift. Sie nutzt dieselben Typografie-
und Abstandsregeln wie „Komponenten“ (18 px, Schriftgewicht 700). Die Überschrift
bleibt auch bei einer Filterung ohne Treffer sichtbar; vor dem Laden eines
Katalogs erscheint weiterhin nur der Importbereich. Das Legacy-Design bleibt
unverändert.

## CI-Nachbesserung: große Diagramme und Größenwechsel (12. Oktober 2026)

Der erste GitHub-Lauf des KERN-PRs bestand 198 Browserprüfungen; die drei
browserabhängigen Ausführungen des großen Katalog-Diagrammtests scheiterten.
Die Ursachen waren das Einpassen erst nach Ende der Kräfteberechnung, veraltete
SVG-Maße nach einem Größenwechsel in WebKit und das gemeinsame Zeitbudget für
neun Diagramm-/Fenstergrößenkombinationen samt umfangreicher Trace-Aufzeichnung.

- Der KERN-Kataloggraph wird bereits ab dem ersten Bild und während seiner
  Berechnung eingepasst. Eigenes Zoomen, Verschieben oder Ziehen beendet die
  automatische Anpassung; „Alles anzeigen“ bleibt verfügbar.
- Ein ResizeObserver verfolgt die tatsächlichen Diagrammflächen, auch ohne
  Fenstergrößenänderung. Verborgene Graphen verbrauchen keine weitere Rechenzeit.
- Größenprüfungen sind nach Arbeitsbereich und Diagramm getrennt. Alle drei
  Browser und alle bisherigen Fenstergrößen bleiben abgedeckt; Graphgrenzen
  werden nun bei jeder geprüften Breite kontrolliert. Eine zusätzliche Prüfung
  deckt Größenänderungen des Containers ohne Fenster-Resize ab.
- Der Workflow und seine Veröffentlichungssperre bei Fehlern bleiben bestehen.
  Pages veröffentlicht weiterhin ausschließlich den geprüften Release-Build.

## Neue Viewer-Bildmarke (12. Oktober 2026)

Nach dem Merge der KERN-Umstellung verwendet der Viewer eine eigenständige,
reduzierte SVG-Bildmarke in KERN-Blau: ein Dokument mit verbundenen Knoten als
Verweis auf Anforderungen und ihre Beziehungen. Sie steht kompakt neben dem
Seitentitel als reine, nicht interaktive Bildmarke. Links daneben bleibt die
eigenständige Home-Schaltfläche mit Häuschen und zugänglichem Namen
„Zur Startseite“ erhalten. Der sichtbare Texttitel bleibt unverändert.

Dieselbe SVG-Datei wird als Favicon verwendet. Vite liefert sie mit Inhalts-Hash
im Dateinamen aus, sodass spätere Änderungen nicht an einem alten Asset-Cache
hängen bleiben. Die bisherige Grafik bleibt für die Legacy-Ansicht erhalten.

Geprüft: Lint, TypeScript, Release-Build und Build-Isolation; drei Release-Tests
in Chromium, Firefox und WebKit; Darstellung bei 320 und 375 Pixeln sowie im
normalen Desktop-Fenster; Rückkehr zur Startseite per Tastatur. Die Logo-Änderung
liegt lokal auf `codex/viewer-kern-logo` und ist noch nicht veröffentlicht.

## Verbleibende Schritte bis zur Gesamtabnahme

1. BundesSans-Webfonts nach Bereitstellung einbinden; anschließend Schriftmetriken,
   Umbrüche, PDF-Layout und KERN-Bildreferenzen erneut prüfen. Fira Sans bleibt bis
   dahin die lokal ausgelieferte Ersatzschrift.
2. Manuelle Abnahme mit assistiven Technologien, insbesondere Screenreader-
   Bedienung von Filtern, Dialogen, Diagrammtabellen und Quernavigation.
   Die vorhandenen automatisierten Tastaturtests ersetzen diese Abnahme nicht.
3. Fachliche Freigabe der umgestellten Ansichten durch die Verantwortlichen.
   Die technische Inhaltsabnahme mit unabhängigem Quellenabgleich sowie die
   Echtdaten- und PDF-Prüfungen sind abgeschlossen; Grenzen und Prüfschritte
   sind im [Abnahmeprotokoll](kern-acceptance.md) dokumentiert.
4. Die KERN-Umstellung wurde vom Nutzer nach `main` gemergt und über GitHub
   Pages veröffentlicht. Weitere Änderungen benötigen erneut eine Freigabe;
   die neue Bildmarke ist bislang nur lokal vorbereitet.

## Referenz

Die Implementierung richtet sich nach den mitgelieferten SCSS-Quellen von
`@kern-ux/native@2.8.2`, insbesondere Button, Input, Checkbox/Check, Fieldset,
Details und Description List. Ein Versionswechsel ist nicht Teil dieses Schritts.
