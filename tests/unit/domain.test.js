import { describe, test, expect } from 'vitest';
import { catalog, mapping, hierarchyCsv } from '../fixtures/documents.js';
import { parseCatalog } from '../../src/domain/catalog.js';
import { parseMappingCollection } from '../../src/domain/mapping.js';
import {
  createCatalogState,
  createComponentState,
  createMappingState,
} from '../../src/domain/state.js';
import {
  buildTargetHierarchy,
  parseTargetHierarchyCsv,
} from '../../src/domain/target-hierarchy.js';
import { buildParamMap, mergeParamMaps, replaceParams } from '../../src/domain/parameters.js';
import {
  detectOscalKind,
  normalizeOscalKind,
  getOscalDocumentIdentifier,
} from '../../src/domain/documents.js';
import {
  parseSearchQuery,
  matchesSearchText,
  getSearchHighlightPatterns,
  getSearchHighlightRanges,
} from '../../src/shared/search.js';
import { escapeHtml } from '../../src/shared/html.js';

describe('catalog model', () => {
  test('retains nested controls, labels, raw references and relationships', () => {
    const model = parseCatalog(catalog);
    expect(model.controls.map((c) => c.rawId)).toEqual(['AC-1', 'AC-1.1', 'AC-2']);
    expect(model.idMap.get('AC-1')).toBe(model.idMap.get('A.1'));
    expect(model.controls[1]).toMatchObject({ parentId: 'A.1', enhDepth: 1 });
    expect(model.edgesBase).toEqual([{ source: 'A.1', target: 'AC-2', rel: 'related' }]);
    expect(model.controls[0].paramMap.p1.value).toBe('monatlich');
    expect(model.hasTargetObjectCategories).toBe(true);
  });
  test('does not overwrite previous model or input', () => {
    const input = structuredClone(catalog),
      before = structuredClone(input);
    const previous = createCatalogState();
    previous.qRaw = 'keep';
    previous.catalogBaseUrl = 'https://example.org/catalog.json';
    const model = parseCatalog(input, previous);
    expect(previous.controls).toEqual([]);
    expect(model.qRaw).toBe('keep');
    expect(model.catalogBaseUrl).toBe(previous.catalogBaseUrl);
    expect(input).toEqual(before);
  });
  test('handles ungrouped and empty catalogs', () => {
    expect(
      parseCatalog({ catalog: { controls: [{ id: 'x', title: 'X' }] } }).ungroupedControls,
    ).toHaveLength(1);
    expect(parseCatalog({ catalog: {} }).controls).toEqual([]);
    expect(() => parseCatalog(null)).toThrow();
  });
  test('independent state factories', () => {
    for (const factory of [createCatalogState, createComponentState, createMappingState])
      expect(factory()).not.toBe(factory());
  });
});
describe('mapping model', () => {
  test('preserves relationship, notes, qualifiers, gap IDs and warnings', () => {
    const model = parseMappingCollection(mapping, 'https://example.org/map.json');
    expect(model.entries).toHaveLength(1);
    expect(model.entries[0]).toMatchObject({
      relationship: 'intersects-with',
      sourceRefs: ['SRC-1'],
      targetRefs: ['AC-1'],
    });
    expect(model.entries[0].searchText).toContain('administrative');
    expect(model.gapGroups[0].ids).toEqual(['AC-2']);
    expect(model.gapWarnings).toHaveLength(1);
    expect(model.baseUrl).toBe('https://example.org/map.json');
  });
  test('accepts singular mapping/map forms and rejects wrong root', () => {
    const group = structuredClone(mapping['mapping-collection'].mappings[0]);
    group.map = group.maps[0];
    delete group.maps;
    expect(
      parseMappingCollection({ 'mapping-collection': { mapping: group } }).entries,
    ).toHaveLength(1);
    expect(() => parseMappingCollection(catalog)).toThrow();
  });
});
describe('search semantics', () => {
  test.each([
    ['konten prüfen', 'Konten regelmäßig prüfen', true],
    ['konten prüfen', 'Konten sperren', false],
    ['konten ODER backup', 'Backup testen', true],
    ['"konto"', 'Benutzerkonto', false],
    ['"konto"', 'Ein Konto.', true],
    ['"sicherer betrieb"', 'Ein sicherer Betrieb hilft', true],
    ['', 'Beliebiger Inhalt', true],
  ])('%s matches %s: %s', (query, text, expected) =>
    expect(matchesSearchText(text, parseSearchQuery(query))).toBe(expected),
  );
  test('highlight ranges do not overlap', () =>
    expect(
      getSearchHighlightRanges('Sicherer Betrieb', getSearchHighlightPatterns('sicher sicherer')),
    ).toEqual([{ start: 0, end: 8 }]));
});
describe('parameters and safety', () => {
  test('scoped override and fallback label', () => {
    const base = buildParamMap([
      { id: 'P1', label: 'Intervall', values: ['monatlich'] },
      { id: 'p2', label: 'Rolle' },
    ]);
    const merged = mergeParamMaps(
      base,
      buildParamMap([{ 'param-id': 'p1', values: ['wöchentlich'] }], 'param-id'),
    );
    expect(replaceParams('{{ insert: param, P1 }} / {{ insert: param, p2 }}', merged)).toBe(
      '{{ value:wöchentlich }} / {{ label:Rolle }}',
    );
    expect(base.p1.value).toBe('monatlich');
    expect(replaceParams('{{ insert: param, unknown }}', merged)).toBe(
      '{{ insert: param, unknown }}',
    );
  });
  test('escapes untrusted HTML', () =>
    expect(escapeHtml('<script>"&</script>')).toBe('&lt;script&gt;&quot;&amp;&lt;/script&gt;'));
});
describe('target hierarchy', () => {
  test('builds parents and ancestors', () => {
    const model = buildTargetHierarchy(hierarchyCsv);
    expect(model.ancestorsByName.server).toEqual(['Infrastruktur']);
    expect(model.roots).toHaveLength(1);
    expect(model.maxDepth).toBe(1);
  });
  test('CSV quotes, BOM, CRLF and multiline fields', () => {
    expect(parseTargetHierarchyCsv('\uFEFFa,b\r\n"a,b","line\nnext"\r\n')).toEqual([
      ['a', 'b'],
      ['a,b', 'line\nnext'],
    ]);
    expect(() => parseTargetHierarchyCsv('"open')).toThrow();
  });
  test('rejects invalid headers, missing parents, duplicate IDs and cycles', () => {
    expect(() => buildTargetHierarchy('a,b\nx,y')).toThrow();
    expect(() =>
      buildTargetHierarchy(
        hierarchyCsv.replace(
          'Server,Ein Server,Technik,Host,aaaaaaaa',
          'Server,Ein Server,Technik,Host,cccccccc',
        ),
      ),
    ).toThrow();
    expect(() => buildTargetHierarchy(hierarchyCsv + hierarchyCsv.split('\n')[1] + '\n')).toThrow();
    expect(() =>
      buildTargetHierarchy(
        hierarchyCsv.replace(
          'Technik,,,aaaaaaaa',
          'Technik,,bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb,aaaaaaaa',
        ),
      ),
    ).toThrow(/Zyklus/);
  });
});
describe('model contracts', () => {
  test.each([
    ['catalog', 'catalog'],
    ['component_definition', 'component'],
    ['mapping-collection', 'mapping'],
    ['SSP', ''],
  ])('normalizes %s', (input, expected) => expect(normalizeOscalKind(input)).toBe(expected));
  test('unsupported future models stay out of scope', () => {
    expect(detectOscalKind(catalog)).toBe('catalog');
    expect(detectOscalKind({ 'system-security-plan': {} })).toBe('');
  });
  test('normalizes document IDs', () =>
    expect(
      getOscalDocumentIdentifier({
        catalog: {
          metadata: {
            'document-ids': [{ identifier: 'urn:uuid:AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA' }],
          },
        },
      }),
    ).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'));
});
