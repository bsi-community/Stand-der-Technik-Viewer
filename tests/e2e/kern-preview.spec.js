import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://**/*', (route) => route.fulfill({ json: { tree: [] } }));
});

test('KERN preview: start page, local fonts, accessible search and legacy comparison', async ({
  page,
}) => {
  await page.goto('./');
  await expect(page.getByText('KERN UX · Testversion', { exact: true })).toBeVisible();
  await expect(page.locator('.registry-search-row .kern-btn')).toHaveText('Suchen');
  await expect(page.locator('header h1')).toContainText('Stand der Technik');
  // WebKit on macOS follows the system's link-tab preference; test keyboard activation explicitly.
  await page.getByRole('link', { name: 'Zum Inhalt springen' }).focus();
  await expect(page.getByRole('link', { name: 'Zum Inhalt springen' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#viewerMain')).toBeFocused();
  await page.goto('./?design=legacy');
  await expect(page.locator('.header-wordmark')).toBeVisible();
  await expect(page.locator('.kern-preview-bar')).toHaveCount(0);
});

test('representative requirement is open, searchable and usable at narrow widths', async ({
  page,
}, testInfo) => {
  await page.goto('./?preview=catalog');
  const control = page.locator('#card-ORG-1');
  await expect(control).toHaveAttribute('open', '');
  await expect(control.locator('.catalog-md').first()).toContainText('Benutzerkonten');
  await expect(page.locator('#q')).toBeVisible();
  await page.locator('#q').fill('Datensicherungen');
  await expect(page.locator('#listTab')).toContainText('Datensicherungen überprüfen');
  await expect(page.locator('#card-ORG-1')).toHaveCount(0);
  await page.locator('#resetBtn').click();
  await expect(page.locator('#card-ORG-1')).toHaveCount(1);
  await page.getByRole('button', { name: 'Alles aufklappen', exact: true }).click();
  await expect(page.locator('#card-ORG-1')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('kern-catalog.png'), fullPage: true });
  await page.setViewportSize({ width: 800, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('mapping preview resolves both catalogs, filters and keeps horizontal scrolling local', async ({
  page,
}, testInfo) => {
  await page.goto('./?preview=mapping');
  await expect(page.locator('.mapping-source-title-cell').first()).toContainText(
    'Konten und Berechtigungen',
  );
  await expect(page.locator('.mapping-target-title-cell').first()).toContainText(
    'Berechtigungsmanagement',
  );
  await expect(page.locator('.mapping-target-prose-cell').first()).toContainText('Benutzerkonten');
  await page.locator('#mappingQ').fill('ORG-2');
  await expect(page.locator('.mapping-id-value').first()).toHaveText('ORG-2');
  await page.locator('#mappingResetBtn').click();
  await expect(page.locator('.mapping-entry-start')).toHaveCount(5);
  await page.screenshot({ path: testInfo.outputPath('kern-mapping.png'), fullPage: true });
  await page.setViewportSize({ width: 800, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('region', { name: /Mapping-Vergleich/ })).toHaveAttribute(
    'tabindex',
    '0',
  );
});
