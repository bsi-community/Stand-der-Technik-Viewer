import { test, expect } from '@playwright/test';
import { catalog, component, mapping } from '../fixtures/documents.js';

async function upload(page, selector, json) {
  await page.locator(selector).setInputFiles({
    name: 'test.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(json)),
  });
}

test.beforeEach(async ({ page }) => {
  await page.route('https://**/*', (route) => route.fulfill({ json: { tree: [] } }));
  await page.goto('./?primary_tab=components');
  await page.locator('#tab-components').click();
});

test('component metadata, nested values and implementation actions retain semantics and content', async ({
  page,
}, testInfo) => {
  const fixture = structuredClone(component);
  fixture['component-definition'].metadata['test-extension'] = {
    zero: 0,
    enabled: false,
    href: 'javascript:alert(1)',
    description: '<img src=x onerror=alert(1)>',
  };
  fixture['component-definition'].components[0].props = [
    { name: 'Beispiel', value: 'lang'.repeat(80), class: 'Test', remarks: 'Zusatzinformation' },
  ];
  await upload(page, '#compFile', fixture);
  await page.getByRole('button', { name: 'Alles aufklappen', exact: true }).click();
  const panel = page.locator('#componentTab');
  await panel.locator('.catalog-info-box > summary').click();
  await panel.getByText('Properties', { exact: true }).click();
  await expect(panel.locator('table.catalog-table')).toHaveCount(0);
  await expect(panel.locator('dl')).not.toHaveCount(0);
  await expect(
    panel
      .locator('.kern-description-list-item')
      .filter({ has: page.locator('dt', { hasText: /^zero$/ }) })
      .last(),
  ).toContainText('0');
  await expect(
    panel
      .locator('.kern-description-list-item')
      .filter({ has: page.locator('dt', { hasText: /^enabled$/ }) })
      .last(),
  ).toContainText('false');
  await expect(panel.locator('a[href^="javascript:"]')).toHaveCount(0);
  await expect(panel.locator('img')).toHaveCount(0);
  await expect(panel.locator('.implementation-description').first()).toContainText('wöchentlich');
  await expect(
    panel.getByRole('button', { name: 'Katalog-Anforderung nicht geladen' }),
  ).toBeDisabled();
  const json = panel.getByRole('button', { name: 'JSON zu Test-Firewall anzeigen' });
  await json.click();
  await page.keyboard.press('Escape');
  await expect(json).toBeFocused();
  for (const width of [1440, 800, 375, 320]) {
    await page.setViewportSize({ width, height: 950 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: testInfo.outputPath(`components-${width}.png`), fullPage: true });
  }
  await upload(page, '#file', catalog);
  await page.locator('#tab-components').click();
  await page.getByRole('button', { name: 'Alles aufklappen', exact: true }).click();
  await panel.getByRole('button', { name: 'Im Katalog öffnen' }).click();
  await expect(page.locator('#listTab')).toBeVisible();
  await expect(
    page.locator('.control-card').filter({ hasText: 'Zugänge schützen' }).first(),
  ).toHaveAttribute('open', '');
});

test('mapping metadata is complete, resolves resources and exposes keyboard scrolling', async ({
  page,
}) => {
  const fixture = structuredClone(mapping);
  const doc = fixture['mapping-collection'];
  doc.metadata.links = [{ href: '#evidence', rel: 'reference' }];
  doc.metadata.roles = [{ id: 'reviewer', title: 'Fachprüfung' }];
  doc.provenance = { 'confidence-score': 0, 'test-extension': { reviewed: false } };
  doc['back-matter'] = {
    resources: [
      {
        uuid: 'evidence',
        title: 'Prüfbericht',
        rlinks: [{ href: 'https://example.org/evidence.pdf' }],
      },
    ],
  };
  await page.locator('#tab-mappings').click();
  await upload(page, '#mappingFile', fixture);
  const info = page.locator('.mapping-document-details');
  await info.locator(':scope > summary').click();
  await expect(info).toContainText('Fachprüfung');
  await expect(info).toContainText('false');
  await expect(info.getByRole('link', { name: '#evidence', exact: true })).toHaveAttribute(
    'href',
    'https://example.org/evidence.pdf',
  );
  await page.setViewportSize({ width: 800, height: 950 });
  const wrap = page.locator('#mapping-comparison-scroll');
  await wrap.scrollIntoViewIfNeeded();
  const scroll = page.getByRole('scrollbar');
  await scroll.focus();
  await page.keyboard.press('End');
  await expect.poll(() => wrap.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await page.keyboard.press('Home');
  await expect.poll(() => wrap.evaluate((el) => el.scrollLeft)).toBe(0);
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => wrap.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await expect(scroll).toHaveAttribute('aria-controls', 'mapping-comparison-scroll');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
