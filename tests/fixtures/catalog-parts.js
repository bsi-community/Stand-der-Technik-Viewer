// Synthetic parts modeled on common OSCAL structures; no external catalog content.
export const catalogParts = {
  catalog: {
    uuid: '11111111-2222-4333-8444-555555555555',
    metadata: { title: 'Part-Testkatalog', version: '1', 'oscal-version': '1.1.3' },
    controls: [
      {
        id: 'parts-1',
        title: 'Control mit mehreren Parts',
        params: [{ id: 'interval', values: ['monatlich'] }],
        remarks: 'Separate Control-Anmerkung.',
        parts: [
          { name: 'overview', title: 'Risk Scenario', prose: 'Erstes Szenario.' },
          { name: 'statement', title: 'Control', prose: 'Erste Anforderung.' },
          {
            name: 'guidance',
            title: 'Assessment Guidance',
            prose: 'Erste Hinweise mit **Prüfung**.',
          },
          {
            name: 'guidance',
            title: 'Implementation Guidance',
            prose: 'Zweite Hinweise {{ insert: param, interval }}.\n\n- Alpha\n- Beta',
          },
          { name: 'statement', title: 'Other Control', prose: 'Zweite Anforderung.' },
          { name: 'overview', prose: 'Zweites Szenario.' },
          { name: 'guidance', title: '  ', prose: 'Dritte Hinweise ohne Titel.' },
          { name: 'example', title: 'Praxisbeispiel', prose: 'Erstes Beispiel.' },
          { name: 'example', prose: 'Zweites Beispiel.' },
          { name: 'custom', title: 'Guidance', prose: 'Wörtlicher Titel bleibt erhalten.' },
          { name: 'custom', title: 'Statement', prose: 'Kein Statement-Part.' },
          { name: 'custom', title: 'Remarks', prose: 'Kein Remarks-Feld.' },
          {
            name: 'custom',
            title: '**Formatierter Titel** <img src=x onerror=alert(1)>',
            prose: 'Sicherer Inhalt.',
          },
          { id: 'fallback-id', prose: 'Part ohne Name und Titel.' },
          { prose: 'Part ohne Name, ID und Titel.' },
          { name: 'custom', title: 'Nur ein Titel' },
          {
            name: 'overview',
            title: 'Verschachtelte Hinweise',
            parts: [
              {
                name: 'guidance',
                title: 'Unterabschnitt',
                prose: 'Elterntext.',
                parts: [
                  { name: 'example', title: 'Detailbeispiel', prose: 'Tiefentreffer.' },
                  { name: 'example', prose: 'Weiteres verschachteltes Beispiel.' },
                ],
              },
              { name: 'statement', title: 'Nested Control', prose: 'Dritte Anforderung.' },
            ],
          },
          { name: 'empty', props: [{ name: 'test', value: 'metadata-only' }] },
        ],
      },
      { id: 'parts-empty', title: 'Control ohne Parts' },
    ],
  },
};

export const partLabels = [
  'Risk Scenario',
  'Anforderung',
  'Assessment Guidance',
  'Implementation Guidance',
  'Anforderung',
  'overview',
  'Hinweise',
  'Praxisbeispiel',
  'example',
  'Guidance',
  'Statement',
  'Remarks',
  'Formatierter Titel <img src=x onerror=alert(1)>',
  'fallback-id',
  'Part',
  'Nur ein Titel',
  'Verschachtelte Hinweise',
  'Unterabschnitt',
  'Detailbeispiel',
  'example',
  'Anforderung',
];
