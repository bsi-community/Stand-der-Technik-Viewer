/** Optional online smoke test using public BSI documents, not part of deterministic CI. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const response = await fetch(
  'https://api.github.com/repos/BSI-Bund/Stand-der-Technik-Bibliothek/git/trees/main?recursive=1',
);
assert.ok(response.ok, 'GitHub tree unavailable');
const tree = await response.json();
assert.ok(!tree.truncated, 'incomplete tree');
const raw = `https://raw.githubusercontent.com/BSI-Bund/Stand-der-Technik-Bibliothek/${tree.sha}/`;
const cases = [
  [
    'catalog',
    'control_layer/Grundschutz++/Grundschutz++-resolved_catalog.json',
    '#file',
    '#tab-list',
    '#listTab',
  ],
  [
    'component',
    'implementation_layer/Keycloak/Keycloak-component_definition.json',
    '#compFile',
    '#tab-components',
    '#componentTab',
  ],
  [
    'mapping',
    'control_layer/Mappings/IT-GS2023-zu-GSpp/ITGS-to-GS++-mapping_collection.json',
    '#mappingFile',
    '#tab-mappings',
    '#mappingTab',
  ],
];
const preview = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--port', '4185'],
  { stdio: 'ignore' },
);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [],
  results = [];
page.on('pageerror', (error) => errors.push(error.message));
try {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch('http://127.0.0.1:4185/Stand-der-Technik-Viewer/')).ok) break;
    } catch {
      /* starting */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  // Only the selected public documents are fetched, not the entire registry.
  await page.route('https://api.github.com/**', (route) => route.fulfill({ json: { tree: [] } }));
  await page.goto('http://127.0.0.1:4185/Stand-der-Technik-Viewer/');
  for (const [kind, file, input, tab, view] of cases) {
    const url = raw + file.split('/').map(encodeURIComponent).join('/');
    const res = await fetch(url);
    assert.ok(res.ok, url);
    const content = Buffer.from(await res.arrayBuffer());
    const json = JSON.parse(content);
    await page.locator(tab).click();
    const started = performance.now();
    await page.locator(input).setInputFiles({
      name: file.split('/').at(-1),
      mimeType: 'application/json',
      buffer: content,
    });
    const title = (json.catalog || json['component-definition'] || json['mapping-collection'])
      .metadata.title;
    await page
      .locator(view)
      .getByText(title, { exact: true })
      .first()
      .waitFor({ state: 'attached', timeout: 30000 });
    assert.ok(
      await page.locator('#msg').evaluate((el) => el.classList.contains('hidden')),
      `${kind}: unexpected error message`,
    );
    const rendered = await page.locator(view).textContent();
    assert.ok(rendered.length > 1000, `${kind}: unexpectedly empty view`);
    await page.locator('#tab-bar').click();
    await page.locator('#barTab svg').waitFor({ timeout: 30000 });
    results.push({
      kind,
      path: file,
      bytes: content.length,
      title,
      milliseconds: Math.round(performance.now() - started),
    });
    console.log(JSON.stringify(results.at(-1)));
  }
  assert.deepEqual(errors, []);
  await mkdir('test-results/live', { recursive: true });
  await writeFile(
    'test-results/live/result.json',
    JSON.stringify(
      { checkedAt: new Date().toISOString(), sourceRevision: tree.sha, results, errors },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
  preview.kill();
}
