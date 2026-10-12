import { test, expect } from '@playwright/test';
import { catalog, component } from '../fixtures/documents.js';
const upload = (page, selector, json, name = 'catalog.json') =>
  page.locator(selector).setInputFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(json)),
  });
test.beforeEach(async ({ page }) => {
  await page.route('https://**/*', (route) => route.fulfill({ json: { tree: [] } }));
  await page.goto('./');
});
test('JSON content can be reached and scrolled without leaving the modal', async ({ page }) => {
  await page.goto('./?preview=catalog');
  const trigger = page.getByRole('button', { name: 'JSON zu ORG-1 anzeigen' });
  await trigger.click();
  await expect(page.locator('#jsonModalClose')).toBeFocused();
  await page.keyboard.press('Tab');
  const body = page.locator('#jsonModal .modal-body');
  await expect(body).toBeFocused();
  await expect(body).toHaveAccessibleName('JSON-Inhalt');
  await page.setViewportSize({ width: 800, height: 500 });
  await page.keyboard.press('PageDown');
  await expect.poll(() => body.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press('Tab');
  await expect(page.locator('#jsonModalClose')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});
test('component reference opens the matching source when two catalogs share control IDs', async ({
  page,
}) => {
  await page.locator('#tab-list').click();
  const alpha = structuredClone(catalog),
    beta = structuredClone(catalog);
  alpha.catalog.metadata.title = 'Katalog Alpha';
  beta.catalog.uuid = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  beta.catalog.metadata.title = 'Katalog Beta';
  beta.catalog.groups[0].groups[0].controls[0].title = 'Abweichende Beta-Anforderung';
  await upload(page, '#file', alpha, 'alpha.json');
  await upload(page, '#file', beta, 'beta.json');
  const definition = structuredClone(component);
  definition['component-definition'].components[0]['control-implementations'][0].source =
    'https://example.org/alpha.json';
  await page.locator('#tab-components').click();
  await upload(page, '#compFile', definition, 'component.json');
  await page.getByRole('button', { name: 'Alles aufklappen', exact: true }).click();
  const row = page.locator('.implementation-table tbody tr').first();
  await expect(row).toContainText('Zugänge schützen');
  await expect(row).not.toContainText('Abweichende Beta-Anforderung');
  await row.getByRole('button', { name: 'Im Katalog öffnen' }).click();
  await expect(page.locator('#fileInfo')).toContainText('Katalog Alpha');
  await expect(page.locator('.control-card[open] > summary').first()).toBeFocused();
});
test('component reference reveals a filtered-out catalog requirement and announces the reset', async ({
  page,
}) => {
  await page.locator('#tab-list').click();
  await upload(page, '#file', catalog);
  await page.locator('#catalogPanel details[data-section="filters"] > summary').click();
  await page.locator('#q').fill('Backups');
  await expect(page.locator('.control-card')).toHaveCount(1);
  await page.locator('#tab-components').click();
  await upload(page, '#compFile', component, 'component.json');
  await page.getByRole('button', { name: 'Alles aufklappen', exact: true }).click();
  await page.getByRole('button', { name: 'Im Katalog öffnen' }).click();
  await expect(page.locator('#q')).toHaveValue('');
  await expect(page.locator('.control-card[open] > summary').first()).toBeFocused();
  await expect(page.locator('#msg')).toContainText('Katalogfilter');
});

test('empty filter selection has an accurate persistent result announcement', async ({ page }) => {
  await page.goto('./?preview=catalog');
  const groups = page.getByRole('group', { name: 'Gruppen/Themen', exact: true });
  await page.getByText('Gruppen/Themen', { exact: true }).first().click();
  await groups.getByRole('checkbox', { name: 'Alle auswählen', exact: true }).uncheck();
  await expect(page.locator('#viewerResultStatus')).toHaveText('0 von 5 Anforderungen sichtbar');
  await expect(page.locator('#catalogSelectionState')).toContainText(
    'Gruppen/Themen: keine Auswahl',
  );
  await groups.getByRole('checkbox', { name: 'Alle auswählen', exact: true }).check();
  await expect(page.locator('#viewerResultStatus')).toHaveText('5 von 5 Anforderungen sichtbar');
});
