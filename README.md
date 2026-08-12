# Stand der Technik-Viewer

## Viewer direkt nutzen

Die GitHub-Organisation `bsi-community` stellt den Stand der Technik-Viewer über GitHub Pages bereit. Er kann ohne Installation oder Download direkt im Browser geöffnet werden:

**[Stand der Technik-Viewer öffnen](https://bsi-community.github.io/Stand-der-Technik-Viewer/)**

Dies ist die empfohlene und einfachste Nutzungsweise. Bei jedem Aufruf wird automatisch die aktuell über GitHub Pages veröffentlichte Version des Viewers verwendet. Ein manueller Download der HTML-Dateien, der D3-Bibliothek oder des Logos ist dafür nicht erforderlich.

## Viewer verwenden

1. Im Viewer ein OSCAL-Dokument laden:

   - über die Suche oder die Modellkacheln auf der Startseite ein Dokument aus dem öffentlichen BSI Stand der Technik Repository auswählen,
   - über die Dateiauswahl eine lokale OSCAL-JSON-Datei auswählen oder
   - eine URL zu einem OSCAL-JSON-Dokument eingeben und laden.

   Lokale JSON-Uploads und URL-Importe stehen in der Katalog-, Komponenten- und Mappingansicht im linken Arbeitsbereich zur Verfügung. Die Repository-Auswahl wird für Kataloge und Komponentendefinitionen angeboten.

2. Nach dem Laden können die Katalog-, Komponenten- oder Mappingansicht sowie Suche, Filter, Diagramme, JSON-Detailanzeigen und PDF-Export verwendet werden. Bei geeigneten Katalogen erscheint zusätzlich der Tab `Vererbung Zielobjektkategorien`. Für die vollständige Komponenten- und Mappingdarstellung sollten die passenden Kataloge zusätzlich in der Katalogansicht geladen sein.

## Lokale Nutzung (optional)

Der Viewer kann weiterhin vollständig lokal ausgeführt werden. Ein lokaler Server ist dafür nicht notwendig.

1. Das Repository über `Code` > `Download ZIP` herunterladen und entpacken. Alternativ können die folgenden Dateien einzeln heruntergeladen werden:

   - `Stand der Technik-Viewer.html` oder die inhaltlich byteidentische Datei `index.html`
   - `d3.v7.min.js`
   - `viewer_logo-transparent.png`

2. Die drei Dateien gemeinsam in demselben Ordner speichern, zum Beispiel:

   ```text
   Stand-der-Technik-Viewer/
   |-- Stand der Technik-Viewer.html
   |-- d3.v7.min.js
   |-- viewer_logo-transparent.png
   ```

   Die Dateinamen von `d3.v7.min.js` und `viewer_logo-transparent.png` dürfen nicht geändert werden, da die HTML-Datei genau diese Namen erwartet.

3. `Stand der Technik-Viewer.html` oder `index.html` per Doppelklick in einem aktuellen Browser wie Chrome, Edge oder Firefox öffnen.

> **Wichtig:** Wenn das Logo fehlt, zeigt der Viewer einen textuellen Titel als Fallback. Wenn `d3.v7.min.js` fehlt oder nicht im selben Ordner liegt, funktioniert der Viewer grundsätzlich weiterhin; Graph, Sunburst, Balkendiagramm und Zielobjekthierarchie können dann jedoch nicht dargestellt werden.

Der Viewer verarbeitet aktuell:

- OSCAL Catalogs
- OSCAL Component Definitions
- OSCAL Control Mapping Collections

Die gesamte Verarbeitung erfolgt clientseitig im Browser. Es gibt keinen Serveranteil und keinen Upload an einen externen Dienst.

## Enthaltene Dateien

- `Stand der Technik-Viewer.html`
  Viewer mit eingebettetem CSS und JavaScript.
- `index.html`
  Byteidentische GitHub-Pages-Einstiegsdatei des deutschen Viewers.
- `d3.v7.min.js`
  Lokal eingebundene D3-Bibliothek für Graph-, Sunburst-, Balkendiagramm- und Zielobjekthierarchie-Ansichten.
- `viewer_logo-transparent.png`
  Logo mit transparentem Hintergrund für den Kopfbereich.
- `VERSION`
  Maßgebliche Versionsquelle des Viewers.
- `CHANGELOG.md`
  Nach Versionen gegliederte Übersicht der Änderungen.

## Was der Viewer aktuell kann

### Allgemein

- drei getrennte Datenmodi in einer Datei
  - `Kataloge`
  - `Komponentendefinitionen`
  - `Mappings`
- paralleles Laden aller drei Dokumenttypen
  - Catalog per Datei oder URL
  - Component Definition per Datei oder URL
  - Control Mapping Collection per Datei oder URL
- automatische Umschaltung des linken Panels passend zum aktiven Haupt-Tab
- dynamische Summary-Box oberhalb des Inhalts
  - `Kataloganalyse` im Katalogmodus
  - `Komponentenanalyse` im Komponentenmodus
  - `Mappinganalyse` im Mappingmodus
- GitHub-`blob`-Links werden automatisch auf `raw` umgeschrieben
- geladene OSCAL-Dokumente werden in Quellen- und Repository-Auswahlen über `metadata.title` statt über den JSON-Dateinamen bezeichnet
- Repository-Dokumente werden anhand von `metadata.document-ids[].identifier` identifiziert
  - identische Document IDs werden dokumenttypübergreifend nur einmal angezeigt
  - gleiche Titel oder Dateinamen bleiben vollständig sichtbar, wenn ihre Document IDs unterschiedlich sind
  - Dokumente ohne gültige Document ID werden sicherheitshalber nicht zusammengeführt
- SHA-gebundener Browser-Cache für Repository-Titel und Document IDs unveränderter Dateien
- Startseite mit Repository-Suche, Modellkacheln, Nutzungshinweisen und Begriffserklärungen
- vollständig lokale Darstellung im Browser

### Startseite

Die Startseite dient als Einstieg in die Stand der Technik-Bibliothek. Sie enthält:

- eine Suche nach Repository-Dokumenten
- Modellkacheln für `Kataloge` und `Komponentendefinitionen`
- eine kurze Anleitung `Wie nutze ich den Viewer?`
- eine Begriffserklärung zentraler OSCAL- und Viewer-Begriffe

Über die Kacheln `Kataloge` und `Komponentendefinitionen` werden die entsprechenden Inhalte aus dem [öffentlichen BSI Stand der Technik GitHub-Repository](https://github.com/BSI-Bund/Stand-der-Technik-Bibliothek) angezeigt. Ein Klick auf ein gelistetes Dokument lädt es direkt im Viewer.

Die Anleitung erklärt:

- wie Dokumente über Startseitensuche, Modellkachel, lokalen JSON-Upload oder URL geladen werden
- wofür die obere Menüleiste da ist
- welche Inhalte in Katalog-, Komponenten- und Mappingansicht angezeigt werden
- wie die linke Menüleiste in Katalog-, Komponenten- und Mappingansicht für Suche und Filter genutzt wird
- wie aktuelle Katalog- und Komponentenansichten über die Browser-Print-to-PDF-Funktion ausgegeben werden können

### Haupt-Tabs

- `Kataloge`
- `Komponentendefinitionen`
- `Mappings`
- `Graph`
- `Sunburst`
- `Balkendiagramm`
- konditional: `Vererbung Zielobjektkategorien`

`Graph`, `Sunburst` und `Balkendiagramm` visualisieren den jeweils aktiven Datenmodus und unterstützen Kataloge, Komponentendefinitionen und Control Mappings. Der Crosswalk bleibt die primäre tabellarische Mappingansicht.

Die obere Menüleiste führt zu den Arbeitsbereichen: `Kataloge`, `Komponentendefinitionen` und `Mappings` zeigen die dort geladenen Inhalte an. Die drei allgemeinen Diagramm-Tabs visualisieren den jeweils aktiven Arbeitsbereich.

`Vererbung Zielobjektkategorien` ersetzt die frühere globale JSON-Gesamtansicht. Der Tab wird ausschließlich angezeigt, wenn im aktiven Katalog mindestens eine Control die OSCAL-Property `target_object_categories` verwendet. JSON-Rohdaten einzelner Controls, Anforderungen und Komponenten bleiben über die jeweiligen `JSON`-Buttons verfügbar.

In der Katalog-, Komponenten- und Mappingansicht steht jeweils ein linker Arbeitsbereich zur Verfügung. Dort können Inhalte über Volltextsuche und weitere vorgegebene Filterungsmöglichkeiten eingegrenzt werden.

### Volltextsuche in allen drei Arbeitsbereichen

Die Suche verwendet in Katalogen, Komponentendefinitionen und Mappings dieselbe Syntax:

- Mehrere durch Leerzeichen getrennte Begriffe werden mit `UND` verknüpft und müssen alle vorkommen.
  - Beispiel: `Firewall Dokumentation`
- Text in Anführungszeichen wird als eigenständige zusammenhängende Wortfolge gesucht. Alphanumerische Fortsetzungen gelten nicht als Treffer.
  - Beispiel: `"G 0.1"` findet `G 0.1`, aber nicht `G 0.10`, `G 0.12` oder `G 0.18`.
- Der deutsche Operator `ODER` trennt alternative Suchgruppen. Mindestens eine Alternative muss vorkommen; Ergebnisse mit beiden Alternativen werden ebenfalls angezeigt.
  - Beispiel: `"G 0.18" ODER "G 0.20"`
- Groß- und Kleinschreibung werden bei der Suche nicht unterschieden.
- Ein Fragezeichen-Tooltip neben jedem Suchfeld erklärt die Syntax unmittelbar im Viewer.

Treffer werden in den dargestellten Inhalten hervorgehoben. Die übrigen facettierten Filter werden zusätzlich zur Volltextsuche angewendet.

## Begriffserklärungen

Die Startseite enthält kompakte Begriffserklärungen für zentrale Begriffe:

- `OSCAL`
  Die [Open Security Controls Assessment Language (OSCAL)](https://pages.nist.gov/OSCAL/) ist ein standardisiertes, maschinenlesbares Framework, das von NIST entwickelt wurde, um die Effizienz und Konsistenz von Dokumentationen zur Informationssicherheit zu verbessern. Es ermöglicht eine Automatisierung über den gesamten Compliance-Lebenszyklus hinweg.
- `Katalog`
  Kataloge sind maschinenlesbare, standardisierte Sammlungen von Sicherheitsanforderungen. Sie dienen als strukturierte Datenbasis, um Kontrollvorgaben, zum Beispiel aus dem Digitalen Kompendium oder Technischen Richtlinien, eindeutig und automatisierbar zu dokumentieren. Mit [OSCAL-Katalogen](https://pages.nist.gov/OSCAL/learn/concepts/layer/control/catalog/) wird der traditionelle, oft manuelle Prozess der Sicherheitsdokumentation durch einen datenzentrierten Ansatz ersetzt.
- `Anforderung`
  Einzelne Anforderung oder Sicherheitskontrolle innerhalb eines Katalogs.
- `Implementierungsbeschreibung`
  Eine Implementierungsbeschreibung in Form einer [OSCAL-Komponentendefinition](https://pages.nist.gov/OSCAL-Reference/models/v1.1.3/component-definition/) enthält eine Sammlung von Komponenten. Jede Komponente beschreibt, wie eine konkrete Implementierung einer Hardware, Software, eines Dienstes, einer Richtlinie, eines Prozesses oder einer Prozedur bestimmte Vorschriften aus einem oder mehreren OSCAL-Katalogen oder -Profilen unterstützen oder implementieren kann.
- `Mappings`
  Sammlung von Beziehungen zwischen Anforderungen aus verschiedenen Katalogen.
- `Metadata`
  Titel, Version, Datum, Rollen und weitere Verwaltungsinformationen eines Dokuments.
- `Back Matter`
  Anhangsbereich für Ressourcen, Links, Dokumente und Referenzen.

## Mappingansicht

- Laden einer OSCAL Control Mapping Collection
  - per Datei-Upload
  - per URL-Import via `fetch`
- strukturierte Anzeige von Metadata, Provenance, Ressourcen und Control-Referenzen
- sieben Spalten umfassende Crosswalk-Tabelle:
  - Source: `Prose`, `Titel`, `ID`
  - Mitte: `Relationship`
  - Target: `ID`, `Titel`, `Prose`
- Titel und Statement-Prose werden aus parallel geladenen Catalogs ergänzt
- Source- und Target-Katalogtitel stehen einmalig in den Tabellen-Gruppenüberschriften
- Filter nach Volltext, Zielpraktik, Relationship, Source-/Target-Katalog, Matching-Art und Status
- Unterstützung der OSCAL-Relationship-Typen wie `equivalent-to`, `equal-to`, `subset-of`, `superset-of`, `intersects-with` und `no-relationship`
- optionale Anzeige von Control-Titeln, wenn die referenzierten Catalogs parallel geladen sind

## Katalogansicht

### Laden und Navigation

- Laden eines OSCAL Catalog JSON
  - per Datei-Upload
  - per URL-Import via `fetch`
- hierarchische Darstellung mit:
  - Praktiken
  - Themen
  - Gruppen
  - Anforderungen
- Sprunglogik zwischen:
  - Beziehungsboxen und Zielanforderung
  - Graph und Listenansicht

### Informationen pro Anforderung

- Titel und ID
- UUID
- Quellkatalog
- Sicherheitsniveau
- Aufwand inkl. Tooltip
- Thema
- Zielobjektkategorien
- Dokumentationsempfehlung
- Modalverben
- Handlungswörter
- Tags
- Schutzziele aus den Custom Properties:
  - `confidentiality` → Vertraulichkeit
  - `integrity` → Integrität
  - `availability` → Verfügbarkeit
  - `authenticity` → Authentizität
- BSI-G0-Gefährdungen aus der Custom Property `threats`
- JSON-Button pro Anforderung

### Detaildarstellung pro Anforderung

- `Statement`
- `Guidance`
- `Remarks`
- weitere `parts`
- Beziehungen:
  - `required`
  - `related`

### Kataloginformationen

Oberhalb der Anforderungen werden strukturierte Informationen aus dem Catalog angezeigt:

- `Metadaten`
- `Backmatter`

Die Anzeige ist bewusst als strukturierte Name/Wert-Darstellung umgesetzt und nicht als Roh-JSON.

### Suche und Filter im Katalog-Modus

- Volltextsuche
- je nach Katalogstruktur Praktiken und Themen beziehungsweise Gruppen und Untergruppen
- Quellkataloge
- Sicherheitsniveaus
- Zielobjektkategorien
- Tags
- Aufwände
- Modalverben
- Dokumentationsempfehlungen
- Handlungswörter
- Schutzziele

Die Filter sind UND-verknüpft. `Filter zurücksetzen` leert das Suchfeld, setzt alle Dropdowns zurück und schließt geöffnete Filter-Dropdowns.

### Automatische Vererbung der Zielobjektkategorien

Sobald der aktive Katalog die Control-Property `target_object_categories` verwendet, lädt der Viewer bedarfsgesteuert die aktuelle Datei [`target_object_categories.csv`](https://github.com/BSI-Bund/Stand-der-Technik-Bibliothek/blob/main/documentation/namespaces/target_object_categories.csv) aus dem öffentlichen BSI Repository. Sie bildet die Zielobjekthierarchie des BSI Grundschutz++/Stand der Technik ab.

Beim Auswählen einer Zielobjektkategorie ergänzt der Filter transitiv alle übergeordneten Kategorien, deren Anforderungen an die ausgewählte Kategorie vererbt werden. Beispiel:

```text
Anwendungen → Webserver → Webanwendungen
```

Die Auswahl `Webanwendungen` aktiviert damit initial auch `Webserver` und `Anwendungen`. Automatisch ergänzte Kategorien werden gekennzeichnet und können anschließend einzeln wieder abgewählt werden. Wird die Ausgangskategorie entfernt und erneut ausgewählt, wird die automatische Ergänzung erneut angewendet. `Alle Zielobjektkategorien` setzt die Auswahl und den Automatikzustand vollständig zurück.

Die CSV-Verarbeitung validiert erforderliche Spalten, UUIDs, eindeutige Kategorien, Elternreferenzen und Zyklen. Ist die Datei nicht erreichbar oder ungültig, bleibt die exakte Zielobjektfilterung ohne Vererbungsautomatik nutzbar.

### Visualisierung der Zielobjektvererbung

Der konditionale Tab `Vererbung Zielobjektkategorien` zeigt die vollständige aktuelle Zielobjekthierarchie des BSI Grundschutz++/Stand der Technik, wenn der aktive Katalog `target_object_categories` verwendet. Die Visualisierung bietet:

- Anordnung von allgemeinen Elternkategorien zu spezielleren Kindkategorien
- farblich getrennte Wurzelfamilien und gerichtete Verbindungslinien
- Zoom, Verschieben und die Aktion `Alles anzeigen`
- Zusammenfassung von Kategorien, Wurzelknoten und Hierarchieebenen
- Tooltips pro Kategorie mit:
  - Definition
  - Kategorie
  - Synonymen, sofern vorhanden
- Mausbedienung und Tastaturfokus für die Kategorien
- verständliche Lade-, Fehler- und Wiederholungszustände

Die CSV wird nur einmal pro Seitenaufruf geladen und für Filterautomatik und Visualisierung gemeinsam verwendet. Beim Wechsel auf einen Katalog ohne die Property sowie in der Komponenten- oder Mappingansicht wird der Tab vollständig ausgeblendet.

## Komponentenansicht

### Laden und Navigation

- Laden einer OSCAL Component Definition
  - per Datei-Upload
  - per URL-Import via `fetch`
- strukturierte Darstellung für:
  - Metadaten
  - Import Component Definitions
  - Back Matter
  - Capabilities
  - Components
  - Control Implementations
  - Implemented Requirements
  - Statements

### Informationen pro Komponente

- Titel
- Typ als lesbare Kennzeichnung, z. B. `Typ: policy`
- UUID
- Description
- optional:
  - Purpose
  - Remarks
  - Links & Dokumentationen
  - Props
  - Protocols
  - Responsible Roles
  - weitere optionale Felder aus der Component Definition

### Links & Dokumentationen in Komponenten

Komponenten-Links werden nicht als rohe Objektliste dargestellt, sondern in einem eigenen aufklappbaren Abschnitt:

- `Links & Dokumentationen`

Jeder Link wird menschenlesbar als eigener Block gerendert:

- Linktext bzw. Dokumenttitel
- aufgelöste URL
- Metadaten-Chips für:
  - `href`
  - `rel`

Wenn ein Link über Back Matter aufgelöst wird, verwendet der Viewer bevorzugt dessen Resource-Informationen.

### Capabilities

Capabilities werden als eigene Einträge angezeigt. Wenn sie Komponenten referenzieren, erscheint eine strukturierte Referenzliste mit:

- Component-Titel
- Component-UUID
- Button `Zum Eintrag`

Der Button springt direkt zur passenden Komponente in der Komponentenansicht und öffnet den zugehörigen Block.

### Control Implementations

Unter Komponenten und optional auch unter Capabilities werden `Control Implementations` mit Quelle und zugeordneten Anforderungen angezeigt.

Das aufklappbare Feld `Implementierungsbeschreibungen` zeigt die zugeordneten Anforderungen unmittelbar in einer Tabelle:

- linke Spalte `Anforderung`: fett hervorgehobene Control-ID, Control-Titel und Prose-Text aus einem parallel geladenen Catalog
- rechte Spalte `Implementierungsbeschreibung`: Description des `Implemented Requirement` und, falls vorhanden, die Descriptions seiner `Statements`

Die Description der jeweiligen `Control Implementation` steht direkt unter der Quellenangabe und vor der Tabelle. Unterhalb der Tabelle erscheint nur dann ein aufklappbares Feld `Remarks`, wenn mindestens ein `Implemented Requirement` einen Remarks-Text enthält.

Ist kein passender Catalog geladen, weist die linke Spalte darauf hin. Die Implementierungsbeschreibungen aus der Component Definition bleiben trotzdem sichtbar.

### Implemented Requirements und Cross-Navigation

Wenn ein passender Catalog geladen ist, führt der Button `Im Katalog öffnen` direkt zur referenzierten Anforderung im Tab `Kataloge`.

Der Viewer merkt sich dabei die exakte Position in der Komponentenansicht. Beim Zurückwechseln zum Tab `Komponentendefinitionen` wird wieder zu genau der Requirement in der ursprünglichen Komponente gesprungen.

Der Button `JSON` in jeder Tabellenzeile zeigt weiterhin die vollständigen Rohdaten des jeweiligen `Implemented Requirement`.

### Suche und Filter im Komponenten-Modus

- Volltextsuche
- Komponententypen
- Quellen
- Komponenten
- Capabilities

Auch hier setzt `Filter zurücksetzen` alle Filter auf den Ausgangszustand zurück.

## Diagramme

D3 wird lokal eingebunden:

```html
<script src="./d3.v7.min.js"></script>
```

Die Diagramme werden lazy gerendert, also nur dann neu aufgebaut, wenn der jeweilige Tab sichtbar ist. Die Zielobjekthierarchie nutzt dieselbe lokale D3-Bibliothek und wird ebenfalls erst beim Öffnen ihrer Ansicht aufgebaut.

### Graph

Im Katalog-Modus:

- Force-Directed Graph für Anforderungen und Beziehungen
- `required`-Beziehungen mit Richtung
- Klick auf Knoten springt zur passenden Anforderung im Katalog

Im Komponenten-Modus:

- Graph für:
  - Capabilities
  - Components
  - Implemented Requirements
- Beziehungen zwischen:
  - Capability und Komponente
  - Owner und Requirement
- Klick auf Requirement-Knoten kann direkt in den Katalog springen oder innerhalb der Komponentenansicht navigieren

Im Mapping-Modus:

- gerichteter Graph zwischen Source- und Target-Controls
- Relationship-Typ als Information an der Verbindung
- getrennte Kennzeichnung von Source- und Target-Seite

### Sunburst

Im Katalog-Modus:

- Verteilung der Anforderungen nach Praktiken bzw. Gruppen

Im Komponenten-Modus:

- Verteilung der Einträge nach Komponententypen
- zusätzliche Zusammenfassung von Capabilities

Im Mapping-Modus:

- Verteilung nach Source-Katalogen
- darunter verwendete Relationship-Typen

### Balkendiagramm

Im Katalog-Modus:

- Anzahl der Anforderungen pro Praktik bzw. Gruppe

Im Komponenten-Modus:

- Anzahl der referenzierten Anforderungen pro Quelle (`source`)

Im Mapping-Modus:

- Anzahl der Mapping-Beziehungen pro Relationship-Typ

## JSON-Funktionen

- JSON-Button in einzelnen Karten und Tabellenzeilen
  - öffnet ein Modal mit dem JSON genau dieses Eintrags
  - unterstützt unter anderem Anforderungen, Komponenten und Implemented Requirements
- die frühere globale JSON-Gesamtansicht wurde entfernt
  - vollständige Quelldokumente können bei Bedarf direkt als ursprüngliche JSON-Datei betrachtet werden
  - die gezielte Rohdatenprüfung im Viewer bleibt über die Detail-Buttons erhalten

## Markdown- und Markup-Unterstützung

Markup-fähige Textfelder werden leichtgewichtig direkt im Viewer gerendert. Das betrifft unter anderem:

- `metadata.remarks`
- `control.remarks`
- `statement`
- `guidance`
- `part.prose`
- `component.description`
- `component.purpose`
- `component.remarks`
- `implemented-requirement.description`
- `statement.description`

Unterstützt werden aktuell:

- Absatzdarstellung
- Überschriften mit `#`
- Listen
- Blockquotes
- Inline-Code mit `` `...` ``
- Fett mit `**...**`
- Markdown-Links
- Tabellen im Markdown-Stil
- Bilder per Markdown-Bildsyntax
- Code-Blocks mit ``` ``` `

Die Implementierung ist absichtlich leichtgewichtig und ohne externe Markdown-Library gehalten.

## Bilder und relative Links

Zuverlässig unterstützt:

- absolute `https://...`- oder `http://...`-URLs
- `data:image/...`-URIs
- relative Pfade, wenn das Dokument selbst per URL geladen wurde

Der Viewer merkt sich bei URL-Importen die Basis-URL des geladenen Dokuments und löst relative Pfade dagegen auf.

Bei lokalem Datei-Upload sind relative lokale Pfade in der Regel nicht verlässlich auflösbar. In diesem Fall sind sinnvoll:

- Dokument ebenfalls per URL bereitstellen
- Ressourcen über `https://...` referenzieren
- kleine Bilder direkt als `data:image/...` einbetten

## Parameterdarstellung

OSCAL-Parameterersetzungen wie:

```text
{{ insert: param, gc.1.1-prm1 }}
```

werden vor dem Rendern ersetzt. Anschliessend werden:

- Parameter-Label farblich hervorgehoben
- Parameter-Values farblich hervorgehoben

Das gilt für markup-fähige Textfelder in Catalogs.

## PDF-Export

Die aktuellen Katalog- und Komponentenansichten können über die Browser-Print-to-PDF-Funktion druckoptimiert ausgegeben werden:

- `Als PDF exportieren` im Katalog-Panel
- `Als PDF exportieren` im Komponenten-Panel

Vor dem Druck öffnet der Viewer die relevante Listenansicht, klappt Details auf und schaltet auf ein druckoptimiertes Layout um.

## Technischer Aufbau

Der Viewer ist eine einzelne HTML-Datei mit eingebettetem CSS und JavaScript.

Grober Aufbau:

- Parser für Catalogs
- Parser für Component Definitions
- Parser für Control Mapping Collections
- validierter CSV-Parser für die BSI-Zielobjekthierarchie
- separater Laufzeitstatus für Katalog-, Komponenten- und Mappingdaten
- DOM-basierte Renderer für:
  - Katalogansicht
  - Komponentenansicht
  - Mapping-Crosswalk
  - Metadaten
  - Back Matter
  - Diagramme
  - Zielobjekthierarchie
- Interaktionslogik für:
  - Multi-Select-Dropdowns
  - gemeinsame UND-, Wortgruppen- und ODER-Suche
  - automatische Zielobjektvererbung
  - JSON-Modal
  - Cross-Navigation zwischen Katalog und Komponenten
- Repository-Indexierung mit Document-ID-Deduplizierung und SHA-gebundenem Metadaten-Cache

## Performance-Aspekte

Der Viewer ist auf größere OSCAL-Dokumente ausgelegt. Wichtige Maßnahmen:

- debounced Volltextsuche
- lazy Rendering der Diagramme
- Caching für markup-fähige Texte
- SHA-gebundener Cache für Repository-Titel und Document IDs
- einmaliger, bedarfsgesteuerter Abruf der Zielobjekt-CSV pro Seitenaufruf
- direkte DOM-Erzeugung ohne Framework
- Lazy-Loading für Bilder
- getrennte States für Katalog-, Komponenten- und Mappingdaten
- keine zusätzliche vollständige JSON-Rohtextkopie pro geladenem Dokument

## Fehlerbehebung

- Es wird nichts angezeigt
  - JSON-Struktur ist nicht kompatibel oder es gibt einen Parsing-Fehler
  - Fehlermeldung im Viewer prüfen
- Diagramme bleiben leer
  - `d3.v7.min.js` fehlt oder wurde nicht geladen
- URL-Laden schlägt fehl
  - URL prüfen
  - Raw-URL verwenden
  - CORS des Zielservers prüfen
- Repository-Inhalte werden auf der Startseite nicht geladen
  - Internetverbindung prüfen
  - Zugriff auf das öffentliche BSI Stand der Technik GitHub-Repository prüfen
  - lokale Dateien und URL-Uploads können weiterhin verwendet werden
- Der Tab `Vererbung Zielobjektkategorien` erscheint nicht
  - prüfen, ob der aktive Katalog mindestens eine Control mit der Property `target_object_categories` enthält
  - der Tab wird nur in der Katalogansicht angeboten
- Zielobjektvererbung oder -visualisierung kann nicht geladen werden
  - Internetzugriff auf die öffentliche BSI-Namespace-Datei prüfen
  - in der Visualisierung die Aktion `Erneut laden` verwenden
  - die exakte Zielobjektfilterung bleibt auch ohne Hierarchiedaten verfügbar
- Sprung in den Katalog funktioniert nicht
  - passender Catalog ist nicht geladen
  - `control-id` der Component Definition passt nicht zu einer Anforderung im geladenen Catalog
- Bilder oder Dokumentlinks werden nicht angezeigt
  - Ziel-URL prüfen
  - bei lokalem Datei-Upload keine relativen lokalen Pfade verwenden
  - bei URL-Dokumenten prüfen, ob relative Pfade korrekt zur Dokument-URL passen
- Keine Treffer in Suche oder Filtern
  - Filter zurücksetzen
  - prüfen, ob der gesuchte Begriff in den geladenen Daten wirklich vorkommt

## Sicherheit und Datenschutz

- Verarbeitung erfolgt vollständig lokal im Browser
- keine Telemetrie oder externe Tracking-Integration im Viewer
- beim Laden per URL sendet der Browser eine HTTP-Anfrage an die angegebene Adresse
- Repository-Auswahl und Zielobjekthierarchie senden HTTP-Anfragen an das öffentliche BSI GitHub-Repository
- für externe Bilder oder Links gelten die Sicherheits- und Verfügbarkeitsbedingungen der jeweiligen Quelle

## Scope dieser README

Diese README beschreibt den aktuellen Implementierungsstand des `Stand der Technik-Viewers` im Ordner, einschließlich:

- Startseite mit Repository-Suche, Anleitung und Begriffserklärungen
- Katalogansicht
- Komponentenansicht
- Mappingansicht
- Metadaten- und Backmatter-Anzeige
- JSON-Detailmodal für einzelne Controls, Anforderungen und Komponenten
- Such- und Filterlogik in Katalog-, Komponenten- und Mappingansicht
- Diagrammansichten auf Basis von D3
- automatische Zielobjektvererbung und konditionale Hierarchievisualisierung
- Document-ID-basierte Repository-Deduplizierung
- Cross-Navigation zwischen Komponenten und Katalog
- PDF-Export
- Markdown-/Markup-Unterstützung inklusive Tabellen, Bilder und Links
