# Architektur

## Ziel und bewusste Grenzen

Der Umbau verändert die technische Organisation, nicht das Bedienkonzept. Ausgangspunkt ist Git-Commit `36c1dc82243360c0f2e8578fc641af2ab80b5a98` vom 30.09.2026 mit sichtbarer Version 2.1.1. Die bestehenden Funktionen einschließlich partieller Mappings bleiben erhalten. Es gibt weiterhin weder Backend noch Datenbank, Uploaddienst, Telemetrie oder Laufzeit-CDN.

Die Anwendung nutzt native ES-Module, DOM-Rendering und D3. Ein Frameworkwechsel hätte gleichzeitig Darstellung, Zustandsführung und Komponentenmodell verändert und wäre für diese verhaltensbewahrende Migration unnötig riskant. Vite löst Module auf, bündelt Assets mit Inhalts-Hashes und erzeugt die statische Veröffentlichung. Node.js wird nur für Entwicklung, Tests und Build benötigt, nicht auf GitHub Pages.

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

Original-JSON bleibt für Detailanzeigen erhalten. Lokale Dateien werden mit `FileReader` verarbeitet. URL-Dokumente benötigen serverseitig erlaubtes CORS. Die Basis-URL bleibt an der Quelle, damit relative Links aufgelöst werden. Komponentenimporte werden wie bisher anhand der bereits geladenen Definitionen aufgelöst; kein automatischer rekursiver Download fremder Dateien.

## JavaScript und TypeScript

Der bestehende, getestete JavaScript-Code bleibt zunächst erhalten. `domain/contracts.ts` und die dazugehörige JSDoc-typisierte `model-registry.js` bilden den ersten strikt geprüften Vertrag für die unterstützten Dokumenttypen. `npm run typecheck` deckt genau diese Dateien ab, **nicht die gesamte Anwendung**. Neue Datenmodelle sollen explizite Typen bekommen; weitere vorhandene Module können in separaten, getesteten Schritten typisiert werden. Eine nur scheinbar erfolgreiche Prüfung mit flächendeckendem `any` oder `@ts-nocheck` wird vermieden.

## CSS und Assets

`styles/index.css` legt die Importreihenfolge fest. Die bestehenden Regeln wurden entlang vollständiger Blöcke aufgeteilt; Reihenfolge, Selektoren und Deklarationen sind absichtlich erhalten. Bestehende Überschreibungen dürfen nicht allein aus ästhetischen Gründen umsortiert werden. Eine spätere CSS-Konsolidierung benötigt eigene visuelle Regressionstests.

Das Logo liegt unter `public/assets/`. Die alte URL `Stand der Technik-Viewer.html` ist eine kleine Weiterleitung, die Suchparameter und Hash beibehält; sie ist keine zweite zu pflegende Anwendung. Vite setzt den Repository-Unterpfad für veröffentlichte Skripte, Styles und Bilder.

## Erweiterungen

Für SSP, Assessment Plan, Assessment Results oder POA&M werden jeweils ein Modellvertrag, Datenaufbereitung, Fachansicht, passende Zustandsverwaltung und Tests ergänzt. Erst danach wird die Modellregistrierung erweitert. Eine neue Registrierung allein erzeugt noch keine vollwertige Ansicht. Gemeinsame Metadaten-/Markup-/Quellenfunktionen sollen wiederverwendet werden; neue Spezialfälle gehören nicht pauschal in den Katalogparser.

## Entscheidungen und Referenzen

- [ADR 0001: Versionierung](adr/0001-semantic-versioning.md)
- [ADR 0002: Modularer statischer Viewer](adr/0002-modular-static-viewer.md)
- [MDN: JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Vite: Static Deploy](https://vite.dev/guide/static-deploy.html#github-pages)
- [GitHub: Custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

Es gibt keine offizielle Norm, die einen bestimmten `src/`-Ordnerbaum vorschreibt. Maßgeblich sind hier nachvollziehbare Zuständigkeiten, reproduzierbare Builds, überprüfte Schnittstellen, automatisierte Regressionstests und dokumentierter Betrieb.
