import { test, expect } from '@playwright/test';
import { catalog, component, mapping, hierarchyCsv } from '../fixtures/documents.js';

const root = 'https://raw.githubusercontent.com/BSI-Bund/Stand-der-Technik-Bibliothek/main/';
const paths = ['control_layer/First/alpha.json', 'control_layer/Second/beta.json'];
const ids = ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'];
function catalogs() {
  return paths.map((path, index) => {
    const json = structuredClone(catalog);
    json.catalog.uuid = ids[index];
    json.catalog.metadata.title = index ? 'Target catalog' : 'Source catalog';
    json.catalog.metadata['document-ids'] = [
      { identifier: 'unused-' + index },
      { identifier: ids[index] },
    ];
    for (const group of json.catalog.groups) group.title += ' ' + index;
    json.catalog.controls = [
      { id: 'SRC-1', title: index ? 'Wrong source title' : 'Referenced source title' },
    ];
    return json;
  });
}
function withRefs(kind, method = 'id') {
  const json = structuredClone(kind === 'component' ? component : mapping);
  const doc = json[kind === 'component' ? 'component-definition' : 'mapping-collection'];
  doc['back-matter'] = {
    resources: paths.map((path, index) => ({
      uuid: 'resource-' + index,
      title: index ? 'Target catalog' : 'Source catalog',
      ...(method === 'id' ? { 'document-ids': [{ identifier: ids[index] }] } : {}),
      rlinks: [{ href: method === 'path' ? path : 'https://outside.example/catalog.json' }],
    })),
  };
  if (kind === 'component') {
    doc.components[0]['control-implementations'][0].source = '#resource-0';
    doc.capabilities[0]['control-implementations'] = [
      {
        ...structuredClone(doc.components[0]['control-implementations'][0]),
        uuid: 'cap-impl',
        source: '#resource-1',
      },
    ];
  } else {
    doc.mappings[0]['source-resource'] = { type: 'catalog', href: '#resource-0' };
    doc.mappings[0]['target-resource'] = { type: 'catalog', href: '#resource-1' };
  }
  return json;
}
async function setup(
  page,
  { documents = catalogs(), treeStatus = 200, definitions = [], delay = null } = {},
) {
  const requests = [];
  await page.route('https://**/*', async (route) => {
    const url = route.request().url();
    requests.push(url);
    if (url.includes('api.github.com')) {
      if (delay) await delay;
      return route.fulfill({
        status: treeStatus,
        json: {
          tree: [
            ...documents.map((json, index) => ({
              type: 'blob',
              path: paths[index] || `control_layer/Other/${index}.json`,
              sha: 'sha-' + index,
            })),
            ...definitions.map((entry) => ({ type: 'blob', path: entry.path, sha: entry.path })),
          ],
        },
      });
    }
    const index = paths.findIndex((path) => url === root + path);
    if (index >= 0 && documents[index]) return route.fulfill({ json: documents[index] });
    const definition = definitions.find((entry) => url === root + entry.path);
    if (definition) return route.fulfill({ json: definition.json });
    if (url.endsWith('.csv')) return route.fulfill({ body: hierarchyCsv, contentType: 'text/csv' });
    return route.fulfill({ status: 404, body: 'Unavailable fixture' });
  });
  await page.goto('./');
  return requests;
}
async function upload(page, kind, json) {
  await page.locator(kind === 'component' ? '#tab-components' : '#tab-mappings').click();
  await page.locator(kind === 'component' ? '#compFile' : '#mappingFile').setInputFiles({
    name: kind + '.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(json)),
  });
}
const loaded = (page) => page.locator('#catalogDatasetSelect option');

test.beforeEach(async ({ page }) => {
  page.__errors = [];
  page.on('pageerror', (error) => page.__errors.push(error.message));
});
test.afterEach(async ({ page }) => expect(page.__errors).toEqual([]));

for (const kind of ['component', 'mapping']) {
  for (const method of ['id', 'path', 'title']) {
    test(`${kind} local import loads both catalogs by ${method} without leaving its workspace`, async ({
      page,
    }) => {
      const requests = await setup(page);
      await upload(page, kind, withRefs(kind, method));
      await expect(loaded(page)).toHaveCount(2);
      await expect(loaded(page)).toContainText(['Source catalog', 'Target catalog']);
      await expect(
        page.locator(kind === 'component' ? '#componentTab' : '#mappingTab'),
      ).toBeVisible();
      if (kind === 'mapping')
        await expect(page.locator('#mappingTab')).toContainText('Referenced source title');
      await expect(page.locator('#viewerImportStatus')).toHaveAttribute('data-state', 'success');
      expect(requests.filter((url) => url.includes('api.github.com'))).toHaveLength(1);
      expect(requests.filter((url) => url === root + paths[0])).toHaveLength(1);
      expect(requests.filter((url) => url === root + paths[1])).toHaveLength(1);
      expect(requests.some((url) => url.includes('outside.example'))).toBe(false);
    });
  }
}

for (const kind of ['component', 'mapping']) {
  test(`${kind} repository dropdown also loads its catalog dependencies`, async ({ page }) => {
    const path =
      kind === 'component'
        ? 'implementation_layer/Test/component.json'
        : 'control_layer/Mappings/Test/map.json';
    await setup(page, { definitions: [{ path, json: withRefs(kind) }] });
    await page.locator(kind === 'component' ? '#tab-components' : '#tab-mappings').click();
    const select = page.locator(`#workspace-${kind}-repository`);
    await expect(select).toBeEnabled();
    await select.selectOption(root + path);
    await expect(loaded(page)).toHaveCount(2);
    await expect(
      page.locator(kind === 'component' ? '#componentTab' : '#mappingTab'),
    ).toBeVisible();
  });
}

test('a missing document ID never falls back to a conflicting path or title', async ({ page }) => {
  await setup(page);
  const json = withRefs('mapping', 'path');
  for (const resource of json['mapping-collection']['back-matter'].resources)
    resource['document-ids'] = [{ identifier: 'unknown-catalog-id' }];
  await upload(page, 'mapping', json);
  await expect(page.locator('#mappingTab .mapping-entry-start')).not.toHaveCount(0);
  await expect(loaded(page)).toHaveText(['Noch kein Katalog geladen']);
  await expect(page.locator('#mappingTab')).toContainText('Kein passender Katalog');
});

test('exact path wins over conflicting title; repeated and simultaneous imports do not duplicate catalogs', async ({
  page,
}) => {
  const requests = await setup(page);
  const json = withRefs('component', 'path');
  json['component-definition']['back-matter'].resources[0].title = 'Target catalog';
  json['component-definition'].capabilities = [];
  await page.locator('#tab-components').click();
  await page.locator('#compFile').setInputFiles(
    [1, 2].map((n) => ({
      name: `component-${n}.json`,
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(json)),
    })),
  );
  await expect(page.locator('#componentDatasetSelect option')).toHaveCount(2);
  await expect(loaded(page)).toContainText(['Source catalog']);
  await upload(page, 'component', json);
  await expect(page.locator('#componentDatasetSelect option')).toHaveCount(3);
  await expect(loaded(page)).toContainText(['Source catalog']);
  expect(requests.filter((url) => url === root + paths[0])).toHaveLength(1);
});

test('already loaded local catalog is reused by document ID and keeps the active catalog', async ({
  page,
}) => {
  await setup(page);
  await page.locator('#tab-list').click();
  const existing = catalogs()[0];
  await page.locator('#file').setInputFiles({
    name: 'renamed-local.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(existing)),
  });
  await expect(loaded(page)).toContainText(['Source catalog']);
  await upload(page, 'mapping', withRefs('mapping'));
  await expect(loaded(page)).toHaveCount(2);
  await expect(page.locator('#catalogDatasetSelect')).toHaveValue('0');
});

test('relative catalog links use the source document URL and the import keeps its deep link', async ({
  page,
}) => {
  const path = 'implementation_layer/Test/component.json';
  const json = withRefs('component');
  json['component-definition'].components[0]['control-implementations'][0].source =
    '../../' + paths[0];
  json['component-definition'].capabilities = [];
  delete json['component-definition']['back-matter'];
  await setup(page, { definitions: [{ path, json }] });
  await page.locator('#tab-components').click();
  await page.locator('#workspace-component-repository').selectOption(root + path);
  await expect(loaded(page)).toContainText(['Source catalog']);
  await expect(page).toHaveURL(/kind=component/);
  expect(new URL(page.url()).searchParams.get('url')).toBe(root + path);
});

test('slow startup inventory is shared; the missing-catalog warning is not rendered prematurely', async ({
  page,
}) => {
  let release;
  const delay = new Promise((resolve) => {
    release = resolve;
  });
  const requests = await setup(page, { delay });
  await upload(page, 'mapping', withRefs('mapping'));
  await expect(page.locator('#viewerImportStatus')).toHaveAttribute('data-state', 'loading');
  await expect(page.locator('#mappingTab .mapping-entry-start')).toHaveCount(0);
  release();
  await expect(loaded(page)).toHaveCount(2);
  await expect(page.locator('#mappingTab .mapping-entry-start')).not.toHaveCount(0);
  expect(requests.filter((url) => url.includes('api.github.com'))).toHaveLength(1);
});

test('unavailable inventory does not prevent a valid local mapping import', async ({ page }) => {
  await setup(page, { treeStatus: 503 });
  await upload(page, 'mapping', withRefs('mapping'));
  await expect(page.locator('#mappingTab .mapping-entry-start')).not.toHaveCount(0);
  await expect(loaded(page)).toHaveText(['Noch kein Katalog geladen']);
  await expect(page.locator('#viewerImportStatus')).toHaveAttribute('data-state', 'success');
});

test('warm metadata cache still verifies downloads and handles one failed catalog independently', async ({
  page,
}) => {
  await setup(page);
  await expect(page.locator('.registry-count')).toContainText('2 Dokumente');
  await page.reload();
  await expect(page.locator('.registry-count')).toContainText('2 Dokumente');
  await page.route(root + paths[0], (route) => route.fulfill({ status: 503, body: 'Unavailable' }));
  await upload(page, 'mapping', withRefs('mapping'));
  await expect(loaded(page)).toContainText(['Target catalog']);
  await expect(page.locator('#mappingTab .mapping-entry-start')).not.toHaveCount(0);
  await expect(page.locator('#mappingTab')).toContainText('Kein passender Katalog');
});

test('noncatalog JSON is never added automatically even when its filename or cached title matches', async ({
  page,
}) => {
  const json = withRefs('component', 'path');
  json['component-definition'].capabilities = [];
  await setup(page, { documents: [component] });
  await upload(page, 'component', json);
  await expect(page.locator('#componentTab')).toContainText('Test-Firewall');
  await expect(loaded(page)).toHaveText(['Noch kein Katalog geladen']);
});

for (const kind of ['component', 'mapping']) {
  test(`${kind} does not resolve a conflicting loaded catalog when the document ID is unknown`, async ({
    page,
  }) => {
    await setup(page);
    await page.locator('#tab-list').click();
    await page.locator('#file').setInputFiles({
      name: 'catalog.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(catalogs()[0])),
    });
    const json = withRefs(kind, 'path');
    const doc = json[kind === 'component' ? 'component-definition' : 'mapping-collection'];
    for (const resource of doc['back-matter'].resources)
      resource['document-ids'] = [{ identifier: 'unavailable-document' }];
    await upload(page, kind, json);
    const panel = page.locator(kind === 'component' ? '#componentTab' : '#mappingTab');
    if (kind === 'component')
      await page.getByRole('button', { name: 'Alles aufklappen', exact: true }).click();
    await expect(panel).toContainText('Kein passender Katalog');
    await expect(loaded(page)).toHaveCount(1);
  });
}
