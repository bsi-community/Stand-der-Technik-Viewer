# Lokale KERN-Entwicklung, Vergleich und Schriftintegration

## Start und Vergleich

KERN UX ist die veröffentlichte Oberfläche. Diese Anleitung beschreibt die lokale
Entwicklung und zusätzliche QA-Vergleiche, nicht eine unveröffentlichte Viewer-Variante.
Ein bestimmter Branchname ist nicht erforderlich. Lokale Änderungen, Commits und
Feature-Branch-Pushes veröffentlichen nichts; Pages deployt geprüfte `main`-Builds.

Voraussetzung für eine frische Installation: Node.js 24 mit npm.

```sh
npm ci
npm run preview:kern
```

Auf dem eingerichteten Mac kann alternativ `KERN-Vorschau.command` im Projektordner
per Doppelklick gestartet werden. Das Terminal geöffnet lassen; mit Ctrl+C beenden.
Der Starter funktioniert unabhängig vom Branchnamen und verwendet bei Bedarf die
vorhandene Node-Laufzeit von Codex. Belegte Ports werden nicht automatisch ersetzt. Der ausgegebene Link
führt seit dem 11. Oktober 2026 zur normalen Ansicht ohne Test- und Vergleichsleiste.
Die folgenden Vergleichslinks sind ausschließlich für Entwicklung und QA gedacht.

- [Normaler Einstieg](http://127.0.0.1:5186/Stand-der-Technik-Viewer/)
- [Startseite mit Vergleichsleiste](http://127.0.0.1:5186/Stand-der-Technik-Viewer/?preview=home)
- [Geöffnete Anforderung mit Filtern](http://127.0.0.1:5186/Stand-der-Technik-Viewer/?preview=catalog)
- [Gefüllte Mapping-Tabelle](http://127.0.0.1:5186/Stand-der-Technik-Viewer/?preview=mapping)
- [Bisherige Startseite](http://127.0.0.1:5186/Stand-der-Technik-Viewer/?design=legacy)
- [Bisherige Anforderungsansicht mit denselben Daten](http://127.0.0.1:5186/Stand-der-Technik-Viewer/?design=legacy&preview=catalog)
- [Bisherige Mapping-Ansicht mit denselben Daten](http://127.0.0.1:5186/Stand-der-Technik-Viewer/?design=legacy&preview=mapping)

Die Vergleichsansichten laden fünf synthetische Anforderungen sowie fünf Zuordnungen
zwischen zwei Beispielkatalogen. Sie sind ausdrücklich keine BSI-Anforderungen und
keine fachlich geprüften Mappings. Suche, Filter, Aufklappen, Verknüpfungen und
Datensatzwechsel benutzen die reguläre Viewer-Logik. Eigene Dokumente können wie
bisher geladen werden; dafür am besten mit der leeren Startseite beginnen.
Die Beispielansichten benötigen keine externen Katalogabrufe. Die normale
Repository-Auswahl auf der Startseite benötigt weiterhin Internetzugang.

Ein lokaler HTTP-Server ist wegen der ES-Module erforderlich. `index.html` direkt
als Datei zu öffnen wird nicht unterstützt. Für einen gebauten Stand:
`npm run build` und anschließend `npm run preview` (Port 4173).

## BundesSans nachreichen

Ein geeigneter, zur Web-Auslieferung freigegebener BundesSans-Satz liegt dem
Repository nicht bei. Der veröffentlichte Viewer und die lokale Entwicklung verwenden deshalb die lokal ausgelieferte KERN-Standardschrift Fira Sans
und zeigt diesen Zustand in der optionalen Vergleichsleiste an. BundesSans ist eine bewusste typografische
Anpassung des KERN-Standards.

Ein zur Nutzung bereitgestelltes BundesSans-Webfont-Paket zunächst entpacken.
Der Importer akzeptiert WOFF2 oder WOFF in normaler Laufweite, keine OTF-Dateien
und keine Condensed-Ersatzschnitte. Benötigt wird mindestens Regular; empfohlen sind zusätzlich
Bold, Italic und Bold Italic. Danach:

```sh
python3 scripts/import-bundessans.py "/Pfad/zum/entpackten/Webfont-Paket"
```

Vorschau neu starten oder neu bauen. Nach erfolgreichem Laden wechselt die
Statusanzeige in der optionalen Vergleichsleiste auf „BundesSans Web“. Bei Ladefehlern bleibt Fira Sans aktiv und die
Anzeige nennt den Fehler. Die Schriften werden vom lokalen Server geladen, nicht
von einem CDN. `public/assets/bundessans/` einschließlich Manifest wird von Git
ignoriert. Ein lokaler Produktionsbuild enthält dort vorhandene Dateien trotzdem;
vor einer Veröffentlichung ist deren Nutzungsfreigabe zu klären. Ein lokaler Import
allein integriert die Fonts **nicht** in GitHub Actions: Ein frischer CI-Checkout
besitzt die ignorierten Dateien nicht. Die freigegebene Bereitstellung im Build
muss daher in einem eigenen Änderungsschritt eingerichtet und getestet werden.

## Technische Grundlage und Release-Abgrenzung

Eingebunden ist `@kern-ux/native` in festgelegter Version 2.8.2 mit den originalen
KERN-Tokens, Basisstilen und Fira-Sans-Dateien. Die Oberfläche verwendet KERN-Markup
für Buttons, Felder, Checkboxen/Fieldsets, Details, Anforderungsmetadaten und die
Mapping-Tabelle sowie eigene Kompositionen für fachliche Viewer-Komponenten. Fachliche Viewer-Kompositionen ergänzen native KERN-Komponenten. Daraus folgt
keine Zertifizierung der Barrierefreiheit; die echte Screenreader-Abnahme bleibt offen.

KERN und Legacy haben getrennte CSS-Einstiege. Die KERN-Layer `structure`, `kern`
und `viewer` enthalten ausschließlich eigene Viewer-Kompositionen und native
KERN-Styles. `?design=legacy` lädt im Entwicklungs-/Vergleichsbuild ausschließlich
die bisherige Gestaltung. Parser, Datenmodelle, Filter und Ladewege sind gemeinsam.

Der normale Einstieg lädt weder Vergleichsleiste noch Beispieldaten. Diese werden
nur über `?preview=home`, `?preview=catalog` oder `?preview=mapping` angefordert.
Der separate Veröffentlichungseinstieg entfernt sie bereits beim Bauen:

```sh
npm run build:release
npm run test:release
npm run preview -- --outDir dist-release
```

`dist-release/` enthält keine Legacy-Styles und keine Vergleichs-/Demodatenmodule.
Auch entsprechende URL-Parameter aktivieren dort keinen Vergleich. Der Workflow
prüft beide Builds und paketiert für die Veröffentlichung nur
`dist-release/`. Ein lokaler Build allein veröffentlicht nichts.

Die Zuständigkeiten sind getrennt:

| Bereich                                            | Einstieg                                                           |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| Tokens, Schrift, Fokus, allgemeine Elemente        | `src/styles/kern/foundation.css`                                   |
| Kopfbereich, Navigation, Seitenleiste, Übersichten | `src/styles/kern/shell.css`                                        |
| Startseite und Suche                               | `src/styles/kern/home.css` und `src/features/home/view.js`         |
| Anforderung, Inhalt und Metadaten                  | `src/styles/kern/catalog.css` und `src/features/catalog/card.js`   |
| Vergleichstabelle und Dokumentinformationen        | `src/styles/kern/mappings.css` und `src/features/mappings/view.js` |
| Schrift und Einrichtung der KERN-Ansicht           | `src/app/kern-presentation.js`                                     |
| Optionale Vergleichsleiste und Beispieldaten       | `src/app/kern-preview.js`, `src/preview/documents.js`              |

Der [Migrationsstand](kern-migration.md) dokumentiert die umgestellten Bereiche,
die Echtdaten- und Druckprüfung sowie die noch ausstehende BundesSans-Einbindung
und manuelle Abnahme mit assistiven Technologien.

Ein offizieller Bundes-Header wird nicht mitgeliefert. Nur die optionalen
Vergleichsansichten tragen eine Testleiste; die Verwendung eines Designsystems allein bestätigt
keine amtliche Herausgeberschaft.

## Prüfung

`npm run check` umfasst Lint, Formatprüfung, den dokumentierten TypeScript-Bereich,
Unit-/Architekturtests, Build und die Browserfälle in Chromium, Firefox und WebKit.
`npm run test:baseline` prüft zehn Legacy-Ansichten gegen die eingefrorene Referenz.

`npm run test:kern-visual` vergleicht zwölf KERN-Bildreferenzen für Startseite,
Import, Anforderung, Sunburst, Mapping und Komponenten bei 1440 und 375 Pixeln.
Die geprüften Referenzen liegen unter `tests/visual/references/darwin/` und gelten
für Chromium aus der festgelegten Playwright-Version auf macOS mit Fira Sans.
Andere Betriebssysteme brauchen separat geprüfte Referenzen. Die Referenzen sind datierte Sollbilder der Migration, kein automatischer Nachweis
für jeden späteren Commit. Nach sichtbaren Änderungen, einschließlich der neuen
Logo-Kopfzeile und einer späteren BundesSans-Einbindung, sind Abweichungen visuell
zu prüfen und die betroffenen Referenzen bewusst neu abzunehmen. Sie werden nicht bei
normalen Testläufen automatisch überschrieben.

`npm run test:release` prüft den zuvor gebauten Release-Einstieg in drei Browsern.
Echtdaten- und PDF-Prüfung sind im Migrationsstand reproduzierbar beschrieben.
Temporäre Browserbilder, PDF-Dateien und Berichte liegen unter `test-results/`;
nur die ausdrücklich abgenommenen KERN-Referenzbilder gehören ins Repository.

## Quellen und Lizenzen

- [KERN UX](https://www.kern-ux.de/) und [KERN-Dokumentation](https://www.kern-ux.de/komponenten/)
- [KERN Native, Quellcode](https://gitlab.opencode.de/kern-ux/kern-ux-plain)
- [Styleguide der Bundesregierung](https://styleguide.bundesregierung.de/)
- [Drittanbieterhinweise](../THIRD_PARTY_NOTICES.md), KERN EUPL-1.2 und Fira Sans OFL-1.1 in `public/assets/licenses/`

BundesSans unterliegt gesonderten Nutzungsbedingungen und wird nicht durch die
KERN- oder Projektlizenz mitlizenziert.

## Nachprüfung der Diagramme und übrigen Ansichten

Die KERN-Seitenleistenregeln gelten nur für `.wrap > aside`. Diagrammlegenden
und der Detailbereich der Zielobjekthierarchie bleiben davon unabhängig. Die
SVG-Höhe wird ausdrücklich festgelegt, da KERN Medien ansonsten mit `height: auto`
skaliert. Beim Fenstergrößenwechsel werden die sichtbaren Diagramme neu berechnet;
alte Graphsimulationen werden vor einem Neuaufbau beendet.

Der Sunburst reserviert Platz für die Legende und begrenzt radiale Beschriftungen
auf die Breite des jeweiligen Rings. Vollständige Bezeichnungen bleiben als
Tooltip und in der Legende verfügbar. Balkenachsen zeigen ausschließlich passende
Ganzzahlmarkierungen. Die Hierarchiefarben, Parameter und Verweisboxen wurden für
bessere Textkontraste angepasst. Diagrammtext verwendet dieselbe Schriftvariable
wie die Oberfläche; damit greift auch die vorbereitete BundesSans-Einbindung.

`tests/e2e/kern-visuals.spec.js` prüft alle drei Diagrammtypen für Kataloge,
Komponentendefinitionen und Mappings nach Größenwechseln bei 1920, 1280 und 800 Pixeln
Breite. Dazu gehört ein synthetischer Katalog mit 1000 Anforderungen. Geprüft werden
SVG-Grenzen, freie Legendenflächen im Sunburst, Beschriftungen, Achsenwerte und
Seitenüberlauf. Weitere Ansichten umfassen Startseite, leere Arbeitsbereiche,
aufgeklappte Anforderungen und Komponenten, Mappings, Zielobjekthierarchie und
JSON-Dialog; Bildschirmbilder werden als lokale Testartefakte gespeichert.
