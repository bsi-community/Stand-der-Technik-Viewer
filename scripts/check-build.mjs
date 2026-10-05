import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const base = '/Stand-der-Technik-Viewer/';
const html = fs.readFileSync('dist/index.html', 'utf8');
const version = fs.readFileSync('VERSION', 'utf8').trim();
assert.match(version, /^\d+\.\d+\.\d+$/);
assert.ok(html.includes(`v${version}`), 'visible build version missing');
assert.ok(!html.includes('%VIEWER_VERSION%'), 'unresolved version placeholder');
assert.ok(!html.includes('/src/main.js'), 'unbuilt source entry');
const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((url) => url.startsWith(base));
assert.ok(
  assets.some((url) => url.endsWith('.js')),
  'missing JavaScript asset',
);
assert.ok(
  assets.some((url) => url.endsWith('.css')),
  'missing CSS asset',
);
assert.ok(
  assets.some((url) => url.endsWith('.png')),
  'missing logo asset',
);
for (const url of assets)
  assert.ok(fs.statSync(path.join('dist', url.slice(base.length))).size > 0, `missing ${url}`);
assert.ok(!/(?:src|href)="\/assets\//.test(html), 'asset URL ignores Pages subpath');
for (const name of ['.nojekyll', 'THIRD-PARTY-NOTICES.txt', 'Stand der Technik-Viewer.html'])
  assert.ok(fs.existsSync(path.join('dist', name)), `missing ${name}`);
assert.ok(
  !fs.existsSync('dist/src') && !fs.existsSync('dist/tests') && !fs.existsSync('dist/node_modules'),
  'source/test files leaked into build',
);
console.log(`Verified static Pages artifact ${version}: ${assets.length} asset references.`);
