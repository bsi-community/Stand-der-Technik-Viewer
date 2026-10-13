import { test, expect } from '@playwright/test';
import { component, hierarchyCsv } from '../fixtures/documents.js';

for (const width of [1440, 375]) {
  test(`KERN reference views at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('https://**/*', (route) =>
      route.fulfill(
        route.request().url().endsWith('.csv')
          ? { body: hierarchyCsv, contentType: 'text/csv' }
          : { json: { tree: [] } },
      ),
    );
    async function shot(name, target = page) {
      await page.evaluate(() => document.fonts.ready);
      await expect(target).toHaveScreenshot(`${name}-${width}.png`);
    }
    await page.goto('./');
    await expect(page.locator('.registry-count')).toHaveText('0 Dokumente in 3 Modelltypen');
    const field = await page.locator('#registrySearch').boundingBox();
    const home = await page.locator('#homeTab').boundingBox();
    expect(field.x + field.width).toBeLessThanOrEqual(home.x + home.width + 1);
    await shot('home');
    await page.locator('#tab-list').click();
    await shot('import', page.locator('.workspace-empty-state'));
    await page.goto('./?preview=catalog');
    await expect(page.locator('#card-ORG-1')).toHaveAttribute('open', '');
    await shot('requirement', page.locator('#card-ORG-1'));
    await page.locator('#tab-sunburst').click();
    await expect(page.locator('#sunburst > svg')).toBeVisible();
    await shot('sunburst', page.locator('#sunburst'));
    await page.goto('./?preview=mapping');
    await expect(page.locator('.mapping-entry-start')).toHaveCount(5);
    await shot('mapping', page.locator('.mapping-table-wrap'));
    await page.locator('#tab-components').click();
    await page.locator('#compFile').setInputFiles({
      name: 'component.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(component)),
    });
    await expect(page.locator('#compFileInfo')).toContainText(
      component['component-definition'].metadata.title,
    );
    await page.getByRole('button', { name: 'Alles aufklappen', exact: true }).click();
    await shot('component', page.locator('#componentTab'));
  });
}
