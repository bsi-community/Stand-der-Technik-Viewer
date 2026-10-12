# Arbeitsregeln für den Stand der Technik-Viewer

- KERN UX ist die verbindliche Grundlage der Oberfläche und künftiger UI-Änderungen.
  Vorhandene native KERN-Bausteine und Viewer-Kompositionen weiterverwenden.
- Vor Änderungen Branch und Arbeitsstand prüfen. Neue Aufgaben nach einem Merge
  auf einem neuen Feature-Branch vom aktuellen `main` beginnen; beim Anlegen von
  `origin/main` mit `--no-track` keine versehentliche Push-Zuordnung zu `main` übernehmen.
  Bestehende Änderungen erhalten. Veröffentlichung und Merge führt der Nutzer aus,
  sofern er dies nicht ausdrücklich anders beauftragt.
- Dokumentation ist Teil jeder Änderung: die Zuordnung in `CONTRIBUTING.md` prüfen,
  betroffene Anleitungen und `CHANGELOG.md` im selben PR aktualisieren. KERN-Stand
  und offene Abnahmen in `docs/kern-migration.md` mitführen.
- Aktuelle Anleitungen dürfen keine überholten Testbranch-/Release-Aussagen enthalten.
  Historische Prüfberichte datiert erhalten und vom aktuellen Stand unterscheiden.
  Keine nicht durchgeführten Tests, Screenreader-Abnahmen oder Zertifizierungen behaupten.
- `dist/` enthält Entwicklung und Vergleiche; nur `dist-release/` wird veröffentlicht.
  BundesSans ist noch nicht produktiv integriert. Fira Sans bleibt die Ersatzschrift,
  bis geeignete, zur Web-Auslieferung freigegebene Fonts vorliegen.
- `CONTRIBUTING.md`, `docs/testing.md` und `docs/deployment.md` beachten. Prüfungen
  passend zur Änderung ausführen und Ergebnisse samt Grenzen nennen.
