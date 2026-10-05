# Changelog

Alle wesentlichen Änderungen am Stand der Technik-Viewer werden in dieser Datei dokumentiert.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/). Die Versionierung folgt [Semantic Versioning](https://semver.org/lang/de/).

## 3.0.0 – Unveröffentlicht

### Geändert

- HTML, Styles und Anwendungslogik in fachliche ES-Module aufgeteilt; bestehende Ansichten, Filter, Diagramme und Bedienung beibehalten.
- Vite-Produktionsbuild für GitHub Pages mit fest versionierter D3-Abhängigkeit und Lockfile.
- Unit-, Architektur-, Mehrbrowser- und visuelle Vergleichstests sowie CI, dokumentierte Release-/Rollback-Schritte und Dependency-Updates hinzugefügt.
- Dokumentation in Entwickler-Einstieg, Bedienungsanleitung, Architektur und Betrieb gegliedert.
- Keine separate per Doppelklick startbare Offline-Ausgabe mehr. Die alte HTML-URL leitet unter Beibehaltung der Parameter auf den Viewer weiter.

### Kleine Bedienverbesserung

- JSON-Dialog unterstützt Escape, begrenzt den Tastaturfokus auf den Dialog und gibt den Fokus danach an die auslösende Schaltfläche zurück.

### Ausgangsstand

Der Umbau basiert auf Repository-Commit `36c1dc82243360c0f2e8578fc641af2ab80b5a98` (30.09.2026), einschließlich partieller Mappings, Qualifier-Anmerkungen und Mapping-Lücken. Dessen sichtbare Version war weiterhin 2.1.1. Die nachstehenden historischen Einträge stammen aus der vorhandenen lokalen Viewer-Dokumentation; sie sind keine nachträglich erfundenen Repository-Releases.

## 2.1.1 – 2026-09-01

### Behoben

- Lange Definitionen wie bei „IT-Systeme“ vergrößern den Zielobjekt-Arbeitsbereich nicht mehr und lösen dadurch weder flackernde Hover-Zustände noch springende Diagrammknoten aus.
- Der Detailbereich besitzt auf Desktop und schmalen Ansichten eine eigene vertikale Scrollfläche mit stabil reservierter Scrollbar und verhindert die Weitergabe der Scrollbewegung an die Seite.
- Wiederholte Hover-, Fokus- oder Klickereignisse derselben Kategorie bauen den Detailinhalt nicht erneut auf; scrollbarbedingte Kleinständerungen der Diagrammfläche lösen kein vollständiges Neurendern mehr aus.

## 2.1.0 – 2026-09-01

### Hinzugefügt

- Die Zielobjekthierarchie besitzt einen fest in das Layout integrierten Detailbereich, der Kategorie, Definition und Synonyme ohne Überlagerung der Grafik anzeigt.
- Die zuletzt per Maus, Tastaturfokus oder Klick ausgewählte Kategorie bleibt im Diagramm hervorgehoben und im Detailbereich lesbar.

### Geändert

- Der bisherige schwebende Kategorie-Tooltip wurde entfernt; auf schmalen Viewports wird der Detailbereich responsiv oberhalb der Grafik angeordnet.
- Bedienhinweise und ARIA-Verknüpfungen beschreiben die neue nicht überlagernde Detailansicht.

## 2.0.4 – 2026-09-01

### Behoben

- Der Abschnitt „Anmerkungen“ einer implementierten Anforderung gehört jetzt zum einklappbaren Beschreibungstext und wird erst nach Betätigung des zugehörigen Pfeils sichtbar.
- Bei befüllten `remarks` bleibt der Aufklapppfeil auch bei kurzen Implementierungsbeschreibungen verfügbar; leere oder fehlende `remarks` verändern das bisherige Einklappverhalten nicht.

## 2.0.3 – 2026-09-01

### Geändert

- Inhaltlich befüllte `remarks` von `implemented-requirements` werden in der Komponentendefinitionsansicht jetzt direkt und dauerhaft sichtbar unter der jeweiligen Implementierungsbeschreibung als Abschnitt „Anmerkungen“ angezeigt.
- Leere oder fehlende `remarks` erzeugen weiterhin keinen Abschnitt; die bisherige separate, zugeklappte Sammelansicht entfällt.

## 2.0.2 – 2026-08-04

### Behoben

- Wortgruppen in Anführungszeichen berücksichtigen jetzt alphanumerische Begriffsgrenzen, sodass beispielsweise `"G 0.1"` die eigenständige Gefährdungskennung findet, aber nicht mehr `G 0.10`, `G 0.12` oder `G 0.18`.
- Trefferprüfung, automatische Detailöffnung und Hervorhebung verwenden dieselbe Grenzlogik in Katalogen, Komponentendefinitionen und Mappings.

### Geändert

- Suchtooltips in allen drei Arbeitsbereichen erläutern die exakte Wortgruppensuche mit einem eindeutigen G0-Beispiel.

## 2.0.1 – 2026-08-04

### Behoben

- Kopfbereich der Zielobjektvisualisierung auf ein robustes Grid umgestellt, sodass Überschrift und Beschreibung die verfügbare Breite nutzen und die Grafik nicht mehr vertikal verdrängen.
- „Alles anzeigen“ gegen globale Button-Breitenregeln isoliert und dauerhaft auf seine notwendige Inhaltsbreite begrenzt.
- Zielobjekt-Tooltips deutlich verbreitert, interne Scrollflächen entfernt und für besonders lange Definitionen mit einer kompakten, viewportabhängigen Darstellung ergänzt.

## 2.0.0 – 2026-08-04

### Hinzugefügt

- Konditionaler Tab „Vererbung Zielobjektkategorien“ für aktive OSCAL-Kataloge mit der Control-Property `target_object_categories`.
- Responsive, automatisch aus der aktuellen BSI-Namespace-Datei erzeugte Hierarchievisualisierung mit Zoom, Verschieben, automatischer Einpassung, Vererbungsrichtung und kompakter Strukturstatistik.
- Zugängliche Knoten-Tooltips mit Definition, Kategorie und Synonymen sowie Tastaturfokus für jede Zielobjektkategorie.
- Transparente Lade-, Fehler- und Wiederholungszustände für die extern geladene Zielobjekthierarchie.

### Geändert

- CSV-Verarbeitung um validierte Visualisierungsmetadaten, Kindbeziehungen, Wurzelknoten und Hierarchietiefen erweitert; Filterautomatik und Diagramm verwenden denselben einmalig geladenen Datenbestand.
- Sichtbarkeit und Navigationszustand der Visualisierung folgen dem jeweils aktiven Katalog; bei ungeeigneten Katalogen sowie in Komponenten- und Mappingansichten wird der Tab vollständig ausgeblendet.

### Entfernt

- Globale JSON-Gesamtansicht einschließlich ihres Tabs, Rohtextkopien, Renderers und ausschließlich dafür benötigter Styles und Zustände entfernt.
- Die JSON-Detailanzeigen einzelner Controls, Anforderungen und Komponenten bleiben unverändert verfügbar.

## 1.4.4 – 2026-08-04

### Geändert

- Repository-Inhalte werden anhand der OSCAL-Document-ID aus `metadata.document-ids[].identifier` identifiziert und dokumenttypübergreifend dedupliziert.
- Gleichnamige Dateien oder Dokumente mit identischem Titel bleiben vollständig sichtbar, sofern ihre Document IDs unterschiedlich sind.
- Titel und Document IDs werden gemeinsam aus den OSCAL-Dokumenten gelesen und SHA-gebunden zwischengespeichert, ohne zusätzliche Repository-Abrufe gegenüber der bisherigen Titelermittlung.
- Dokumente ohne gültige Document ID bleiben als sicherer Fallback einzeln sichtbar, statt anhand uneindeutiger Titel oder Dateinamen zusammengeführt zu werden.

## 1.4.3 – 2026-08-04

### Behoben

- Ausrichtung des Zielobjekt-Tooltips bei anfangs zugeklapptem Filterbereich korrigiert: Unsichtbare Null-Geometrien werden ignoriert und die Position beim Auf- und Zuklappen sowie bei Größenänderungen neu berechnet.
- Tooltipfenster als dokumentweites Overlay rechts neben dem Fragezeichen positioniert, sodass es weder von der scrollbaren Seitenleiste beschnitten wird noch die Menüleiste überdeckt.

## 1.4.2 – 2026-08-04

### Geändert

- Fragezeichen-Tooltip dynamisch an der tatsächlichen Mitte des Zielobjekt-Dropdown-Titels und damit exakt auf Höhe des Dropdown-Pfeils ausgerichtet.
- Sichtbare Lade- und Statuszeile unter dem Zielobjekt-Dropdown einschließlich der nicht mehr benötigten DOM-, CSS- und JavaScript-Verwaltung entfernt.

## 1.4.1 – 2026-08-04

### Geändert

- Tooltip zur Zielobjektvererbung in die freie rechte Randfläche versetzt, sodass das Zielobjekt-Dropdown wieder dieselbe Breite wie alle übrigen Filter besitzt.
- Automatisch ergänzte Elternkategorien werden initial als normale aktivierte Checkboxen gesetzt und können anschließend einzeln abgewählt werden.
- Eine erneute Auswahl der Ausgangskategorie stellt zuvor entfernte Elternkategorien wieder her; „Alle Zielobjektkategorien“ setzt Auswahl und Automatikstatus vollständig zurück.
- Tooltiptext um die nachträgliche Abwahl automatisch ausgewählter Kategorien ergänzt.

## 1.4.0 – 2026-08-04

### Hinzugefügt

- Transitive Vererbungslogik für OSCAL-Control-Properties `target_object_categories`: Eine ausgewählte Zielobjektkategorie bezieht automatisch ihre übergeordneten Kategorien ein.
- Bedarfsgesteuerter, einmaliger Abruf der aktuellen BSI-Zielobjekthierarchie aus dem öffentlichen Stand-der-Technik-Repository mit vollständiger CSV- und Graphvalidierung.
- Kennzeichnung automatisch einbezogener Kategorien im Dropdown, im Dropdown-Titel und im aktiven Filterstatus.
- Verständlicher Tooltip zur Zielobjektvererbung sowie ein transparenter Lade- und Fehlerstatus.

### Geändert

- Manuelle und automatisch einbezogene Zielobjektkategorien werden getrennt verwaltet, damit Mehrfachauswahl und Abwahl eindeutig bleiben.
- Bei nicht erreichbarer oder ungültiger Namespace-Datei bleibt die bisherige exakte Zielobjektfilterung ohne Funktionsverlust aktiv.
- Veraltete String-Zerlegung beim Aufbau der Zielobjektoptionen durch die bereits normalisierten Control-Werte ersetzt.

## 1.3.0 – 2026-08-04

### Hinzugefügt

- Deutscher Suchoperator `ODER` für alternative Suchgruppen in Katalogen, Komponentendefinitionen und Mappings.
- Inklusive ODER-Logik: Ein Ergebnis darf eine oder mehrere der angegebenen Alternativen enthalten.

### Geändert

- Gemeinsames Suchmodell auf UND-Gruppen mit ODER-Alternativen erweitert und den bisherigen flachen Suchbegriff-Zustand vollständig ersetzt.
- Suchtooltips in allen drei Ansichten um verständliche UND-, ODER- und Wortgruppenbeispiele ergänzt.

## 1.2.1 – 2026-08-04

### Geändert

- Suchtooltips in allen drei Ansichten verständlicher formuliert: Begriffe werden per Leerzeichen getrennt, alle Begriffe müssen vorkommen, und Anführungszeichen kennzeichnen eine zusammenhängende Wortfolge.

## 1.2.0 – 2026-08-04

### Hinzugefügt

- Einheitliche UND-Mehrfachsuche für Kataloge, Komponentendefinitionen und Mappings.
- Suche nach exakten Wortgruppen durch Anführungszeichen.
- Zugängliche Bedienhinweise als Tooltip an allen drei Suchfeldüberschriften.

### Geändert

- Trefferhervorhebung markiert alle einzelnen Suchbegriffe und exakten Wortgruppen.
- Automatisch geöffnete Detailbereiche berücksichtigen die neue Mehrfachsuche.
- Alte Einzelstring-Suchprüfungen und der bisherige Ein-Begriff-Highlight-Cache wurden durch gemeinsame Suchhelfer ersetzt.

## 1.1.0 – 2026-08-04

### Hinzugefügt

- Anzeige der OSCAL-Custom-Properties `confidentiality`, `integrity`, `availability`, `authenticity` und `threats` in den Metadaten jeder Anforderung.
- Facettierter Filter „Alle Schutzziele“ für Vertraulichkeit, Integrität, Verfügbarkeit und Authentizität; Werte größer als `0` gelten als Zuordnung.

### Geändert

- Schutzziel- und BSI-G0-Metadaten werden zentral normalisiert, durchsuchbar gemacht und konsistent beschriftet.
- Direkt betroffenen redundanten und ungenutzten Property-/Aufwand-Code entfernt.

## 1.0.3 – 2026-07-29

### Geändert

- Logo-Hintergrund entfernt und durch echte PNG-Transparenz ersetzt.
- Beide Viewer auf die neue transparente Logo-Datei umgestellt.

## 1.0.2 – 2026-07-29

### Geändert

- Versionsangabe bündig unten rechts im Logo-Feld positioniert.
- Sichtbare Versionsangabe verkürzt und weiter verkleinert, damit sie die Logo-Fläche nicht überlagert.

## 1.0.1 – 2026-07-29

### Geändert

- Versionsangabe verkleinert und unten rechts im Logo-Feld positioniert.
- Logo-Darstellung im Kopfbereich wieder vergrößert.

## 1.0.0 – 2026-07-29

### Hinzugefügt

- Erste offiziell versionierte Ausgabe des Viewers.
- Sichtbare Versionsanzeige im Kopfbereich.
- Verbindliche Regeln für zukünftige Major-, Minor- und Patch-Versionen.
