# KERN-Abnahmeprotokoll – 10. Oktober 2026

## Ergebnis und Geltungsbereich

Die technische Inhaltsprüfung und die unten dokumentierten manuellen
Tastatur-/Accessibility-Prüfungen sind bestanden. Fünf konkrete Fehler wurden
behoben und durch vier zusätzliche Browser-Testfälle abgesichert.

**Die eigentliche manuelle Screenreader-Abnahme bleibt offen.** VoiceOver ließ
sich in den macOS-Bedienungshilfen einschalten, seine Ausgabe war über die
verfügbare Fernsteuerung aber nicht verlässlich zugänglich. Weder ein nutzbarer
Rotor noch die tatsächliche Sprachausgabe konnten beobachtet werden. Auch der
bereits eingeschaltete Beschriftungsbereich lieferte keinen auswertbaren Nachweis.
VoiceOver wurde anschließend wieder ausgeschaltet. Ein sichtbarer
Accessibility-Baum ist kein Nachweis für korrekt gesprochene Ausgaben.
NVDA und JAWS wurden nicht geprüft.

Dies ist eine technische Vorbereitung der fachlichen Gesamtabnahme, keine
stellvertretende Freigabe durch Fachverantwortliche und keine WCAG-Zertifizierung.
Geprüft wurde ausschließlich der lokale Branch `restructure-viewer-KERN` mit
Fira Sans; BundesSans liegt weiterhin nicht vor. Es wurde nichts veröffentlicht.

## Manuelle Bedienprüfung in Safari

Umgebung: macOS 26.6.2 (Build 25G83), native Safari-Anwendung. Beobachtet wurden
Tastaturfokus, sichtbarer Zustand und der von Safari bereitgestellte
Accessibility-Baum. Diese Prüfungen sind von den automatisierten Playwright-
WebKit-Läufen zu unterscheiden. Die Vergleichsansicht `?preview=catalog` enthält
synthetische Beispieldaten; sie wurde ausschließlich für Bedienprüfungen genutzt.

| Ablauf                                    | Beobachtung nach Korrektur                                                                                                                           | Ergebnis                        |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Katalogfilter lesen                       | Suche besitzt einen Namen; Gruppenfilter nennt Auswahlzahl und geöffneten/geschlossenen Zustand.                                                     | Bestanden im Accessibility-Baum |
| Alle Gruppen mit Tastatur abwählen        | Checkbox bleibt fokussiert; Liste wird leer; Fokusübersicht nennt „Gruppen/Themen: keine Auswahl“ und Status nennt „0 von 5 Anforderungen sichtbar“. | Bestanden                       |
| Alle Gruppen wieder auswählen, Escape     | Fünf Treffer wieder vorhanden; Filter schließt; Fokus liegt auf seiner Zusammenfassung.                                                              | Bestanden                       |
| JSON öffnen und Tab                       | Hintergrund fehlt im Accessibility-Baum; Fokus wechselt von „Schließen“ zum benannten Bereich „JSON-Inhalt“.                                         | Bestanden                       |
| Weiteres Tab, dann Escape                 | Tab führt zurück zu „Schließen“; Escape schließt den Dialog und fokussiert „JSON zu ORG-1 anzeigen“.                                                 | Bestanden                       |
| Darstellungstabs mit Pfeiltaste und Enter | Pfeil rechts fokussiert Graph, ohne ihn zu aktivieren; Enter aktiviert Graph und markiert ihn als ausgewählt.                                        | Bestanden                       |
| Graph-Datentabelle öffnen und durchsuchen | Benannte Tabellen „Knoten“ und „Beziehungen“, Suchfelder und Kopfzeilen erscheinen; Suche `ORG-4` lässt genau die passende Zeile übrig.              | Bestanden                       |
| Tabellenaktion mit Tastatur öffnen        | „Datensicherungen überprüfen öffnen“ führt zur geöffneten Anforderung ORG-4 und fokussiert deren Zusammenfassung.                                    | Bestanden                       |

In der Mapping-Vergleichsansicht wurde zusätzlich der Safari-Accessibility-Baum
kontrolliert: Tabellenname, gruppierte Quell-/Zielkataloge, Spaltenfolge
Prose/Titel/ID/Relationship/ID/Titel/Prose und die Beschriftung
„Relationship aus Sicht der Source“ sind vorhanden. Die fünf synthetischen
Zeilen stellen Quelle und Ziel in der erwarteten Reihenfolge dar. Die tatsächliche
Screenreader-Ansage mehrstufiger Tabellenköpfe bleibt Teil der offenen Prüfung.

Safari überspringt mit seiner aktuellen Tab-Einstellung bestimmte Checkboxen und
Buttons. Für alle Steuerelemente wurde zusätzlich Option-Tab bzw.
Option-Umschalt-Tab verwendet; die Safari-Einstellung wurde nicht verändert.
PageDown wurde im JSON-Bereich manuell ausgelöst; der belastbare Nachweis einer
positiven Scrollbewegung erfolgt zusätzlich automatisiert bei kleiner Fensterhöhe
in allen drei Browsern. Eine vorgelesene Dialog- oder Tabellenstruktur wurde
hierdurch ausdrücklich nicht geprüft.

Die erwartete Dialogbedienung orientiert sich am
[W3C-Dialogmuster](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), die
semantische Datentabelle am
[W3C-Tabellenmuster](https://www.w3.org/WAI/ARIA/apg/patterns/table/).

## Gefundene und behobene Fehler

| Befund                                                                                                        | Korrektur                                                                                                                                                                            | Absicherung                                                                 |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| JSON-Inhalt war nicht per Tab erreichbar.                                                                     | Benannter, fokussierbarer Scrollbereich; Fokusbegrenzung schließt Inhalt und Schließen-Button ein.                                                                                   | Native Safari-Prüfung sowie Tab/PageDown/Escape in drei Browsern            |
| Bei identischen IDs konnte eine Komponente den aktiven statt des referenzierten Katalogs anzeigen und öffnen. | Erkannte Quellenübereinstimmung hat Vorrang; ursprünglicher Dateiname und Quell-URL werden berücksichtigt; KERN-Quernavigation aktiviert die ermittelte Quelle vor der ID-Auflösung. | Zwei Kataloge mit gleicher ID und unterschiedlichen Titeln in drei Browsern |
| Referenzierte Anforderung konnte durch bestehende Filter verborgen bleiben.                                   | Falls nötig werden Katalogfilter mit sichtbarer Meldung zurückgesetzt; Aufklappzustand und Fokus folgen dem Ziel.                                                                    | Suche verdeckt Ziel, Komponentenverweis öffnet es in drei Browsern          |
| Persistenter Ergebnisstatus meldete nach Filterung die Gesamtzahl.                                            | Status übernimmt die gefilterte Auswahlzusammenfassung des aktuellen Datenkontexts.                                                                                                  | Null und fünf Treffer in Safari und drei Browsern                           |
| Leere Mehrfachauswahl erschien als „Keine aktiven Einschränkungen“.                                           | KERN-Fokusübersicht kennzeichnet leere Auswahl ausdrücklich mit „keine Auswahl“.                                                                                                     | Safari und drei Browser                                                     |

Die Quellenkorrektur verbessert die gemeinsame Katalogzuordnung. Die übrigen
Bedienkorrekturen sind auf KERN begrenzt. Eine unbekannte oder mehrdeutige
Quellenangabe wird durch diese Prüfung nicht automatisch fachlich geklärt; die
bestehende ID-basierte Ersatzzuordnung bleibt erhalten.

## Unabhängiger fachlicher Quellenabgleich

Die erwarteten Werte werden direkt aus den rohen OSCAL-Dateien ermittelt, ohne
Viewer-Parser oder dessen Auswahlfunktionen wiederzuverwenden. Geprüft wurden
öffentliche Dokumente der BSI-Bibliothek aus Revision
`a12831136f4122a4c43854622180a24f2576a41e`; Links und Dokumentgrößen stehen im
[Migrationsstand](kern-migration.md).

| Dokument                       | Prüfumfang                                                                                                                             | Ergebnis        |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Grundschutz++-Anwenderkatalog  | Alle 1.000 sichtbaren IDs und Titel gegen Quelldaten; JSON-Stichproben GC.1.1, SENS.9.5 und DEV.7.2 strukturell gegen Originalobjekte. | Übereinstimmung |
| IT-GS2023 → GS++               | Alle 1.185 Beziehungstypen in ursprünglicher Reihenfolge; Quell-/Ziel-ID der Einträge 1, 593 und 1.185.                                | Übereinstimmung |
| Keycloak-Komponentendefinition | 43 Umsetzungstexte aus drei Komponenten in ursprünglicher Reihenfolge; Leerraum wird beim Textvergleich normalisiert.                  | Übereinstimmung |

Der Quellkatalog G0 der Keycloak-Implementierungen wurde in dieser Stichprobe
nicht zusätzlich geladen. Daraus folgt keine Aussage über die vollständige
Auflösung dieser Querverweise. Referenzauflösung, konkurrierende Kataloge und
Filterwechsel wurden separat mit gezielt konstruierten Testdaten geprüft.
Die Prüfung bewertet die Wiedergabe vorhandener Inhalte, nicht die fachliche
Richtigkeit oder Sicherheitswirksamkeit der Quelldokumente und Mappings.

SHA-256 der verwendeten Dateien, in derselben Reihenfolge:

```text
27a9d50092bd6c8fef5c0f83495e125bd54383a1ebf5d4f763803fce0380c645
df7ea11261ace956a3ebb440f60928851a4815f5545775ac9b24e4d3d22f267f
eb7fd4c6a3df7a39945c5bde4d3f9c91f386ee400f66f2d49873d8fd91f0fe3b
```

Reproduzieren nach dem aktuellen Build und nach dem normalen E2E-Lauf:

```sh
npm run build
node scripts/check-kern-content.mjs /pfad/katalog.json /pfad/mapping.json /pfad/komponente.json
```

Das Skript verwendet Chromium und standardmäßig Port 4194
(`VIEWER_CONTENT_PORT` überschreibt ihn). Es lädt keine externen Daten nach.
Bericht und Bildschirmbild entstehen unter
`test-results/kern-content-acceptance/`. Die speziellen Inhaltsannahmen der
Stichprobe, insbesondere einfache Umsetzungstexte und die ID-Spalten der
Mapping-Einträge, sind keine allgemeine OSCAL-Validierung. Die Quelldokumente
werden nicht ins Repository kopiert.

## Automatisierter Abschlusslauf

Nach den Korrekturen bestanden 174 Browserprüfungen in Chromium, Firefox und
WebKit, 43 Unit-/Architekturtests und drei Release-Prüfungen. Zwölf KERN-
Bildreferenzen in zwei Testfällen stimmen überein; zehn Legacy-Vergleichsansichten
bleiben pixelgleich. ESLint, Formatprüfung, TypeScript, beide Builds und deren
Artefaktprüfungen bestanden ebenfalls. Die sechs Diagrammansichten mit Echtdaten
und der oben beschriebene unabhängige Quellenabgleich liefen ohne JavaScript-
Laufzeitfehler. Die im Migrationsstand dokumentierte PDF-Prüfung des vorigen
Ausbauschritts wurde in diesem Lauf nicht wiederholt; Drucklayout und CSS wurden
hier nicht geändert.

## Verbleibende manuelle Abnahme

Für die echte Screenreader-Prüfung werden tatsächliche Ausgabe und
Bedienerfahrung protokolliert, beispielsweise mit Safari/VoiceOver und
Firefox oder Chrome/NVDA. Browser-, Betriebssystem- und Screenreader-Version,
Prüfperson, Datum sowie Abweichungen gehören ins Folgeprotokoll.

1. Startseite über Landmarken und Überschriften erschließen; Bibliothekssuche,
   Trefferzahl, Ladefehler und Wiederholung ohne Maus bedienen.
2. Katalog laden; Erfolg, falschen Dokumenttyp und fehlgeschlagenen Import
   unterscheiden. Bestehende Daten müssen erhalten bleiben.
3. Filter öffnen; Namen, Auswahlzahl, Checkbox-Zustände und Teil-Auswahl lesen.
   Null Treffer erzeugen. Den aktualisierten Ergebnisstatus tatsächlich hören.
4. Filter schließen und Fokus prüfen; Suchtext und Filter zurücksetzen.
5. Darstellungstabs mit Pfeiltasten bewegen und erst mit Enter aktivieren;
   ausgewählten Tab und zugehörigen Inhalt erkennen.
6. Anforderung samt Unterabschnitten, Metadaten und Parametertext lesen.
7. JSON-Dialog öffnen, Inhalt lesen und scrollen; Hintergrund darf nicht
   erreichbar sein. Escape muss zum auslösenden Button zurückführen.
8. Graph-Datentabelle durchsuchen, Spaltenüberschriften und Beziehungen lesen;
   bei mehr als 50 Einträgen Seiten wechseln. Eintrag öffnen und Fokus prüfen.
9. Sunburst-/Balkendaten und Zielobjekthierarchie über ihre Tabellen erschließen.
10. Gefülltes Mapping lesen: Quelle, Beziehung, Richtung und Ziel eindeutig
    zuordnen; horizontale Scrollbedienung bei schmaler Darstellung prüfen.
11. Komponente öffnen; Quellkatalog, Umsetzungstext und Metadaten lesen;
    Querverweis trotz vorheriger Filter öffnen und Reset-Meldung hören.
12. Fachverantwortliche gleichen repräsentative eigene Dokumente, mehrdeutige
    Quellen und Mehrfachzuordnungen ab und dokumentieren ihre Freigabe oder
    Restbefunde. Vor Veröffentlichung folgen BundesSans-Layoutprüfung und eine
    gesonderte Veröffentlichungsentscheidung.

Eine Abnahme kann erst als abgeschlossen markiert werden, wenn diese noch
offenen Nachweise vorliegen. Die automatisierten Prüfungen und die bisherige
PDF-Sichtprüfung ergänzen diesen Ablauf, ersetzen ihn aber nicht.
