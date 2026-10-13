# Prüfstrategie

## Automatisierte Prüfungen

| Kommando                | Zweck                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| `npm run lint`          | Fehlerhafte Bezeichner, ungenutzter Code und allgemeine JavaScript-Probleme                  |
| `npm run format:check`  | Einheitliche Formatierung ohne automatische Änderungen                                       |
| `npm run typecheck`     | Strikte Modellverträge und Modellregistrierung, noch nicht alle JS-Dateien                   |
| `npm test`              | Parser, Suchsemantik, Parameter, Hierarchie, Modellkennung und Architekturgrenzen            |
| `npm run build`         | Entwicklungs-/Vergleichsbuild `dist/` mit korrektem Unterpfad                                |
| `npm run test:e2e`      | Benutzerabläufe gegen `dist/` in Chromium, Firefox und WebKit                                |
| `npm run test:baseline` | Bildschirmvergleich gegen eine eingefrorene Referenz, gleicher Browser und gleiche Testdaten |

Zusätzlich:

- `npm run build:release`: Pages-Artefakt `dist-release/` ohne Legacy und Demo-Module.
- `npm run test:release`: Release-Einstieg und Import in drei Browsern; vorher Release bauen.
- `npm run test:kern-visual`: separate macOS-Bildreferenzen der KERN-Oberfläche.

`npm run check` führt die regulären Qualitätsprüfungen bis einschließlich Browsertests aus. Der Baselinevergleich ist zusätzlich verpflichtend und läuft in CI nach `npm run check`. Er prüft ausdrücklich die Legacy-Ansicht (`?design=legacy`), nicht das aktuelle KERN-Design. KERN-Änderungen rechtfertigen deshalb keine Anpassung der Legacy-Referenz. Nur gezielte Änderungen am Legacy-Verhalten oder seinen Abhängigkeiten erfordern eine separat geprüfte Aktualisierung. Testreports und Screenshots liegen ausschließlich in ignorierten Ausgabeverzeichnissen.

## Regression und Testdaten

Die synthetischen Fixtures decken unter anderem verschachtelte Controls, Labels/Original-IDs, Parameterwerte, Capabilities, implementierte Anforderungen, Konfigurationsbefehle, partielle Mappings und nicht vollständig auflösbare Gap-Selektoren ab. Externe API-Antworten werden in den regulären Tests ersetzt: Die Tests sollen Anwendungsfehler erkennen und nicht von einer temporären GitHub-Störung abhängen.

Der Legacy-Vergleich baut zwei voneinander unabhängige Vergleichsstände und rendert beide im selben Chromium. Die Referenz besteht aus der in `main` enthaltenen Git-Revision `fb6b696a986c252b7a41930d19f80645d292c7e6` plus dem eingecheckten `tests/fixtures/mapping-visual-baseline.patch`. Dieser Patch friert ausschließlich die fünf Quelldateiänderungen der geprüften Mapping-Kopfzeile aus Commit `8bbf243953826a196980e8ba7681592cd45a8b0f` (PR #11) ein. Der Test erzeugt ihn niemals aus dem aktuellen Arbeitsstand. Damit bleibt die Referenz auch nach Squash-Merge und Löschen des PR-Branches reproduzierbar.

Die Referenz wird in einem temporären Verzeichnis mit denselben installierten Abhängigkeiten gebaut; die Lockfiles müssen dafür identisch sein. Der Arbeitsstand wird nicht verändert, temporäre Dateien und Vorschauprozesse werden anschließend entfernt. Die vollständige Git-Historie muss lokal verfügbar sein (`fetch-depth: 0` in CI). Bei einer zukünftigen bewussten Legacy-Design- oder Dependency-Änderung Referenzrevision/Patch nach Prüfung separat aktualisieren und den Grund dokumentieren; keine automatische Übernahme aktueller Quelldateien als Sollzustand.

Nur der Versionsschriftzug wird normalisiert. Kein Maskieren, Weglassen oder Ersetzen der Mapping-Kopfzeile: Alle zehn vollständigen Screenshots müssen pixelidentisch sein. Geprüft werden Startseite, Mapping ohne Kataloge, die drei Fachansichten, deren Balkendiagramme, Zielobjekthierarchie und eine schmale Katalogansicht. Vorher-/Nachher-Bilder stehen unter `test-results/baseline/` und werden bei CI-Fehlern als Diagnostik hochgeladen. Keine Referenzbilder einer anderen Betriebssystem-/Fontumgebung werden übernommen. Kraftbasierte Graphen sind wegen ihrer Layoutdynamik nicht Teil des pixelgenauen Vergleichs; sie besitzen Funktionstests.

Der CSS-Vertrag schützt weiterhin sämtliche ursprünglichen Stylesheets mit dem unveränderten Hash des Ausgangsstands. Nur das ergänzende `mapping-resource.css` ist davon ausgenommen. Die Ressourcenanzeige wird durch Domain- und Browsertests geprüft: Mapping ohne Kataloge, Laden/Entfernen eines Katalogs, Back-Matter-Verweise, optionale vs. geladene Versionen, mehrere Ressourcen und Filter, relative Pfade, nicht vertrauenswürdiger Text sowie lange Referenzen bei breiter und schmaler Ansicht.

## Fachliche und Live-Abnahme

Die Aktualisierungsprüfungen in `tests/e2e/updates.spec.js` testen veraltetes HTML, entfernte alte Assets, alte benannte HTML-Links, erhaltene Parameter/Fragmente, Schleifenschutz, ungültige/nicht erreichbare/langsame Versionsantworten und den Erhalt bereits geladener Dokumente. Ein zusätzlicher lokaler HTTP-Server reproduziert in allen drei Browser-Engines einen echten `max-age=600`-Cache: erster Besuch, neue Veröffentlichung, zweiter Besuch über dieselbe Adresse ohne manuelles Neuladen. Dieser Test verwendet einen eigenen Browser-Kontext ohne Request-Routing, damit der Browsercache tatsächlich aktiv bleibt.

Zusätzlich mit repräsentativen realen Katalogen und Komponenten prüfen: Datei und URL laden, mehrere Quellen wechseln/entfernen, Suche und kombinierte Filter, Metadaten/Back Matter, Parameter, Cross-Navigation, JSON-Details, Diagramme und Print-to-PDF. Bei großen Dokumenten auch Bedienbarkeit und Wartezeiten beurteilen.

Der automatisierte Drucktest prüft Aufbereitung und Wiederherstellung der Ansicht mit ersetztem `window.print`. Er steuert nicht den betriebssystemspezifischen Druckdialog. Ein echter PDF-Export bleibt Teil der manuellen Abnahme. WebKit ist ein Test der Engine, keine vollständige Garantie für jede Safari-/iOS-Version.

Nach einem Deployment sind die echten Pages-URL und externen Datenquellen separat zu prüfen. Lokale Tests können GitHub-Einstellungen, organisationsweite Actions-Regeln oder zukünftige API-Ausfälle nicht garantieren. Datierte Prüfnachweise stehen in [verification.md](verification.md) und [kern-acceptance.md](kern-acceptance.md). Sie gelten jeweils nur für den dort beschriebenen Stand und Umfang.

## KERN-Regressionen und Dokumentationsprüfung

Die KERN-Browserfälle decken Navigation, Fokus, Filter, Import, Inhalte, Diagramme,
responsive Layouts und Release-Isolation ab. `import-status.spec.js` prüft für
alle drei Dokumenttypen Ablauf und Bereinigung der Erfolgsmeldung sowie den
Schutz neuer Lade-/Fehlerzustände vor älteren Timern.

Der reguläre Ubuntu-Workflow führt die funktionalen Tests und den Legacy-Vergleich
aus. `test:kern-visual` ist eine zusätzliche macOS-Prüfung mit festen Fira-Sans-
Referenzen. Die bisher eingecheckten Bilder stammen aus der Migration; die neue
Logo-Kopfzeile erfordert eine bewusste Sichtprüfung und Aktualisierung. Kein
normales Testkommando darf die Sollbilder automatisch überschreiben.

Bei Dokumentationsänderungen mindestens Markdown formatieren, lokale Links und
referenzierte Dateipfade prüfen, Kommandos mit `package.json`/Workflow abgleichen
und `git diff --check` ausführen. Für reine Prosa ist kein vollständiger
Browserdurchlauf nötig. Änderungen an Startern zusätzlich syntaktisch und beim
Start prüfen. Viewer-Codeänderungen benötigen die passenden fachlichen Tests.

## Größenwechsel ohne Messrennen

Die Zielobjekthierarchie baut ihre Darstellung nach einem Fenstergrößenwechsel
verzögert neu auf. Der responsive Test in `kern-polish.spec.js` ermittelt das
aktuelle Tabellenelement und seine Maße in derselben Browser-Auswertung und wartet
mit `expect.poll` auf den fertigen Zustand. Er verlangt weiterhin eine sichtbare
Tabelle, eine auf die Fensterbreite begrenzte Scrollfläche, deren überbreiten
Tabelleninhalt und eine Seite ohne horizontalen Überlauf. Bleibt dieser Zustand
aus, schlägt der Test fehl. Keine feste Schlafpause, deaktivierte Assertion oder
zusätzliche Wiederholung des gesamten Tests ersetzt diese Prüfung.

## Unfertigen Seitenstart prüfen

`tests/release/startup.spec.js` hält Skripte, Stylesheets bzw. die Versionsantwort
gezielt zurück und prüft bereits vor der fertigen Anwendung die neue Bildmarke,
deren 40-×-40-Abmessungen, den Texttitel und das 24-×-24-Home-Symbol. Kein Aufruf
des alten PNG darf erfolgen. Danach werden die Antworten freigegeben und der
reguläre Start sowie die Home-Navigation geprüft, bei 375 und 1280 Pixeln in allen
drei Browser-Engines. Der Build-Vertrag schützt zusätzlich die initiale HTML-Ausgabe.

## Öffentliche Mapping-Bibliothek

`tests/e2e/repository-mappings.spec.js` prüft die dritte Modellkachel einschließlich
Tastaturnavigation, Suche, beide Dropdowns, verschachtelte und URL-kodierte Pfade,
Aktualisierung beim Neustart trotz Metadaten-Cache, verzögertes Laden, leere und
fehlgeschlagene bzw. unvollständige Repositoryantworten, erneuten Abruf,
fehlgeschlagene Mapping-Downloads sowie schmale Ansichten. Die regulären Prüfungen
ersetzen GitHub-Antworten durch synthetische Daten und laufen in allen drei Engines.
Die macOS-KERN-Startseitenbilder müssen die dritte Kachel berücksichtigen; die
historische Legacy-Referenz bleibt unverändert.

## Automatische Katalogabhängigkeiten

`catalog-references.test.js` deckt Referenzstellen, Back-Matter-Priorität, sämtliche
Document-IDs, Instanz-UUID-URIs, exakte Pfade/Titel, fremde Hosts, lokale relative
Pfade und explizit importierte bereits geladene Definitionen ab.
`repository-fetch.test.js` prüft gemeinsame Requests, Wiederverwendung, Fehler-
Erholung und den Abbruch zeitüberschrittener Abrufe mit kontrollierter Uhr.
`catalog-dependencies.spec.js` prüft beide Modelle über alle drei Prioritätsstufen,
Datei- und Repositoryimport, mehrere Kataloge, konkurrierende Importe, vorhandene
Quellen, relative URLs und Deep Links, kalten/warmen Cache, verzögerten bzw.
fehlgeschlagenen Abruf sowie die Ablehnung falscher Modelle und IDs. Sämtliche
Browserfälle laufen mit synthetischen Daten in Chromium, Firefox und WebKit.
Der separate Echtdatenabgleich darf fehlende oder ungenaue Referenzen im öffentlichen
Bestand nicht durch unscharfe Fallbacks verdecken.

## Metadatenlayout und Dokumenttitel

`metadata-layout.spec.js` prüft die volle Lesebreite von Anmerkungen in Catalogs,
Component Definitions und Mapping Collections bei 1440, 820, 375 und 320 Pixeln.
Die synthetischen Daten enthalten mehrere Absätze, Listen, Links und verschachtelte
Anmerkungen. Zusätzlich werden Tastaturbedienung der Metadaten, Quellenwechsel,
fehlende Titel und sichere Titel-Markupdarstellung geprüft. Die Fälle laufen in
Chromium, Firefox und WebKit. Layout-Screenshots werden als Prüfartefakte erzeugt;
die bestehenden KERN-Komponentenbilder berücksichtigen den neuen Dokumenttitel.
