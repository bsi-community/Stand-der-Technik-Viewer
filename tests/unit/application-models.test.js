import { beforeEach, test, expect } from 'vitest';
import { catalog, component } from '../fixtures/documents.js';
import { catalogStore, componentStore, sourceStore, uiStore } from '../../src/app/store.js';
import { parseCatalog } from '../../src/domain/catalog.js';
import { createComponentState } from '../../src/domain/state.js';
import { processComponentDefinition } from '../../src/app/components.js';
import { buildCatalogSourceMeta, getCatalogControlByRef } from '../../src/app/catalog-lookup.js';
import {
  getRepositoryJsonFiles,
  deduplicateRepositoryFilesByDocumentId,
  applyRepositoryMetadataCache,
} from '../../src/infrastructure/repository.js';

beforeEach(() => {
  catalogStore.state = parseCatalog(catalog);
  componentStore.componentState = createComponentState();
  sourceStore.loadedCatalogSources = [{ json: catalog, ...buildCatalogSourceMeta(catalog) }];
  sourceStore.loadedComponentSources = [];
  sourceStore.activeComponentSourceIndex = -1;
  uiStore.compEls = { countInfo: { textContent: '' } };
});
test('component parameters override catalog values and preserve capability associations', () => {
  processComponentDefinition(component);
  const model = componentStore.componentState;
  expect(model.components).toHaveLength(1);
  expect(model.capabilities).toHaveLength(1);
  const req = model.components[0].controlImplementations[0].requirements[0];
  expect(req.paramMap.p1.value).toBe('wöchentlich');
  expect(req.statements[0].paramMap).toBe(req.paramMap);
  expect(req.configCommands[0].value).toBe('show access-list');
  expect(model.capabilityComponents[model.capabilities[0].uuid][0]).toBe(model.components[0]);
  expect(uiStore.compEls.countInfo.textContent).toBe('1 Komponenten / 1 Capabilities');
});
test('catalog lookup accepts raw and display IDs', () => {
  expect(getCatalogControlByRef('AC-1')).toBe(getCatalogControlByRef('A.1'));
  expect(getCatalogControlByRef('missing')).toBeNull();
});
test('repository indexing filters excluded paths and non-JSON files', () => {
  const tree = {
    tree: [
      { type: 'blob', path: 'control_layer/topic/catalog.json' },
      { type: 'blob', path: 'control_layer/Mappings/map.json' },
      { type: 'tree', path: 'control_layer/dir.json' },
      { type: 'blob', path: 'control_layer/image.png' },
    ],
  };
  expect(
    getRepositoryJsonFiles(tree, 'control_layer/', false, ['control_layer/Mappings/']).map(
      (f) => f.name,
    ),
  ).toEqual(['catalog.json']);
});
test('repository document IDs deduplicate equivalent copies', () => {
  const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const files = [
    { path: 'long/catalog-copy.json', documentId: id },
    { path: 'catalog.json', documentId: id },
    { path: 'unknown.json', documentId: '' },
  ];
  expect(deduplicateRepositoryFilesByDocumentId(files).map((f) => f.path)).toEqual([
    'catalog.json',
    'unknown.json',
  ]);
});
test('metadata cache is accepted only for the same SHA', () => {
  const files = [{ name: 'a.json', path: 'a.json', sha: 'new' }];
  expect(
    applyRepositoryMetadataCache(files, { 'a.json': { sha: 'old', title: 'Old', documentId: '' } }),
  ).toHaveLength(1);
  expect(
    applyRepositoryMetadataCache(files, {
      'a.json': { sha: 'new', title: 'Current', documentId: '' },
    }),
  ).toHaveLength(0);
  expect(files[0].title).toBe('Current');
});
