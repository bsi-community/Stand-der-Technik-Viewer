import { test, expect } from '@playwright/test';
import { catalog, component, mapping } from '../fixtures/documents.js';

const modes = [
  ['catalog', 'list', '#file', catalog],
  ['component', 'components', '#compFile', component],
  ['mapping', 'mappings', '#mappingFile', mapping],
];
test.beforeEach(async ({ page }) => {
  await page.route('https://**/*', (route) => route.fulfill({ json: { tree: [] } }));
});

for (const [kind, tab, input, document] of modes) {
  test(`${kind}: confirmation expires and clears on navigation and removal`, async ({ page }) => {
    await page.goto(`./?primary_tab=${tab}`);
    await page.locator(`#tab-${tab}`).click();
    await page.clock.install();
    const status = page.locator('#viewerImportStatus');
    const upload = () =>
      page.locator(input).setInputFiles({
        name: `${kind}.json`,
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(document)),
      });
    await upload();
    await expect(status).toHaveAttribute('data-state', 'success');
    await page.clock.fastForward(4000);
    await expect(status).toBeVisible();
    await page.clock.fastForward(1100);
    await expect(status).toBeHidden();
    await expect(status).toHaveText('');

    await upload();
    await expect(status).toBeVisible();
    await page.locator('#homeBtn').click();
    await expect(status).toBeHidden();
    await page.locator(`#tab-${tab}`).click();
    await expect(status).toBeHidden();

    await upload();
    await expect(status).toBeVisible();
    await page.locator(`#${kind}Panel [data-section="upload"]`).evaluate((el) => {
      el.open = true;
    });
    await page.locator(`#${kind}SourceButton`).click();
    await page.locator(`#${kind}SourceMenu .source-item-remove`).first().click();
    await expect(status).toBeHidden();

    await upload();
    await expect(status).toBeVisible();
    await page.locator(`#tab-${tab === 'list' ? 'components' : 'list'}`).click();
    await expect(status).toBeHidden();
  });
}

test('an earlier success timer cannot hide a pending import or its error', async ({ page }) => {
  await page.goto('./?primary_tab=list');
  await page.locator('#tab-list').click();
  await page.clock.install();
  const status = page.locator('#viewerImportStatus');
  const input = page.locator('#workspace-catalog-url');
  await page.route('https://example.org/valid.json', (route) => route.fulfill({ json: catalog }));
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('https://example.org/wait.json', async (route) => {
    await gate;
    await route.fulfill({ status: 404, body: 'Unavailable' });
  });
  await input.fill('https://example.org/valid.json');
  await input.press('Enter');
  await expect(status).toHaveAttribute('data-state', 'success');
  await page.clock.fastForward(4000);
  // The first successful import replaces the empty-workspace URL input.
  const uploadPanel = page.locator('#catalogPanel [data-section="upload"]');
  await uploadPanel.evaluate((el) => {
    el.open = true;
  });
  await page.locator('#urlInput').fill('https://example.org/wait.json');
  await page.locator('#urlInput').press('Enter');
  await expect(status).toHaveAttribute('data-state', 'loading');
  await page.clock.fastForward(6000);
  await expect(status).toBeVisible();
  release();
  await expect(status).toHaveAttribute('data-state', 'error');
  await page.clock.fastForward(10000);
  await expect(status).toBeVisible();
  await expect(status).toContainText('404');
});
