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
test('mapping headers identify missing catalogs and update after loading and removing them', async ({
  page,
}, testInfo) => {
  await upload(page, '#mappingFile', mapping);
  const source = page.locator('.mapping-source-context');
  const target = page.locator('.mapping-target-context');
  await expect(source).toContainText('source.json');
  await expect(target).toContainText('catalog.json');
  await expect(target.getByRole('link')).toHaveAttribute(
    'href',
    'https://example.org/catalog.json',
  );
  await expect(target).toContainText('Katalogversion im Mapping nicht angegeben');
  await expect(target).toContainText(
    'Für Titel und Anforderungstexte in der Katalogansicht laden.',
  );
  await expect(target.locator('details')).toHaveCount(0);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page
    .locator('.mapping-table')
    .screenshot({ path: testInfo.outputPath('mapping-only.png') });
  await page.setViewportSize({ width: 1440, height: 1000 });

  await upload(page, '#file', catalog, 'catalog.json');
  await page.locator('#tab-mappings').click();
  await expect(target).toContainText('Testkatalog Sicherheit');
  await expect(target).toContainText('Zugeordneter Katalog geladen · Version 1.0.0');
  await expect(target).toContainText('Katalogversion im Mapping nicht angegeben');
  await expect(page.locator('.mapping-target-title-cell')).toContainText('Zugänge schützen');
  await expect(page.locator('.mapping-target-prose-cell')).toContainText('monatlich');
  await expect(source).toContainText('in der Katalogansicht laden');

  await page.locator('#tab-list').click();
  await page.locator('#catalogPanel details[data-section="upload"] > summary').click();
  await page.locator('#catalogSourceButton').click();
  await page.getByRole('button', { name: 'Testkatalog Sicherheit entfernen', exact: true }).click();
  await page.locator('#tab-mappings').click();
  await expect(target).toContainText('catalog.json');
  await expect(target).not.toContainText('Zugeordneter Katalog geladen');
  await expect(target).toContainText('in der Katalogansicht laden');
});

test('mapping headers resolve back matter, distinguish versions and respect filtered resource pairs', async ({
  page,
}) => {
  const fixture = structuredClone(mapping);
  const doc = fixture['mapping-collection'];
  doc.metadata.version = 'MAPPING-9';
  const group = doc.mappings[0];
  group['source-resource'] = { type: 'catalog', href: '#source' };
  group['target-resource'] = {
    type: 'catalog',
    href: 'https://example.org/catalog.json',
    props: [{ name: 'version', ns: 'https://example.org/ns', value: '0.8' }],
  };
  doc['back-matter'] = {
    resources: [
      {
        uuid: 'source',
        title: 'Source-Katalog mit Version',
        props: [{ name: 'version', ns: 'https://example.org/ns', value: '2.0' }],
        rlinks: [{ href: '../catalogs/source-v2.json' }],
      },
    ],
  };
  doc.mappings.push(structuredClone(group));
  doc.mappings.push({
    ...structuredClone(group),
    'source-resource': { href: 'other.json' },
    maps: [
      {
        relationship: 'equal-to',
        sources: [{ 'id-ref': 'OTHER' }],
        targets: [{ 'id-ref': 'AC-2' }],
      },
    ],
  });
  await upload(page, '#file', catalog, 'catalog.json');
  await upload(page, '#mappingFile', fixture);
  const source = page.locator('.mapping-source-context');
  const target = page.locator('.mapping-target-context');
  await expect(source.locator('.mapping-catalog-context')).toHaveCount(2);
  await expect(source).toContainText('Source-Katalog mit Version');
  await expect(source).toContainText('../catalogs/source-v2.json');
  await expect(source.getByRole('link')).toHaveCount(0);
  await expect(source).toContainText('Versionsangabe im Mapping: 2.0');
  await expect(target).toContainText('Versionsangabe im Mapping: 0.8');
  await expect(target).toContainText('Zugeordneter Katalog geladen · Version 1.0.0');
  await expect(source).not.toContainText('MAPPING-9');
  await page.locator('#mappingPanel details[data-section="filters"] > summary').click();
  await page.locator('#mappingQ').fill('OTHER');
  await expect(source.locator('.mapping-catalog-context')).toHaveCount(1);
  await expect(source).toContainText('other.json');
  await expect(source).not.toContainText('source-v2');
});

test('mapping header escapes content and wraps long references within the table', async ({
  page,
}) => {
  const fixture = structuredClone(mapping);
  const longPath = '../' + 'long-directory-'.repeat(30) + '/catalog.json';
  fixture['mapping-collection'].mappings[0]['source-resource'] = {
    href: longPath,
    title: '<img src=x onerror="window.injected=true">',
  };
  fixture['mapping-collection'].mappings[0]['target-resource'] = { href: 'javascript:alert(1)' };
  await upload(page, '#mappingFile', fixture);
  await expect(page.locator('.mapping-source-context')).toContainText('<img src=x');
  await expect(page.locator('.mapping-source-context img')).toHaveCount(0);
  await expect(page.locator('.mapping-target-context a')).toHaveCount(0);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const size = await page.locator('.mapping-source-context').evaluate((cell) => ({
      width: cell.clientWidth,
      content: cell.scrollWidth,
    }));
    expect(size.content).toBeLessThanOrEqual(size.width + 1);
  }
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
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
