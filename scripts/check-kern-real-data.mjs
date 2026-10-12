/** Optional offline large-document check. Pass catalog.json and mapping.json after building. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { parseCatalog } from '../src/domain/catalog.js';
import { parseMappingCollection } from '../src/domain/mapping.js';

const [catalogPath, mappingPath] = process.argv.slice(2);
assert.ok(
  catalogPath && mappingPath,
  'Usage: node scripts/check-kern-real-data.mjs catalog.json mapping.json',
);
const output = 'test-results/kern-real-data';
const port = process.env.VIEWER_REAL_DATA_PORT || '4188';
const url = `http://127.0.0.1:${port}/Stand-der-Technik-Viewer/`;
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--configLoader',
    'native',
    '--port',
    port,
    '--strictPort',
  ],
  { stdio: 'pipe' },
);
let serverError = '';
server.stderr.on('data', (data) => {
  serverError += data;
});
let browser;
const results = [];
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    assert.equal(server.exitCode, null, serverError);
    try {
      ready = (await fetch(url)).ok;
    } catch {
      /* starting */
    }
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready, 'Preview did not start');
  await mkdir(output, { recursive: true });
  browser = await chromium.launch();
  for (const [kind, path, tab, input] of [
    ['catalog', catalogPath, '#tab-list', '#file'],
    ['mapping', mappingPath, '#tab-mappings', '#mappingFile'],
  ]) {
    const buffer = await readFile(path);
    const json = JSON.parse(buffer);
    const state = kind === 'catalog' ? parseCatalog(json) : parseMappingCollection(json);
    const count = kind === 'catalog' ? state.controls.length : state.entries.length;
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('https://**/*', (route) => route.fulfill({ json: { tree: [] } }));
    await page.goto(url);
    await page.locator(tab).click();
    await page
      .locator(input)
      .setInputFiles({ name: `${kind}.json`, mimeType: 'application/json', buffer });
    const title = (json.catalog || json['mapping-collection']).metadata.title;
    await expect(
      page
        .locator(kind === 'catalog' ? '#listTab' : '#mappingTab')
        .getByText(title, { exact: true })
        .first(),
    ).toBeAttached({ timeout: 30000 });
    const charts = [];
    for (const chart of ['graph', 'sunburst', 'bar']) {
      await page.locator(`#tab-${chart}`).click();
      await expect(page.locator(`#${chart} > svg`)).toHaveAttribute('role', 'img');
      await page.locator(`#${chart}-data-summary`).press('Enter');
      const table = page.locator(`#${chart}-data table`).first();
      await expect(table.locator('tbody tr').first()).toBeVisible();
      let expectedNodes, expectedEdges;
      if (chart === 'graph') {
        if (kind === 'catalog') expectedNodes = count;
        else {
          const ids = new Set();
          expectedEdges = 0;
          for (const entry of state.entries)
            for (const source of entry.sourceRefs) {
              ids.add('source|' + entry.sourceCatalog + '|' + source);
              for (const target of entry.targetRefs) {
                ids.add('target|' + entry.targetCatalog + '|' + target);
                expectedEdges++;
              }
            }
          expectedNodes = ids.size;
        }
        await expect(page.locator('#graph-data-0-status')).toContainText(
          `von ${expectedNodes} Einträgen`,
        );
        if (expectedEdges)
          await expect(page.locator('#graph-data-1-status')).toContainText(
            `von ${expectedEdges} Einträgen`,
          );
        assert.ok((await table.locator('tbody tr').count()) <= 50);
        await page.locator('#graph-control-fit').press('Enter');
      } else {
        // Public examples have fewer than 50 distribution groups: sum every rendered group.
        await expect(page.locator(`#${chart}-data-0-next`)).toBeHidden();
        const column = kind === 'mapping' && chart === 'sunburst' ? 2 : 1;
        const total = await table
          .locator('tbody tr')
          .evaluateAll(
            (rows, index) =>
              rows.reduce((sum, row) => sum + Number(row.cells[index].textContent), 0),
            column,
          );
        assert.equal(total, count, `${kind}/${chart}: grouped count differs from imported data`);
      }
      for (const width of [1440, 800, 375]) {
        await page.setViewportSize({ width, height: 1000 });
        await expect
          .poll(() => page.locator(`#${chart} > svg`).getAttribute('width'))
          .toBe(String(await page.locator(`#${chart}`).evaluate((el) => el.clientWidth)));
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `${kind}/${chart}/${width}: page overflow`,
        );
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      await expect
        .poll(() => page.locator(`#${chart} > svg`).getAttribute('width'))
        .toBe(String(await page.locator(`#${chart}`).evaluate((el) => el.clientWidth)));
      await page.locator(`#${chart}-data`).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${output}/${kind}-${chart}.png` });
      charts.push({ chart, expectedNodes, expectedEdges });
    }
    assert.deepEqual(errors, []);
    results.push({
      kind,
      title,
      bytes: buffer.length,
      sha256: createHash('sha256').update(buffer).digest('hex'),
      count,
      charts,
      errors,
    });
    await page.close();
  }
  await writeFile(
    `${output}/result.json`,
    JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser?.close();
  server.kill();
}
