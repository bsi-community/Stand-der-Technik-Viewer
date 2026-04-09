# Stand der Technik-Viewer

Lokaler Browser-Viewer fuer OSCAL-Dokumente mit Fokus auf den Stand der Technik. Der Viewer verarbeitet aktuell:

- OSCAL Catalogs
- OSCAL Component Definitions

Die gesamte Verarbeitung erfolgt clientseitig im Browser. Es gibt keinen Serveranteil und keinen Upload an einen externen Dienst.

## Enthaltene Dateien

- `Stand der Technik-Viewer.html`
  Viewer mit eingebettetem CSS und JavaScript.
- `d3.v7.min.js`
  Lokal eingebundene D3-Bibliothek fuer Graph-, Sunburst- und Balkendiagramm-Ansichten.
- `viewer_logo.png`
  Optionales Logo im linken Menueband.

## Was der Viewer aktuell kann

### Allgemein

- zwei getrennte Datenmodi in einer Datei
  - `Katalog`
  - `Komponenten`
- paralleles Laden beider Dokumenttypen
  - Catalog per Datei oder URL
  - Component Definition per Datei oder URL
- automatische Umschaltung des linken Panels passend zum aktiven Haupt-Tab
- dynamische Summary-Box oberhalb des Inhalts
  - `Kataloganalyse` im Katalogmodus
  - `Komponentenanalyse` im Komponentenmodus
- GitHub-`blob`-Links werden automatisch auf `raw` umgeschrieben
- vollstaendig lokale Darstellung im Browser

### Haupt-Tabs

- `Katalog`
- `Komponenten`
- `Graph`
- `Sunburst`
- `Balkendiagramm`
- `JSON`

Die Tabs `Graph`, `Sunburst`, `Balkendiagramm` und `JSON` arbeiten immer auf dem aktuell aktiven Datenmodus.

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
- Zielobjektkategorie
- Dokumentationsempfehlung
- Tags
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
- Praktiken
- Quellkataloge
- Sicherheitsniveaus
- Zielobjektkategorien
- Tags
- Aufwaende
- Modalverben
- Dokumentationsempfehlungen
- Handlungswoerter

Die Filter sind AND-verknuepft. `Filter zuruecksetzen` leert das Suchfeld, setzt alle Dropdowns zurueck und schliesst geoeffnete Filter-Dropdowns.

## Komponentenansicht

### Laden und Navigation

- Laden einer OSCAL Component Definition
  - per Datei-Upload
  - per URL-Import via `fetch`
- strukturierte Darstellung fuer:
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
- aufgeloeste URL
- Metadaten-Chips fuer:
  - `href`
  - `rel`

Wenn ein Link ueber Back Matter aufgeloest wird, verwendet der Viewer bevorzugt dessen Resource-Informationen.

### Capabilities

Capabilities werden als eigene Eintraege angezeigt. Wenn sie Komponenten referenzieren, erscheint eine strukturierte Referenzliste mit:

- Component-Titel
- Component-UUID
- Button `Zum Eintrag`

Der Button springt direkt zur passenden Komponente in der Komponentenansicht und oeffnet den zugehoerigen Block.

### Control Implementations

Unter Komponenten und optional auch unter Capabilities werden `Control Implementations` mit Quelle und zugeordneten Anforderungen angezeigt.

Darunter werden `Implemented Requirements` und ihre `Statements` dargestellt.

### Implemented Requirements und Cross-Navigation

Pro `Implemented Requirement` werden unter anderem angezeigt:

- `control-id`
- UUID
- Quelle
- Description
- weitere Felder, falls vorhanden

Wenn ein passender Catalog geladen ist, fuehrt der Button `Im Katalog oeffnen` direkt zur referenzierten Anforderung im Katalog-Tab.

Der Viewer merkt sich dabei die exakte Position in der Komponentenansicht. Beim Zurueckwechseln zum Tab `Komponenten` wird wieder zu genau der Requirement in der urspruenglichen Komponente gesprungen.

### Suche und Filter im Komponenten-Modus

- Volltextsuche
- Komponententypen
- Quellen
- Komponenten
- Capabilities

Auch hier setzt `Filter zuruecksetzen` alle Filter auf den Ausgangszustand zurueck.

## Diagramme

D3 wird lokal eingebunden:

```html
<script src="./d3.v7.min.js"></script>
```

Die Diagramme werden lazy gerendert, also nur dann neu aufgebaut, wenn der jeweilige Tab sichtbar ist.

### Graph

Im Katalog-Modus:

- Force-Directed Graph fuer Anforderungen und Beziehungen
- `required`-Beziehungen mit Richtung
- Klick auf Knoten springt zur passenden Anforderung im Katalog

Im Komponenten-Modus:

- Graph fuer:
  - Capabilities
  - Components
  - Implemented Requirements
- Beziehungen zwischen:
  - Capability und Komponente
  - Owner und Requirement
- Klick auf Requirement-Knoten kann direkt in den Katalog springen oder innerhalb der Komponentenansicht navigieren

### Sunburst

Im Katalog-Modus:

- Verteilung der Anforderungen nach Praktiken bzw. Gruppen

Im Komponenten-Modus:

- Verteilung der Eintraege nach Komponententypen
- zusaetzliche Zusammenfassung von Capabilities

### Balkendiagramm

Im Katalog-Modus:

- Anzahl der Anforderungen pro Praktik bzw. Gruppe

Im Komponenten-Modus:

- Anzahl der referenzierten Anforderungen pro Quelle (`source`)

## JSON-Funktionen

- `JSON`-Tab
  - zeigt immer das aktuell aktive Dokument als formatiertes JSON
  - also entweder den geladenen Catalog oder die geladene Component Definition
- JSON-Button in einzelnen Karten
  - oeffnet ein Modal mit dem JSON genau dieses Eintrags
  - z. B. Anforderung, Komponente oder Implemented Requirement

## Markdown- und Markup-Unterstuetzung

Markup-faehige Textfelder werden leichtgewichtig direkt im Viewer gerendert. Das betrifft unter anderem:

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

Unterstuetzt werden aktuell:

- Absatzdarstellung
- Ueberschriften mit `#`
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

Zuverlaessig unterstuetzt:

- absolute `https://...`- oder `http://...`-URLs
- `data:image/...`-URIs
- relative Pfade, wenn das Dokument selbst per URL geladen wurde

Der Viewer merkt sich bei URL-Importen die Basis-URL des geladenen Dokuments und loest relative Pfade dagegen auf.

Bei lokalem Datei-Upload sind relative lokale Pfade in der Regel nicht verlaesslich aufloesbar. In diesem Fall sind sinnvoll:

- Dokument ebenfalls per URL bereitstellen
- Ressourcen ueber `https://...` referenzieren
- kleine Bilder direkt als `data:image/...` einbetten

## Parameterdarstellung

OSCAL-Parameterersetzungen wie:

```text
{{ insert: param, gc.1.1-prm1 }}
```

werden vor dem Rendern ersetzt. Anschliessend werden:

- Parameter-Label farblich hervorgehoben
- Parameter-Values farblich hervorgehoben

Das gilt fuer markup-faehige Textfelder in Catalogs.

## PDF-Export

Beide Datenmodi koennen ueber den Browser-Druckdialog als PDF exportiert werden:

- `Als PDF exportieren` im Katalog-Panel
- `Als PDF exportieren` im Komponenten-Panel

Vor dem Druck oeffnet der Viewer die relevante Listenansicht, klappt Details auf und schaltet auf ein druckoptimiertes Layout um.

## Technischer Aufbau

Der Viewer ist eine einzelne HTML-Datei mit eingebettetem CSS und JavaScript.

Grober Aufbau:

- Parser fuer Catalogs
- Parser fuer Component Definitions
- separater Laufzeitstatus fuer beide Datenmodi
- DOM-basierte Renderer fuer:
  - Katalogansicht
  - Komponentenansicht
  - Metadaten
  - Back Matter
  - Diagramme
- Interaktionslogik fuer:
  - Multi-Select-Dropdowns
  - debounced Suche
  - JSON-Modal
  - Cross-Navigation zwischen Katalog und Komponenten

## Performance-Aspekte

Der Viewer ist auf groessere OSCAL-Dokumente ausgelegt. Wichtige Massnahmen:

- debounced Volltextsuche
- lazy Rendering der Diagramme
- Caching fuer markup-faehige Texte
- direkte DOM-Erzeugung ohne Framework
- Lazy-Loading fuer Bilder
- getrennte States fuer Katalog- und Komponenten-Daten

## Voraussetzungen

- aktueller Browser wie Chrome, Edge oder Firefox
- im selben Ordner:
  - `Stand der Technik-Viewer.html`
  - `d3.v7.min.js`
  - optional `viewer_logo.png`

## Start

1. `Stand der Technik-Viewer.html` im Browser oeffnen.
   Alternativ kann zum Testen der aktuellen Oberflaeche auch `DESIGN_NEU_Stand der Technik-Viewer - Kopie.html` geoeffnet werden.
2. Catalog und/oder Component Definition per Datei oder URL laden.
3. Zwischen `Katalog` und `Komponenten` wechseln.
4. Tabs, Suche, Filter, Diagramme und PDF-Export verwenden.

## Fehlerbehebung

- Es wird nichts angezeigt
  - JSON-Struktur ist nicht kompatibel oder es gibt einen Parsing-Fehler
  - Fehlermeldung im Viewer pruefen
- Diagramme bleiben leer
  - `d3.v7.min.js` fehlt oder wurde nicht geladen
- URL-Laden schlaegt fehl
  - URL pruefen
  - Raw-URL verwenden
  - CORS des Zielservers pruefen
- Sprung in den Katalog funktioniert nicht
  - passender Catalog ist nicht geladen
  - `control-id` der Component Definition passt nicht zu einer Anforderung im geladenen Catalog
- Bilder oder Dokumentlinks werden nicht angezeigt
  - Ziel-URL pruefen
  - bei lokalem Datei-Upload keine relativen lokalen Pfade verwenden
  - bei URL-Dokumenten pruefen, ob relative Pfade korrekt zur Dokument-URL passen
- Keine Treffer in Suche oder Filtern
  - Filter zuruecksetzen
  - pruefen, ob der gesuchte Begriff in den geladenen Daten wirklich vorkommt

## Sicherheit und Datenschutz

- Verarbeitung erfolgt vollstaendig lokal im Browser
- keine Telemetrie oder externe Tracking-Integration im Viewer
- beim Laden per URL sendet der Browser eine HTTP-Anfrage an die angegebene Adresse
- fuer externe Bilder oder Links gelten die Sicherheits- und Verfuegbarkeitsbedingungen der jeweiligen Quelle

## Scope dieser README

Diese README beschreibt den aktuellen Implementierungsstand des `Stand der Technik-Viewers` im Ordner, einschliesslich:

- Katalogansicht
- Komponentenansicht
- Metadaten- und Backmatter-Anzeige
- JSON-Tab und JSON-Modal
- Such- und Filterlogik in beiden Datenmodi
- Diagrammansichten auf Basis von D3
- Cross-Navigation zwischen Komponenten und Katalog
- PDF-Export
- Markdown-/Markup-Unterstuetzung inklusive Tabellen, Bilder und Links
