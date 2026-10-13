import { test, expect } from '@playwright/test';
import { catalog, component, mapping, hierarchyCsv } from '../fixtures/documents.js';

const prefix = 'control_layer/Mappings/';
const firstPath = prefix + 'Thema mit Leerzeichen/Unterthema/A-map.json';
const secondPath = prefix + 'Weiteres Thema/B-map.json';
const rawRoot = 'https://raw.githubusercontent.com/BSI-Bund/Stand-der-Technik-Bibliothek/main/';
const rawUrl = (path) => rawRoot + path.split('/').map(encodeURIComponent).join('/');
const entry = (path, sha = path) => ({ type: 'blob', path, sha });
const titledMapping = (title) => {
  const json = structuredClone(mapping);
  json['mapping-collection'].metadata.title = title;
  return json;
};

async function repository(page, { tree, status = 200, truncated = false } = {}) {
  await page.route('https://**/*', (route) => {
    const url = route.request().url();
    if (url.includes('api.github.com'))
      return route.fulfill({ status, json: { tree: tree ?? [entry(firstPath)], truncated } });
    if (url.endsWith('.csv')) return route.fulfill({ body: hierarchyCsv, contentType: 'text/csv' });
    if (url === rawUrl(firstPath)) return route.fulfill({ json: mapping });
    if (url === rawUrl(secondPath))
      return route.fulfill({ json: titledMapping('Zweites Mapping') });
    if (url.endsWith('/catalog.json')) return route.fulfill({ json: catalog });
    if (url.endsWith('/component.json')) return route.fulfill({ json: component });
    return route.fulfill({ status: 404, body: 'Unavailable fixture' });
  });
}

test.beforeEach(async ({ page }) => {
  page.__errors = [];
  page.on('pageerror', (error) => page.__errors.push(error.message));
});
test.afterEach(async ({ page }) => expect(page.__errors).toEqual([]));

test('third card browses nested mappings and opens the selected mapping with the keyboard', async ({
  page,
}) => {
  await repository(page, {
    tree: [
      entry(firstPath),
      entry(secondPath),
      entry('control_layer/Test/catalog.json'),
      entry('implementation_layer/Test/component.json'),
      entry(prefix + 'README.md'),
    ],
  });
  await page.goto('./');
  await expect(page.locator('.registry-count')).toHaveText('4 Dokumente in 3 Modelltypen');
  const cards = page.locator('.registry-model-card');
  await expect(cards.locator('h3')).toHaveText(['Kataloge', 'Komponentendefinitionen', 'Mappings']);
  const componentBox = await cards.nth(1).boundingBox();
  const mappingBox = await cards.nth(2).boundingBox();
  expect(mappingBox.x).toBeGreaterThan(componentBox.x + componentBox.width);
  expect(mappingBox.y).toBe(componentBox.y);
  await cards.nth(2).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.registry-document-title')).toHaveText([
    'Testmapping',
    'Zweites Mapping',
  ]);
  await expect(page.locator('.registry-document-badge')).toHaveText([
    'Mapping Collection',
    'Mapping Collection',
  ]);
  await page.locator('.registry-document-row').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#mappingTab')).toBeVisible();
  await expect(page.locator('#mappingFileInfo')).toContainText('Testmapping');
  await expect(page.locator('.mapping-entry-start')).not.toHaveCount(0);
  await expect(page.locator('#mappingTab')).toBeFocused();
});

test('global repository search includes mapping metadata titles', async ({ page }) => {
  await repository(page);
  await page.goto('./');
  await expect(page.locator('.registry-count')).toHaveText('1 Dokumente in 3 Modelltypen');
  await page.getByRole('searchbox', { name: 'Bibliothek durchsuchen' }).fill('Testmapping');
  await page.keyboard.press('Enter');
  await expect(page.locator('.registry-document-title')).toHaveText(['Testmapping']);
  await page.locator('.registry-document-row').click();
  await expect(page.locator('#mappingFileInfo')).toContainText('Testmapping');
});

for (const source of ['sidebar', 'empty']) {
  test(`${source} repository select loads a mapping and retains the other model selections`, async ({
    page,
  }) => {
    await repository(page, {
      tree: [
        entry(firstPath),
        entry('control_layer/Test/catalog.json'),
        entry('implementation_layer/Test/component.json'),
      ],
    });
    await page.goto('./');
    await page.locator('#tab-mappings').click();
    await expect(page.locator('#workspace-mapping-repository')).toBeEnabled();
    await expect(page.locator('#workspace-mapping-repository option')).toHaveText([
      'Aus dem Repository auswählen',
      'Testmapping',
    ]);
    await expect(page.locator('#bsiMappingSelect option')).toHaveText([
      'Aus dem Repository auswählen',
      'Testmapping',
    ]);
    await expect(page.locator('#bsiCatalogSelect option')).toHaveText([
      'Aus dem Repository auswählen',
      'Testkatalog Sicherheit',
    ]);
    await expect(page.locator('#bsiComponentSelect option')).toHaveText([
      'Aus dem Repository auswählen',
      'Testdefinition Infrastruktur',
    ]);
    if (source === 'sidebar')
      await page.locator('#mappingPanel [data-section="upload"] > summary').click();
    const select = page.locator(
      source === 'sidebar' ? '#bsiMappingSelect' : '#workspace-mapping-repository',
    );
    await expect(select).toBeVisible();
    await select.selectOption({ label: 'Testmapping' });
    await expect(page.locator('#mappingFileInfo')).toContainText('Testmapping');
    await expect(page.locator('#mappingTab .workspace-empty-state')).toHaveCount(0);
    await expect(page.locator('#bsiMappingSelect')).toHaveValue('');
  });
}

test('reload refreshes the tree, drops removed mappings and refreshes changed metadata', async ({
  page,
}) => {
  let version = 0;
  let treeRequests = 0;
  await repository(page);
  await page.route('https://api.github.com/**', (route) => {
    treeRequests++;
    return route.fulfill({
      json: {
        tree:
          version === 0
            ? [entry(firstPath, 'old')]
            : version === 1
              ? [entry(firstPath, 'new'), entry(secondPath)]
              : [entry(secondPath)],
      },
    });
  });
  await page.route(rawUrl(firstPath), (route) =>
    route.fulfill({ json: titledMapping(version ? 'Aktualisiertes Mapping' : 'Altes Mapping') }),
  );
  await page.goto('./');
  await expect(page.locator('#bsiMappingSelect option')).toHaveText([
    'Aus dem Repository auswählen',
    'Altes Mapping',
  ]);
  version = 1;
  await page.reload();
  await expect(page.locator('#bsiMappingSelect option')).toHaveText([
    'Aus dem Repository auswählen',
    'Aktualisiertes Mapping',
    'Zweites Mapping',
  ]);
  version = 2;
  await page.reload();
  await page.locator('#tab-mappings').click();
  await expect(page.locator('#workspace-mapping-repository option')).toHaveText([
    'Aus dem Repository auswählen',
    'Zweites Mapping',
  ]);
  expect(treeRequests).toBe(3);
});

test('mapping dropdown created while the repository loads updates when the request finishes', async ({
  page,
}) => {
  await repository(page);
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('https://api.github.com/**', async (route) => {
    await pending;
    await route.fulfill({ json: { tree: [entry(firstPath)] } });
  });
  await page.goto('./');
  await page.locator('#tab-mappings').click();
  await expect(page.locator('#workspace-mapping-repository')).toBeDisabled();
  await expect(page.locator('[data-workspace-repository-status="mapping"]')).toContainText(
    'abgerufen',
  );
  release();
  await expect(page.locator('#workspace-mapping-repository')).toBeEnabled();
  await expect(page.locator('[data-workspace-repository-status="mapping"]')).toHaveText(
    '1 aktuelle Mappings verfügbar.',
  );
});

for (const failure of ['unavailable', 'truncated', 'empty']) {
  test(`repository ${failure} leaves local mapping import available`, async ({ page }) => {
    await repository(page, {
      status: failure === 'unavailable' ? 503 : 200,
      truncated: failure === 'truncated',
      tree: failure === 'empty' ? [] : [entry(firstPath)],
    });
    await page.goto('./');
    await page.locator('#tab-mappings').click();
    const status = page.locator('[data-workspace-repository-status="mapping"]');
    await expect(status).toContainText(
      failure === 'empty' ? '0 aktuelle Mappings' : 'nicht erreichbar',
    );
    await expect(page.locator('#workspace-mapping-repository')).toBeDisabled();
    await expect(page.locator('#bsiMappingSelect')).toBeDisabled();
    await page.locator('#mappingFile').setInputFiles({
      name: 'mapping.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(mapping)),
    });
    await expect(page.locator('#mappingFileInfo')).toContainText('Testmapping');
  });
}

test('repository retry recovers mapping dropdowns; a failed download keeps the empty state usable', async ({
  page,
}) => {
  await repository(page, { status: 503 });
  await page.goto('./');
  await expect(page.locator('#registryRetry')).toBeVisible();
  await repository(page);
  await page.locator('#registryRetry').click();
  await expect(page.locator('#bsiMappingSelect')).toBeEnabled();
  await page.route(rawUrl(firstPath), (route) =>
    route.fulfill({ status: 503, body: 'Unavailable' }),
  );
  await page.locator('#tab-mappings').click();
  await page.locator('#workspace-mapping-repository').selectOption({ label: 'Testmapping' });
  await expect(page.locator('#msg')).toContainText('HTTP 503');
  await expect(page.locator('#workspace-mapping-repository')).toBeEnabled();
  await expect(page.locator('#workspace-mapping-repository')).toHaveValue('');
});

for (const width of [375, 820]) {
  test(`mapping card and empty-state import fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await repository(page);
    await page.goto('./');
    await expect(page.locator('.registry-count')).toHaveText('1 Dokumente in 3 Modelltypen');
    for (const card of await page.locator('.registry-model-card').all()) {
      const box = await card.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
    await page.locator('#tab-mappings').click();
    await expect(page.locator('#workspace-mapping-repository')).toBeVisible();
    const box = await page.locator('#workspace-mapping-repository').boundingBox();
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}
