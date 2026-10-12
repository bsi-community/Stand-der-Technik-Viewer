/** Synthetic demonstration data. These are not BSI requirements or an assessed mapping. */
const metadata = (title) => ({
  title,
  version: '0.1.0',
  'oscal-version': '1.1.3',
  'last-modified': '2026-10-08T10:00:00Z',
  remarks: 'Synthetische Beispieldaten für den KERN-Entwurf. Keine normative Aussage.',
});
const entries = [
  [
    'Konten und Berechtigungen prüfen',
    'Benutzerkonten SOLLTEN regelmäßig auf Erforderlichkeit und angemessene Berechtigungen geprüft werden. Nicht mehr benötigte Konten SOLLTEN deaktiviert werden.',
    'Dokumentiere Verantwortliche, Prüftermine und Ergebnisse. Berücksichtige insbesondere privilegierte Konten und externe Zugänge.',
  ],
  [
    'Administrative Zugänge absichern',
    'Privilegierte Zugänge SOLLTEN durch Mehrfaktor-Authentisierung geschützt und von alltäglichen Benutzerkonten getrennt werden.',
    'Nutze persönliche Administrationskonten und protokolliere sicherheitsrelevante Änderungen.',
  ],
  [
    'Netzübergänge kontrollieren',
    'Kommunikationsbeziehungen zwischen Netzsegmenten SOLLTEN auf erforderliche Verbindungen beschränkt werden.',
    'Dokumentiere freigegebene Verbindungen mit Zweck, Quelle, Ziel und verantwortlicher Stelle.',
  ],
  [
    'Datensicherungen überprüfen',
    'Die Wiederherstellung aus Datensicherungen SOLLTE regelmäßig getestet werden.',
    'Lege nachvollziehbare Wiederherstellungsziele fest und dokumentiere die Ergebnisse der Tests.',
  ],
  [
    'Sicherheitsereignisse auswerten',
    'Sicherheitsrelevante Ereignisse SOLLTEN zentral erfasst und zeitnah ausgewertet werden.',
    'Definiere Meldewege und prüfe regelmäßig, ob die notwendigen Ereignisse erfasst werden.',
  ],
];
const controls = (prefix, titles = []) =>
  entries.map(([title, statement, guidance], i) => ({
    id: `${prefix}-${i + 1}`,
    title: titles[i] || title,
    props: [
      { name: 'sec_level', value: 'normal' },
      { name: 'documentation', value: 'Prüfprotokoll' },
      { name: 'Taxonomy-L1', value: i < 2 ? 'Protect' : 'Identify' },
      { name: 'Taxonomy-L2', value: 'Security Management' },
    ],
    parts: [
      { name: 'statement', prose: statement },
      { name: 'guidance', prose: guidance },
    ],
  }));
export const sourceUrl = 'https://preview.example.invalid/organisation.json';
export const targetUrl = 'https://preview.example.invalid/referenz.json';
export const source = {
  catalog: {
    uuid: 'b7711111-1111-4111-8111-111111111111',
    metadata: metadata('Beispielkatalog · Sicherheitsorganisation'),
    groups: [{ id: 'access', title: 'Zugriff und Betrieb', controls: controls('ORG') }],
  },
};
export const target = {
  catalog: {
    uuid: 'b7722222-2222-4222-8222-222222222222',
    metadata: metadata('Beispielkatalog · Technische Schutzmaßnahmen'),
    groups: [
      {
        id: 'protection',
        title: 'Technische Schutzmaßnahmen',
        controls: controls('REF', [
          'Berechtigungsmanagement',
          'Schutz privilegierter Konten',
          'Netzsegmentierung',
          'Wiederherstellbarkeit',
          'Protokollierung',
        ]),
      },
    ],
  },
};
export const mapping = {
  'mapping-collection': {
    uuid: 'b7733333-3333-4333-8333-333333333333',
    metadata: metadata('Beispielmapping · Organisation und Technik'),
    mappings: [
      {
        'source-resource': { href: sourceUrl },
        'target-resource': { href: targetUrl },
        maps: entries.map((_, i) => ({
          uuid: `b7744444-4444-4444-8444-${String(i + 1).padStart(12, '0')}`,
          relationship: i === 1 ? 'intersects-with' : 'equivalent-to',
          sources: [{ 'id-ref': `ORG-${i + 1}` }],
          targets: [{ 'id-ref': `REF-${i + 1}` }],
          remarks:
            i === 1
              ? 'Beispiel einer teilweisen Überschneidung; keine fachlich geprüfte Zuordnung.'
              : 'Synthetische Zuordnung zur Darstellung des Tabellenlayouts.',
        })),
      },
    ],
  },
};
