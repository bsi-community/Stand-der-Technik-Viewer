# Prüfstände und historische Nachweise

## Öffentliche Mapping-Bibliothek – 13. Oktober 2026

Branch `codex/viewer-public-mappings`: dritte KERN-Modellkachel, Mapping-Suche und
Repository-Dropdowns in Seitenleiste und leerem Arbeitsbereich. Die Liste wird
inklusive Unterordnern bei jedem Start frisch geladen.

Lokal erfolgreich: Lint, vollständige Formatprüfung, TypeScript,
43 Unit-/Architekturtests, 270 reguläre Browserfälle (davon 36 neue Mappingfälle),
zehn unveränderte Legacy-Bildvergleiche und 21 Release-Browserfälle. Beide Builds
bestehen die Artefaktprüfung; der Release enthält weiterhin keine Legacy-/Demo-
Module. Die Browserläufe nutzten Chromium, Firefox und WebKit ohne Test-Retries.
Nach der abschließenden Kachel-Layoutkorrektur wurden die 36 gezielten Browserfälle
sowie Lint, Typprüfung, Unit-Tests und Entwicklungsbuild erneut erfolgreich geprüft.

Zusätzlicher Browserabruf der öffentlichen BSI-Bibliothek: beide verfügbaren
Mapping Collections wurden mit ihren Metadatentiteln angeboten. Das GSMap-Mapping
ließ sich aus dem mittleren Dropdown mit 1.185 Beziehungen öffnen, ohne protokollierte
JavaScript-Fehler. Startseite und Mapping-Ladewege wurden bei 1440 Pixeln,
die Startseite zusätzlich bei 375 und 820 Pixeln visuell geprüft. Die zwei KERN-
Startseitenreferenzen wurden gezielt nach Sichtprüfung aktualisiert. Anschließend
bestanden alle zwölf KERN-Bildvergleiche (zwei Browserfälle) und erneut der
Release-Build samt Artefaktprüfung und allen 21 Release-Browserfällen.

Die Prüfungen sind lokale Nachweise. GitHub-CI und Pages-Veröffentlichung stehen
für diesen Feature-Branch noch aus; keine neue Screenreader- oder fachliche
Gesamtabnahme wird behauptet.

## Startlogo-Korrektur – 12. Oktober 2026

Auf `codex/viewer-startup-logo`, ausgehend von `main` nach PR #16 (`1469c3c`),
wurde das alte PNG aus der initialen HTML-Kopfzeile entfernt. Die neue SVG-Bildmarke
und das Home-Symbol sind bereits ohne geladenes JavaScript/CSS auf ihre vorgesehenen
Maße begrenzt. Das alte Bild wird nur im expliziten Legacy-Vergleich nachgeladen.

Lokal erfolgreich: Lint, vollständige Formatprüfung, TypeScript,
43 Unit-/Architekturtests, 234 reguläre Browserfälle, beide Builds samt Asset- und
Release-Isolationsprüfung, 21 Release-Browserfälle und alle zehn unveränderten
Legacy-Bildvergleiche. Die neuen 18 Startfälle verzögern gezielt Skripte, Stylesheets
oder Versionsantworten bei 375/1280 Pixeln in Chromium, Firefox und WebKit. Sie
prüfen die Logo-Maße schon vor dem fertigen Start und schließen Anforderungen des
alten PNG aus. Beide Browserdurchläufe liefen ohne Test-Retries. Der Ubuntu-CI-
und Pages-Nachweis steht bis zum Push bzw. Merge dieses Folgebranches aus.

## Aktueller Bezug – 12. Oktober 2026

Der KERN-Umbau und die Folgekorrekturen sind auf `main` übernommen: PR #13
(`6e01c199`) und PR #14 (`fc4e960`, Logo und Importbestätigung). Die GitHub-
Prüfungen des letzten PR-Commits `7ed6426` waren für Push und Pull Request
erfolgreich. Der Workflow prüft `main` vor jeder Pages-Veröffentlichung erneut;
maßgeblich für den Live-Stand ist der jeweilige erfolgreiche Deploy-Lauf.

Für die Importkorrektur bestanden lokal Lint, Formatierung, TypeScript,
43 Unit-/Architekturtests, der Build und 36 gezielte Browserprüfungen in drei
Engines. Das ist kein erneuter Volltest aller Ansichten. Frühere KERN-Prüfungen
sind in [kern-migration.md](kern-migration.md) und [kern-acceptance.md](kern-acceptance.md)
datiert dokumentiert. Die echte Screenreader-Abnahme bleibt offen; macOS-KERN-
Bildreferenzen müssen nach der neuen Logo-Kopfzeile erneut abgenommen werden.

Die folgenden Abschnitte sind **historische Prüfberichte**. Ihre Testzahlen,
Branch-Namen und damaligen Aussagen zur noch ausstehenden Veröffentlichung gelten
für den jeweiligen Prüfzeitpunkt, nicht als Beschreibung des heutigen Betriebs.
Aktuelle Befehle und Freigabeschritte: [Prüfstrategie](testing.md) und [Betrieb](deployment.md).

## Deployment-Diagnose vom 12. Oktober 2026

Der [main-Lauf 38244430190](https://github.com/bsi-community/Stand-der-Technik-Viewer/actions/runs/38244430190)
für `fc4e960` scheiterte trotz zuvor grüner PR-Prüfungen: 233 Browserfälle bestanden,
der Firefox-Fall zur responsiven Hierarchietabelle scheiterte an der einmaligen
Breitenmessung unmittelbar nach dem Fenstergrößenwechsel, auch im Wiederholungsversuch.
Der `deploy`-Job wurde deshalb übersprungen. Beim Diagnoseabruf blieb die frühere
Pages-Veröffentlichung aktiv; dies war kein Browsercache-Problem.

Die Messung wurde im Folgebranch auf eine gemeinsame Abfrage des aktuellen DOM
mit begrenztem Warten auf den erwarteten Layoutzustand umgestellt. Anforderungen
an Lesbarkeit, Tabellenüberlauf und Seitenbreite sowie die Veröffentlichungssperre
bei Fehlern bleiben erhalten. Lokal bestanden nach der Korrektur Lint, vollständige Formatprüfung und 36 gezielte
Browserprüfungen (die vier Fälle aus `kern-polish.spec.js`, jeweils dreimal in
Chromium, Firefox und WebKit, mit zwei Workern und ohne Wiederholungsversuche bei
Fehlern). Der Ubuntu-CI-Nachweis für die Korrektur steht bis zum Push aus. Nach
dem zwischenzeitlichen Merge von PR #15 liegt sie separat auf
`codex/viewer-hierarchy-check`, ausgehend von `main` (`51288b4`).

## Historie: Architekturumbau

## Ergänzung vom 08.10.2026: automatische Aktualisierung beim Öffnen

Der Live-Abruf der Pages-Startseite bestätigte `Cache-Control: max-age=600`. Das Firefox-Lesezeichen verweist auf die Root-Adresse; diese und die Mapping-Adresse mit Query-String werden getrennt gecacht. Ein Neuladen der Mapping-Adresse aktualisiert daher nicht zwingend den Cache des Lesezeichens.

Eine vor den Asset-Imports eingebettete Startprüfung vergleicht die Build-Kennung mit einer nicht gecachten Release-Datei und navigiert bei Abweichung einmalig auf eine versionsspezifische URL. Der reguläre Anwendungsstart wartet darauf. Laufende Sitzungen werden nicht erneut geprüft oder neu geladen.

Lokal mit Node.js 24.19.0 bestanden: ESLint, vollständige Prettier-Prüfung, TypeScript-Modellverträge, 42 Unit-/Architektur-/CSS-Tests, Produktionsbuild samt Release-/Assetprüfung, 84 Browserprüfungen und alle zehn vollständigen visuellen Vergleiche. Die visuelle Referenz wurde nicht verändert. Die 30 zusätzlichen Browserprüfungen decken zehn Update-Szenarien in Chromium, Firefox und WebKit ab; darunter ein echter HTTP-Cache mit zehn Minuten Gültigkeit und ein Versionswechsel zwischen zwei Besuchen ohne manuelles Neuladen. Auch entfernte alte Assets, Schleifenschutz, Versionsabruf-Ausfälle und der Erhalt lokaler Mapping-Dateien sind geprüft.

## Ergänzung vom 08.10.2026: Katalogreferenzen in der Mappingansicht

Die vorhandene Source-/Target-Kopfzeile zeigt nun Ressourcenreferenzen und Ladehinweise auch ohne geladene Kataloge. Back-Matter-Titel und -Verweise sowie optionale Versions-Properties werden ausgewertet. Die Version des geladenen Katalogs bleibt ausdrücklich von Angaben im Mapping getrennt; keine Änderung an der bestehenden Katalog-/Control-Zuordnung und keine automatische Nachladung.

Geprüft mit Node.js 24.19.0: ESLint, vollständige Prettier-Prüfung, TypeScript-Modellverträge, 42 Unit-/Architektur-/CSS-Tests, Produktionsbuild und Assetprüfung sowie 54 Browserprüfungen (18 Abläufe in Chromium, Firefox und WebKit) erfolgreich. Die zusätzlichen Abläufe prüfen insbesondere Mapping-only, Laden/Entfernen, mehrere Ressourcen, Filter, Versionen, Back Matter, nicht vertrauenswürdige Inhalte und lange Referenzen auf schmalen Ansichten.

Die ersten CI-Läufe von PR #11 scheiterten ausschließlich an `test:baseline`: Die neue Mapping-Kopfzeile wurde noch mit der alten Oberfläche verglichen. Die frühere Einordnung dieser Abweichung als bloß erwartetes Ergebnis war für den verpflichtenden CI-Check falsch. Die Referenzstrategie wurde deshalb angepasst: unabhängiger Referenzbuild aus einer festen, in `main` enthaltenen Revision plus eingefrorenem Mapping-Patch. Der Workflow und seine Pflichtprüfungen bleiben aktiv; kein Screenshotbereich wird ausgespart.

Die neue Prüfung besteht für alle zehn vollständigen Ansichten einschließlich „Mapping ohne Kataloge“. Eine absichtlich rot eingefärbte Katalogüberschrift im temporären Testbuild wird in beiden Mapping-Zuständen als Fehler erkannt; nach Wiederherstellung bestehen alle zehn Vergleiche erneut. Der CSS-Test schützt weiterhin alle ursprünglichen Stylesheets mit dem ursprünglichen Hash; die neue Gestaltung liegt ausschließlich im ergänzenden `mapping-resource.css`. Die nachfolgenden Angaben dokumentieren unverändert die frühere Abnahme vom 05.10.2026.

Stand: 05.10.2026 · Zielversion: 3.0.0 · Branch: `restructure-viewer`

## Ausgangspunkt und Umfang

Umbau des geklonten Repositorys auf Grundlage von Commit `36c1dc82243360c0f2e8578fc641af2ab80b5a98`. Der Desktop-Viewer wurde nicht verändert. Die bisherige Standalone-Doppeldatei wurde durch ein HTML-Grundgerüst, fachliche JavaScript-Module und geordnete Stylesheets ersetzt. D3 7.8.5 bleibt die Diagrammbibliothek. Die alte benannte HTML-URL bleibt per Weiterleitung erhalten. Alte Dateien und das ursprüngliche Logo bleiben über die Git-Historie wiederherstellbar.

Keine neuen SSP-/Assessment-Ansichten und kein optischer Neuaufbau. Einzige gezielte Bedienverbesserung: Escape, Fokusbegrenzung und Fokusrückgabe im JSON-Dialog. Version 3.0.0 dokumentiert die geänderte Build-/Bereitstellungsform ohne separate Offline-Ausgabe.

## Lokale Ergebnisse

Geprüft unter macOS mit Node.js 24.19.0, Vite 8.3.2 und Playwright 1.63.0:

| Prüfung                                       | Ergebnis                                                       |
| --------------------------------------------- | -------------------------------------------------------------- |
| Frische Installation mit `npm ci`             | Erfolgreich; Lockfile verwendbar                               |
| Abhängigkeitsaudit bei Installation           | 0 bekannte gemeldete Schwachstellen zum Prüfzeitpunkt          |
| ESLint                                        | Erfolgreich                                                    |
| Prettier-Prüfung                              | Erfolgreich                                                    |
| TypeScript-Modellverträge                     | Erfolgreich; bewusst keine vollständige JS-Typabdeckung        |
| Unit-/Architektur-/CSS-Tests                  | 34 erfolgreich                                                 |
| End-to-End                                    | 15 Abläufe × Chromium/Firefox/WebKit = 45 erfolgreich          |
| Produktionsbuild und Asset-/Pages-Pfadprüfung | Erfolgreich                                                    |
| Vergleich mit Ausgangsstand                   | 9 von 9 Screenshots identisch, Versionsschriftzug normalisiert |
| Git-Whitespace-Prüfung                        | Erfolgreich                                                    |

Der CSS-Test vergleicht zusätzlich die vollständige Folge der ursprünglichen Regeln und Deklarationen nach kanonischer Formatierung; Kommentare und reine Formatunterschiede sind ausgenommen. Der Architekturtest prüft Modulzyklen, Domain-Abhängigkeitsgrenzen und die vollständige Verdrahtung der Anwendungsrückrufe.

Die Browserabläufe umfassen: Start/Navigation, alte Einstiegs-URL, Kataloge mit Unteranforderungen, Suche/Reset und kombinierte Gruppenfilter, Komponenten/Capabilities, alle drei Diagrammtypen je Fachbereich, Mapping-Anmerkungen/Lücken, URL-Deep-Links, Fehlerbehandlung, JSON-Dialog mit nicht vertrauenswürdigem Inhalt, mehrere Quellen, Zielobjekthierarchie, schmale Ansicht, Druckvorbereitung/-bereinigung, geladene/fehlende Komponentenimporte, Repository-Suche mit Metadaten, API-Ausfall und Komponenten-Katalog-Cross-Navigation. Nicht abgefangene Browser-Laufzeitfehler führen zum Testfehler.

## Öffentliche Realdokumente

Zusätzlich wurde derselbe lokale Produktionsbuild mit diesen öffentlich verfügbaren BSI-Dokumenten geprüft. Datenrevision: `a12831136f4122a4c43854622180a24f2576a41e` im Repository `BSI-Bund/Stand-der-Technik-Bibliothek`.

| Dokument                              | Umfang          | Ergebnis                                          |
| ------------------------------------- | --------------- | ------------------------------------------------- |
| Anwenderkatalog Grundschutz++         | 5.400.938 Bytes | Laden, Fachansicht und Balkendiagramm erfolgreich |
| Entwurf Keycloak Component Definition | 54.724 Bytes    | Laden, Fachansicht und Balkendiagramm erfolgreich |
| ITGS-to-GS++ Mapping Collection       | 2.775.310 Bytes | Laden, Fachansicht und Balkendiagramm erfolgreich |

Keine dieser Dateien wurde in das Repository kopiert. `npm run test:live` kann diese zusätzliche Online-Prüfung wiederholen; dabei wird die dann aktuelle öffentliche Datenrevision im lokalen Ergebnis protokolliert. Reguläre CI-Tests verwenden ausschließlich kleine synthetische Fixtures und definierte Netzwerkantworten.

## Verbleibende Freigabeschritte und Grenzen

- Kein Commit, Push, Merge oder Deployment wurde im Rahmen der lokalen Umsetzung vorgenommen. Der veröffentlichte Viewer wurde nicht ersetzt.
- Der neue GitHub-Actions-Workflow wurde lokal vorbereitet, aber noch nicht auf GitHub ausgeführt. Organisationsrechte, Environment-Regeln und die Pages-Einstellung können erst dort abschließend bestätigt werden.
- Vor dem ersten Merge muss Pages wie in [deployment.md](deployment.md) beschrieben auf **GitHub Actions** umgestellt werden. Anschließend ist eine Live-Abnahme erforderlich.
- Der automatisierte Drucktest ersetzt `window.print` und prüft Layoutvorbereitung sowie Wiederherstellung; den nativen Druckdialog und den resultierenden PDF-Ausdruck bitte bei der fachlichen Abnahme einmal tatsächlich benutzen.
- Keine vollständige OSCAL-Schemavalidierung, WCAG-Zertifizierung oder unabhängige Sicherheitsprüfung. Die Prüfungen sind konkrete Regressionsevidenz, keine Garantie für jede mögliche Eingabedatei, Browsererweiterung oder zukünftige externe Störung.
- Der visuelle Vergleich betrifft die neun beschriebenen Zustände. Dynamische Force-Graphen sind funktional geprüft, aber nicht pixelgenau verglichen.

## Wiederholung

```sh
npm ci
npx playwright install
npm run check
npm run test:baseline
npm run test:live
git diff --check
```

Browserberichte liegen in `playwright-report/`, Screenshots und Live-Diagnosen in `test-results/`. Beide Verzeichnisse sind absichtlich von Git ausgeschlossen. Zum lokalen manuellen Test: `npm run preview` und `http://127.0.0.1:4173/Stand-der-Technik-Viewer/` öffnen.
