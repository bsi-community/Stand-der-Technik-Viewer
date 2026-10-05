import { test, expect } from '@playwright/test';
import { catalog, component, mapping, hierarchyCsv } from '../fixtures/documents.js';

async function upload(page, selector, json, name = 'fixture.json') {
  await page
    .locator(
      selector === '#file'
        ? '#tab-list'
        : selector === '#compFile'
          ? '#tab-components'
          : '#tab-mappings',
    )
    .click();
  await page.locator(selector).setInputFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(json)),
  });
}
test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://**/*', async (route) => {
    const url = route.request().url();
    if (url.includes('api.github.com')) return route.fulfill({ json: { tree: [] } });
    if (url.endsWith('.csv')) return route.fulfill({ body: hierarchyCsv, contentType: 'text/csv' });
    if (url === 'https://example.org/catalog.json') return route.fulfill({ json: catalog });
    if (url === 'https://example.org/component.json') return route.fulfill({ json: component });
    return route.fulfill({ status: 404, body: 'Fixture: unavailable resource' });
  });
  await page.goto('./');
  page.__errors = errors;
});
test.afterEach(async ({ page }) => {
  expect(page.__errors).toEqual([]);
});

test('start, model tabs and legacy URL preserve navigation', async ({ page }) => {
  await expect(page.locator('#homeTab')).toBeVisible();
  await page.locator('#tab-list').click();
  await expect(page.locator('#catalogPanel')).toBeVisible();
  await page.goto('Stand%20der%20Technik-Viewer.html?primary_tab=components#bookmark');
  await expect(page.locator('#componentPanel')).toBeVisible();
  await expect(page).toHaveURL(/primary_tab=components#bookmark$/);
});
test('catalog: nested controls, parameters, search, reset and diagrams', async ({ page }) => {
  await upload(page, '#file', catalog, 'catalog.json');
  await expect(page.locator('#listTab')).toContainText('Zugänge schützen');
  await expect(page.locator('#listTab')).toContainText('Privilegierte Konten');
  await page.locator('#catalogPanel details[data-section="filters"] > summary').click();
  await page.locator('#q').fill('Datensicherung');
  await expect(page.locator('#listTab')).toContainText('Datensicherung testen');
  await expect(page.locator('#listTab')).not.toContainText('Zugänge schützen');
  await page.locator('#resetBtn').click();
  await expect(page.locator('#q')).toHaveValue('');
  await expect(page.locator('#listTab')).toContainText('Zugänge schützen');
  for (const [tab, container] of [
    ['graph', 'graphTab'],
    ['sunburst', 'sunburstTab'],
    ['bar', 'barTab'],
  ]) {
    await page.locator('#tab-' + tab).click();
    await expect(page.locator('#' + container + ' svg')).toBeVisible();
  }
});
test('components: capability, implementation search and diagrams', async ({ page }) => {
  await upload(page, '#file', catalog);
  await upload(page, '#compFile', component);
  await expect(page.locator('#componentTab')).toContainText('Test-Firewall');
  await expect(page.locator('#componentTab')).toContainText('Netzwerkschutz');
  await page.locator('#componentPanel details[data-section="filters"] > summary').click();
  await page.locator('#compQ').fill('show access-list');
  await expect(page.locator('#componentTab')).toContainText('Test-Firewall');
  await page.locator('#compResetBtn').click();
  for (const [tab, container] of [
    ['graph', 'graphTab'],
    ['sunburst', 'sunburstTab'],
    ['bar', 'barTab'],
  ]) {
    await page.locator('#tab-' + tab).click();
    await expect(page.locator('#' + container + ' svg')).toBeVisible();
  }
});
test('mappings: partial coverage, gaps, search and diagrams', async ({ page }) => {
  await upload(page, '#mappingFile', mapping);
  await expect(page.locator('#mappingTab')).toContainText('SRC-1');
  await expect(page.locator('#mappingTab')).toContainText('AC-2');
  await expect(page.locator('#mappingTab')).toContainText('Partielle Abdeckung');
  await page.locator('#mappingPanel details[data-section="filters"] > summary').click();
  await page.locator('#mappingQ').fill('administrative');
  await expect(page.locator('#mappingTab')).toContainText('SRC-1');
  await page.locator('#mappingResetBtn').click();
  for (const [tab, container] of [
    ['graph', 'graphTab'],
    ['sunburst', 'sunburstTab'],
    ['bar', 'barTab'],
  ]) {
    await page.locator('#tab-' + tab).click();
    await expect(page.locator('#' + container + ' svg')).toBeVisible();
  }
});
test('deep links load remote documents and restore secondary tab', async ({ page }) => {
  await page.goto(
    './?url=https%3A%2F%2Fexample.org%2Fcatalog.json&kind=catalog&primary_tab=list&secondary_tab=bar',
  );
  await expect(page.locator('#barTab svg')).toBeVisible();
});
test('invalid input is reported and valid input recovers', async ({ page }) => {
  await page.locator('#tab-list').click();
  await page.locator('#file').setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{ invalid'),
  });
  await expect(page.locator('#msg')).toContainText(/Fehler|fehlgeschlagen|konnte/i);
  await upload(page, '#file', catalog);
  await expect(page.locator('#listTab')).toContainText('Zugänge schützen');
});

test('JSON dialog escapes document content and closes with Escape', async ({ page }) => {
  const malicious = structuredClone(catalog);
  malicious.catalog.groups[0].groups[0].controls[0].title =
    '<img src=x onerror="window.injected=true">';
  await upload(page, '#file', malicious);
  await page.getByRole('button', { name: 'Alles aufklappen', exact: true }).click();
  await page
    .locator('.control-card')
    .first()
    .getByRole('button', { name: 'JSON', exact: true })
    .click();
  await expect(page.locator('#jsonModal')).toBeVisible();
  await expect(page.locator('#jsonModalBody')).toContainText('onerror');
  await expect(page.locator('#jsonModalClose')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#jsonModalClose')).toBeFocused();
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  await page.keyboard.press('Escape');
  await expect(page.locator('#jsonModal')).toBeHidden();
  await expect(
    page.locator('.control-card').first().getByRole('button', { name: 'JSON', exact: true }),
  ).toBeFocused();
});
test('multiple sources can be switched and removed', async ({ page }) => {
  await upload(page, '#file', catalog);
  const second = {
    catalog: {
      uuid: 'another',
      metadata: { title: 'Zweiter Katalog' },
      controls: [{ id: 'B-1', title: 'Zweiter Inhalt' }],
    },
  };
  await upload(page, '#file', second);
  await expect(page.locator('#listTab')).toContainText('Zweiter Inhalt');
  await page.locator('#catalogPanel details[data-section="upload"] > summary').click();
  await page.locator('#catalogSourceButton').click();
  await page.locator('#catalogSourceMenu .source-item-button').first().click();
  await expect(page.locator('#listTab')).toContainText('Zugänge schützen');
  await page.locator('#catalogSourceButton').click();
  await page.getByRole('button', { name: 'Testkatalog Sicherheit entfernen', exact: true }).click();
  await expect(page.locator('#listTab')).toContainText('Zweiter Inhalt');
  await page.getByRole('button', { name: 'Zweiter Katalog entfernen', exact: true }).click();
  await expect(page.locator('#catalogSourceButton')).toBeDisabled();
});
test('target hierarchy renders, selects details and supports narrow viewport', async ({ page }) => {
  await upload(page, '#file', catalog);
  await page.locator('#tab-target-hierarchy').click();
  await expect(page.locator('#targetHierarchyCanvas svg')).toBeVisible();
  await expect(page.locator('#targetHierarchyCanvas')).toContainText('Server');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#targetHierarchyDetails')).toBeVisible();
  await expect(page.locator('#tab-list')).toBeVisible();
});
test('catalog and component print preparation restores UI after printing', async ({ page }) => {
  await page.evaluate(() => {
    window.print = () => {
      window.printedWithLayout = document.body.classList.contains('print-mode');
      window.dispatchEvent(new Event('afterprint'));
    };
  });
  for (const [selector, json] of [
    ['#file', catalog],
    ['#compFile', component],
  ]) {
    await upload(page, selector, json);
    await page
      .getByRole('button', { name: 'Als PDF exportieren', exact: true })
      .filter({ visible: true })
      .click();
    expect(await page.evaluate(() => window.printedWithLayout)).toBe(true);
    await expect(page.locator('body')).not.toHaveClass(/print-mode/);
  }
});
test('loaded component imports resolve and unavailable imports are explained', async ({ page }) => {
  await upload(page, '#compFile', component);
  const imported = {
    'component-definition': {
      uuid: 'parent',
      metadata: { title: 'Importierende Definition' },
      'import-component-definitions': [{ href: '#dependency' }],
      'back-matter': {
        resources: [
          {
            uuid: 'dependency',
            title: 'Abhängigkeit',
            'document-ids': [{ identifier: component['component-definition'].uuid }],
          },
        ],
      },
      components: [],
    },
  };
  await upload(page, '#compFile', imported);
  await expect(page.locator('#componentTab')).toContainText('Test-Firewall');
  const missing = structuredClone(imported);
  missing['component-definition']['back-matter'].resources[0]['document-ids'][0].identifier =
    'missing';
  await upload(page, '#compFile', missing);
  await expect(page.locator('#componentTab')).toContainText('nicht hochgeladen');
});
test('repository errors and failed URL imports leave local loading available', async ({ page }) => {
  await page.route('https://api.github.com/**', (route) =>
    route.fulfill({ status: 503, body: 'Unavailable' }),
  );
  await page.goto('./?url=https%3A%2F%2Fexample.org%2Funavailable.json&kind=catalog');
  await expect(page.locator('#msg')).toContainText('HTTP 404');
  await upload(page, '#file', catalog);
  await expect(page.locator('#listTab')).toContainText('Zugänge schützen');
});

test('component cross-navigation opens the matching catalog requirement', async ({ page }) => {
  await upload(page, '#file', catalog);
  await upload(page, '#compFile', component);
  await page.getByRole('button', { name: 'Alles aufklappen', exact: true }).click();
  await page.getByRole('button', { name: 'Im Katalog öffnen', exact: true }).first().click();
  await expect(page.locator('#listTab')).toBeVisible();
  await expect(page.locator('.control-card').first()).toHaveAttribute('open', '');
  await expect(page.locator('.control-card').first()).toContainText('Zugänge schützen');
});

test('repository search resolves metadata and opens its catalog', async ({ page }) => {
  await page.route('https://api.github.com/**', (route) =>
    route.fulfill({
      json: {
        tree: [
          { type: 'blob', path: 'control_layer/Test/catalog.json', sha: 'catalog-sha' },
          { type: 'blob', path: 'implementation_layer/Test/component.json', sha: 'component-sha' },
        ],
      },
    }),
  );
  await page.route('https://raw.githubusercontent.com/**/catalog.json', (route) =>
    route.fulfill({ json: catalog }),
  );
  await page.route('https://raw.githubusercontent.com/**/component.json', (route) =>
    route.fulfill({ json: component }),
  );
  await page.reload();
  await expect(page.getByText('2 Dokumente in 2 Modelltypen', { exact: true })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Repository-Dokumente suchen' }).fill('Testkatalog');
  await page.getByRole('button', { name: 'Suchen', exact: true }).click();
  await page
    .locator('#homeTab')
    .getByRole('button')
    .filter({ hasText: 'Testkatalog Sicherheit' })
    .click();
  await expect(page.locator('#listTab')).toBeVisible();
  await expect(page.locator('#listTab')).toContainText('Zugänge schützen');
});
test('catalog group checkbox filters compose with search and reset', async ({ page }) => {
  const input = structuredClone(catalog);
  input.catalog.groups.push({
    id: 'group-b',
    title: 'Zusätzliche Gruppe',
    controls: [{ id: 'B.1', title: 'Zusätzlicher Inhalt' }],
  });
  await upload(page, '#file', input);
  await page.locator('#catalogPanel details[data-section="filters"] > summary').click();
  await page.locator('#groupMS > summary').click();
  await page.locator('#groupMS_menu input[data-value="group-a"]').uncheck();
  await page.locator('#groupMS_menu input[data-value="group-b"]').check();
  await expect(page.locator('#listTab')).toContainText('Zusätzlicher Inhalt');
  await expect(page.locator('#listTab')).not.toContainText('Zugänge schützen');
  await page.locator('#q').fill('nichtvorhanden');
  await expect(page.locator('#listTab .control-card')).toHaveCount(0);
  await page.locator('#resetBtn').click();
  await expect(page.locator('#listTab .control-card')).toHaveCount(4);
});
