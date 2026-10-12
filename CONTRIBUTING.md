# Mitwirken

## Arbeitsweise

Änderungen in einem eigenen Branch und in fachlich überschaubaren Schritten vornehmen. Unabhängige Neufunktionen nicht mit einer Strukturmigration vermischen. KERN UX ist die dauerhafte UI-Grundlage; fachliche OSCAL-Regeln bleiben unabhängig von der Oberfläche. SSP und Assessment Layer sind noch nicht implementiert.

Node.js 24 und `npm ci` verwenden. `package-lock.json` wird mit eingecheckt. Keine global installierten Buildwerkzeuge voraussetzen. Abhängigkeiten bewusst aktualisieren und die Tests erneut ausführen; Versionsänderungen nicht unbemerkt in einem Formatierungscommit verstecken.

## Vor jedem Pull Request

```sh
npm run format
npm run check
npm run test:baseline
npm run build:release
npm run test:release
git diff --check
```

Für den visuellen Vergleich muss die Ausgangsrevision in der Git-Historie vorhanden sein. Bewusste Designänderungen brauchen eine dokumentierte Abweichung und Anpassung der Vergleichsstrategie; Fehlermeldungen nicht durch deaktivierte Tests beseitigen.

- Neue Parser-/Such-/Filterregeln erhalten Unit-Tests mit Erfolg und Fehlerfall.
- Neue oder geänderte Benutzerabläufe erhalten Browsertests, einschließlich sinnvoller Tastatur- und schmaler Ansichten.
- Keine vertraulichen OSCAL-Dokumente als Testdaten einchecken. Kleine synthetische Fixtures bevorzugen.
- `domain` bleibt unabhängig von UI, globalem Zustand und Netzwerk. Architekturtests dürfen nicht umgangen werden.
- Bestehende Lizenzhinweise erhalten. Neue Abhängigkeiten und deren Lizenzen prüfen.
- API-/UI-/Betriebsänderungen in README, Bedienungsanleitung oder Architektur dokumentieren.
- Bei einem Release `VERSION` und `CHANGELOG.md` gemeinsam aktualisieren. Die sichtbare Version wird beim Build eingesetzt.

## Review und Veröffentlichung

Der Pull Request beschreibt Motivation, fachliche Änderungen, Prüfergebnisse und verbleibende Einschränkungen. Änderungen an Berechtigungen, externen Requests, Rendering untrusted JSON/Markup und dem Pages-Workflow besonders prüfen. Die bestehende [Pages-Veröffentlichung](docs/deployment.md) nutzt ausschließlich den Release-Build von `main`.

Empfohlene Repository-Einstellung: `main` durch Pull Requests und den erfolgreichen Job `verify` schützen; bei mehreren Betreuenden zusätzlich mindestens ein Review verlangen. Diese Einstellungen werden nicht durch lokale Dateien automatisch aktiviert.

## Dokumentation gehört zur Änderung

Bei jeder Änderung prüfen und im selben PR aktualisieren:

| Änderung                                                         | Zugehörige Dokumentation                                                                   |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Bedienung, Texte, Filter, Navigation, Import, Diagramme, Export  | `docs/user-guide.md`, bei grundlegendem Umfang auch `README.md`                            |
| KERN-Bausteine, Schrift, Zugänglichkeit und offene Abnahmen      | `docs/kern-migration.md`, `docs/kern-preview.md`, gegebenenfalls `docs/kern-acceptance.md` |
| Struktur, Datenfluss, Zuständigkeiten, technische Entscheidungen | `docs/architecture.md`, bei dauerhaften Entscheidungen ein ADR                             |
| Build, Tests, CI, Pages, Cache oder Rückfall                     | `docs/testing.md`, `docs/deployment.md`, Prüfstand in `docs/verification.md`               |
| Abhängigkeiten, Netzwerk oder Lizenzumfang                       | `SECURITY.md`, `THIRD_PARTY_NOTICES.md` und ausgelieferte Lizenzhinweise                   |
| Sichtbare Funktionen und Fehlerkorrekturen                       | `CHANGELOG.md`; beim Release außerdem `VERSION`                                            |

Beschreibungen an Implementierung, Skripten und Workflow prüfen. Keine alten
Testbranch-Namen als Voraussetzung für aktuelle Nutzung stehen lassen. Entwicklungs-
und Vergleichsbuild (`dist/`) klar vom Pages-Artefakt (`dist-release/`) trennen.
Historische Prüfzahlen und Entscheidungen nicht rückwirkend umschreiben: einen
datierten Folgestand ergänzen und die Reichweite der alten Nachweise benennen.
Offene Abnahmen nur mit tatsächlichem Nachweis als abgeschlossen markieren.

Im PR die aktualisierten Dokumente nennen oder begründen, warum eine rein interne
Änderung keine Anpassung benötigt. Markdown-Formatierung und lokale Links prüfen.
Die Checkliste unterstützt das Review; sie erzwingt keine GitHub-Branchregel.
