import { test, expect } from 'vitest';
import { describeMappingResource, mappingReferenceUrl } from '../../src/domain/mapping-resource.js';

test('mapping-only references retain full paths and decode filenames without guessing versions', () => {
  const resource = describeMappingResource({ href: '../catalogs/NIST%20CSF_v2.0.json' });
  expect(resource.title).toBe('NIST CSF_v2.0.json');
  expect(resource.references).toEqual([{ value: '../catalogs/NIST%20CSF_v2.0.json', url: '' }]);
  expect(resource.versions).toEqual([]);
});

test('relative URLs use the mapping document as their base', () => {
  expect(mappingReferenceUrl('../catalog.json', 'https://example.org/maps/map.json')).toBe(
    'https://example.org/catalog.json',
  );
  expect(mappingReferenceUrl('../catalog.json')).toBe('');
  expect(mappingReferenceUrl('#local', 'https://example.org/map.json')).toBe('');
});

test.each(['javascript:alert(1)', 'data:text/html,test', 'file:///tmp/catalog.json'])(
  'unsafe reference remains text: %s',
  (href) => {
    expect(describeMappingResource({ href }).references).toEqual([{ value: href, url: '' }]);
  },
);

test('back matter resolves titles, all locations and publisher-defined version hints', () => {
  const result = describeMappingResource(
    { href: '#CATALOG', props: [{ name: 'version', ns: 'https://example.org/ns', value: '2.0' }] },
    {
      resources: [
        {
          uuid: 'catalog',
          title: 'Katalog Sicherheit',
          props: [{ name: 'document-version', ns: 'https://example.org/ns', value: '2.1' }],
          rlinks: [
            { href: '../catalog.json' },
            { href: 'https://example.org/archive/catalog.json' },
          ],
        },
      ],
    },
    'https://example.org/maps/mapping.json',
  );
  expect(result.title).toBe('Katalog Sicherheit');
  expect(result.references.map((r) => r.url)).toEqual([
    '',
    'https://example.org/catalog.json',
    'https://example.org/archive/catalog.json',
  ]);
  expect(result.versions.map((v) => [v.value, v.origin])).toEqual([
    ['2.0', 'Ressourcenreferenz'],
    ['2.1', 'Back Matter'],
  ]);
});

test('unresolved fragments and absent references remain honest and usable', () => {
  expect(describeMappingResource({ href: '#missing' }).title).toBe('#missing');
  expect(describeMappingResource().title).toBe('Katalogreferenz nicht angegeben');
  expect(describeMappingResource({ href: 'bad%escape.json' }).title).toBe('bad%escape.json');
});

test('OSCAL model versions and unrelated back matter are not catalog versions', () => {
  const result = describeMappingResource(
    { href: 'catalog.json', props: [{ name: 'oscal-version', value: '1.2.3' }] },
    { resources: [{ uuid: 'unrelated', props: [{ name: 'version', value: '9.0' }] }] },
  );
  expect(result.versions).toEqual([]);
});
