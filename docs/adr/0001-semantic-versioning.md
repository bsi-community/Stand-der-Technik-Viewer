# ADR 0001: Semantische Versionierung

- Status: Akzeptiert, Veröffentlichungsmechanik durch ADR 0002 aktualisiert
- Ursprüngliches Datum: 2026-07-29
- Aktualisierung: 2026-10-05

Der Viewer verwendet `MAJOR.MINOR.PATCH`. Rückwärtskompatible Fehlerkorrekturen erhöhen PATCH, neue Funktionen MINOR und inkompatible Änderungen MAJOR. `VERSION` bleibt die maßgebliche Versionsquelle. Änderungen werden in `CHANGELOG.md` dokumentiert.

Die frühere Vorgabe zweier byteidentischer, eigenständig ausführbarer HTML-Dateien entfällt mit der Umstellung auf einen Modulbuild. Vite setzt die sichtbare Versionsangabe aus `VERSION` in das eine HTML-Grundgerüst ein. Die bisherige benannte HTML-URL leitet zur Anwendung weiter.

Version 3.0.0 kennzeichnet die Änderung der Bereitstellung: kein direkt per `file://` gestartetes Offlinepaket mehr, sondern HTTP/HTTPS-Auslieferung des gebauten Verzeichnisses. Die bisherigen Onlinefunktionen und Deep Links sollen dadurch nicht verändert werden.
