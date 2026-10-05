/** config: see docs/architecture.md for responsibilities. */

export const SDT_PRACTICES = [
  { id: 'GC', title: 'Governance und Compliance', uuid: 'b843af63-e2a3-4dcd-ab8e-fe66dde9b138' },
  { id: 'STM', title: 'Strukturmodellierung', uuid: 'deba3c17-15a1-450e-84a9-129ac73b0b84' },
  { id: 'UMS', title: 'Umsetzung', uuid: 'af61e9e7-80ee-4630-b603-c615c6a966ec' },
  { id: 'VRB', title: 'Verbesserung', uuid: '662fb453-caf1-4e01-8152-b88027b71438' },
  { id: 'PERF', title: 'Monitoring-Evaluation', uuid: '929c7c4f-efe1-4092-907e-ba1e767a1ac3' },
  { id: 'RISK', title: 'Risikomanagement', uuid: '906e6304-5a16-4251-b225-324d4945100a' },
  { id: 'ASST', title: 'Informationen und Assets', uuid: '02088622-573d-4225-883c-9afe0c7dc69b' },
  { id: 'PERS', title: 'Personal', uuid: '8c802b3e-567c-4dd2-a7d0-c915659deb57' },
  { id: 'BES', title: 'Beschaffungsmanagement', uuid: 'cf85fe4e-56dc-4942-9564-aa80aa13a626' },
  { id: 'DLS', title: 'Dienstleistersteuerung', uuid: '1291637b-aa0e-4b80-a309-5aca40e1c01b' },
  { id: 'TEST', title: 'Änderungen und Tests', uuid: '554ba2da-7317-4792-8548-141250039260' },
  { id: 'GEB', title: 'Gebäudemanagement', uuid: '17b37cff-5445-4487-acec-ef18d91cfec2' },
  { id: 'SENS', title: 'Sensibilisierung', uuid: '66da6dfc-8bb3-4dcb-9809-72f3be19845e' },
  { id: 'ARCH', title: 'Architektur', uuid: '6710c63e-bb40-4742-9bae-1779ba21f2a9' },
  { id: 'BER', title: 'Berechtigung', uuid: '389cd5ad-fb81-4a95-8f7a-8f1fe1881709' },
  { id: 'NOT', title: 'Notfallplanung', uuid: '723219b0-d58a-432d-bce2-2bf16c5874ae' },
  { id: 'DET', title: 'Detektion', uuid: 'f479aa5a-6dd9-4b9b-973e-8c4f85b074ed' },
  {
    id: 'REA',
    title: 'Sicherheitsvorfallsbehandlung',
    uuid: '28b2c88b-1a2a-4f9f-81c0-5d46b50c8f04',
  },
  { id: 'KONF', title: 'Konfiguration', uuid: '8e46d34c-5145-44f8-882e-790e2dcffa09' },
  { id: 'DEV', title: 'Entwicklung', uuid: '108b65aa-5964-49d7-b9eb-dc8946a923ca' },
  { id: 'EXMP', title: 'Beispielpraktik', uuid: '9d330062-5c39-4bb0-bef2-62ab66414aa5' },
];

export const TARGET_OBJECT_CATEGORY_NAMESPACE_URL =
  'https://raw.githubusercontent.com/BSI-Bund/Stand-der-Technik-Bibliothek/main/documentation/namespaces/target_object_categories.csv';

export const SECURITY_TARGET_DEFINITIONS = [
  { key: 'confidentiality', label: 'Vertraulichkeit' },
  { key: 'integrity', label: 'Integrität' },
  { key: 'availability', label: 'Verfügbarkeit' },
  { key: 'authenticity', label: 'Authentizität' },
];

export const effortDefinitions = {
  0: 'Der Aufwand der Anforderung wird nicht bewertet, da ihre Implementierung in jedem Fall zwingend erforderlich ist. Beispiel: Benennung eines Informationssicherheitsbeauftragten.',
  1: 'In der Regel ist die Umsetzung noch am selben Tag und mit wenig Aufwand erreichbar. Zur Aufrechterhaltung sind keine regelmäßigen Aufwände erforderlich (Sogenannte Quick Wins / low hanging fruit). Beispiel: Aktivierung einer typischerweise vorhandenen Systemfunktion.',
  2: 'In der Regel ist die Umsetzung innerhalb einer Woche mit eigenen Mitteln möglich. Zur Aufrechterhaltung sind nur geringe Aufwände erforderlich. Beispiel: Erstellung einer Kontaktübersicht, die mit mehreren Fachbereichen abgestimmt werden muss.',
  3: 'In der Regel ist für die Umsetzung ein Zeitraum über mehrere Wochen bis einige Monate erforderlich. Je nach Ressourcen der Institution kann hierzu auch eine Beteiligung externer Dienstleister erforderlich sein. Die Aufrechterhaltung kann von einem kleinen Team an Betriebspersonal gewährleistet werden. Beispiel: Unterbringung von Geräten im Serverraum.',
  4: 'In der Regel sind diese Anforderungen mit einer längerfristigen Umsetzung oder Beibehaltung verbunden. Es wird Expertenwissen und oftmals auch eine Unterstützung von Dritten benötigt. Für die Aufrechterhaltung ist häufig ein größeres Team von Betriebspersonal erforderlich. Beispiel: Initiierung und Umsetzung von Baumaßnahmen.',
  5: 'In der Regel sind für die Umsetzung aufwändige, komplexe Maßnahmen oder eine individuelle Abwägung und Behandlung damit verbundener sekundärer Risiken erforderlich. Hierzu ist häufig tiefgehendes Expertenwissen oder der Einsatz entsprechender externer Dienstleister, sowie eine sorgfältige Planung und Aufrechterhaltung notwendig. Beispiel: Aufbau georedundanter Rechenzentren.',
};

export const BSI_REPOSITORY_TREE_URL =
  'https://api.github.com/repos/BSI-Bund/Stand-der-Technik-Bibliothek/git/trees/main?recursive=1';

export const BSI_REPOSITORY_RAW_ROOT =
  'https://raw.githubusercontent.com/BSI-Bund/Stand-der-Technik-Bibliothek/main/';

export const BSI_REPOSITORY_METADATA_CACHE_KEY = 'sdt-viewer:bsi-repository-metadata:v2';

export const BSI_CONTROL_LAYER_PREFIX = 'control_layer/';

export const BSI_CONTROL_LAYER_MAPPINGS_PREFIX = 'control_layer/Mappings/';

export const BSI_CONTROL_LAYER_SOURCES_DIRECTORY = 'sources';

export const BSI_CONTROL_LAYER_CATALOGS_DIRECTORY = 'catalogs';

export const BSI_IMPLEMENTATION_LAYER_PREFIX = 'implementation_layer/';
