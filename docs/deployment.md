# Betrieb und GitHub Pages

## Lokal prüfen, ohne die Veröffentlichung zu verändern

```sh
git branch --show-current
npm ci
npx playwright install
npm run check
npm run test:baseline
npm run build:release
npm run test:release
npm run preview -- --outDir dist-release
```

Auf einem eigenen Feature-Branch arbeiten; `main` nicht für ungeprüfte Änderungen verwenden. Vorschau: `http://127.0.0.1:4173/Stand-der-Technik-Viewer/`. Das ist derselbe Produktionsbuild und derselbe URL-Unterpfad wie bei Pages. Für die Entwicklung zusätzlich `npm run dev` verwenden. `dist/` und `dist-release/` nicht von Hand bearbeiten. `dist/` enthält die Entwicklungsversion mit historischen Vergleichsszenarien; ausschließlich `dist-release/` ist zur Veröffentlichung vorgesehen.

## Veröffentlichung des aktuellen Viewers

Die KERN-Umstellung ist auf `main` übernommen. Pages verwendet **GitHub Actions**;
eine erneute Umstellung der Veröffentlichungsquelle ist nicht erforderlich.

1. Änderungen und zugehörige Dokumentation auf einem Feature-Branch committen
   und pushen. Ein offener PR dieses Branches nimmt weitere Commits automatisch auf.
2. Im PR die erfolgreichen Prüfungen des neuesten Commits und die für die Änderung
   nötige fachliche Abnahme abwarten. Der Workflow läuft für Push und Pull Request,
   weshalb zwei `verify`-Einträge erscheinen können. Weitere Pushes ersetzen ältere
   Prüfläufe. Abhängig von Installation und Browsertests dauern die Läufe mehrere Minuten.
3. Den PR nach `main` mergen. Danach läuft die Prüfung auf `main` erneut; erst bei
   Erfolg wird `dist-release/` paketiert und nach Pages veröffentlicht. Der Merge
   allein bedeutet noch nicht, dass die neue Version bereits live ist.
4. Den erfolgreichen `deploy`-Job abwarten. Anschließend Live-URL, Seitentitel/Logo
   und die betroffenen Benutzerabläufe prüfen. Die letzte erfolgreiche
   Veröffentlichung bleibt bei einem fehlgeschlagenen neuen Lauf bestehen.

Für ein neu eingerichtetes Repository muss unter **Settings → Pages → Build and
deployment → Source** die Option **GitHub Actions** gewählt sein; die Environment-
Regeln für `github-pages` müssen Deployments von `main` erlauben. Der Workflow
benötigt keine persönlichen Tokens. Pages-Berechtigungen erhält nur der Deploy-Job.

## Workflow

`verify-and-deploy.yml` läuft auf Pull Requests, Branch-Pushes und manuell. Prüfungen benötigen nur Lesezugriff auf das Repository. Bei Fehlern scheitert der Workflow vor der Veröffentlichung. Browserberichte werden als Diagnoseartefakt gesichert. Der Pages-Upload enthält ausschließlich `dist-release/`; Testdaten, Dokumentationen, Quelldateien und `node_modules/` werden nicht mit veröffentlicht.

Nur ein Push oder manueller Workflowlauf auf `main` kann deployen. Pull Requests und Feature-Branches erhalten **keine eigene öffentlich erreichbare Pages-Vorschau** und überschreiben die Produktion durch diesen Workflow nicht. Lokal lässt sich trotzdem der vollständige Build testen. Soll später eine öffentliche Staging-Website entstehen, benötigt sie eine getrennte Hostingquelle.

Der Basis-Pfad ist in `vite.config.js` auf `/Stand-der-Technik-Viewer/` festgelegt. Bei Repository-Umbenennung, Organisationswechsel oder eigener Domain Pfad, Testadressen, Links und Deployment-Dokumentation gemeinsam anpassen.

### Browserumgebung der CI

Der Job `verify` läuft im offiziellen Playwright-Container für Ubuntu Noble.
Image-Version und SHA-256-Digest sind im Workflow festgelegt; die Version muss
mit `@playwright/test`, `playwright` und `playwright-core` im Lockfile übereinstimmen.
Chromium, Firefox, WebKit und ihre Linux-Systembibliotheken sind vorinstalliert.
`npm ci` installiert weiterhin die festgelegten Projektpakete; ein zusätzlicher
`playwright install --with-deps`-Schritt ist in CI nicht erforderlich.
Damit hängt die Prüfdauer nicht mehr von APT-Downloads des Ubuntu-Mirrors ab.
Das Job-Zeitlimit bleibt bei 20 Minuten; sämtliche Prüfungen bleiben verpflichtend.

Bei Playwright-Updates die passende offizielle Image-Version und ihren Digest
über die Microsoft Container Registry verifizieren und zusammen mit dem Lockfile
aktualisieren. Der Unit-Test `ci-workflow.test.js` erkennt abweichende Versionen.
Grundlage sind die [Playwright-CI-Anleitung](https://playwright.dev/docs/ci#via-containers)
und die [Container-Dokumentation](https://playwright.dev/docs/docker).
Der Container dient ausschließlich der Prüfung; Pages veröffentlicht weiterhin
nur `dist-release/`. Die oben beschriebenen lokalen Installationsschritte bleiben gültig.

## Aktualisierung bei Lesezeichen-Aufrufen

Beim dokumentierten Live-Abruf lieferte GitHub Pages HTML mit `Cache-Control: max-age=600`. Ein normaler Aufruf kann deshalb bis zu zehn Minuten alte Startseiten verwenden; verschiedene Query-Strings besitzen getrennte Cache-Einträge. Die gehashten JS-/CSS-Dateinamen allein lösen dies nicht, weil eine alte Startseite weiterhin die alten Dateien referenziert.

Der Build veröffentlicht deshalb `release.json` mit einer aus dem Build-Inhalt erzeugten Kennung. Ein kleines Inline-Skript in der Startseite prüft diese Kennung vor dem Anwendungsstart per `fetch` mit `cache: 'no-store'` und einer eindeutigen Anfrage-URL. Bei einer neuen Veröffentlichung öffnet es dieselbe Adresse einmalig mit einem Release-Parameter und entfernt diesen anschließend aus der sichtbaren URL. Bestehende Parameter und Fragmente bleiben erhalten. Das Skript läuft unabhängig von den gehashten Modulen, damit auch eine alte Startseite mit inzwischen entfernten Assets aktualisiert werden kann. Die Kennung ändert sich auch ohne Änderung von `VERSION`.

Es gibt keine Hintergrund-Neuladung während der Arbeit: Lokal geladene Dokumente bleiben erhalten. Ein fehlgeschlagener oder nach drei Sekunden abgebrochener Versionsabruf verhindert den Start nicht. Ein Wiederholungsschutz verhindert Schleifen bei kurzzeitig unterschiedlichen CDN-Ständen. Der Schutz wirkt ab der ersten geladenen Veröffentlichung, die ihn enthält; bereits vorher zwischengespeicherte Startseiten erhalten ihn nach Ablauf ihrer Cache-Gültigkeit. Die Cache-Header von GitHub Pages werden dadurch nicht verändert.

## Rückfall und Störungen

- Vor dem Merge: Branch nicht mergen; die bestehende Veröffentlichung bleibt unberührt.
- Bei einem neuen Release: Ein fehlgeschlagener Prüf-/Buildjob veröffentlicht nichts Neues. Den fehlgeschlagenen Schritt und das Browserartefakt prüfen.
- Nach einem fehlerhaften Release: Den fehlerhaften Merge mit einem nachvollziehbaren Revert rückgängig machen oder einen bekannten guten modularen Stand erneut deployen. Keine History-Rewrites auf `main`.
- Rückkehr zum alten Ein-Datei-Stand: Den alten Stand in einem ausdrücklich geplanten Revert wiederherstellen und die frühere branchbasierte Pages-Quelle wieder aktivieren. Der alte Commit besitzt den neuen Buildworkflow nicht; nur ein Workflow-Rerun ist deshalb keine ausreichende Rückfallanleitung. Die neue Anwendung und die alte Veröffentlichungsart nicht mischen.

GitHub Pages/Actions, GitHub API, Raw-Dateien und verlinkte externe Ressourcen besitzen eigene Verfügbarkeitsgrenzen. Bei Repository-API-Ausfall bleiben lokale JSON-Dateien verwendbar. CORS-Probleme fremder Dokumentserver kann der statische Viewer nicht serverseitig umgehen. Keine Secrets in Frontend-Konfiguration oder `VITE_*`-Variablen ablegen: Frontend-Buildwerte sind öffentlich.
