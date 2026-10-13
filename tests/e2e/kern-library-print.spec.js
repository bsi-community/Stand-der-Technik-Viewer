import { test, expect } from '@playwright/test';
import { catalog, component } from '../fixtures/documents.js';

test('library failure, retry and search keep a draft and offer recovery', async ({ page }) => {
  await page.route('https://**/*', (route) => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Bibliothek erneut laden' })).toBeVisible();
  await page.getByRole('button', { name: 'Eigene Datei öffnen' }).click();
  await expect(page.locator('#listTab .workspace-upload-dropzone')).toBeFocused();
  await page.locator('#homeBtn').click();
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('https://api.github.com/**', async (route) => {
    await gate;
    await route.fulfill({ json: { tree: [] } });
  });
  await page.getByRole('button', { name: 'Bibliothek erneut laden' }).click();
  const field = page.getByLabel('Bibliothek durchsuchen', { exact: true });
  await field.fill('noch nicht abgeschickt');
  release();
  await expect(page.locator('.registry-count')).toHaveText('0 Dokumente in 3 Modelltypen');
  await expect(field).toHaveValue('noch nicht abgeschickt');
  await expect(field).toBeFocused();
  await field.press('Enter');
  await expect(field).toBeFocused();
  await expect(page.locator('.registry-empty')).toContainText('Keine Dokumente');
  // Let any queued workspace announcement run before checking the library status.
  await page.waitForTimeout(250);
  await expect(page.locator('#viewerResultStatus')).toContainText('0 Dokumente');
  await page.getByRole('button', { name: 'Suche zurücksetzen' }).click();
  await expect(field).toHaveValue('');
  await expect(field).toBeFocused();
  for (const width of [1440, 800, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});

test('KERN printing expands an isolated copy and preserves the workspace and focus', async ({
  page,
}, testInfo) => {
  await page.route('https://**/*', (route) => route.fulfill({ json: { tree: [] } }));
  await page.goto('./?primary_tab=list');
  await page.locator('#tab-list').click();
  await page.evaluate(() => {
    window.print = () => {};
  });
  for (const [tab, input, doc, panel] of [
    ['#tab-list', '#file', catalog, '#listTab'],
    ['#tab-components', '#compFile', component, '#componentTab'],
  ]) {
    await page.locator(tab).click();
    await page.locator(input).setInputFiles({
      name: 'test.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(doc)),
    });
    await expect(page.locator(`${panel} details`).first()).toBeAttached();
    const before = await page
      .locator(`${panel} details`)
      .evaluateAll((els) => els.map((el) => el.open));
    const print = page.getByRole('button', { name: 'Als PDF exportieren', exact: true });
    await print.click();
    await expect(page.locator('#viewerPrintDocument')).toHaveCount(1);
    expect(
      await page.locator(`${panel} details`).evaluateAll((els) => els.map((el) => el.open)),
    ).toEqual(before);
    expect(
      await page
        .locator('#viewerPrintDocument details')
        .evaluateAll((els) => els.every((el) => el.open)),
    ).toBe(true);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('#viewerPrintDocument')).toBeVisible();
    await expect(page.locator('.wrap')).toBeHidden();
    await expect(page.locator('body')).toHaveCSS('display', 'block');
    expect(
      await page
        .locator('#viewerPrintDocument p')
        .first()
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeCloseTo(40 / 3, 1);
    await expect(page.locator('#viewerPrintDocument button')).toHaveCount(0);
    expect(
      await page
        .locator('#viewerPrintDocument')
        .evaluate((el) => el.scrollWidth <= document.documentElement.clientWidth),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`print-${panel.slice(1)}.png`),
      fullPage: true,
    });
    await page.emulateMedia({ media: 'screen' });
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    await expect(page.locator('#viewerPrintDocument')).toHaveCount(0);
    await expect(print).toBeFocused();
    expect(
      await page.locator(`${panel} details`).evaluateAll((els) => els.map((el) => el.open)),
    ).toEqual(before);
  }
});
