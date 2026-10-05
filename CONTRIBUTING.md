# Mitwirken

## Arbeitsweise

Änderungen in einem eigenen Branch und in fachlich überschaubaren Schritten vornehmen. Unabhängige Neufunktionen nicht mit einer Strukturmigration vermischen. Für den aktuellen Umbau bleibt das bestehende Verhalten die Referenz; SSP und Assessment Layer gehören in spätere Änderungen.

Node.js 24 und `npm ci` verwenden. `package-lock.json` wird mit eingecheckt. Keine global installierten Buildwerkzeuge voraussetzen. Abhängigkeiten bewusst aktualisieren und die Tests erneut ausführen; Versionsänderungen nicht unbemerkt in einem Formatierungscommit verstecken.

## Vor jedem Pull Request

```sh
npm run format
npm run check
npm run test:baseline
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

Der Pull Request beschreibt Motivation, fachliche Änderungen, Prüfergebnisse und verbleibende Einschränkungen. Änderungen an Berechtigungen, externen Requests, Rendering untrusted JSON/Markup und dem Pages-Workflow besonders prüfen. Vor dem ersten Merge die [Pages-Migration](docs/deployment.md) durchführen.

Empfohlene Repository-Einstellung: `main` durch Pull Requests und den erfolgreichen Job `verify` schützen; bei mehreren Betreuenden zusätzlich mindestens ein Review verlangen. Diese Einstellungen werden nicht durch lokale Dateien automatisch aktiviert.
