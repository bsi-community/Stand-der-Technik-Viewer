/** Independent source-to-screen checks; expected values come from raw OSCAL, not Viewer parsers. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
const paths = process.argv.slice(2);
assert.equal(
  paths.length,
  3,
  'Usage: node scripts/check-kern-content.mjs catalog.json mapping.json component.json',
);
const files = await Promise.all(
  paths.map(async (path) => {
    const buffer = await readFile(path);
    return {
      buffer,
      json: JSON.parse(buffer),
      sha256: createHash('sha256').update(buffer).digest('hex'),
    };
  }),
);
const output = 'test-results/kern-content-acceptance';
const port = process.env.VIEWER_CONTENT_PORT || '4194';
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
  { stdio: 'inherit' },
);
let browser;
const report = { sources: files.map(({ sha256 }) => sha256), checks: [], errors: [] };
function controls(node) {
  return [
    ...(node.controls || []).flatMap((c) => [c, ...controls(c)]),
    ...(node.groups || []).flatMap(controls),
  ];
}
function label(c) {
  return c.props?.find((p) => p.name === 'label')?.value || c.id;
}
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    assert.equal(server.exitCode, null);
    try {
      ready = (await fetch(url)).ok;
    } catch {}
    if (ready) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(ready);
  await mkdir(output, { recursive: true });
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', (e) => report.errors.push(e.message));
  await page.route('https://**/*', (r) => r.fulfill({ json: { tree: [] } }));
  await page.goto(url);
  await page.locator('#tab-list').click();
  await page
    .locator('#file')
    .setInputFiles({ name: 'catalog.json', mimeType: 'application/json', buffer: files[0].buffer });
  const rawControls = controls(files[0].json.catalog);
  await page.getByRole('button', { name: 'Alles aufklappen', exact: true }).click();
  await expect(page.locator('.control-card')).toHaveCount(rawControls.length);
  const names = await page
    .locator('.control-card > summary')
    .evaluateAll((es) => es.map((e) => e.getAttribute('aria-label')));
  assert.deepEqual(names.sort(), rawControls.map((c) => `${label(c)}: ${c.title}`).sort());
  report.checks.push({ kind: 'catalog', allIdsAndTitles: rawControls.length });
  const samples = [
    rawControls[0],
    rawControls[Math.floor(rawControls.length / 2)],
    rawControls.at(-1),
  ];
  for (const c of samples) {
    const card = page
      .locator('.control-card')
      .filter({ has: page.locator('summary', { hasText: label(c) }) })
      .filter({ has: page.locator(':scope > summary', { hasText: c.title }) })
      .first();
    await card.getByRole('button', { name: `JSON zu ${label(c)} anzeigen`, exact: true }).click();
    const expected = structuredClone(c);
    delete expected.controls;
    assert.deepEqual(JSON.parse(await page.locator('#jsonModalBody').innerText()), expected);
    await page.keyboard.press('Escape');
  }
  report.checks.push({ kind: 'catalog-json', ids: samples.map(label) });
  await page.locator('#tab-mappings').click();
  await page
    .locator('#mappingFile')
    .setInputFiles({ name: 'mapping.json', mimeType: 'application/json', buffer: files[1].buffer });
  const maps = files[1].json['mapping-collection'].mappings.flatMap((m) => m.maps);
  await expect(page.locator('.mapping-entry-start')).toHaveCount(maps.length);
  const relations = await page.locator('.mapping-relation-badge').allTextContents();
  assert.deepEqual(
    relations,
    maps.map((m) => m.relationship),
  );
  for (const n of [0, Math.floor(maps.length / 2), maps.length - 1]) {
    const row = page.locator('.mapping-entry-start').nth(n);
    const ids = await row.locator('.mapping-id-value').allTextContents();
    assert.equal(ids[0], maps[n].sources[0]['id-ref']);
    assert.equal(ids.at(-1), maps[n].targets[0]['id-ref']);
  }
  report.checks.push({
    kind: 'mapping',
    allRelationships: maps.length,
    directionalPairSamples: [0, Math.floor(maps.length / 2), maps.length - 1],
  });
  await page.locator('#tab-components').click();
  await page.locator('#compFile').setInputFiles({
    name: 'component.json',
    mimeType: 'application/json',
    buffer: files[2].buffer,
  });
  await page.getByRole('button', { name: 'Alles aufklappen', exact: true }).click();
  const rawComponents = files[2].json['component-definition'].components;
  const requirements = rawComponents.flatMap((c) =>
    (c['control-implementations'] || []).flatMap((i) => i['implemented-requirements'] || []),
  );
  const rows = page.locator('.implementation-table tbody tr');
  await expect(rows).toHaveCount(requirements.length);
  const descriptions = await rows.locator('.implementation-description').allTextContents();
  assert.equal(descriptions.length, requirements.length);
  descriptions.forEach((s, i) => assert.equal(norm(s), norm(requirements[i].description)));
  report.checks.push({
    kind: 'component',
    components: rawComponents.length,
    allImplementationDescriptions: requirements.length,
  });
  await page.screenshot({ path: `${output}/component.png` });
  assert.deepEqual(report.errors, []);
  await writeFile(`${output}/result.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close();
  server.kill();
}
