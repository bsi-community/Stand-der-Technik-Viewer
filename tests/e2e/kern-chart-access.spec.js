import { test, expect } from '@playwright/test';
import { catalog, component, mapping, hierarchyCsv } from '../fixtures/documents.js';

async function upload(page, tab, input, json) {
  await page.locator(tab).click();
  await page.locator(input).setInputFiles({
    name: 'chart.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(json)),
  });
}

test.beforeEach(async ({ page }) => {
  await page.route('https://**/*', (route) =>
    route.fulfill(
      route.request().url().endsWith('.csv')
        ? { body: hierarchyCsv, contentType: 'text/csv' }
        : { json: { tree: [] } },
    ),
  );
  await page.goto('./');
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

for (const [mode, tab, input, fixture, nodes] of [
  ['catalog', '#tab-list', '#file', catalog, 3],
  ['component', '#tab-components', '#compFile', component, 3],
  ['mapping', '#tab-mappings', '#mappingFile', mapping, 2],
]) {
  test(`${mode}: equivalent data, keyboard zoom, responsive controls and empty-state cleanup`, async ({
    page,
  }, testInfo) => {
    await upload(page, tab, input, fixture);
    await page.locator('#tab-graph').click();
    await expect(page.locator('#graph svg')).toHaveAttribute('role', 'img');
    await expect(page.locator('#graph-data table')).toHaveCount(0);
    await page.locator('#graph-data-summary').press('Enter');
    await expect(page.locator('#graph-data-0-status')).toContainText(`${nodes} Einträgen`);
    await expect(page.locator('#graph-data-1-status')).not.toHaveText('0 Einträge');
    if (mode === 'mapping') await expect(page.locator('#graph-data')).not.toContainText('source|');
    const transform = () => page.locator('#graph svg > g').getAttribute('transform');
    await page.locator('#graph-control-fit').press('Enter');
    const before = await transform();
    await page.locator('#graph-control-in').press('Enter');
    await expect.poll(transform).not.toBe(before);
    const zoomed = await transform();
    await page.locator('#graph-control-left').press('Enter');
    await expect.poll(transform).not.toBe(zoomed);
    await expect(page.locator('#graph-control-left')).toBeFocused();
    for (const width of [1440, 800, 375, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await expect
        .poll(() => page.locator('#graph > svg').getAttribute('width'))
        .toBe(String(await page.locator('#graph').evaluate((el) => el.clientWidth)));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await expect(page.locator('#graph-control-left')).toBeFocused();
      await expect(page.locator('#graph-data')).toHaveAttribute('open', '');
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const chart of ['sunburst', 'bar']) {
      await page.locator(`#tab-${chart}`).click();
      await expect(page.locator(`#${chart} svg`)).toHaveAttribute('role', 'img');
      await page.locator(`#${chart}-data-summary`).press('Enter');
      await expect(page.locator(`#${chart}-data table`)).toHaveCount(1);
      await expect(page.locator(`#${chart}-data tbody tr`)).not.toHaveCount(0);
      await expect
        .poll(() =>
          page
            .locator(`#${chart}-data`)
            .evaluate((el, chartId) => el.previousElementSibling?.id === chartId, chart),
        )
        .toBe(true);
    }
    await page.screenshot({
      path: testInfo.outputPath(`${mode}-accessible-bar.png`),
      fullPage: true,
    });
    const panel =
      mode === 'catalog'
        ? '#catalogPanel'
        : mode === 'component'
          ? '#componentPanel'
          : '#mappingPanel';
    const query = mode === 'catalog' ? '#q' : mode === 'component' ? '#compQ' : '#mappingQ';
    await page.locator(`${panel} details[data-section="filters"] > summary`).click();
    await page.locator(query).fill('does-not-exist-abcdef');
    await expect(page.locator('#bar svg')).toHaveCount(0);
    await expect(page.locator('#bar-data')).toHaveCount(0);
  });
}

test('large graph tables paginate, keep searches on resize and open context requirements', async ({
  page,
}) => {
  const fixture = structuredClone(catalog);
  fixture.catalog.groups = [];
  fixture.catalog.controls = Array.from({ length: 1000 }, (_, i) => ({
    id: `R-${i}`,
    title: `Prüfanforderung ${i}`,
    links: i ? [{ rel: 'required', href: `#R-${i - 1}` }] : [],
  }));
  await upload(page, '#tab-list', '#file', fixture);
  await page.locator('#tab-graph').click();
  await page.locator('#graph-data-summary').press('Enter');
  await expect(page.locator('#graph-data-0-status')).toHaveText('1–50 von 1000 Einträgen');
  await expect(page.locator('#graph-data table').first().locator('tbody tr')).toHaveCount(50);
  await page.locator('#graph-data-0-next').press('Enter');
  await expect(page.locator('#graph-data-0-status')).toHaveText('51–100 von 1000 Einträgen');
  await page.locator('#graph-data-0-search').fill('Prüfanforderung 999');
  await expect(page.locator('#graph-data-0-status')).toHaveText('1–1 von 1 Einträgen');
  await page.setViewportSize({ width: 800, height: 900 });
  await expect(page.locator('#graph-data-0-search')).toBeFocused();
  await expect(page.locator('#graph-data-0-search')).toHaveValue('Prüfanforderung 999');
  await page.locator('#graph-data-0-open-0').press('Enter');
  await expect(page.locator('#card-R-999 > summary')).toBeFocused();
  await page.locator('#catalogPanel details[data-section="filters"] > summary').click();
  await page.locator('#q').fill('Prüfanforderung 999');
  await page.locator('#tab-graph').click();
  await page.locator('#graph-data-0-search').fill('R-998');
  await expect(page.locator('#graph-data table').first()).toContainText(
    'Kontext außerhalb der Filter',
  );
  await expect(page.locator('#graph-data table').nth(1)).toContainText('required');
  await page.locator('#graph-data-0-open-0').press('Enter');
  await expect(page.locator('#card-R-998 > summary')).toBeFocused();
  await expect(page.locator('#q')).toHaveValue('');
});

test('component graph table opens an implementation without requiring a loaded catalog', async ({
  page,
}) => {
  await upload(page, '#tab-components', '#compFile', component);
  await page.getByRole('button', { name: 'Alles zuklappen', exact: true }).click();
  await page.locator('#tab-graph').click();
  await page.locator('#graph-data-summary').press('Enter');
  await page
    .locator('#graph-data')
    .getByRole('button', { name: 'AC-1 öffnen', exact: true })
    .press('Enter');
  await expect(page.locator('#componentTab')).toBeVisible();
  await expect(page.locator('#componentTab .implementation-table tbody tr').first()).toBeVisible();
  await expect(page.locator('#componentTab .implementation-table tbody tr').first()).toBeFocused();
});

test('hierarchy table exposes complete parent relationships and keyboard details', async ({
  page,
}, testInfo) => {
  await upload(page, '#tab-list', '#file', catalog);
  await page.locator('#tab-target-hierarchy').click();
  await page.locator('#targetHierarchyCanvas-data-summary').press('Enter');
  await expect(page.locator('#targetHierarchyCanvas-data')).toContainText('Infrastruktur');
  await expect(page.locator('#targetHierarchyCanvas-data')).toContainText('Ein Server');
  await page.getByRole('button', { name: 'Details zu Server öffnen' }).press('Enter');
  await expect(page.locator('#targetHierarchyDetails')).toBeFocused();
  await expect(page.locator('#targetHierarchyDetails')).toContainText('Ein Server');
  for (const width of [1440, 800, 375]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: testInfo.outputPath(`hierarchy-${width}.png`), fullPage: true });
  }
});
