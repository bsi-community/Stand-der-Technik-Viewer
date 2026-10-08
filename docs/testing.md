# Prüfstrategie

## Automatisierte Prüfungen

| Kommando                | Zweck                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| `npm run lint`          | Fehlerhafte Bezeichner, ungenutzter Code und allgemeine JavaScript-Probleme                  |
| `npm run format:check`  | Einheitliche Formatierung ohne automatische Änderungen                                       |
| `npm run typecheck`     | Strikte Modellverträge und Modellregistrierung, noch nicht alle JS-Dateien                   |
| `npm test`              | Parser, Suchsemantik, Parameter, Hierarchie, Modellkennung und Architekturgrenzen            |
| `npm run build`         | Reproduzierbares statisches Pages-Artefakt mit korrektem Unterpfad                           |
| `npm run test:e2e`      | Benutzerabläufe gegen `dist/` in Chromium, Firefox und WebKit                                |
| `npm run test:baseline` | Bildschirmvergleich gegen eine eingefrorene Referenz, gleicher Browser und gleiche Testdaten |

`npm run check` führt die regulären Qualitätsprüfungen bis einschließlich Browsertests aus. Der Baselinevergleich ist zusätzlich verpflichtend und läuft in CI nach `npm run check`. Auch bei beabsichtigten UI-Änderungen muss er erfolgreich sein; dann ist die Referenz nach Sichtprüfung gezielt zu aktualisieren. Testreports und Screenshots liegen ausschließlich in ignorierten Ausgabeverzeichnissen.

## Regression und Testdaten

Die synthetischen Fixtures decken unter anderem verschachtelte Controls, Labels/Original-IDs, Parameterwerte, Capabilities, implementierte Anforderungen, Konfigurationsbefehle, partielle Mappings und nicht vollständig auflösbare Gap-Selektoren ab. Externe API-Antworten werden in den regulären Tests ersetzt: Die Tests sollen Anwendungsfehler erkennen und nicht von einer temporären GitHub-Störung abhängen.

Der visuelle Vergleich baut zwei voneinander unabhängige Produktionsstände und rendert beide im selben Chromium. Die Referenz besteht aus der in `main` enthaltenen Git-Revision `fb6b696a986c252b7a41930d19f80645d292c7e6` plus dem eingecheckten `tests/fixtures/mapping-visual-baseline.patch`. Dieser Patch friert ausschließlich die fünf Quelldateiänderungen der geprüften Mapping-Kopfzeile aus Commit `8bbf243953826a196980e8ba7681592cd45a8b0f` (PR #11) ein. Der Test erzeugt ihn niemals aus dem aktuellen Arbeitsstand. Damit bleibt die Referenz auch nach Squash-Merge und Löschen des PR-Branches reproduzierbar.

Die Referenz wird in einem temporären Verzeichnis mit denselben installierten Abhängigkeiten gebaut; die Lockfiles müssen dafür identisch sein. Der Arbeitsstand wird nicht verändert, temporäre Dateien und Vorschauprozesse werden anschließend entfernt. Die vollständige Git-Historie muss lokal verfügbar sein (`fetch-depth: 0` in CI). Bei einer zukünftigen bewussten Design- oder Dependency-Änderung Referenzrevision/Patch nach Prüfung separat aktualisieren und den Grund dokumentieren; keine automatische Übernahme aktueller Quelldateien als Sollzustand.

Nur der Versionsschriftzug wird normalisiert. Kein Maskieren, Weglassen oder Ersetzen der Mapping-Kopfzeile: Alle zehn vollständigen Screenshots müssen pixelidentisch sein. Geprüft werden Startseite, Mapping ohne Kataloge, die drei Fachansichten, deren Balkendiagramme, Zielobjekthierarchie und eine schmale Katalogansicht. Vorher-/Nachher-Bilder stehen unter `test-results/baseline/` und werden bei CI-Fehlern als Diagnostik hochgeladen. Keine Referenzbilder einer anderen Betriebssystem-/Fontumgebung werden übernommen. Kraftbasierte Graphen sind wegen ihrer Layoutdynamik nicht Teil des pixelgenauen Vergleichs; sie besitzen Funktionstests.

Der CSS-Vertrag schützt weiterhin sämtliche ursprünglichen Stylesheets mit dem unveränderten Hash des Ausgangsstands. Nur das ergänzende `mapping-resource.css` ist davon ausgenommen. Die Ressourcenanzeige wird durch Domain- und Browsertests geprüft: Mapping ohne Kataloge, Laden/Entfernen eines Katalogs, Back-Matter-Verweise, optionale vs. geladene Versionen, mehrere Ressourcen und Filter, relative Pfade, nicht vertrauenswürdiger Text sowie lange Referenzen bei breiter und schmaler Ansicht.

## Fachliche und Live-Abnahme

Die Aktualisierungsprüfungen in `tests/e2e/updates.spec.js` testen veraltetes HTML, entfernte alte Assets, alte benannte HTML-Links, erhaltene Parameter/Fragmente, Schleifenschutz, ungültige/nicht erreichbare/langsame Versionsantworten und den Erhalt bereits geladener Dokumente. Ein zusätzlicher lokaler HTTP-Server reproduziert in allen drei Browser-Engines einen echten `max-age=600`-Cache: erster Besuch, neue Veröffentlichung, zweiter Besuch über dieselbe Adresse ohne manuelles Neuladen. Dieser Test verwendet einen eigenen Browser-Kontext ohne Request-Routing, damit der Browsercache tatsächlich aktiv bleibt.

Zusätzlich mit repräsentativen realen Katalogen und Komponenten prüfen: Datei und URL laden, mehrere Quellen wechseln/entfernen, Suche und kombinierte Filter, Metadaten/Back Matter, Parameter, Cross-Navigation, JSON-Details, Diagramme und Print-to-PDF. Bei großen Dokumenten auch Bedienbarkeit und Wartezeiten beurteilen.

Der automatisierte Drucktest prüft Aufbereitung und Wiederherstellung der Ansicht mit ersetztem `window.print`. Er steuert nicht den betriebssystemspezifischen Druckdialog. Ein echter PDF-Export bleibt Teil der manuellen Abnahme. WebKit ist ein Test der Engine, keine vollständige Garantie für jede Safari-/iOS-Version.

Nach einem Deployment sind die echten Pages-URL und externen Datenquellen separat zu prüfen. Lokale Tests können GitHub-Einstellungen, organisationsweite Actions-Regeln oder zukünftige API-Ausfälle nicht garantieren. Der konkrete lokale Umbau-Prüfstand wird in `docs/verification.md` festgehalten.
