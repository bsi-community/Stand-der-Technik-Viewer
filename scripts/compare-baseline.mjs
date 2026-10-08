/** Compare independently built, frozen reference and current UI in the same browser.
 * Run after npm run build; loopback previews use ports 4174 and 4183.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { buildVisualBaseline } from './build-visual-baseline.mjs';
import { catalog, component, mapping, hierarchyCsv } from '../tests/fixtures/documents.js';

const baseline = await buildVisualBaseline();
const previews = [];
let browser;
const output = 'test-results/baseline';
await mkdir(output, { recursive: true });
const pictures = new Map();
const failures = [];
try {
  for (const [cwd, port] of [
    [baseline.root, '4174'],
    [process.cwd(), '4183'],
  ]) {
    previews.push(
      spawn(
        process.execPath,
        [
          path.resolve('node_modules/vite/bin/vite.js'),
          'preview',
          '--configLoader',
          'native',
          '--port',
          port,
        ],
        { cwd, stdio: 'inherit' },
      ),
    );
  }
  browser = await chromium.launch();
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      ready =
        (await fetch('http://127.0.0.1:4174/Stand-der-Technik-Viewer/')).ok &&
        (await fetch('http://127.0.0.1:4183/Stand-der-Technik-Viewer/')).ok;
    } catch {
      /* server starting */
    }
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('Production preview did not start. Run npm run build first.');
  for (const [name, url] of [
    ['before', 'http://127.0.0.1:4174/Stand-der-Technik-Viewer/'],
    ['after', 'http://127.0.0.1:4183/Stand-der-Technik-Viewer/'],
  ]) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      locale: 'de-DE',
      deviceScaleFactor: 1,
    });
    page.on('pageerror', (error) => failures.push(`${name}: ${error.message}`));
    await page.route('https://**/*', (route) =>
      route.fulfill(
        route.request().url().endsWith('.csv')
          ? { body: hierarchyCsv, contentType: 'text/csv' }
          : { json: { tree: [] } },
      ),
    );
    await page.goto(url);
    await page.getByText('0 Dokumente in 2 Modelltypen', { exact: true }).waitFor();
    // Version is intentionally changed; normalize its text (not layout) for comparison.
    await page.locator('#viewerVersion').evaluate((el) => {
      el.textContent = 'vTEST';
    });
    async function capture(view) {
      await page.evaluate(() => document.fonts.ready);
      await page.mouse.move(0, 0);
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      await page.waitForFunction(() =>
        [...document.querySelectorAll('svg, svg *')].every((el) => !el.__transition),
      );
      const png = await page.screenshot({ fullPage: true, animations: 'disabled' });
      await writeFile(`${output}/${view}-${name}.png`, png);
      if (name === 'before') pictures.set(view, png);
      else {
        const same = png.equals(pictures.get(view));
        console.log(`${view}: ${same ? 'identical' : 'DIFFERENT'}`);
        if (!same) failures.push(view);
      }
    }
    await capture('home');
    await page.locator('#tab-mappings').click();
    await page.locator('#mappingFile').setInputFiles({
      name: 'mapping-only.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(mapping)),
    });
    await page.locator('.mapping-source-context').waitFor();
    await capture('mapping-only');
    for (const [kind, json, input, tab] of [
      ['catalog', catalog, '#file', '#tab-list'],
      ['component', component, '#compFile', '#tab-components'],
      ['mapping', mapping, '#mappingFile', '#tab-mappings'],
    ]) {
      await page.locator(tab).click();
      await page.locator(input).setInputFiles({
        name: 'fixture.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(json)),
      });
      const title =
        kind === 'catalog' ? 'Zugänge schützen' : kind === 'component' ? 'Test-Firewall' : 'SRC-1';
      await page.getByText(title, { exact: true }).first().waitFor({ state: 'attached' });
      await capture(kind);
      await page.locator('#tab-bar').click();
      await page.locator('#barTab svg').waitFor();
      await capture(kind + '-bar');
    }
    await page.locator('#tab-list').click();
    await page.locator('#tab-target-hierarchy').click();
    await page.locator('#targetHierarchyCanvas svg').waitFor();
    await capture('hierarchy');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#tab-list').click();
    await capture('catalog-mobile');
    await page.close();
  }
} finally {
  for (const preview of previews) preview.kill();
  await browser?.close();
  await baseline.cleanup();
}
if (failures.length) throw new Error('Baseline differences: ' + failures.join(', '));
