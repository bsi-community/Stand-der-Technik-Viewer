/** Small synthetic fixtures: no personal, sensitive or externally licensed data. */
const metadata = (title) => ({
  title,
  version: '1.0.0',
  'oscal-version': '1.1.3',
  'last-modified': '2026-09-30T00:00:00Z',
});
export const catalog = {
  catalog: {
    uuid: '11111111-1111-4111-8111-111111111111',
    metadata: metadata('Testkatalog Sicherheit'),
    groups: [
      {
        id: 'group-a',
        title: 'Sicherer Betrieb',
        groups: [
          {
            id: 'topic-a',
            title: 'Zugriffsschutz',
            controls: [
              {
                id: 'AC-1',
                title: 'Zugänge schützen',
                props: [
                  { name: 'label', value: 'A.1' },
                  { name: 'target_object_categories', value: 'Server' },
                ],
                params: [{ id: 'p1', label: 'Intervall', values: ['monatlich'] }],
                parts: [
                  {
                    id: 'AC-1_smt',
                    name: 'statement',
                    prose: 'Konten müssen {{ insert: param, p1 }} geprüft werden.',
                  },
                  {
                    name: 'guidance',
                    prose: '**Prüfung** und [Dokumentation](https://example.org/docs).',
                  },
                ],
                links: [{ rel: 'related', href: '#AC-2' }],
                controls: [
                  {
                    id: 'AC-1.1',
                    title: 'Privilegierte Konten',
                    parts: [
                      { name: 'statement', prose: 'Administrationskonten gesondert prüfen.' },
                    ],
                  },
                ],
              },
              {
                id: 'AC-2',
                title: 'Datensicherung testen',
                parts: [{ name: 'statement', prose: 'Backups regelmäßig testen.' }],
              },
            ],
          },
        ],
      },
    ],
    'back-matter': {
      resources: [
        { uuid: 'source-1', title: 'Testquelle', rlinks: [{ href: 'https://example.org/source' }] },
      ],
    },
  },
};
export const component = {
  'component-definition': {
    uuid: '22222222-2222-4222-8222-222222222222',
    metadata: metadata('Testdefinition Infrastruktur'),
    components: [
      {
        uuid: '33333333-3333-4333-8333-333333333333',
        type: 'software',
        title: 'Test-Firewall',
        description: 'Filtert Netzwerkverkehr.',
        'control-implementations': [
          {
            uuid: 'impl-1',
            source: 'https://example.org/catalog.json',
            description: 'Zugriffsschutz umsetzen',
            'set-parameters': [{ 'param-id': 'p1', values: ['wöchentlich'] }],
            'implemented-requirements': [
              {
                uuid: 'req-1',
                'control-id': 'AC-1',
                description: 'Konten {{ insert: param, p1 }} prüfen.',
                props: [
                  {
                    name: 'config-command',
                    value: 'show access-list',
                    remarks: 'Nur lesender Beispielbefehl.',
                  },
                ],
                statements: [
                  {
                    uuid: 'stmt-1',
                    'statement-id': 'AC-1_smt',
                    description: 'Protokollierte Prüfung.',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    capabilities: [
      {
        uuid: '44444444-4444-4444-8444-444444444444',
        name: 'Netzwerkschutz',
        description: 'Schutzfähigkeit',
        'incorporates-components': [
          { 'component-uuid': '33333333-3333-4333-8333-333333333333', description: 'Firewall' },
        ],
      },
    ],
  },
};
export const mapping = {
  'mapping-collection': {
    uuid: '55555555-5555-4555-8555-555555555555',
    metadata: metadata('Testmapping'),
    mappings: [
      {
        'source-resource': { href: 'https://example.org/source.json' },
        'target-resource': { href: 'https://example.org/catalog.json' },
        maps: [
          {
            uuid: 'map-1',
            relationship: 'intersects-with',
            sources: [{ 'id-ref': 'SRC-1' }],
            targets: [{ 'id-ref': 'AC-1' }],
            remarks: 'Partielle Abdeckung',
            qualifiers: [
              {
                subject: 'source',
                predicate: 'covers',
                category: 'partial',
                description: 'Nur administrative Konten.',
              },
            ],
          },
        ],
        'target-gap-summary': {
          'unmapped-controls': [{ 'with-ids': ['AC-2'] }, { matching: [{ pattern: 'AC-*' }] }],
        },
      },
    ],
  },
};
export const hierarchyCsv =
  'Zielobjekt,Definition,Kategorie,Synonyme,ChildOfUUID,UUID\nInfrastruktur,Technische Infrastruktur,Technik,,,aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa\nServer,Ein Server,Technik,Host,aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa,bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb\n';
