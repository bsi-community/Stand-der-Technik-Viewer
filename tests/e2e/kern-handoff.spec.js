import { test, expect } from '@playwright/test';
import { catalog, hierarchyCsv } from '../fixtures/documents.js';

test.beforeEach(async ({ page }) => {
  await page.route('https://**/*', (route) =>
    route.fulfill(
      route.request().url().endsWith('.csv')
        ? { body: hierarchyCsv, contentType: 'text/csv' }
        : { json: { tree: [] } },
    ),
  );
});

test('normal entry and import have no comparison chrome or panel focus frame', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.kern-preview-bar')).toHaveCount(0);
  await page.locator('#tab-list').click();
  await page.locator('#file').setInputFiles({
    name: 'catalog.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(catalog)),
  });
  const panel = page.locator('#listTab');
  await expect(panel).toHaveAttribute('tabindex', '-1');
  // Also cover a focus transfer after a loader removes its trigger.
  await panel.focus();
  await expect(panel).toBeFocused();
  await expect(panel).toHaveCSS('outline-style', 'none');
  await page.keyboard.press('Tab');
  expect(await panel.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)).not.toBe(
    'none',
  );
  await expect(page.locator('.kern-preview-bar, .kern-demo-note')).toHaveCount(0);
});

test('filter counts stay beside names and the help does not narrow the target field', async ({
  page,
}) => {
  await page.goto('./?preview=catalog');
  for (const width of [1440, 1000, 800, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const result = await page.locator('#catalogPanel').evaluate((panel) => {
      const filters = [...panel.querySelectorAll('details.ms')].filter(
        (el) => el.getBoundingClientRect().width,
      );
      return filters.map((el) => {
        const summary = el.querySelector('summary');
        const label = summary.querySelector('.viewer-filter-label').getBoundingClientRect();
        const count = summary.querySelector('.viewer-filter-count').getBoundingClientRect();
        const box = el.getBoundingClientRect();
        const frame = summary.getBoundingClientRect();
        return {
          id: el.id,
          width: box.width,
          sameRow: count.top < label.bottom && count.bottom > label.top,
          right: count.left >= label.right - 1,
          fits: summary.scrollWidth <= summary.clientWidth + 1,
          countRight: count.right,
          frameRight: frame.right,
          frameCenter: frame.y + frame.height / 2,
        };
      });
    });
    for (const item of result) {
      expect(item.sameRow, `${width}: ${item.id} count row`).toBe(true);
      expect(item.right, `${width}: ${item.id} count position`).toBe(true);
      expect(item.fits, `${width}: ${item.id} content width`).toBe(true);
      expect(
        Math.abs(item.width - result[0].width),
        `${width}: ${item.id} field width`,
      ).toBeLessThan(2);
    }
    const help = await page
      .getByRole('button', { name: 'Hinweise zur Zielobjektvererbung anzeigen' })
      .boundingBox();
    const target = result.find((item) => item.id === 'targetMS');
    expect(Math.abs(help.y + help.height / 2 - target.frameCenter)).toBeLessThan(2);
    expect(help.x).toBeGreaterThanOrEqual(target.countRight);
    expect(help.x + help.width).toBeLessThanOrEqual(target.frameRight);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
  }
  const help = page.getByRole('button', { name: 'Hinweise zur Zielobjektvererbung anzeigen' });
  await help.focus();
  await expect(help).toBeFocused();
  await expect(page.locator('#targetObjectHelp')).toBeVisible();
  await expect(help).not.toHaveCSS('outline-style', 'none');
  const tooltip = await page.locator('#targetObjectHelp').boundingBox();
  expect(tooltip.x).toBeGreaterThanOrEqual(0);
  expect(tooltip.x + tooltip.width).toBeLessThanOrEqual(320);
  expect(tooltip.y).toBeGreaterThanOrEqual(0);
  expect(tooltip.y + tooltip.height).toBeLessThanOrEqual(1000);
  await page.keyboard.press('Escape');
  await expect(page.locator('#targetObjectHelp')).toBeHidden();
  await expect(help).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#targetMS > summary')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#targetMS')).toHaveAttribute('open', '');
});
