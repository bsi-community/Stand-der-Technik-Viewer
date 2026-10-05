# Sicherheit und Datenschutz

Der Viewer verarbeitet lokale JSON-Dateien im Browser; es gibt keinen eigenen Uploadserver und keine Telemetrie. Eine URL-Eingabe, Repositoryauswahl, Zielobjekthierarchie und externe Bilder können jedoch Netzwerkzugriffe auslösen. Dabei gelten die Datenschutz- und Verfügbarkeitsbedingungen der jeweiligen Zielserver. OSCAL-Inhalte können sicherheitsrelevante Informationen enthalten: Nur freigegebene Daten aus vertrauenswürdigen Quellen verwenden.

Der Viewer ist eine Anzeigeanwendung, kein vollständiger OSCAL-Schemavalidator. Die unterstützte Struktur wird beim Einlesen geprüft und aufbereitet; erfolgreiche Anzeige ist kein Nachweis fachlicher oder vollständiger Schema-Konformität.

## Entwicklungsregeln

- Untrusted Text vor HTML-Ausgabe escapen. Neue Markup-Funktionen benötigen Tests gegen Script-/Eventhandler-Einschleusung und unsichere URL-Schemata.
- Keine API-Schlüssel, Zugangsdaten oder vertraulichen Fixtures in Repository oder Frontend-Build aufnehmen.
- Frontend-Abhängigkeiten lokal bündeln und Versionsänderungen über Lockfile, Tests und Review absichern.
- CI für Pull Requests erhält keine Deployment-Rechte. `pull_request_target` wird nicht verwendet. Actions sind auf vollständige Commit-Hashes fixiert.
- `npm audit` regelmäßig ausführen und Hinweise bewerten. Ein fehlerfreier Auditlauf ersetzt weder Code-Review noch eine Sicherheitsprüfung.

## Meldung

Bei einem vermuteten Sicherheitsproblem möglichst eine private Meldemöglichkeit der Repository-Betreuenden bzw. GitHubs „Report a vulnerability“ verwenden, sofern sie im Repository aktiviert ist. Keine noch ausnutzbaren Details oder vertraulichen Beispieldaten in einem öffentlichen Issue veröffentlichen. Diese Datei aktiviert keine private GitHub-Meldefunktion automatisch.
