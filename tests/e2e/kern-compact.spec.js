import { test, expect } from '@playwright/test';
import { catalog, component, mapping, hierarchyCsv } from '../fixtures/documents.js';

test.beforeEach(async ({ page }) => {
  await page.route('https://**/*', (route) =>
    route.fulfill(
      route.request().url().endsWith('.csv')
        ? { body: hierarchyCsv, contentType: 'text/csv' }
        : { json: { tree: [] } },
    ),
  );
  await page.goto('./');
});
const file = (json) => ({
  name: 'compact.json',
  mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify(json)),
});

test('import fields and all source pickers have one clean frame and accessible labels', async ({
  page,
}) => {
  await expect(page.locator('#viewSubtitle')).toContainText('lokalen Dateien und Online-Quellen');
  for (const [tab, input, prefix, data] of [
    ['#tab-list', '#file', 'catalog', catalog],
    ['#tab-components', '#compFile', 'component', component],
    ['#tab-mappings', '#mappingFile', 'mapping', mapping],
  ]) {
    await page.locator(tab).click();
    const empty = page.locator('.workspace-empty-state:visible');
    const url = empty.getByRole('textbox', { name: 'Dokument-URL', exact: true });
    await expect(url).toBeVisible();
    expect((await empty.locator('label').first().boundingBox()).height).toBeLessThanOrEqual(1);
    const select = empty.getByRole('combobox', { name: 'Dokument aus der Bibliothek' });
    if (await select.count()) {
      const wrapper = select.locator('..');
      await expect(wrapper).toHaveCSS('border-bottom-width', '0px');
      await wrapper.hover();
      await expect(wrapper).toHaveCSS('border-bottom-width', '0px');
      await expect(select).toHaveCSS('border-bottom-width', '1px');
    }
    await page.locator(input).setInputFiles(file(data));
    const trigger = page.locator(`#${prefix}SourceButton`);
    await expect(trigger).toBeEnabled();
    await page.locator(`#${prefix}Panel > details > summary`).first().click();
    await trigger.scrollIntoViewIfNeeded();
    const label = page.locator(`label[for="${prefix}SourceButton"]`);
    const labelBox = await label.boundingBox();
    const buttonBox = await trigger.boundingBox();
    expect(buttonBox.y - labelBox.y - labelBox.height).toBeLessThanOrEqual(12);
    await expect(page.locator(`#${prefix}DatasetSelect`)).toBeHidden();
    await expect(
      page.locator(`.kern-form-input__select-wrapper #${prefix}DatasetSelect`),
    ).toHaveCount(0);
    await trigger.click();
    await expect(page.locator(`#${prefix}SourcePicker .source-item-button`)).toBeVisible();
    await page.locator(`#${prefix}SourcePicker .source-item-button`).click();
    await expect(trigger).toBeFocused();
  }
});

test('catalogue overview is compact, responsive and always identifies the active document', async ({
  page,
}) => {
  await page.locator('#tab-list').click();
  await page.locator('#file').setInputFiles(file(catalog));
  const title = page.locator('.catalog-document-title');
  await expect(title).toContainText('Geladener Katalog');
  await expect(title).toContainText(catalog.catalog.metadata.title);
  await expect(page.locator('#listTab details').first()).not.toHaveAttribute('open', '');
  expect((await page.locator('#viewSummary').boundingBox()).height).toBeLessThan(150);
  const next = structuredClone(catalog);
  next.catalog.uuid = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
  next.catalog.metadata.title = 'Zweiter Katalog mit langem Dokumenttitel';
  await page.locator('#file').setInputFiles(file(next));
  await expect(title).toContainText(next.catalog.metadata.title);
  await page.locator('#catalogPanel > details > summary').first().click();
  await page.locator('#catalogSourceButton').click();
  await page.locator('#catalogSourcePicker .source-item-button').first().click();
  await expect(title).toContainText(catalog.catalog.metadata.title);
  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
  }
});

test('mapping ID separators remain continuous for one-to-many and many-to-one rows', async ({
  page,
}) => {
  const fixture = structuredClone(mapping);
  const maps = fixture['mapping-collection'].mappings[0].maps;
  maps[0].targets.push({ 'id-ref': 'AC-2' }, { 'id-ref': 'AC-3' });
  maps.push({
    ...structuredClone(maps[0]),
    uuid: 'map-2',
    sources: [{ 'id-ref': 'SRC-2' }, { 'id-ref': 'SRC-3' }],
    targets: [{ 'id-ref': 'AC-4' }],
  });
  await page.locator('#tab-mappings').click();
  await page.locator('#mappingFile').setInputFiles(file(fixture));
  const targets = page.locator('.mapping-target-id-cell');
  await expect(targets).toHaveCount(4);
  for (const cell of await targets.all()) await expect(cell).toHaveCSS('border-left-width', '1px');
  for (const cell of await page.locator('.mapping-source-prose-cell').all())
    await expect(cell).toHaveCSS('border-left-width', '0px');
});
