# Sicherheit und Datenschutz

Der Viewer verarbeitet lokale JSON-Dateien im Browser; es gibt keinen eigenen Uploadserver und keine Telemetrie. Eine URL-Eingabe, Repositoryauswahl, automatisches Nachladen referenzierter öffentlicher Kataloge, Zielobjekthierarchie und externe Bilder können jedoch Netzwerkzugriffe auslösen. Beim Start wird außerdem die Build-Kennung vom eigenen Hosting-Ursprung abgerufen; während laufender Arbeit erfolgt keine automatische Neuladung. KERN, Fira Sans und D3 werden mit dem Build ausgeliefert und benötigen kein externes Font- oder Skript-CDN. Dabei gelten die Datenschutz- und Verfügbarkeitsbedingungen der jeweiligen Zielserver. OSCAL-Inhalte können sicherheitsrelevante Informationen enthalten: Nur freigegebene Daten aus vertrauenswürdigen Quellen verwenden.

Der Viewer ist eine Anzeigeanwendung, kein vollständiger OSCAL-Schemavalidator. Die unterstützte Struktur wird beim Einlesen geprüft und aufbereitet; erfolgreiche Anzeige ist kein Nachweis fachlicher oder vollständiger Schema-Konformität.

## Automatische Katalogabrufe

Auch ein lokaler Komponenten- oder Mappingimport kann passende öffentliche
Kataloge nachladen. Die Auswahl erfolgt lokal anhand des frisch geladenen
Repository-Index; der Inhalt lokaler Dateien und deren Suchkriterien werden nicht
an eine Such-API übertragen. Automatisch abgerufen werden ausschließlich im
aktuellen BSI-Repository unter `control_layer/` nachgewiesene JSON-Dateien. Vor der
Übernahme werden der Catalog-Root und die maßgebliche Identität erneut geprüft.
Ungeprüfte Fremd-URLs, Literaturverweise, Profile und importierte Component
Definitions werden nicht automatisch verfolgt. Die Repositoryabrufe verwenden
`credentials: 'omit'`, haben ein Zeitlimit und werden bei Parallelität geteilt.

## Entwicklungsregeln

- Untrusted Text vor HTML-Ausgabe escapen. Neue Markup-Funktionen benötigen Tests gegen Script-/Eventhandler-Einschleusung und unsichere URL-Schemata.
- Keine API-Schlüssel, Zugangsdaten oder vertraulichen Fixtures in Repository oder Frontend-Build aufnehmen.
- Frontend-Abhängigkeiten lokal bündeln und Versionsänderungen über Lockfile, Tests und Review absichern.
- CI für Pull Requests erhält keine Deployment-Rechte. `pull_request_target` wird nicht verwendet. Actions sind auf vollständige Commit-Hashes fixiert.
- `npm audit` regelmäßig ausführen und Hinweise bewerten. Ein fehlerfreier Auditlauf ersetzt weder Code-Review noch eine Sicherheitsprüfung.

## Meldung

Bei einem vermuteten Sicherheitsproblem möglichst eine private Meldemöglichkeit der Repository-Betreuenden bzw. GitHubs „Report a vulnerability“ verwenden, sofern sie im Repository aktiviert ist. Keine noch ausnutzbaren Details oder vertraulichen Beispieldaten in einem öffentlichen Issue veröffentlichen. Diese Datei aktiviert keine private GitHub-Meldefunktion automatisch.
