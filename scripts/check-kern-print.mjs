/** Export representative local documents through the same print-copy action as the UI. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

const [catalogPath, componentPath, query = 'GC.1.1'] = process.argv.slice(2);
assert.ok(
  catalogPath && componentPath,
  'Usage: node scripts/check-kern-print.mjs catalog.json component.json [catalog search]',
);
const output = 'test-results/kern-print';
const port = process.env.VIEWER_PRINT_TEST_PORT || '4191';
const baseURL = `http://127.0.0.1:${port}/Stand-der-Technik-Viewer/`;
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--port',
    port,
    '--strictPort',
    '--configLoader',
    'native',
  ],
  { stdio: 'inherit' },
);
let browser;
const results = [];
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    assert.equal(server.exitCode, null, 'Preview exited');
    try {
      ready = (await fetch(baseURL)).ok;
    } catch {
      /* starting */
    }
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready);
  await mkdir(output, { recursive: true });
  browser = await chromium.launch();
  for (const [kind, path, tab, input, panel] of [
    ['catalog', catalogPath, '#tab-list', '#file', '#listTab'],
    ['component', componentPath, '#tab-components', '#compFile', '#componentTab'],
  ]) {
    const buffer = await readFile(path);
    const page = await browser.newPage();
    await page.route('https://**/*', (route) => route.fulfill({ json: { tree: [] } }));
    await page.goto(baseURL);
    await page.evaluate(() => {
      window.print = () => {};
    });
    await page.locator(tab).click();
    await page
      .locator(input)
      .setInputFiles({ name: `${kind}.json`, mimeType: 'application/json', buffer });
    await expect(page.locator(`${panel} details`).first()).toBeAttached();
    if (kind === 'catalog') {
      await page.locator('#catalogPanel details[data-section="filters"] > summary').click();
      await page.locator('#q').fill(query);
      await expect(page.locator('#listTab .control-card').first()).toBeAttached();
    }
    await page
      .locator('main')
      .getByRole('button', { name: 'Als PDF exportieren', exact: true })
      .click();
    await expect(page.locator('#viewerPrintDocument')).toBeAttached();
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ media: 'print' });
    const text = await page.locator('#viewerPrintDocument').innerText();
    await writeFile(`${output}/${kind}-expected.txt`, text);
    await page.pdf({
      path: `${output}/${kind}.pdf`,
      printBackground: true,
      preferCSSPageSize: true,
    });
    results.push({
      kind,
      bytes: buffer.length,
      sha256: createHash('sha256').update(buffer).digest('hex'),
      query: kind === 'catalog' ? query : null,
      textCharacters: text.length,
    });
    await page.close();
  }
  await writeFile(`${output}/result.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser?.close();
  server.kill();
}
