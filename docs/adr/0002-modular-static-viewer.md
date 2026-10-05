# ADR 0002: Modularer statischer Viewer

- Status: Akzeptiert für den lokalen Umbau; Live-Freigabe separat
- Datum: 2026-10-05

## Kontext

Mehr als 12.000 Zeilen HTML, CSS und JavaScript in einer Datei erschweren Navigation, Review und gezielte Regressionstests. Der Viewer soll dennoch gleich aussehen und ohne Backend auf GitHub Pages laufen. Eine Offline-Ausgabe wird nicht mehr benötigt; SSP und Assessment Layer sind spätere Erweiterungen.

## Entscheidung

Native ES-Module, fachliche Ansichtsordner, unabhängige Datenparser, explizite Zustandscontainer und ein zentraler Startpunkt. Bestehendes DOM-Rendering und D3 7.8.5 bleiben erhalten. Vite erzeugt ein statisches `dist/`-Artefakt. GitHub Actions prüft Branches/PRs und veröffentlicht nur erfolgreiche `main`-Builds. ESLint, Prettier, Vitest, Playwright und erste strikte Modellverträge sichern Änderungen ab.

CSS wird zunächst ohne Änderung der Kaskade aufgeteilt. Die alte HTML-URL bleibt als Weiterleitung erhalten. Die Bedienungsanleitung wird vom Entwickler-Einstieg getrennt. Kein Frameworkwechsel, kein automatisches Veröffentlichen von Testbranches und keine neuen OSCAL-Ansichten in dieser Migration.

## Abgewogene Alternativen

- Nur drei große Dateien (HTML/CSS/JS): geringes Umbaurisiko, aber weiterhin schwer wartbare monolithische Anwendungslogik.
- Vollständige Neuentwicklung in React/Vue: möglich, aber für unveränderte Bedienung zusätzliche Abhängigkeiten, Umschreibarbeit und Regressionen ohne unmittelbaren fachlichen Nutzen.
- Vollständige TypeScript-Umschreibung auf einmal: bessere flächige Typabdeckung als Ziel, aber nicht notwendig für den ersten verhaltensbewahrenden Architekturumbau. Schrittweise explizite Modellverträge bevorzugt.

## Konsequenzen

Ein Node-Buildschritt wird für Entwicklung und Veröffentlichung erforderlich. Pages bleibt rein statisch. Die Pages-Quelle muss einmalig auf GitHub Actions umgestellt werden. Bestehende imperative Zustandszugriffe und einige größere Renderer bleiben sichtbar dokumentierte Migrationsgrenzen; künftig können sie mit Tests weiter verfeinert werden.
