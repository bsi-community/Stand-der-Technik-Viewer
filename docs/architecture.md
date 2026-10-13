# Architektur

## Ziel und bewusste Grenzen

Der veröffentlichte Viewer ist eine statische Browseranwendung für OSCAL-Kataloge,
Komponentendefinitionen und Mappings. KERN UX ist die aktuelle Oberflächengrundlage.
Es gibt weder Backend noch Datenbank, Uploaddienst, Telemetrie oder Laufzeit-CDN.
Lokale Dateien werden im Browser verarbeitet; Repository-, URL- und Versionsabrufe
sowie externe Dokumentressourcen benötigen Netzwerkzugriff.

Die Anwendung nutzt native ES-Module, DOM-Rendering und D3. Vite löst Module auf,
bündelt Assets mit Inhalts-Hashes und erzeugt den statischen Release-Build.
Node.js wird nur für Entwicklung, Tests und Build benötigt, nicht auf Pages.
Der ursprüngliche Architekturumbau aus dem Ein-Datei-Viewer und seine damaligen
Grenzen sind in [ADR 0002](adr/0002-modular-static-viewer.md) dokumentiert; die
anschließende UI-Entscheidung in [ADR 0003](adr/0003-kern-ui.md).

## Zuständigkeiten

| Bereich          | Verantwortung                                                                    | Nicht dort ablegen                      |
| ---------------- | -------------------------------------------------------------------------------- | --------------------------------------- |
| `domain`         | OSCAL-Erkennung, Datentransformation, Parameter, Hierarchien                     | DOM, Fetch, globale Anwendungszustände  |
| `app`            | Startreihenfolge, aktive Quellen, Zustände, Navigation, Koordination und Drucken | CSS, wiederverwendbare Textformatierung |
| `features`       | Fachliche Ansichten, Filter, Auswahl, Diagramme                                  | Allgemeine OSCAL-Parser                 |
| `infrastructure` | Repositoryabruf, Metadaten-Cache, CSV-Verfügbarkeit                              | Fachliche Renderer                      |
| `shared`         | Formatierung, Suche, DOM-Helfer, wiederverwendbare UI-Elemente                   | Modellübergreifende Navigation          |
| `styles`         | Bestehende Darstellung, responsive Regeln und Drucklayout                        | Anwendungszustand                       |

`domain/catalog.js` und `domain/mapping.js` liefern Datenmodelle ohne DOM-Zugriff. `app/catalog.js` und `app/mapping.js` übernehmen anschließend Zustandswechsel und UI-Effekte. Komponenten benötigen zusätzlich bereits geladene Kataloge und importierte Definitionen; diese zustandsabhängige Koordination ist ausdrücklich in `app/components.js` und `app/catalog-lookup.js` untergebracht, nicht als vermeintlich reiner Parser im Domain-Layer.

`app/bootstrap.js` ist der Composition Root: Er initialisiert Zustandscontainer, verbindet Anwendungsaktionen und bindet Ereignisse. `app/actions.js` stellt die dabei verbundenen Rückrufe für Ansichten bereit. So können etwa eine Karte zur Navigation auffordern und die Navigation Ansichten aktualisieren, ohne zyklische Modulimporte. Die Verbindungen werden vor der ersten Benutzerinteraktion hergestellt. Kein dynamisches Plugin-System und kein Event-Bus mit versteckten Ereignisnamen.

Der Architekturtest prüft existierende Imports, Zyklenfreiheit und die Abhängigkeitsgrenze des Domain-Layers. Bestehende imperative DOM-Renderer dürfen weiterhin auf ihren expliziten Zustandscontainer zugreifen. Das ist eine bewusste Migrationsgrenze, keine Behauptung einer vollständig zustandsfreien Anwendung. Insbesondere einige formatierende UI-Helfer verwenden den aktuellen Ressourcen- und Suchkontext.

## Datenfluss

```text
Datei / URL / Repositoryauswahl
  → app/loaders → app/sources
  → Parser bzw. Komponentenkoordination
  → getrennte Katalog-, Komponenten- und Mappingzustände
  → Filter/Selektoren → Fachansicht oder Diagramm
```

Original-JSON bleibt für Detailanzeigen erhalten. Lokale Dateien werden mit `FileReader` verarbeitet. URL-Dokumente benötigen serverseitig erlaubtes CORS. Die Basis-URL bleibt an der Quelle, damit relative Links aufgelöst werden. Komponentenimporte werden anhand der bereits geladenen Definitionen aufgelöst. Referenzierte öffentliche Kataloge werden vor dem Einfügen eines Komponenten- oder Mappingdokuments ergänzt; kein automatischer rekursiver Download fremder Dateien.

## JavaScript und TypeScript

Der bestehende, getestete JavaScript-Code bleibt zunächst erhalten. `domain/contracts.ts` und die dazugehörige JSDoc-typisierte `model-registry.js` bilden den ersten strikt geprüften Vertrag für die unterstützten Dokumenttypen. `npm run typecheck` deckt genau diese Dateien ab, **nicht die gesamte Anwendung**. Neue Datenmodelle sollen explizite Typen bekommen; weitere vorhandene Module können in separaten, getesteten Schritten typisiert werden. Eine nur scheinbar erfolgreiche Prüfung mit flächendeckendem `any` oder `@ts-nocheck` wird vermieden.

## CSS und Assets

`main.js` lädt regulär `styles/kern/index.css`. Native KERN-Styles und fachliche
Viewer-Kompositionen sind durch CSS-Layer geordnet. Legacy-Styles besitzen einen
getrennten Einstieg und stehen ausschließlich für explizite Entwicklungsvergleiche
zur Verfügung. Ihre historische Kaskade bleibt durch Regressionstests geschützt.

Die neue SVG-Bildmarke liegt unter `src/assets/viewer-mark.svg` und wird auch als
Favicon gebündelt. Sie steht ohne eigene Aktion zwischen Home-Button und Texttitel.
Das PNG unter `public/assets/viewer-logo.png` dient der Legacy-Ansicht. Fira Sans
wird lokal ausgeliefert; die optionale BundesSans-Einbindung beschreibt
[kern-preview.md](kern-preview.md).

Die alte URL `Stand der Technik-Viewer.html` leitet unter Erhalt von Suchparametern
und Hash weiter. Das Inline-Startskript und `release.json` erkennen neue Builds,
ohne laufende Sitzungen neu zu laden; siehe [Betrieb](deployment.md).

## Erweiterungen

Für SSP, Assessment Plan, Assessment Results oder POA&M werden jeweils ein Modellvertrag, Datenaufbereitung, Fachansicht, passende Zustandsverwaltung und Tests ergänzt. Erst danach wird die Modellregistrierung erweitert. Eine neue Registrierung allein erzeugt noch keine vollwertige Ansicht. Gemeinsame Metadaten-/Markup-/Quellenfunktionen sollen wiederverwendet werden; neue Spezialfälle gehören nicht pauschal in den Katalogparser.

## Entscheidungen und Referenzen

- [ADR 0001: Versionierung](adr/0001-semantic-versioning.md)
- [ADR 0002: Modularer statischer Viewer](adr/0002-modular-static-viewer.md)
- [MDN: JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Vite: Static Deploy](https://vite.dev/guide/static-deploy.html#github-pages)
- [GitHub: Custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

Es gibt keine offizielle Norm, die einen bestimmten `src/`-Ordnerbaum vorschreibt. Maßgeblich sind hier nachvollziehbare Zuständigkeiten, reproduzierbare Builds, überprüfte Schnittstellen, automatisierte Regressionstests und dokumentierter Betrieb.

## KERN-Oberfläche

Die veröffentlichte KERN-Oberfläche verwendet wiederverwendbare UI-Primitiven und eine
separate Shell-Einrichtung. Umfang und noch ausstehende Abnahmen
sind im [KERN-Migrationsstand](kern-migration.md) dokumentiert. Die ursprüngliche
verhaltensbewahrende Migration oben bleibt die Grundlage der OSCAL-Fachlogik.

### KERN-Inhalte und Druck

`shared/ui/kern.js` erzeugt gemeinsame Beschreibungslisten und stellt Tabellen,
Buttons und Details für explizit übergebene Inhaltsbereiche bereit. Die generischen
Metadatenrenderer behalten sichere Linkauflösung und Rich Text bei. Mapping-
Dokumentinformationen liegen in `features/mappings/document-info.js`.
`app/kern-print.js` druckt ausschließlich eine DOM-Kopie der aktuellen Auswahl;
Print-Details verändern daher keine Aufklappzustände im Store.

### Unabhängiger KERN-Einstieg und Release-Build

`main.js` entscheidet vor dem Start zwischen den getrennten Stylesheets. KERN
importiert keine Legacy-Dateien: `styles/kern/index.css` legt die Layer `structure`
(fachliche Layouts), `kern` (native Bibliothek) und `viewer` (Gestaltung) fest.
Der Architekturtest verhindert lokale CSS-Imports außerhalb des KERN-Verzeichnisses.
Die initiale `index.html` enthält die neue SVG-Bildmarke und den Texttitel bereits
vor dem Anwendungsstart; Logo und Home-Symbol besitzen feste HTML-Abmessungen.
`app/kern-presentation.js` richtet Schrift, Fokus, Titel und Größenanpassung ein.
Nur der Vergleichseinstieg in `main.js` ersetzt die Kopfzeile nach dem Laden der
Legacy-Styles durch das historische PNG. Der KERN-Start fordert dieses Bild nicht an.
`shared/ui/import-feedback.js` bündelt parallele Importe und entfernt reine
Erfolgsmeldungen nach fünf Sekunden oder bei Navigation/Entfernung einer Quelle.
Die Live-Region bleibt bestehen; Lade- und Fehlerzustände haben keinen Ablauf-Timer.
`app/kern-preview.js` und `preview/documents.js` werden nur für explizite
Vergleichsparameter dynamisch geladen.

Vite setzt `import.meta.env.VIEWER_COMPARISON` abhängig vom Build-Modus. Im Modus
`release` ist die Konstante `false`; der Bundler entfernt damit die Vergleichszweige,
Legacy-CSS und Demo-Chunks. `check-build.mjs dist-release` prüft die Artefaktgrenze,
`playwright.release.config.js` den Einstieg samt echtem Dateiimport. Der Pages-
Workflow paketiert nur `dist-release`; seine Freigabe bleibt an `main` gebunden.
Die separaten macOS-KERN-Bildreferenzen ersetzen nicht den plattformübergreifenden
funktionalen Browserlauf oder die eingefrorene Legacy-Referenz.

## Repositoryauswahl für Mappings (13. Oktober 2026)

`features/home/repository.js` nutzt dieselbe rekursive GitHub-Dateiliste für alle
drei Modelle. JSON-Dateien unter `control_layer/Mappings/` werden als `mapping`
geführt und bleiben aus der Katalogauswahl ausgeschlossen. Die Dateiliste wird bei
jedem Anwendungsstart mit `cache: 'no-store'` geladen; ausschließlich Metadaten
unveränderter Dateien werden anhand der SHA wiederverwendet.

`registryState.mappings` versorgt die KERN-Startseitenkachel, die globale Suche und
die Mappingauswahl in der Seitenleiste. Der leere Arbeitsbereich übernimmt Optionen,
Lade-/Fehlerzustand und Dokumenttitel über `refreshWorkspaceRepositoryControls`.
Alle drei Einstiege verwenden den bestehenden `loadMappingFromUrl`-Import und
behalten dessen Quellen-URL für relative Referenzen bei. Keine neue Netzwerkquelle
und keine neue Abhängigkeit. Die historische Legacy-Vergleichsoberfläche behält
ihren bisherigen Einstieg mit zwei Modellkacheln.

## Automatische Katalogabhängigkeiten

`domain/catalog-references.js` extrahiert scoped Referenzen und prüft die Priorität
Document-ID → exakter Repositorypfad → exakter Titel ohne Netzwerkzugriff.
`infrastructure/repository-index.js` liefert eine von Startseite und Importen
geteilte Promise für die aktuelle Dateiliste und ihre Metadaten. Alle JSON-Dateien
unter `control_layer/` werden indexiert; nur tatsächlich erkannte Catalogs kommen
für den automatischen Import infrage. Mappings und Profile bleiben ausgeschlossen.

Der SHA-gebundene Metadaten-Cache v3 enthält alle Document-IDs, Instanz-UUID und
Modelltyp. `repository-fetch.js` bündelt laufende Requests, begrenzt jeden Abruf
auf acht Sekunden und hält bis zu 24 öffentliche Katalog-JSONs im Arbeitsspeicher.
Ein beim Indexieren bereits abgerufenes Katalogdokument muss für den Import nicht
erneut übertragen werden. Ein Neuladen beginnt wieder mit einer frischen Dateiliste.

`app/catalog-dependencies.js` koordiniert bis zu vier parallele Katalogabrufe,
validiert Dokumenttyp und Identität vor der Übernahme, prüft nach dem Warten erneut
auf bereits importierte Kataloge und fügt neue Quellen gesammelt über
`addCatalogSources` ein. Ein vorhandener aktiver Katalog bleibt aktiv; pro Gruppe
wird die Katalogansicht nur einmal aufgebaut. Lokale und URL-Loader warten vor dem
Einfügen des Hauptdokuments auf diese Prüfung. Fehler bei Abhängigkeiten werden
isoliert, sodass das Hauptdokument weiterhin importiert werden kann.

Die Anforderungsauflösung berücksichtigt dieselben Identitäten: Eine explizite,
nicht passende Document-ID darf nicht durch zufällig gleiche Control-IDs eines
anderen geladenen Katalogs ersetzt werden. Details, unterstützte Referenzstellen
und Grenzen stehen in [catalog-autoload.md](catalog-autoload.md).
