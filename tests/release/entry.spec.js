import { test, expect } from '@playwright/test';
import { catalog } from '../fixtures/documents.js';

test('release excludes comparison tools and imports real user files normally', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://**/*', (route) => route.fulfill({ json: { tree: [] } }));
  await page.goto('./?design=legacy&preview=catalog');
  await expect(page.locator('html')).toHaveAttribute('data-viewer-design', 'kern');
  await expect(page.locator('.registry-hero')).toBeVisible();
  await expect(page.locator('.kern-preview-bar, .kern-demo-note, #card-ORG-1')).toHaveCount(0);
  await page.locator('#tab-list').click();
  await page.locator('#file').setInputFiles({
    name: 'catalog.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(catalog)),
  });
  await expect(page.locator('#fileInfo')).toContainText(catalog.catalog.metadata.title);
  await page.locator('#tab-sunburst').click();
  await expect(page.locator('#sunburst > svg')).toBeVisible();
  await page.locator('#sunburst-data-summary').click();
  await expect(page.locator('#sunburst-data table')).toBeVisible();
  expect(errors).toEqual([]);
});
