# ADR 0003: KERN UX als dauerhafte Oberflächengrundlage

- Status: Akzeptiert und auf `main` umgesetzt (PR #13 und #14)
- Dokumentiert: 2026-10-12

## Entscheidung

Der Viewer wird auf Basis von `@kern-ux/native` und eigenen fachlichen
Kompositionen weiterentwickelt. Die gemeinsame OSCAL-Fachlogik bleibt unabhängig
vom Design. KERN ist der normale Einstieg; Legacy dient nur Entwicklungsvergleichen.

Der Release-Build `dist-release/` entfernt Legacy-CSS, Vergleichsleiste und
synthetische Demo-Module. Nur dieses Artefakt wird nach erfolgreichen Prüfungen
von `main` über GitHub Pages veröffentlicht. `dist/` bleibt der Vergleichsbuild.
Damit werden die ursprünglichen UI- und Artefaktangaben aus ADR 0002 ergänzt.

Fira Sans wird lokal ausgeliefert. BundesSans erfordert geeignete Webfonts,
Freigabe zur Auslieferung, reproduzierbare Bereitstellung im Build sowie neue
Layoutprüfungen. KERN-Nutzung allein ist weder eine amtliche Kennzeichnung noch
ein Nachweis vollständiger Barrierefreiheit. Offene Abnahmen bleiben dokumentiert.

## Konsequenzen

Neue UI-Änderungen verwenden die bestehenden KERN-Bausteine und Tokens.
Bedienung, Architektur, Betrieb und Changelog werden im selben PR wie die
jeweilige Änderung gepflegt. Historische Prüfberichte bleiben datiert erhalten;
neue Ergebnisse und Abweichungen werden ausdrücklich ergänzt.

Siehe [Architektur](../architecture.md), [Betrieb](../deployment.md),
[KERN-Stand](../kern-migration.md) und [Beitragsregeln](../../CONTRIBUTING.md).
