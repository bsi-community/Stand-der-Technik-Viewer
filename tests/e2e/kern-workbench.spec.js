import { test, expect } from '@playwright/test';
import { catalog } from '../fixtures/documents.js';

const tagged = {
  catalog: {
    uuid: '12a0d1ad-b4c8-46be-90fa-1df8f3f7c390',
    metadata: { title: 'Filterprüfkatalog', version: '1', 'oscal-version': '1.1.3' },
    controls: Array.from({ length: 14 }, (_, i) => ({
      id: `F-${i + 1}`,
      title: `Anforderung ${i + 1}`,
      props: [
        { name: 'label', value: `F-${i + 1}` },
        { name: 'tag', value: `Thema ${i + 1}` },
      ],
      parts: [{ name: 'statement', prose: `Prüftext ${i + 1}` }],
    })),
  },
};

async function upload(page, json, name = 'catalog.json') {
  await page.locator('#file').setInputFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(json)),
  });
}

test.beforeEach(async ({ page }) => {
  await page.route('https://**/*', (route) => route.fulfill({ json: { tree: [] } }));
});

test('workspace context, manual keyboard tab activation and return to filtered list', async ({
  page,
}) => {
  await page.goto('./?preview=catalog');
  await page.locator('#q').fill('Datensicherungen');
  await expect(page.locator('#listTab .control-card')).toHaveCount(1);
  const records = page.getByRole('tab', { name: 'Anforderungen', exact: true });
  await records.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-graph')).toBeFocused();
  await expect(records).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await expect(page.locator('#graphTab')).toBeVisible();
  await expect(page.locator('#tab-list')).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('#visualizationTabGroup [aria-selected="true"]')).toHaveCount(1);
  await page.keyboard.press('Home');
  await page.keyboard.press('Enter');
  await expect(page.locator('#listTab .control-card')).toHaveCount(1);
  await expect(page.locator('#q')).toHaveValue('Datensicherungen');
  await page.locator('#tab-components').click();
  await expect(records).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Komponenten', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

test('filter value search preserves checked values, supports mixed state and reset', async ({
  page,
}) => {
  await page.goto('./?primary_tab=list');
  await page.locator('#tab-list').click();
  await upload(page, tagged);
  await page.locator('#catalogPanel [data-section="filters"] > summary').click();
  await page.locator('#tagMS > summary').click();
  await expect(page.locator('#tagMS .viewer-option-search')).toBeVisible();
  const all = page.locator('#tagMS_all');
  await all.uncheck();
  await page.locator('#tagMS input[type="search"]').fill('Thema 14');
  await page.locator('#tagMS_menu input[data-value="Thema 14"]').check();
  await expect(page.locator('#listTab .control-card')).toHaveCount(1);
  await expect(page.locator('#tagMS > summary')).toContainText('1 / 15');
  expect(await all.evaluate((el) => el.indeterminate)).toBe(true);
  await page.locator('#tagMS input[type="search"]').fill('kein-treffer');
  await expect(page.locator('#tagMS')).toContainText('Keine passenden Filterwerte.');
  await expect(page.locator('#listTab .control-card')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('#tagMS > summary')).toBeFocused();
  await page.locator('#resetBtn').click();
  await expect(page.locator('#listTab .control-card')).toHaveCount(14);
});

test('URL imports announce pending, failure and recovery without duplicate requests', async ({
  page,
}) => {
  await page.goto('./?primary_tab=list');
  await page.locator('#tab-list').click();
  const input = page.locator('#workspace-catalog-url');
  await expect(page.getByLabel('Dokument-URL', { exact: true })).toBeVisible();
  await input.fill('https://example.org/wait.json');
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  let requests = 0;
  await page.route('https://example.org/wait.json', async (route) => {
    requests++;
    await gate;
    await route.fulfill({ status: 404, body: 'Unavailable' });
  });
  await input.press('Enter');
  await expect(page.locator('#viewerImportStatus')).toHaveAttribute('data-state', 'loading');
  await input.press('Enter');
  expect(requests).toBe(1);
  release();
  await expect(page.locator('#viewerImportStatus')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#msg')).toContainText('HTTP 404');
  await page.route('https://example.org/valid.json', (route) => route.fulfill({ json: catalog }));
  await input.fill('https://example.org/valid.json');
  await input.press('Enter');
  await expect(page.locator('#viewerImportStatus')).toHaveAttribute('data-state', 'success');
  await expect(page.locator('#listTab')).toContainText('Zugänge schützen');
  await expect(page.locator('#msg')).toBeHidden();
});

test('mixed file import batch reports failures while valid data remains available', async ({
  page,
}) => {
  await page.goto('./?primary_tab=list');
  await page.locator('#tab-list').click();
  await page.locator('#file').setInputFiles([
    {
      name: 'valid.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(catalog)),
    },
    { name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{broken') },
  ]);
  await expect(page.locator('#viewerImportStatus')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#listTab')).toContainText('Zugänge schützen');
  await upload(
    page,
    { 'component-definition': { metadata: { title: 'Falscher Dokumenttyp' } } },
    'wrong.json',
  );
  await expect(page.locator('#msg')).toContainText('Erwartet wurde');
  await expect(page.locator('#listTab')).toContainText('Zugänge schützen');
});

test('source disclosure returns keyboard focus after selection and removal', async ({ page }) => {
  await page.goto('./?primary_tab=list');
  await page.locator('#tab-list').click();
  await upload(page, catalog, 'eins.json');
  await upload(page, tagged, 'zwei.json');
  await page.locator('#catalogPanel [data-section="upload"] > summary').click();
  const trigger = page.locator('#catalogSourceButton');
  await trigger.click();
  await expect(page.locator('#catalogSourceMenu')).toHaveAttribute('role', 'group');
  await page.locator('#catalogSourceMenu .source-item-button').first().focus();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.locator('#catalogSourceMenu .source-item-button').first().click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.locator('#catalogSourceMenu .source-item-remove').first().click();
  await expect(page.locator('#catalogSourceMenu .source-item-button').first()).toBeFocused();
});

test('native metadata and modal focus isolation preserve readable requirement content', async ({
  page,
}) => {
  await page.goto('./?preview=catalog');
  const card = page.locator('#card-ORG-1');
  await expect(card.locator('dl dt').first()).toHaveText('UUID');
  await expect(card.locator('dl dd').first()).toContainText('–');
  await expect(card.locator('summary').nth(1)).toHaveText('Anforderung');
  const json = card.getByRole('button', { name: 'JSON zu ORG-1 anzeigen' });
  await json.click();
  await expect(page.locator('.wrap')).toHaveAttribute('inert', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('.wrap')).not.toHaveAttribute('inert');
  await expect(json).toBeFocused();
});

test('navigation, imports and expanded filters reflow without clipped controls', async ({
  page,
}, testInfo) => {
  await page.goto('./?preview=catalog');
  await page.locator('#effortMS > summary').click();
  for (const width of [1440, 900, 800, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(
      await page.locator('.header-nav').evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    const label = await page.locator('#visualContextLabel').boundingBox();
    const primary = await page.locator('#tab-list').boundingBox();
    expect(label.y).toBeGreaterThanOrEqual(primary.y + primary.height);
    await page.screenshot({ path: testInfo.outputPath(`workbench-${width}.png`), fullPage: true });
  }
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.locator('#effortMS_opt_0').focus();
  await expect(page.locator('#effortMS_opt_0')).toBeFocused();
});

test('empty URL validation is associated with its field and overview actions retain focus', async ({
  page,
}) => {
  await page.goto('./?primary_tab=list');
  await page.locator('#tab-list').click();
  await page.locator('#workspace-catalog-url').press('Enter');
  await expect(page.locator('#workspace-catalog-url')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#workspace-catalog-urlError')).toContainText('Dokument-URL eingeben');
  await upload(page, catalog);
  const expand = page.getByRole('button', { name: 'Alles aufklappen', exact: true });
  await expand.focus();
  await page.keyboard.press('Enter');
  await expect(expand).toBeFocused();
  await expect(page.locator('.control-card').first()).toHaveAttribute('open', '');
});
