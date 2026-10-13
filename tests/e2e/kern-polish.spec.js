import { test, expect } from '@playwright/test';
import { catalog, mapping, hierarchyCsv } from '../fixtures/documents.js';

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
const upload = async (page, tab, input, json) => {
  await page.locator(tab).click();
  await page.locator(input).setInputFiles({
    name: 'polish.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(json)),
  });
};

test('fresh visits and reloads start at home, document links still open their target', async ({
  page,
}) => {
  await page.goto('./?primary_tab=mappings&secondary_tab=graph');
  await expect(page.locator('#homeTab')).toBeVisible();
  await expect(page.locator('header h1')).toContainText('Stand der Technik-Viewer');
  await page.locator('#tab-list').click();
  await page.reload();
  await expect(page.locator('#homeTab')).toBeVisible();
  await page.route('https://example.org/catalog.json', (route) => route.fulfill({ json: catalog }));
  await page.goto('./?url=https%3A%2F%2Fexample.org%2Fcatalog.json&kind=catalog&secondary_tab=bar');
  await expect(page.locator('#bar svg')).toBeVisible();
});

test('hierarchy table keeps words intact; details scroll the page while diagram wheel zooms', async ({
  page,
}) => {
  await upload(page, '#tab-list', '#file', catalog);
  await page.locator('#tab-target-hierarchy').click();
  const details = page.locator('.target-hierarchy-details');
  await details.hover();
  const initial = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 230);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(initial);
  const canvas = page.locator('.target-hierarchy-canvas svg');
  await canvas.hover();
  const before = await canvas.locator('g').first().getAttribute('transform');
  const beforeScroll = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, -200);
  await expect.poll(() => canvas.locator('g').first().getAttribute('transform')).not.toBe(before);
  expect(await page.evaluate(() => scrollY)).toBe(beforeScroll);
  await page.getByText('Diagrammdaten als Tabelle', { exact: true }).click();
  const table = page.locator('.viewer-chart-data table');
  const button = table.getByRole('button').first();
  expect(await button.evaluate((el) => getComputedStyle(el).whiteSpace)).toBe('nowrap');
  expect(
    await table
      .locator('thead th')
      .first()
      .evaluate((el) => el.clientWidth),
  ).toBeGreaterThan(140);
  await page.setViewportSize({ width: 375, height: 900 });
  // Resizing rebuilds the hierarchy after a debounce. Resolve and measure the
  // current table together so a detached, zero-width table cannot fail the check.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const currentTable = document.querySelector('.viewer-chart-data table');
        const wrapper = currentTable?.parentElement;
        return {
          pageFits: document.documentElement.scrollWidth <= innerWidth,
          tableVisible: Boolean(currentTable?.getClientRects().length),
          wrapperFits: Boolean(
            wrapper && wrapper.clientWidth > 0 && wrapper.clientWidth <= innerWidth,
          ),
          tableOverflows: Boolean(wrapper && currentTable.scrollWidth > wrapper.clientWidth),
        };
      }),
    )
    .toEqual({ pageFits: true, tableVisible: true, wrapperFits: true, tableOverflows: true });
});

test('sunburst labels fit radial text and preserve readable narrow sectors', async ({ page }) => {
  const fixture = structuredClone(catalog);
  fixture.catalog.groups = [97, 3, 1].map((weight, i) => ({
    id: ['BIG', 'SMALL', 'TINY'][i],
    title: ['BIG', 'SMALL', 'TINY'][i],
    controls: Array.from({ length: weight }, (_, j) => ({
      id: `G${i}-${j}`,
      title: `Requirement ${i}-${j}`,
    })),
  }));
  await upload(page, '#tab-list', '#file', fixture);
  await page.locator('#tab-sunburst').click();
  const labels = page.locator('.sunburst-segment-label');
  await expect(labels.filter({ hasText: 'SMALL' })).toHaveCount(1);
  await expect(labels.filter({ hasText: 'TINY' })).toHaveCount(0);
});

test('mapping metadata is expanded clearly; relationship help is centered and accessible', async ({
  page,
}) => {
  const fixture = structuredClone(mapping);
  fixture['mapping-collection'].metadata.props = [
    {
      name: 'review-scope',
      value: 'A complete long description '.repeat(12),
      ns: 'https://example.org/ns',
      remarks: 'Property remarks retained',
    },
  ];
  fixture['mapping-collection'].provenance = {
    method: 'automation',
    'matching-rationale': 'semantic',
    status: 'draft',
    'mapping-description': 'Long methodology description '.repeat(15),
    props: [{ name: 'review-method', value: 'Documented source analysis' }],
  };
  await upload(page, '#tab-mappings', '#mappingFile', fixture);
  await page.locator('.mapping-document-details > summary').click();
  const info = page.locator('.mapping-document-details');
  await expect(info.locator('details')).toHaveCount(0);
  await expect(info).toContainText('Property remarks retained');
  const prose = info
    .locator('.viewer-description-list-item--wide')
    .filter({ hasText: 'Beschreibung der Zuordnung' })
    .first();
  expect((await prose.boundingBox()).width).toBeGreaterThan(600);
  const trigger = page.locator('.mapping-relationship-trigger').first();
  await trigger.focus();
  const tip = page.locator('.mapping-relationship-tooltip:popover-open');
  await expect(tip).toContainText('Deutsche Übersetzung');
  const buttonBox = await trigger.boundingBox();
  const cellBox = await trigger.locator('..').boundingBox();
  expect(Math.abs(buttonBox.x + buttonBox.width / 2 - cellBox.x - cellBox.width / 2)).toBeLessThan(
    2,
  );
  await trigger.press('Escape');
  await expect(tip).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(tip).toBeVisible();
  await page.setViewportSize({ width: 375, height: 900 });
  await trigger.click();
  await expect(tip).toBeVisible();
  const tipBox = await tip.boundingBox();
  expect(tipBox.x).toBeGreaterThanOrEqual(0);
  expect(tipBox.x + tipBox.width).toBeLessThanOrEqual(375);
});
