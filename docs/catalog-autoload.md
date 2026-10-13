# Automatische Katalogauflösung

Beim Datei-, URL- und Repositoryimport einer Component Definition oder Mapping
Collection lädt der Viewer zugehörige öffentliche Catalogs vor der Darstellung
nach. Alle Quellen bleiben in der Katalogansicht verfügbar. Bereits geladene
Dokumente werden anhand ihrer Identität wiederverwendet; der gewählte Arbeitsbereich
und ein bereits aktiver Katalog bleiben erhalten.

## OSCAL-Referenzstellen

Die Recherche erfolgte anhand der offiziellen NIST-Referenzen:

- [Component Definition 1.1.3](https://pages.nist.gov/OSCAL-Reference/models/v1.1.3/component-definition/json-reference/):
  `components[].control-implementations[].source` und
  `capabilities[].control-implementations[].source` verweisen auf Catalogs oder
  Profiles. Zulässig sind absolute URIs, relative Verweise und `#uuid`-Verweise
  auf Back-Matter-Ressourcen des Dokuments oder importierter Definitionen.
- [Mapping Collection 1.2.2](https://pages.nist.gov/OSCAL-Reference/models/v1.2.2/mapping/json-reference/):
  `mappings[].source-resource.href` und `target-resource.href` verwenden dieselben
  Verweisformen. Eine Collection kann mehrere Mapping-Gruppen mit unterschiedlichen
  Katalogpaaren enthalten.
- In beiden Modellen führt `back-matter.resources[].document-ids[].identifier`
  die Dokumentkennungen der referenzierten Ressource; `title` und `rlinks[].href`
  liefern Titel und Fundorte. Die UUID der Back-Matter-Ressource ist lediglich
  der lokale Verweisanker. `metadata.document-ids` der Component Definition oder
  Mapping Collection identifizieren das Hauptdokument, nicht dessen Kataloge.

Außerhalb von Back Matter besitzen `source` bzw. `href` keine eigenen standardisierten
`document-ids`-Unterfelder. Direkte `urn:uuid:`-Verweise können einen Katalog über
seine Dokumentkennung oder seine Instanz-UUID identifizieren. OSCAL erlaubt außerdem
Erweiterungen über `props` und `links`: Der Viewer unterstützt die ausdrücklich
benannte Property `document-id` am jeweiligen Implementation-/Resource-Objekt,
sowie den Text eines zugehörigen Links als Titelhinweis. Diese Auswertung ist eine
Viewer-Konvention, keine Behauptung eines zusätzlichen OSCAL-Pflichtfelds.
Descriptions, Bemerkungen und ähnlich klingende Dateinamen werden nicht als Titel
interpretiert.

## Prioritäten und Grenzen

1. Kennungen der tatsächlich referenzierten Back-Matter-Ressource haben Vorrang.
   Falls dort keine Kennung steht, werden die beschriebenen direkten URI- bzw.
   Property-Angaben geprüft. Explizite `document-ids` müssen einem der
   `metadata.document-ids` des Katalogs entsprechen; eine davon abweichende
   Instanz-UUID genügt nicht. UUIDs mit oder ohne `urn:uuid:` und unterschiedliche
   UUID-Großschreibung sind gleichwertig. Andere Kennungen werden exakt verglichen.
   Ist eine Kennung vorhanden, gibt es keinen schwächeren Pfad-/Titelfallback.
2. Ohne Kennung werden nur exakte Dateipfade aus der frischen GitHub-Dateiliste
   verwendet. Unterstützt sind Raw-/Blob-URLs des BSI-Repositorys auf `main`,
   explizite repositoryrelative `control_layer/...`-Pfade und URL-relative Pfade
   auf Basis des hochgeladenen Dokuments. Bei lokalen Dateien können führende
   `./` oder `../` vor einem expliziten `control_layer/...`-Pfad entfernt werden;
   ein Dateiname allein liefert dagegen keinen verlässlichen Ablageort.
3. Ohne Pfadtreffer wird ein vorhandener Referenztitel mit `metadata.title` exakt
   verglichen. Mehrere Kataloge mit exakt diesem Titel bleiben Kandidaten;
   gleiche Dokumentidentitäten werden nur einmal übernommen. Eine Document-ID
   ist die bessere Wahl, wenn Titel mehrfach vorkommen.

Die Suche umfasst rekursiv tatsächliche Catalogs unter `control_layer/`, auch
Dateien ohne die Endung `-catalog.json`. `control_layer/Mappings/`, andere
Dokumenttypen, fremde Repositories, fremde Hosts und andere Branches sind keine
Quellen für automatische Katalogimporte. Ein vorhandenes Profile wird nicht
aufgelöst; ein veröffentlichtes resolved Catalog kann über seine eigene Identität
gefunden werden. Historische Git-Commit-URLs werden nicht stillschweigend auf
`main` umgeschrieben. Hashes bzw. Versionsgleichheit werden weiterhin nicht geprüft.

`import-component-definitions` importiert andere Definitionen, keine Kataloge.
Bereits geladene, ausdrücklich importierte Definitionen können ihre Katalogreferenzen
beisteuern; der Viewer lädt weder diese Definitionen noch beliebige URLs rekursiv
nach. Unverknüpfte Literaturangaben im Back Matter lösen keinen Katalogimport aus.

## Geschwindigkeit und Ausfälle

Startseite und Import teilen denselben Repository-Index. Die Dateiliste wird pro
Start frisch abgerufen; der SHA-gebundene Metadaten-Cache enthält alle Kennungen,
Titel, Modelltyp und Instanz-UUID. Bis zu sechs Metadatenabrufe bzw. vier benötigte
Katalogabrufe laufen parallel. Laufende gleiche Requests werden geteilt, bis zu
24 öffentliche Katalog-JSONs bleiben im Arbeitsspeicher wiederverwendbar, und jeder
Repositoryabruf wird nach acht Sekunden abgebrochen. Neue Katalogquellen werden
gesammelt hinzugefügt und nur einmal gerendert. Vor der Übernahme werden Modell
und Identität erneut am Dokument geprüft.

Ohne Treffer oder bei Abruffehlern bleibt das Hauptdokument nutzbar. Die bisherigen
Hinweise auf fehlende Kataloge erscheinen nach Abschluss der Prüfung. Später lassen
sich fehlende Kataloge weiterhin manuell laden. Ein erneuter Import kann einen
fehlgeschlagenen Katalogdownload erneut versuchen; bei ausgefallener Dateiliste
kann die Bibliothek auf der Startseite erneut geladen werden.

## Echtdatenabgleich am 13. Oktober 2026

Geprüft wurden die beiden öffentlichen Mappings und alle sechs öffentlichen
Komponentendefinitionen. Die
[Passwortrichtlinie](https://github.com/BSI-Bund/Stand-der-Technik-Bibliothek/blob/main/implementation_layer/Passwortrichtlinie/Passwortrichtlinie-component_definition.json)
referenziert exakt „Anwenderkatalog Grundschutz++“. Der Katalog wurde automatisch
geladen; der gemessene Import im lokalen Browser benötigte rund 0,8 Sekunden nach
Bereitstellung des Repository-Index. Das ist ein Einzelmesswert, keine zugesicherte
Ladezeit.

Die beiden [Mappings](https://github.com/BSI-Bund/Stand-der-Technik-Bibliothek/tree/main/control_layer/Mappings)
enthalten im geprüften Stand bloße Katalogdateinamen ohne auflösbare Repositorypfade,
Dokumentkennungen oder passende Referenztitel. Bei Keycloak lautet der Referenztitel
„BSI Stand der Technik Kernel G0 – OSCAL Catalog“, der veröffentlichte Katalogtitel
dagegen „BSI Stand der Technik Kernel“. Auch GA-Lotse, Lieferkettensicherheit,
Netzarchitektur und AWS Security Hub liefern im geprüften Stand keinen Treffer nach
diesen exakten Regeln. Hier ist das Ausbleiben eines automatischen Imports beabsichtigt.
Es wurden keine öffentlichen Quelldokumente geändert. Die Autoren können durch
passende Back-Matter-Document-IDs oder exakte Referenzen die Auflösung ermöglichen.
