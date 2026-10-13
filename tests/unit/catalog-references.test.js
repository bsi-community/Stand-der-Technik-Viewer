import { test, expect } from 'vitest';
import {
  describeCatalogReference,
  collectCatalogReferences,
  matchingCatalogs,
  catalogIdentity,
  publicCatalogPath,
  documentIds,
} from '../../src/domain/catalog-references.js';

const path = 'control_layer/Thema/catalog.json';
const base =
  'https://raw.githubusercontent.com/BSI-Bund/Stand-der-Technik-Bibliothek/main/implementation_layer/Test/component.json';
const uuid = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const resource = {
  uuid: 'ref',
  title: 'Exact title',
  'document-ids': [{ identifier: uuid }],
  rlinks: [{ href: '../../' + path }],
};
const candidate = { ids: [uuid], uuid: 'another-uuid', path, title: 'Changed title' };

test('back-matter IDs take priority over scoped extensions, paths and title', () => {
  const ref = describeCatalogReference(
    { source: '#ref', props: [{ name: 'document-id', value: 'different' }] },
    { resources: [resource] },
    base,
  );
  expect(ref.ids).toEqual([uuid]);
  expect(
    matchingCatalogs(ref, [candidate, { ids: ['different'], path, title: 'Exact title' }]),
  ).toEqual([candidate]);
  expect(matchingCatalogs({ ...ref, ids: ['missing'] }, [candidate])).toEqual([]);
});

test('all IDs support UUID URNs and non-UUID document identifiers', () => {
  expect(
    documentIds({
      'document-ids': [
        { identifier: 'urn:uuid:' + uuid.toUpperCase() },
        { identifier: 'BSI:Catalog-2026' },
      ],
    }),
  ).toEqual([uuid, 'BSI:Catalog-2026']);
  expect(
    matchingCatalogs({ ids: ['BSI:Catalog-2026'], paths: [], titles: [] }, [
      { ids: ['BSI:Catalog-2026'] },
    ]),
  ).toHaveLength(1);
});

test('a UUID URI or explicitly named extension identifies a direct catalog reference', () => {
  expect(describeCatalogReference({ href: 'urn:uuid:' + uuid }, null).ids).toEqual([uuid]);
  expect(
    describeCatalogReference(
      {
        source: 'unknown.json',
        props: [{ name: 'document-id', ns: 'https://example.org/ns', value: 'BSI:1' }],
      },
      null,
    ).ids,
  ).toEqual(['BSI:1']);
});

test('direct reference can obtain identity from a matching back-matter rlink', () => {
  expect(describeCatalogReference({ href: path }, { resources: [resource] }, base).ids).toEqual([
    uuid,
  ]);
});

test('path precedes exact title; title only applies when the path has no result', () => {
  const ref = { ids: [], paths: [path], titles: ['Exact title'] };
  const byTitle = { ids: [], path: 'other', title: 'Exact title' };
  expect(matchingCatalogs(ref, [candidate, byTitle])).toEqual([candidate]);
  expect(matchingCatalogs(ref, [byTitle, { ids: [], title: 'exact title' }])).toEqual([byTitle]);
  expect(matchingCatalogs({ ...ref, titles: ['Exact'] }, [byTitle])).toEqual([]);
});

test('all exact title hits remain candidates; no fuzzy filename match', () => {
  const a = { ids: ['a'], title: 'Same' },
    b = { ids: ['b'], title: 'Same' };
  expect(matchingCatalogs({ ids: [], paths: [], titles: ['Same'] }, [a, b])).toEqual([a, b]);
  expect(publicCatalogPath('catalog.json')).toBe('');
});

test.each([
  [path, ''],
  ['../../' + path, ''],
  ['../../' + path, base],
  ['https://github.com/BSI-Bund/Stand-der-Technik-Bibliothek/blob/main/' + path, ''],
  ['https://raw.githubusercontent.com/BSI-Bund/Stand-der-Technik-Bibliothek/main/' + path, ''],
])('exact public path %s resolves against %s', (href, baseUrl) =>
  expect(publicCatalogPath(href, baseUrl)).toBe(path),
);

test.each([
  'https://example.org/' + path,
  'https://raw.githubusercontent.com/other/repo/main/' + path,
  'https://github.com/BSI-Bund/Stand-der-Technik-Bibliothek/blob/old/' + path,
  'https://raw.githubusercontent.com.evil.test/BSI-Bund/Stand-der-Technik-Bibliothek/main/' + path,
  'control_layer/Mappings/mapping.json',
  'implementation_layer/catalog.json',
  'file:///catalog.json',
  'control_layer/%2e%2e/implementation_layer/catalog.json',
  'control_layer/bad%encoding.json',
])('rejects noncatalog or nonpublic reference %s', (href) =>
  expect(publicCatalogPath(href)).toBe(''),
);

test('component and capability references are scoped to referenced resources', () => {
  const json = {
    'component-definition': {
      metadata: { 'document-ids': [{ identifier: 'parent-document' }] },
      components: [{ 'control-implementations': [{ source: '#ref' }, { source: '#ref' }] }],
      capabilities: [
        { 'control-implementations': [{ source: 'control_layer/Other/catalog.json' }] },
      ],
      'back-matter': {
        resources: [resource, { uuid: 'unrelated', 'document-ids': [{ identifier: 'ignore' }] }],
      },
    },
  };
  const refs = collectCatalogReferences(json);
  expect(refs).toHaveLength(2);
  expect(refs[0].ids).toEqual([uuid]);
  expect(refs[1].paths).toEqual(['control_layer/Other/catalog.json']);
});

test('all mapping groups contribute both resources, and broken fragments are not document IDs', () => {
  const json = {
    'mapping-collection': {
      mappings: [
        {
          'source-resource': { href: '#ref' },
          'target-resource': { href: 'control_layer/Other/target.json' },
        },
        { 'source-resource': { href: '#ref' }, 'target-resource': { href: '#missing' } },
      ],
      'back-matter': { resources: [resource] },
    },
  };
  expect(collectCatalogReferences(json)).toHaveLength(2);
  expect(describeCatalogReference({ href: '#missing' }, null).ids).toEqual([]);
});

test('link text supplies an exact title without treating descriptions as titles', () => {
  const ref = describeCatalogReference(
    {
      source: 'absent.json',
      description: 'Wrong title',
      links: [
        { href: 'absent.json', text: 'Exact title' },
        { href: 'unrelated.json', text: 'Ignore' },
      ],
    },
    null,
  );
  expect(ref.titles).toEqual(['Exact title']);
});

test('explicit imports can use already loaded definitions, unrelated loaded definitions are ignored', () => {
  const parent = {
    'component-definition': {
      'import-component-definitions': [{ href: '#import' }],
      'back-matter': { resources: [{ uuid: 'import', 'document-ids': [{ identifier: uuid }] }] },
    },
  };
  const imported = {
    json: {
      'component-definition': {
        uuid,
        components: [{ 'control-implementations': [{ source: '../../' + path }] }],
      },
    },
    baseUrl: base,
  };
  expect(collectCatalogReferences(parent, '', [imported])).toHaveLength(1);
  expect(collectCatalogReferences({ 'component-definition': {} }, '', [imported])).toEqual([]);
});

test('catalog identity uses its metadata, not the local filename', () => {
  expect(
    catalogIdentity({
      catalog: {
        uuid,
        metadata: { title: 'Exact title', 'document-ids': [{ identifier: 'BSI:1' }] },
      },
    }),
  ).toEqual({ ids: ['BSI:1'], uuid, title: 'Exact title', path: '' });
});

test('explicit document-ids must match metadata identifiers, not a different catalog instance UUID', () => {
  const candidate = { ids: ['other-document'], uuid, path, title: 'Exact title' };
  const ref = describeCatalogReference({ href: '#ref' }, { resources: [resource] });
  expect(matchingCatalogs(ref, [candidate])).toEqual([]);
  expect(
    matchingCatalogs(describeCatalogReference({ href: 'urn:uuid:' + uuid }, null), [candidate]),
  ).toEqual([candidate]);
});

test('URL-relative paths keep their actual origin and directory depth', () => {
  expect(
    publicCatalogPath(
      '../../' + path,
      'https://example.org/implementation_layer/Test/component.json',
    ),
  ).toBe('');
  expect(publicCatalogPath('../' + path, base)).toBe('');
});
