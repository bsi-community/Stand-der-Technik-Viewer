# KERN-Vorschau

## Start und Vergleich

Die Vorschau läuft ausschließlich lokal auf dem Branch `restructure-viewer-KERN`.
Die vorhandene Pages-Veröffentlichung und deren Workflow sind unverändert.
Eine lokale Änderung oder ein lokaler Commit veröffentlicht nichts.

Voraussetzung für eine frische Installation: Node.js 24 mit npm.

```sh
npm ci
npm run preview:kern
```

Auf dem eingerichteten Mac kann alternativ `KERN-Vorschau.command` im Projektordner
per Doppelklick gestartet werden. Das Terminal geöffnet lassen; mit Ctrl+C beenden.
Der Starter prüft den Branch und verwendet bei Bedarf die vorhandene Node-Laufzeit
von Codex. Belegte Ports werden nicht automatisch ersetzt.

- [Startseite](http://127.0.0.1:5186/Stand-der-Technik-Viewer/)
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

Die eigentlichen BundesSans-Dateien liegen dem Repository nicht bei. Die Vorschau
verwendet deshalb zunächst die lokal ausgelieferte KERN-Standardschrift Fira Sans
und zeigt diesen Zustand oben an. BundesSans ist eine bewusste typografische
Anpassung des KERN-Standards.

Ein zur Nutzung bereitgestelltes BundesSans-Webfont-Paket zunächst entpacken.
Benötigt wird mindestens Regular als WOFF2 oder WOFF; empfohlen sind zusätzlich
Bold, Italic und Bold Italic. Danach:

```sh
python3 scripts/import-bundessans.py "/Pfad/zum/entpackten/Webfont-Paket"
```

Vorschau neu starten oder neu bauen. Nach erfolgreichem Laden wechselt die
Statusanzeige auf „BundesSans Web“. Bei Ladefehlern bleibt Fira Sans aktiv und die
Anzeige nennt den Fehler. Die Schriften werden vom lokalen Server geladen, nicht
von einem CDN. `public/assets/bundessans/` einschließlich Manifest wird von Git
ignoriert. Ein lokaler Produktionsbuild enthält dort vorhandene Dateien trotzdem;
vor einer späteren Veröffentlichung ist deren Nutzungsfreigabe zu klären.

## Technische Grundlage und weitere Umstellung

Eingebunden ist `@kern-ux/native` in festgelegter Version 2.8.2 mit den originalen
KERN-Tokens, Basisstilen und Fira-Sans-Dateien. Die Vorschau verwendet KERN-Markup
für das Suchfeld, dessen primären Button und die Mapping-Tabelle sowie eigene
Anpassungen für die fachlichen Viewer-Komponenten. Sie ist noch keine vollständig
auf native KERN-Komponenten umgestellte oder auf Barrierefreiheit zertifizierte
Anwendung.

Die bestehenden Styles liegen unverändert in `src/styles/index.css` und werden
über `legacy.css` in der CSS-Layer `legacy` geladen. Darüber liegen die Layer
`kern` und `viewer`. Mit `?design=legacy` werden die KERN-Styles und die Änderungen
an der Darstellung nicht aktiviert. Die bisherigen Parser, Datenmodelle,
Filterlogiken und Ladewege bleiben die gemeinsame Grundlage.

Die Zuständigkeiten sind getrennt:

| Bereich                                             | Einstieg                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------ |
| Tokens, Schrift, Fokus, allgemeine Elemente         | `src/styles/kern/foundation.css`                                   |
| Kopfbereich, Navigation, Seitenleiste, Übersichten  | `src/styles/kern/shell.css`                                        |
| Startseite und Suche                                | `src/styles/kern/home.css` und `src/features/home/view.js`         |
| Anforderung, Inhalt und Metadaten                   | `src/styles/kern/catalog.css` und `src/features/catalog/card.js`   |
| Vergleichstabelle und Dokumentinformationen         | `src/styles/kern/mappings.css` und `src/features/mappings/view.js` |
| Vorschauleiste, optionale Schrift und Beispieldaten | `src/app/kern-preview.js`, `src/preview/documents.js`              |

Für die weitere Umstellung können diese Module direkt erweitert werden. Als
nächste Schritte bleiben insbesondere Komponentendefinitionen, komplexe
Mehrfachfilter, Dialoge, Diagramme, Druckansichten und leere/fehlerhafte Zustände
systematisch an die passenden KERN-Muster anzupassen. Anschließend folgen eine
vertiefte Tastatur-/Screenreader-Prüfung und Tests mit repräsentativen großen
Echtdokumenten. Die Legacy-Layer sollte erst nach vollständiger Migration und
Abnahme entfallen.

Ein offizieller Bundes-Header wird nicht mitgeliefert. Die Vorschauleiste
kennzeichnet die Testversion; die Verwendung eines Designsystems allein bestätigt
keine amtliche Herausgeberschaft.

## Prüfung

`npm run check` umfasst die bestehenden Prüfungen sowie drei neue Browserfälle
für KERN in jeweils Chromium, Firefox und WebKit. Die neuen Fälle prüfen unter
anderem Beispielanforderung, Suche/Zurücksetzen, aufgelöste Mapping-Inhalte,
Sprunglink und Überlaufverhalten bei 800 Pixeln Breite.

`npm run test:baseline` vergleicht den Legacy-Modus gegen den eingefrorenen
Ausgangsstand. Nur die zusätzliche KERN-Abhängigkeit ist beim Lockfile-Vergleich
ausgenommen; sonstige Abhängigkeitsänderungen bleiben ein Fehler.
Die KERN-Gestaltung wird dabei bewusst nicht gegen das alte Erscheinungsbild
verglichen. Browserbilder liegen unter `test-results/` und gehören nicht in Git.

## Quellen und Lizenzen

- [KERN UX](https://www.kern-ux.de/) und [KERN-Dokumentation](https://www.kern-ux.de/komponenten/)
- [KERN Native, Quellcode](https://gitlab.opencode.de/kern-ux/kern-ux-plain)
- [Styleguide der Bundesregierung](https://styleguide.bundesregierung.de/)
- [Drittanbieterhinweise](../THIRD_PARTY_NOTICES.md), KERN EUPL-1.2 und Fira Sans OFL-1.1 in `public/assets/licenses/`

BundesSans unterliegt gesonderten Nutzungsbedingungen und wird nicht durch die
KERN- oder Projektlizenz mitlizenziert.
