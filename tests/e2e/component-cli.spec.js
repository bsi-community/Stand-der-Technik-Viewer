import { test, expect } from '@playwright/test';
import { component } from '../fixtures/documents.js';

const longDescription =
  '## Ermittlung und Bewertung des Ist-Zustands\n\n' +
  'Die wirksame Konfiguration wird geprüft und das Ergebnis dokumentiert. '.repeat(12) +
  '\n\n## Umsetzung\n\nZugriffe einschränken.\n\n### GUI\n\nEinstellungen öffnen.' +
  '\n\n### CLI\n\nDer Befehl liest die wirksame Konfiguration aus.';

async function loadRequirement(page, description, { remarks = true, commands = true } = {}) {
  const fixture = structuredClone(component);
  const req =
    fixture['component-definition'].components[0]['control-implementations'][0][
      'implemented-requirements'
    ][0];
  req.description = description;
  req.statements = [];
  if (remarks) req.remarks = 'Zusätzliche Hinweise zur Umsetzung.';
  if (!commands) req.props = [];
  await page.route('https://**/*', (route) => route.fulfill({ json: { tree: [] } }));
  await page.goto('./?primary_tab=components');
  await page.locator('#tab-components').click();
  await page.locator('#compFile').setInputFiles({
    name: 'component-cli.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  await page.getByRole('button', { name: 'Alles aufklappen', exact: true }).click();
  return page.locator('.implementation-table tbody tr').first();
}

for (const width of [1440, 375]) {
  for (const [name, description, remarks] of [
    ['long CLI description', longDescription, true],
    ['short description without remarks', 'Konten prüfen.', false],
    ['commands without description', '', false],
  ]) {
    test(`commands follow CLI before remarks and require expansion: ${name}, ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 950 });
      const row = await loadRequirement(page, description, { remarks });
      const commands = row.locator('.config-command-section');
      const expand = row.locator('.description-collapse-toggle');
      await expect(commands).toBeHidden();
      await expect(expand).toBeVisible();
      // Hidden summaries and copy actions must not enter the tab order.
      await commands.locator('summary').evaluate((el) => el.focus());
      await expect(commands.locator('summary')).not.toBeFocused();
      await expand.focus();
      await expect(expand).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(expand).toHaveAttribute('aria-expanded', 'true');
      await expect(commands).toBeVisible();
      await expect(commands).not.toHaveAttribute('open', '');
      if (remarks) {
        const content = row.locator('.implementation-description');
        await expect(
          content.locator(':scope > .config-command-section + .implemented-requirement-remarks'),
        ).toContainText('Zusätzliche Hinweise');
        expect(await commands.evaluate((el) => el.previousElementSibling.textContent)).toBe(
          'Der Befehl liest die wirksame Konfiguration aus.',
        );
      }
      await commands.locator('summary').focus();
      await page.keyboard.press('Enter');
      await expect(commands.locator('code')).toBeVisible();
      await expect(commands.locator('code')).toHaveText('show access-list');
      await expect(commands).toContainText('Nur lesender Beispielbefehl.');
      await expect(commands.getByRole('button', { name: 'Kopieren', exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (remarks) {
        await row.screenshot({ path: testInfo.outputPath(`cli-expanded-${width}.png`) });
      }
      await row.getByRole('button', { name: 'Text einklappen' }).click();
      await expect(commands).toBeHidden();
      await page.setViewportSize({ width: width === 1440 ? 375 : 1440, height: 950 });
      await expect(commands).toBeHidden();
      await expand.click();
      await expect(commands.locator('code')).toBeVisible();
    });
  }
}

test('requirements without commands retain their existing short description', async ({ page }) => {
  const row = await loadRequirement(page, 'Kurze Beschreibung.', {
    remarks: false,
    commands: false,
  });
  await expect(row.locator('.implementation-description')).toHaveText('Kurze Beschreibung.');
  await expect(row.locator('.config-command-section')).toHaveCount(0);
  await expect(row.getByRole('button', { name: 'Gesamten Text anzeigen' })).toBeHidden();
});

test('command search stays collapsed until expanded and print includes hidden commands', async ({
  page,
}) => {
  const row = await loadRequirement(page, longDescription);
  await page.locator('#componentPanel details[data-section="filters"] > summary').click();
  await page.locator('#compQ').fill('show access-list');
  const commands = row.locator('.config-command-section');
  await expect(commands).toHaveAttribute('open', '');
  await expect(commands).toBeHidden();
  await row.getByRole('button', { name: 'Gesamten Text anzeigen' }).click();
  await expect(commands.locator('code')).toBeVisible();
  await expect(commands.locator('code mark').first()).toBeVisible();
  await row.getByRole('button', { name: 'Text einklappen' }).click();
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.locator('#compExportPdfBtn').click();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#viewerPrintDocument .config-command-section code')).toBeVisible();
  await expect(page.locator('#viewerPrintDocument .config-command-section code')).toHaveText(
    'show access-list',
  );
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await expect(commands).toBeHidden();
});
