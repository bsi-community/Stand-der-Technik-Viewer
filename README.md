# Stand der Technik-Viewer

Browseranwendung für OSCAL Catalogs, Component Definitions und Mapping Collections der Stand der Technik-Bibliothek. Alle Dokumente werden clientseitig verarbeitet; ein Backend ist nicht erforderlich.

**[Veröffentlichten Viewer öffnen](https://bsi-community.github.io/Stand-der-Technik-Viewer/)** · [Bedienungsanleitung](docs/user-guide.md)

## Oberfläche auf Basis von KERN UX

KERN UX ist die Grundlage der veröffentlichten Oberfläche und der weiteren Entwicklung. Der Viewer bietet getrennte Arbeitsbereiche für Kataloge, Komponentendefinitionen und Mappings, Suche und Filter, Diagramme mit tabellarischen Alternativen sowie einen PDF-Export für Kataloge und Komponenten. Dokumente lassen sich lokal, per URL oder aus der öffentlichen Bibliothek laden.

Die Oberfläche verwendet lokal mitgelieferte **Fira Sans**. BundesSans ist vorbereitet, aber noch nicht Bestandteil der Veröffentlichung. Tastaturbedienung, semantische Strukturen und Fokusführung unterstützen die Zugänglichkeit; eine vollständige Barrierefreiheitsprüfung ist damit nicht belegt. Siehe [KERN-Stand und offene Abnahmen](docs/kern-migration.md).

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
  styles/          KERN-Oberfläche und getrennte historische Legacy-Styles
  assets/          Gebündelte SVG-Bildmarke und weitere importierte Assets
public/            Statische Ressourcen und Weiterleitung der bisherigen HTML-URL
tests/             Synthetische Testdaten, Unit-, Architektur- und Browsertests
scripts/           Reproduzierbarer visueller Vergleich mit dem Ausgangsstand
docs/              Bedienung, Architektur, Betrieb und Entscheidungen
.github/           Prüfung, Pages-Veröffentlichung und Dependency-Updates
index.html         Gemeinsames HTML-Grundgerüst; keine Anwendungslogik
VERSION            Einzige Quelle der sichtbaren Viewer-Version
```

Gebaut wird mit Vite. D3 wird als fest versionierte Abhängigkeit mitgeliefert, nicht zur Laufzeit von einem CDN geladen. `dist/`, `dist-release/` und `node_modules/` gehören nicht in Git.

## Veröffentlichung

GitHub Pages kann den Viewer weiterhin als statische Website betreiben. Der Workflow prüft Änderungen auf Branches und Pull Requests; **nur `main` darf nach erfolgreichen Prüfungen deployen**. Feature-Branches und Pull Requests veröffentlichen keine Pages-Version.

Die Pages-Veröffentlichung erfolgt über **GitHub Actions**. Nach einem Merge nach `main` prüft der Workflow erneut und veröffentlicht bei Erfolg ausschließlich das gebaute `dist-release/`-Artefakt. Der Quellcode und der Vergleichsbuild `dist/` sind keine Veröffentlichungsartefakte. Details: [Betrieb und Veröffentlichung](docs/deployment.md).

Für eine lokale Prüfung des tatsächlichen Release-Einstiegs:

```sh
npm run build:release
npm run test:release
npm run preview -- --outDir dist-release
```

Optionale synthetische Vergleichsansichten sind nur für Entwicklung und QA vorgesehen: [Lokale KERN-Entwicklung](docs/kern-preview.md).

## Weiterentwicklung

Viewer und Dokumentation werden im selben Pull Request aktualisiert. Aktuelle Anleitungen beschreiben den geltenden Stand; datierte Prüfprotokolle bleiben als historische Nachweise erkennbar. Die [PR-Checkliste](.github/pull_request_template.md) und [Beitragsregeln](CONTRIBUTING.md) halten diesen Ablauf fest.

- [Architektur und Erweiterungspunkte](docs/architecture.md)
- [Beitragen und Qualitätsregeln](CONTRIBUTING.md)
- [Prüfstrategie und Abnahme](docs/testing.md)
- [Änderungshistorie](CHANGELOG.md)
- [Sicherheit und Datenschutz](SECURITY.md)

SSP und Assessment Layer sind noch nicht implementiert. Sie lassen sich als weitere fachliche Bereiche ergänzen, ohne wieder eine einzige große HTML-Datei aufzubauen.

## Lizenz

Die bestehende Projektlizenz bleibt unverändert: [CC BY-SA 4.0](LICENSE). Abhängigkeiten besitzen eigene Lizenzen, siehe [Drittanbieterhinweise](THIRD_PARTY_NOTICES.md).
