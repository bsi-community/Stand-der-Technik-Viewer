import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const output = process.argv[2] || 'dist';
const base = '/Stand-der-Technik-Viewer/';
const html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
const version = fs.readFileSync('VERSION', 'utf8').trim();
assert.match(version, /^\d+\.\d+\.\d+$/);
assert.ok(html.includes(`v${version}`), 'visible build version missing');
assert.ok(!html.includes('%VIEWER_VERSION%'), 'unresolved version placeholder');
assert.ok(!html.includes('/src/main.js'), 'unbuilt source entry');
const release = JSON.parse(fs.readFileSync(path.join(output, 'release.json'), 'utf8'));
assert.match(release.buildId, /^[a-f0-9]{64}$/);
assert.equal(release.version, version);
assert.ok(html.includes(release.buildId), 'HTML and release manifest disagree');
assert.ok(!html.includes('__VIEWER_RELEASE_BUILD_ID__'), 'unresolved release build ID');
assert.ok(
  html.indexOf('data-viewer-update') < html.indexOf('type="module"'),
  'update guard must run before potentially stale asset imports',
);
const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((url) => url.startsWith(base));
assert.ok(
  assets.some((url) => url.endsWith('.js')),
  'missing JavaScript asset',
);
assert.ok(
  fs.readdirSync(path.join(output, 'assets')).some((name) => name.endsWith('.css')),
  'missing CSS asset',
);
assert.ok(
  assets.some((url) => url.endsWith('.png')),
  'missing logo asset',
);
for (const url of assets)
  assert.ok(fs.statSync(path.join(output, url.slice(base.length))).size > 0, `missing ${url}`);
assert.ok(!/(?:src|href)="\/assets\//.test(html), 'asset URL ignores Pages subpath');
for (const name of ['.nojekyll', 'THIRD-PARTY-NOTICES.txt', 'Stand der Technik-Viewer.html'])
  assert.ok(fs.existsSync(path.join(output, name)), `missing ${name}`);
assert.ok(
  !fs.existsSync(path.join(output, 'src')) &&
    !fs.existsSync(path.join(output, 'tests')) &&
    !fs.existsSync(path.join(output, 'node_modules')),
  'source/test files leaked into build',
);
console.log(`Verified static Pages artifact ${version}: ${assets.length} asset references.`);

if (output === 'dist-release') {
  const names = fs.readdirSync(path.join(output, 'assets'));
  assert.ok(
    !names.some((name) => /^(legacy-|kern-preview-|documents-)/.test(name)),
    'comparison assets leaked into release',
  );
  for (const name of names.filter((name) => name.endsWith('.js'))) {
    const script = fs.readFileSync(path.join(output, 'assets', name), 'utf8');
    assert.ok(
      !script.includes('preview.example.invalid'),
      'synthetic documents leaked into release',
    );
  }
  console.log(
    'Verified release isolation: no legacy stylesheet, comparison module or demo documents.',
  );
}
