import { test, expect } from '@playwright/test';
import { catalogParts, partLabels } from '../fixtures/catalog-parts.js';

const file = (json) => ({
  name: 'parts.json',
  mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify(json)),
});

test.beforeEach(async ({ page }) => {
  await page.route('https://**/*', (route) => route.fulfill({ json: { tree: [] } }));
  await page.goto('./?primary_tab=list');
  await page.locator('#tab-list').click();
  await page.locator('#file').setInputFiles(file(catalogParts));
  await page.locator('#card-parts-1 > summary').click();
});

test('every part keeps its own label and content in source order, including nested parts', async ({
  page,
}) => {
  const card = page.locator('#card-parts-1');
  await expect(card.locator('.catalog-part > summary')).toHaveText(partLabels);
  await expect(card.locator('.catalog-part[open] > summary')).toHaveText([
    'Anforderung',
    'Anforderung',
    'Anforderung',
  ]);
  await expect(card.locator('.catalog-part > .catalog-md')).toHaveCount(19);
  await expect(card.locator('.catalog-part img, .catalog-part script')).toHaveCount(0);
  await expect(card.locator('.catalog-part > summary strong strong')).toHaveText(
    'Formatierter Titel',
  );
  const second = card
    .locator('.catalog-part')
    .filter({ has: page.locator(':scope > summary', { hasText: /^Implementation Guidance$/ }) });
  await second.locator(':scope > summary').click();
  await expect(second.locator('.param-value')).toContainText('monatlich');
  await expect(second.locator('li')).toHaveText(['Alpha', 'Beta']);
  await expect(card.getByText('Separate Control-Anmerkung.')).toHaveCount(1);
  await expect(page.locator('#card-parts-empty .catalog-part')).toHaveCount(0);
});

test('search finds later parts and their titles and expands the ancestors of nested matches', async ({
  page,
}) => {
  await page.locator('#catalogPanel details[data-section="filters"] > summary').click();
  for (const [query, labels] of [
    ['Implementation', ['Implementation Guidance']],
    ['Dritte Hinweise', ['Hinweise']],
    ['Detailbeispiel', ['Verschachtelte Hinweise', 'Unterabschnitt', 'Detailbeispiel']],
    ['Tiefentreffer', ['Verschachtelte Hinweise', 'Unterabschnitt', 'Detailbeispiel']],
  ]) {
    await page.locator('#q').fill(query);
    await expect(page.locator('.control-card')).toHaveCount(1);
    const card = page.locator('#card-parts-1');
    for (const label of labels) {
      await expect(
        card.locator('.catalog-part[open] > summary').filter({ hasText: new RegExp(`^${label}$`) }),
      ).toHaveCount(1);
    }
    await expect(card.locator('.search-hit').first()).toBeAttached();
  }
  await page.locator('#q').fill('KeinTrefferImKatalog');
  await expect(page.locator('.control-card')).toHaveCount(0);
});

test('repeated sections work with the keyboard and long titles wrap on narrow screens', async ({
  page,
}, testInfo) => {
  const doc = structuredClone(catalogParts);
  doc.catalog.controls[0].parts[3].title = 'Implementation Guidance ' + 'Langtitel'.repeat(30);
  await page.locator('#file').setInputFiles(file(doc));
  const card = page.locator('#card-parts-1');
  await card.locator(':scope > summary').click();
  const summary = card
    .locator('.catalog-part > summary')
    .filter({ hasText: /^Implementation Guidance/ });
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(summary.locator('..')).toHaveAttribute('open', '');
  await expect(summary).toBeFocused();
  await expect(summary.locator('..').locator('li')).toHaveCount(2);
  await page.keyboard.press('Space');
  await expect(summary.locator('..')).not.toHaveAttribute('open', '');
  for (const width of [1440, 375, 320]) {
    await page.setViewportSize({ width, height: 950 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      .toBe(true);
    await summary.scrollIntoViewIfNeeded();
    expect((await summary.boundingBox()).width).toBeLessThan(width);
    await page.screenshot({
      path: testInfo.outputPath(`catalog-parts-${width}.png`),
      fullPage: true,
    });
  }
});

test('printing includes every part exactly once and preserves disclosure states', async ({
  page,
}) => {
  const card = page.locator('#card-parts-1');
  const before = await card.locator('details').evaluateAll((els) => els.map((el) => el.open));
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.getByRole('button', { name: 'Als PDF exportieren', exact: true }).click();
  const copy = page.locator('#viewerPrintDocument');
  await expect(copy.locator('.catalog-part > summary')).toHaveText(partLabels);
  await expect(copy.locator('.catalog-part:not([open])')).toHaveCount(0);
  await expect(copy.getByText('Tiefentreffer.', { exact: true })).toHaveCount(1);
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await expect(copy).toHaveCount(0);
  expect(await card.locator('details').evaluateAll((els) => els.map((el) => el.open))).toEqual(
    before,
  );
});

test('many identically named and titled parts remain separate', async ({ page }) => {
  const doc = structuredClone(catalogParts);
  doc.catalog.controls[0].parts = Array.from({ length: 40 }, (_, i) => ({
    name: 'guidance',
    title: 'Gleicher Titel',
    prose: `Individueller Inhalt ${i + 1}.`,
  }));
  await page.locator('#file').setInputFiles(file(doc));
  const card = page.locator('#card-parts-1');
  await expect(card.locator('.catalog-part > summary')).toHaveText(
    Array(40).fill('Gleicher Titel'),
  );
  await expect(card.locator('.catalog-part > .catalog-md')).toHaveText(
    Array.from({ length: 40 }, (_, i) => `Individueller Inhalt ${i + 1}.`),
  );
});
