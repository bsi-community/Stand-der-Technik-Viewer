/** Reproducible visual migration check against the original Git revision.
 * Serve only known baseline files, on loopback; do not mutate any checkout.
 * Run after npm run build; starts its own preview on loopback port 4183.
 */
import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { catalog, component, mapping, hierarchyCsv } from '../tests/fixtures/documents.js';

const ref = '36c1dc82243360c0f2e8578fc641af2ab80b5a98';
const original = (name) =>
  execFileSync('git', ['show', `${ref}:${name}`], { maxBuffer: 4 * 1024 * 1024 });
const files = new Map([
  ['/', [original('index.html'), 'text/html; charset=utf-8']],
  ['/d3.v7.min.js', [original('d3.v7.min.js'), 'text/javascript']],
  ['/viewer_logo-transparent.png', [original('viewer_logo-transparent.png'), 'image/png']],
]);
const server = createServer((req, res) => {
  const value = files.get(new URL(req.url, 'http://localhost').pathname);
  res.writeHead(value ? 200 : 404, { 'Content-Type': value?.[1] || 'text/plain' });
  res.end(value?.[0] || 'Not found');
});
await new Promise((resolve) => server.listen(4174, '127.0.0.1', resolve));
const browser = await chromium.launch();
const preview = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--port', '4183'],
  { stdio: 'ignore' },
);
const output = 'test-results/baseline';
await mkdir(output, { recursive: true });
const pictures = new Map();
const failures = [];
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      ready = (await fetch('http://127.0.0.1:4183/Stand-der-Technik-Viewer/')).ok;
    } catch {
      /* server starting */
    }
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('Production preview did not start. Run npm run build first.');
  for (const [name, url] of [
    ['before', 'http://127.0.0.1:4174/'],
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
  preview.kill();
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
if (failures.length) throw new Error('Baseline differences: ' + failures.join(', '));
