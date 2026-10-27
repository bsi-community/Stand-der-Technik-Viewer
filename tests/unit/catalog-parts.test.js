import { test, expect } from 'vitest';
import { parseCatalog } from '../../src/domain/catalog.js';
import { catalogParts } from '../fixtures/catalog-parts.js';

test('catalog preserves repeated parts, titles and descendants without changing the input', () => {
  const input = structuredClone(catalogParts);
  const before = structuredClone(input);
  const model = parseCatalog(input);
  const control = model.controls[0];
  expect(control.parts.map((part) => part.name)).toEqual(
    input.catalog.controls[0].parts.map((part) => part.name),
  );
  expect(control.parts.filter((part) => part.name === 'guidance')).toHaveLength(3);
  expect(control.parts[3]).toMatchObject({ title: 'Implementation Guidance' });
  expect(control.parts[16].parts[0].parts).toMatchObject([
    { name: 'example', title: 'Detailbeispiel', prose: 'Tiefentreffer.' },
    { name: 'example', title: '', prose: 'Weiteres verschachteltes Beispiel.' },
  ]);
  for (const term of [
    'implementation guidance',
    'detailbeispiel',
    'tiefentreffer',
    'zweite anforderung',
  ]) {
    expect(control.searchText).toContain(term);
  }
  expect(model.controls[1].parts).toEqual([]);
  expect(input).toEqual(before);
});

test('missing and malformed optional parts do not discard valid siblings', () => {
  const model = parseCatalog({
    catalog: {
      controls: [
        {
          id: 'malformed',
          parts: [
            null,
            false,
            'invalid',
            { name: 'guidance', parts: null },
            { name: 'example', prose: 'Valid' },
          ],
        },
        { id: 'missing', parts: {} },
      ],
    },
  });
  expect(model.controls[0].parts).toHaveLength(2);
  expect(model.controls[0].parts[0].parts).toEqual([]);
  expect(model.controls[0].searchText).toContain('valid');
  expect(model.controls[1].parts).toEqual([]);
});
