# Stand der Technik-Viewer

Browseranwendung für OSCAL Catalogs, Component Definitions und Mapping Collections der Stand der Technik-Bibliothek. Alle Dokumente werden clientseitig verarbeitet; ein Backend ist nicht erforderlich.

**[Veröffentlichten Viewer öffnen](https://bsi-community.github.io/Stand-der-Technik-Viewer/)** · [Bedienungsanleitung](docs/user-guide.md)

## Lokal entwickeln und testen

Voraussetzung: Node.js 24 LTS mit npm (siehe `.nvmrc`).

```sh
npm ci
npx playwright install
npm run dev
```

Entwicklungsadresse: `http://127.0.0.1:5173/Stand-der-Technik-Viewer/`.

```sh
npm run check
npm run preview
```

`check` prüft Linting, Formatierung, die typisierten Modellverträge, Unit-/Architekturtests, den Produktionsbuild und Browserabläufe in Chromium, Firefox und WebKit. `preview` stellt anschließend genau den gebauten Inhalt aus `dist/` bereit: `http://127.0.0.1:4173/Stand-der-Technik-Viewer/`.

Zum direkten optischen Vergleich mit dem Ausgangsstand des Umbaus: `npm run test:baseline` nach dem Build. Dafür muss die Git-Historie vorhanden sein. Ergebnisse liegen in `test-results/baseline/`. Dieser Vergleich lädt keine echten Nutzerdokumente.

Eine lokale Änderung oder ein lokaler Test veröffentlicht nichts. **Die HTML-Datei nicht per Doppelklick öffnen:** Die Entwicklung verwendet ES-Module und einen lokalen HTTP-Server; eine separate Offline-Ausgabe wird nicht mehr gepflegt.

## Repository-Aufbau

```text
src/
  app/             Start, Zustand, Laden, Navigation, Druck und Koordination
  domain/          Datenmodelle, Katalog-/Mappingparser, Eigenschaften und Parameter
  features/        Kataloge, Komponenten, Mappings, Startseite und Visualisierungen
  infrastructure/  GitHub-Repository und Zielobjekt-CSV
  shared/          Wiederverwendbare Text-, DOM- und UI-Hilfen
  styles/          CSS in bewusst beibehaltener Kaskadenreihenfolge
public/            Statische Ressourcen und Weiterleitung der bisherigen HTML-URL
tests/             Synthetische Testdaten, Unit-, Architektur- und Browsertests
scripts/           Reproduzierbarer visueller Vergleich mit dem Ausgangsstand
docs/              Bedienung, Architektur, Betrieb und Entscheidungen
.github/           Prüfung, Pages-Veröffentlichung und Dependency-Updates
index.html         Gemeinsames HTML-Grundgerüst; keine Anwendungslogik
VERSION            Einzige Quelle der sichtbaren Viewer-Version
```

Gebaut wird mit Vite. D3 wird als fest versionierte Abhängigkeit mitgeliefert, nicht zur Laufzeit von einem CDN geladen. `dist/` und `node_modules/` gehören nicht in Git.

## Veröffentlichung

GitHub Pages kann den Viewer weiterhin als statische Website betreiben. Der Workflow prüft Änderungen auf Branches und Pull Requests; **nur `main` darf nach erfolgreichen Prüfungen deployen**. Ein Push auf `restructure-viewer` veröffentlicht den Viewer nicht über diesen Workflow.

Für die einmalige Umstellung muss unter **Settings → Pages → Build and deployment → Source** die Option **GitHub Actions** gewählt werden. Die Reihenfolge und Rückfallstrategie sind in [Betrieb und Veröffentlichung](docs/deployment.md) beschrieben. Nicht einfach die Quell-HTML über eine branchbasierte Pages-Veröffentlichung ausliefern: Ausgeliefert wird ausschließlich das geprüfte `dist/`-Artefakt.

## Weiterentwicklung

- [Architektur und Erweiterungspunkte](docs/architecture.md)
- [Beitragen und Qualitätsregeln](CONTRIBUTING.md)
- [Prüfstrategie und Abnahme](docs/testing.md)
- [Änderungshistorie](CHANGELOG.md)
- [Sicherheit und Datenschutz](SECURITY.md)

SSP und Assessment Layer sind noch nicht implementiert. Sie lassen sich als weitere fachliche Bereiche ergänzen, ohne wieder eine einzige große HTML-Datei aufzubauen.

## Lizenz

Die bestehende Projektlizenz bleibt unverändert: [CC BY-SA 4.0](LICENSE). Abhängigkeiten besitzen eigene Lizenzen, siehe [Drittanbieterhinweise](THIRD_PARTY_NOTICES.md).
