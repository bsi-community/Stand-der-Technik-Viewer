# Prüfstrategie

## Automatisierte Prüfungen

| Kommando                | Zweck                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| `npm run lint`          | Fehlerhafte Bezeichner, ungenutzter Code und allgemeine JavaScript-Probleme                      |
| `npm run format:check`  | Einheitliche Formatierung ohne automatische Änderungen                                           |
| `npm run typecheck`     | Strikte Modellverträge und Modellregistrierung, noch nicht alle JS-Dateien                       |
| `npm test`              | Parser, Suchsemantik, Parameter, Hierarchie, Modellkennung und Architekturgrenzen                |
| `npm run build`         | Reproduzierbares statisches Pages-Artefakt mit korrektem Unterpfad                               |
| `npm run test:e2e`      | Benutzerabläufe gegen `dist/` in Chromium, Firefox und WebKit                                    |
| `npm run test:baseline` | Bildschirmvergleich gegen die ursprüngliche Git-Revision, gleicher Browser und gleiche Testdaten |

`npm run check` führt die regulären Qualitätsprüfungen bis einschließlich Browsertests aus. Der Baselinevergleich ist zusätzlich nötig, solange die unveränderte Optik Abnahmekriterium ist. Testreports und Screenshots liegen ausschließlich in ignorierten Ausgabeverzeichnissen.

## Regression und Testdaten

Die synthetischen Fixtures decken unter anderem verschachtelte Controls, Labels/Original-IDs, Parameterwerte, Capabilities, implementierte Anforderungen, Konfigurationsbefehle, partielle Mappings und nicht vollständig auflösbare Gap-Selektoren ab. Externe API-Antworten werden in den regulären Tests ersetzt: Die Tests sollen Anwendungsfehler erkennen und nicht von einer temporären GitHub-Störung abhängen.

Der visuelle Vergleich liest die alte HTML-Datei und D3 direkt aus Git, betreibt sie auf einem separaten lokalen Port und vergleicht beide Versionen im selben Chromium. Der bewusst geänderte Versionsschriftzug wird normalisiert. Seit der Ergänzung der Ressourcen-Kopfzeile ist für die Mappingansicht eine bewusste Abweichung zur ursprünglichen Version zu erwarten; dieser historische Gesamtvergleich ist dort kein Bestehenskriterium mehr. Die neue Darstellung wird separat über die Mapping-Browsertests und deren Screenshot geprüft. Keine Referenzbilder einer anderen Betriebssystem-/Fontumgebung werden blind übernommen. Verglichen werden Startseite, drei Fachansichten, Balkendiagramme, Zielobjekthierarchie und eine schmale Katalogansicht. Kraftbasierte Graphen sind wegen ihrer Layoutdynamik nicht Teil des pixelgenauen Vergleichs; sie besitzen Funktionstests.

Der CSS-Vertrag schützt weiterhin sämtliche ursprünglichen Stylesheets mit dem unveränderten Hash des Ausgangsstands. Nur das ergänzende `mapping-resource.css` ist davon ausgenommen. Die Ressourcenanzeige wird durch Domain- und Browsertests geprüft: Mapping ohne Kataloge, Laden/Entfernen eines Katalogs, Back-Matter-Verweise, optionale vs. geladene Versionen, mehrere Ressourcen und Filter, relative Pfade, nicht vertrauenswürdiger Text sowie lange Referenzen bei breiter und schmaler Ansicht.

## Fachliche und Live-Abnahme

Zusätzlich mit repräsentativen realen Katalogen und Komponenten prüfen: Datei und URL laden, mehrere Quellen wechseln/entfernen, Suche und kombinierte Filter, Metadaten/Back Matter, Parameter, Cross-Navigation, JSON-Details, Diagramme und Print-to-PDF. Bei großen Dokumenten auch Bedienbarkeit und Wartezeiten beurteilen.

Der automatisierte Drucktest prüft Aufbereitung und Wiederherstellung der Ansicht mit ersetztem `window.print`. Er steuert nicht den betriebssystemspezifischen Druckdialog. Ein echter PDF-Export bleibt Teil der manuellen Abnahme. WebKit ist ein Test der Engine, keine vollständige Garantie für jede Safari-/iOS-Version.

Nach einem Deployment sind die echten Pages-URL und externen Datenquellen separat zu prüfen. Lokale Tests können GitHub-Einstellungen, organisationsweite Actions-Regeln oder zukünftige API-Ausfälle nicht garantieren. Der konkrete lokale Umbau-Prüfstand wird in `docs/verification.md` festgehalten.
