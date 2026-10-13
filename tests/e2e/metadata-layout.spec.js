import { test, expect } from '@playwright/test';
import { catalog, component, mapping } from '../fixtures/documents.js';

const file = (json) => ({
  name: 'metadata.json',
  mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify(json)),
});
const remarks =
  'Lange Anmerkungen beschreiben den Kontext und die Anwendung des Dokuments. '.repeat(12) +
  '\n\nEin zweiter Absatz mit **wichtigen Hinweisen** und einem [Verweis](https://example.org/info).\n\n- Erster Punkt\n- Zweiter Punkt';

test.beforeEach(async ({ page }) => {
  await page.route('https://**/*', (route) => route.fulfill({ json: { tree: [] } }));
  await page.goto('./');
});

for (const [kind, fixture, tab, input, panel] of [
  ['catalog', catalog, '#tab-list', '#file', '#listTab'],
  ['component-definition', component, '#tab-components', '#compFile', '#componentTab'],
  ['mapping-collection', mapping, '#tab-mappings', '#mappingFile', '#mappingTab'],
]) {
  test(`${kind}: metadata prose uses available width on desktop and mobile`, async ({
    page,
  }, testInfo) => {
    const doc = structuredClone(fixture);
    doc[kind].metadata.remarks = remarks;
    doc[kind].metadata['document-ids'] = [
      { identifier: 'test-id', remarks: 'Verschachtelte Anmerkung. '.repeat(10) },
    ];
    await page.locator(tab).click();
    await page.locator(input).setInputFiles(file(doc));
    const details = page.locator(`${panel} details`).first();
    await details.locator(':scope > summary').focus();
    await page.keyboard.press('Enter');
    await expect(details).toHaveAttribute('open', '');
    const row = details
      .locator('.kern-description-list-item')
      .filter({ has: page.locator(':scope > dt', { hasText: /^Anmerkungen$/ }) })
      .first();
    await expect(row.locator('dd').first()).toContainText('Ein zweiter Absatz');
    await expect(row.locator('strong')).toHaveText('wichtigen Hinweisen');
    await expect(row.locator('li')).toHaveCount(2);
    await expect(row.getByRole('link', { name: 'Verweis', exact: true })).toHaveAttribute(
      'href',
      'https://example.org/info',
    );
    for (const width of [1440, 820, 375, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect
        .poll(async () =>
          row.evaluate((el) => {
            const box = el.getBoundingClientRect();
            const parent = el.parentElement.getBoundingClientRect();
            return Math.abs(box.width - parent.width);
          }),
        )
        .toBeLessThan(2);
      const prose = row.locator('dd > .catalog-table-wrap > .catalog-md');
      expect(
        Math.abs((await prose.boundingBox()).width - (await row.boundingBox()).width),
      ).toBeLessThan(2);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      if (width === 1440 || width === 375) {
        await details.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: testInfo.outputPath(`${kind}-${width}.png`),
          fullPage: true,
        });
      }
    }
    // Nested remarks must receive the full width of their structured parent too.
    const nested = details.locator('.viewer-description-list .viewer-description-list').first();
    await expect(nested).toBeVisible();
    expect((await nested.boundingBox()).width).toBeGreaterThan(150);
    await details.locator(':scope > summary').focus();
    await page.keyboard.press('Enter');
    await expect(details).not.toHaveAttribute('open', '');
  });
}

test('component document title follows source selection and handles missing titles', async ({
  page,
}) => {
  await page.locator('#tab-components').click();
  const title = page.locator('#componentTab .catalog-document-title');
  await expect(title).toHaveCount(0);
  await page.locator('#compFile').setInputFiles(file(component));
  await expect(title).toContainText('Geladene Komponentendefinition');
  await expect(title).toContainText(component['component-definition'].metadata.title);
  const details = page.locator('#componentTab > details').first();
  await expect(details).not.toHaveAttribute('open', '');
  expect((await title.boundingBox()).y).toBeLessThan((await details.boundingBox()).y);
  const next = structuredClone(component);
  next['component-definition'].uuid = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
  next['component-definition'].metadata.title =
    '**Zweite Definition** mit ausführlichem Titel und <script>unerlaubtem Markup</script>';
  await page.locator('#compFile').setInputFiles(file(next));
  await expect(title.locator('strong')).toHaveText('Zweite Definition');
  await expect(title.locator('script')).toHaveCount(0);
  await page.locator('#componentPanel > details > summary').first().click();
  await page.locator('#componentSourceButton').click();
  await page.locator('#componentSourcePicker .source-item-button').first().click();
  await expect(title).toContainText(component['component-definition'].metadata.title);
  const untitled = structuredClone(component);
  untitled['component-definition'].uuid = 'bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee';
  delete untitled['component-definition'].metadata.title;
  await page.locator('#compFile').setInputFiles(file(untitled));
  await expect(title).toHaveCount(0);
});
