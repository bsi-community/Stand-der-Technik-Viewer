import { test, expect } from '@playwright/test';

test('normal KERN entry loads neither legacy CSS nor comparison data', async ({ page }) => {
  await page.route('https://**/*', (route) => route.fulfill({ json: { tree: [] } }));
  await page.goto('./');
  await expect(page.locator('.registry-hero')).toBeVisible();
  await expect(page.locator('.kern-preview-bar')).toHaveCount(0);
  const resources = await page.evaluate(() =>
    performance.getEntriesByType('resource').map((r) => r.name),
  );
  expect(resources.some((name) => /\/(legacy-|kern-preview-|documents-)/.test(name))).toBe(false);
  await page.goto('./?preview=catalog');
  await expect(page.locator('#card-ORG-1')).toBeVisible();
  await expect(page.locator('.kern-preview-bar')).toBeVisible();
  expect(
    await page.evaluate(() =>
      performance.getEntriesByType('resource').some((r) => r.name.includes('/legacy-')),
    ),
  ).toBe(false);
});
