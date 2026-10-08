# Betrieb und GitHub Pages

## Lokal prüfen, ohne die Veröffentlichung zu verändern

```sh
git branch --show-current
npm ci
npx playwright install
npm run check
npm run test:baseline
npm run preview
```

Auf dem Umbau-Branch muss `restructure-viewer` erscheinen. Vorschau: `http://127.0.0.1:4173/Stand-der-Technik-Viewer/`. Das ist derselbe Produktionsbuild und derselbe URL-Unterpfad wie bei Pages. Für die Entwicklung zusätzlich `npm run dev` verwenden. `dist/` nicht von Hand bearbeiten.

## Erstmalige Umstellung

1. Änderungen auf `restructure-viewer` prüfen, committen und auf diesen Branch pushen. Vorher in **Settings → Pages** verifizieren, dass nicht dieser Testbranch als bisherige Veröffentlichungsquelle eingerichtet ist. Einen Pull Request nach `main` öffnen; erfolgreiche CI und fachliche Abnahme abwarten.
2. Den aktuellen produktiven Commit bzw. die letzte erfolgreiche Pages-Veröffentlichung notieren. Der Ausgangsstand dieser Migration ist `36c1dc82243360c0f2e8578fc641af2ab80b5a98`.
3. **Vor dem Merge** unter **Settings → Pages → Build and deployment → Source** von der bisherigen branchbasierten Veröffentlichung auf **GitHub Actions** umstellen. Auch die Environment-Regeln für `github-pages` müssen Deployments von `main` zulassen. Die existierende Website bleibt bis zum nächsten erfolgreichen Deployment der zuletzt veröffentlichte Stand; bei organisatorisch besonders kritischer Verfügbarkeit zuerst in einem separaten Testrepository proben.
4. Den geprüften Pull Request nach `main` mergen. Der Workflow prüft erneut, baut und veröffentlicht ausschließlich `dist/`. Er benötigt keine gespeicherten persönlichen Tokens; die Pages-Berechtigungen werden nur dem Deployment-Job gewährt.
5. Nach erfolgreichem Deployment die Live-URL, das Logo, die sichtbare Version, einen Katalog, eine Komponentendefinition, ein Mapping und einen Deep Link im Browser prüfen. Erst damit ist die Live-Abnahme abgeschlossen.

Ein Merge vor der Pages-Umstellung kann dazu führen, dass Quellcode statt des gebauten Artefakts veröffentlicht wird. Diese Reihenfolge ist daher Teil des Releases, nicht bloß eine optionale Einstellung.

## Workflow

`verify-and-deploy.yml` läuft auf Pull Requests, Branch-Pushes und manuell. Prüfungen benötigen nur Lesezugriff auf das Repository. Bei Fehlern scheitert der Workflow vor der Veröffentlichung. Browserberichte werden als Diagnoseartefakt gesichert. Der Pages-Upload enthält ausschließlich `dist/`; Testdaten, Dokumentationen, Quelldateien und `node_modules/` werden nicht mit veröffentlicht.

Nur ein Push oder manueller Workflowlauf auf `main` kann deployen. Pull Requests und `restructure-viewer` erhalten **keine eigene öffentlich erreichbare Pages-Vorschau** und überschreiben die Produktion durch diesen Workflow nicht. Lokal lässt sich trotzdem der vollständige Build testen. Soll später eine öffentliche Staging-Website entstehen, benötigt sie eine getrennte Hostingquelle.

Der Basis-Pfad ist in `vite.config.js` auf `/Stand-der-Technik-Viewer/` festgelegt. Bei Repository-Umbenennung, Organisationswechsel oder eigener Domain Pfad, Testadressen, Links und Deployment-Dokumentation gemeinsam anpassen.

## Aktualisierung bei Lesezeichen-Aufrufen

GitHub Pages liefert HTML mit `Cache-Control: max-age=600`. Ein normaler Aufruf kann deshalb bis zu zehn Minuten alte Startseiten verwenden; verschiedene Query-Strings besitzen getrennte Cache-Einträge. Die gehashten JS-/CSS-Dateinamen allein lösen dies nicht, weil eine alte Startseite weiterhin die alten Dateien referenziert.

Der Build veröffentlicht deshalb `release.json` mit einer aus dem Build-Inhalt erzeugten Kennung. Ein kleines Inline-Skript in der Startseite prüft diese Kennung vor dem Anwendungsstart per `fetch` mit `cache: 'no-store'` und einer eindeutigen Anfrage-URL. Bei einer neuen Veröffentlichung öffnet es dieselbe Adresse einmalig mit einem Release-Parameter und entfernt diesen anschließend aus der sichtbaren URL. Bestehende Parameter und Fragmente bleiben erhalten. Das Skript läuft unabhängig von den gehashten Modulen, damit auch eine alte Startseite mit inzwischen entfernten Assets aktualisiert werden kann. Die Kennung ändert sich auch ohne Änderung von `VERSION`.

Es gibt keine Hintergrund-Neuladung während der Arbeit: Lokal geladene Dokumente bleiben erhalten. Ein fehlgeschlagener oder nach drei Sekunden abgebrochener Versionsabruf verhindert den Start nicht. Ein Wiederholungsschutz verhindert Schleifen bei kurzzeitig unterschiedlichen CDN-Ständen. Der Schutz wirkt ab der ersten geladenen Veröffentlichung, die ihn enthält; bereits vorher zwischengespeicherte Startseiten erhalten ihn nach Ablauf ihrer Cache-Gültigkeit. Die Cache-Header von GitHub Pages werden dadurch nicht verändert.

## Rückfall und Störungen

- Vor dem Merge: Branch nicht mergen; die bestehende Veröffentlichung bleibt unberührt.
- Nach der Umstellung: Ein fehlgeschlagener Prüf-/Buildjob veröffentlicht nichts Neues. Den fehlgeschlagenen Schritt und das Browserartefakt prüfen.
- Nach einem fehlerhaften modularen Release: Den fehlerhaften Merge mit einem nachvollziehbaren Revert rückgängig machen oder einen bekannten guten modularen Stand erneut deployen. Keine History-Rewrites auf `main`.
- Rückkehr zum alten Ein-Datei-Stand: Den alten Stand in einem ausdrücklich geplanten Revert wiederherstellen und die frühere branchbasierte Pages-Quelle wieder aktivieren. Der alte Commit besitzt den neuen Buildworkflow nicht; nur ein Workflow-Rerun ist deshalb keine ausreichende Rückfallanleitung. Die neue Anwendung und die alte Veröffentlichungsart nicht mischen.

GitHub Pages/Actions, GitHub API, Raw-Dateien und verlinkte externe Ressourcen besitzen eigene Verfügbarkeitsgrenzen. Bei Repository-API-Ausfall bleiben lokale JSON-Dateien verwendbar. CORS-Probleme fremder Dokumentserver kann der statische Viewer nicht serverseitig umgehen. Keine Secrets in Frontend-Konfiguration oder `VITE_*`-Variablen ablegen: Frontend-Buildwerte sind öffentlich.
