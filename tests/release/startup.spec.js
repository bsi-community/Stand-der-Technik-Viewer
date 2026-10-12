import { test, expect } from '@playwright/test';

for (const blockedResource of ['script', 'stylesheet', 'release']) {
  for (const width of [375, 1280]) {
    test(`initial branding stays compact while ${blockedResource} waits at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.route('https://**/*', (route) => route.fulfill({ json: { tree: [] } }));
      let resume;
      const gate = new Promise((resolve) => {
        resume = resolve;
      });
      let intercepted = false;
      const historicRequests = [];
      page.on('request', (request) => {
        if (request.url().includes('viewer-logo.png')) historicRequests.push(request.url());
      });
      await page.route('**/*', async (route) => {
        const request = route.request();
        const matches =
          blockedResource === 'release'
            ? new URL(request.url()).pathname.endsWith('/release.json')
            : request.resourceType() === blockedResource;
        if (matches) {
          intercepted = true;
          await gate;
        }
        await route.fallback();
      });
      try {
        await page.goto('./', { waitUntil: 'commit' });
        await expect.poll(() => intercepted).toBe(true);
        const mark = page.locator('.viewer-brand-mark');
        await expect(mark).toBeVisible();
        await expect(mark).toHaveCount(1);
        await expect(page.locator('header h1')).toHaveText('Stand der Technik-Viewer');
        expect(
          await mark.evaluate((el) => {
            const rect = el.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
          }),
        ).toEqual({ width: 40, height: 40 });
        expect(
          await page.locator('#homeBtn svg').evaluate((el) => el.getBoundingClientRect().width),
        ).toBe(24);
        await expect(page.locator('.header-wordmark')).toHaveCount(0);
        expect(historicRequests).toEqual([]);
        resume();
        await expect(page.locator('.registry-hero')).toBeVisible();
        await expect(mark).toHaveCount(1);
        await expect(mark).toBeVisible();
        expect(historicRequests).toEqual([]);
        await page.locator('#tab-list').click();
        await page.getByRole('button', { name: 'Zur Startseite', exact: true }).click();
        await expect(page.locator('.registry-hero')).toBeVisible();
      } finally {
        resume();
      }
    });
  }
}
