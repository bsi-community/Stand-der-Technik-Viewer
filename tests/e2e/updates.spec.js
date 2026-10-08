import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { test, expect } from '@playwright/test';
import { mapping } from '../fixtures/documents.js';

const html = readFileSync('dist/index.html', 'utf8');
const release = JSON.parse(readFileSync('dist/release.json', 'utf8'));
const oldBuild = '0'.repeat(64);
const staleHtml = html.replaceAll(release.buildId, oldBuild);
const base = '/Stand-der-Technik-Viewer/';

test.beforeEach(async ({ page }) => {
  await page.route('https://**/*', (route) => route.fulfill({ json: { tree: [] } }));
});

async function serveStartup(
  page,
  { stale = false, alwaysStale = false, missingAssets = false } = {},
) {
  const documents = [];
  const checks = [];
  await page.route('**/release.json?*', async (route) => {
    checks.push(route.request().url());
    await route.fulfill({ json: release });
  });
  await page.route('**/Stand-der-Technik-Viewer/?*', async (route) => {
    if (!route.request().isNavigationRequest()) return route.continue();
    documents.push(route.request().url());
    const outdated = stale && (documents.length === 1 || alwaysStale);
    let body = outdated ? staleHtml : html;
    if (outdated && missingAssets) {
      body = body.replace(/src="[^"]+\/assets\/index-[^"]+\.js"/, 'src="./removed-entry.js"');
    }
    await route.fulfill({ body, contentType: 'text/html' });
  });
  return { documents, checks };
}

test('current release starts once and preserves bookmarked parameters and fragment', async ({
  page,
}) => {
  const { documents, checks } = await serveStartup(page);
  await page.goto('./?primary_tab=mappings&keep=a%2Fb&keep=c#bookmark');
  await expect(page.locator('#mappingPanel')).toBeVisible();
  expect(documents).toHaveLength(1);
  expect(checks).toHaveLength(1);
  await expect(page).toHaveURL(/primary_tab=mappings&keep=a%2Fb&keep=c#bookmark$/);
});

for (const missingAssets of [false, true]) {
  test(`cached bookmark updates before startup${missingAssets ? ' even with removed old assets' : ''}`, async ({
    page,
  }) => {
    const { documents, checks } = await serveStartup(page, { stale: true, missingAssets });
    if (missingAssets) {
      await page.route('**/removed-entry.js', (route) => route.fulfill({ status: 404, body: '' }));
    }
    await page.goto('./?primary_tab=mappings&keep=a%2Fb&keep=c#bookmark');
    await expect(page.locator('#mappingPanel')).toBeVisible();
    await expect(page).not.toHaveURL(/_viewer_release/);
    expect(documents).toHaveLength(2);
    expect(new URL(documents[1]).searchParams.get('_viewer_release')).toBe(release.buildId);
    expect(checks).toHaveLength(2);
    await expect(page).toHaveURL(/primary_tab=mappings&keep=a%2Fb&keep=c#bookmark$/);
    await page.locator('#mappingFile').setInputFiles({
      name: 'mapping.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(mapping)),
    });
    await expect(page.locator('.mapping-source-context')).toContainText('source.json');
  });
}

test('legacy bookmarks retain their workspace and fragment during an update', async ({ page }) => {
  const { documents } = await serveStartup(page, { stale: true });
  await page.goto('Stand%20der%20Technik-Viewer.html?primary_tab=components#bookmark');
  await expect(page.locator('#componentPanel')).toBeVisible();
  await expect(page).toHaveURL(/\/\?primary_tab=components#bookmark$/);
  expect(documents).toHaveLength(2);
});

test('an inconsistent deployment cannot cause a reload loop', async ({ page }) => {
  const { documents } = await serveStartup(page, { stale: true, alwaysStale: true });
  await page.goto('./?primary_tab=mappings#bookmark');
  await expect(page.locator('#mappingPanel')).toBeVisible();
  await expect(page).not.toHaveURL(/_viewer_release/);
  expect(documents).toHaveLength(2);
});

for (const failure of ['unavailable', 'invalid', 'timeout']) {
  test(`viewer remains usable when release check is ${failure}`, async ({ page }) => {
    await page.route('**/release.json?*', async (route) => {
      if (failure === 'timeout') return; // Let the startup deadline abort the request.
      if (failure === 'unavailable') return route.abort();
      await route.fulfill({ json: { buildId: 'https://example.org/untrusted' } });
    });
    await page.goto('./?primary_tab=mappings');
    await expect(page.locator('#mappingPanel')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(base + '\\?primary_tab=mappings$'));
  });
}

test('a running session keeps uploaded files when a newer release becomes available', async ({
  page,
}) => {
  const { checks, documents } = await serveStartup(page);
  await page.goto('./?primary_tab=mappings');
  await expect(page.locator('#mappingPanel')).toBeVisible();
  await page.locator('#mappingFile').setInputFiles({
    name: 'mapping.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(mapping)),
  });
  await expect(page.locator('.mapping-source-context')).toContainText('source.json');
  await page.route('**/release.json?*', (route) => route.fulfill({ json: { buildId: oldBuild } }));
  await page.evaluate(() => {
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.locator('#tab-list').click();
  await page.locator('#tab-mappings').click();
  await expect(page.locator('.mapping-source-context')).toContainText('source.json');
  expect(documents).toHaveLength(1);
  expect(checks).toHaveLength(1);
});

test('a real ten-minute HTTP cache updates on the next bookmark visit', async ({ browser }) => {
  // A separate context has no Playwright routes: routing disables the browser cache.
  const context = await browser.newContext();
  let deployed = false;
  const requests = [];
  const guard = html.match(/<script data-viewer-update[^>]*>[\s\S]*?<\/script>/)[0];
  const server = createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === base + 'release.json') {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ buildId: deployed ? release.buildId : oldBuild }));
      return;
    }
    requests.push(url.href);
    const label = deployed ? 'new release' : 'old release';
    const inline = deployed ? guard : guard.replaceAll(release.buildId, oldBuild);
    response.setHeader('Content-Type', 'text/html');
    response.setHeader('Cache-Control', 'public, max-age=600');
    response.end(`<!doctype html><html><head>${inline}</head><body><script>
      window.__viewerReady.then(ready => {
        if (ready !== false) document.body.textContent = ${JSON.stringify(label)};
      });
    </script></body></html>`);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const page = await context.newPage();
    const bookmark = `http://127.0.0.1:${server.address().port}${base}`;
    await page.goto(bookmark);
    await expect(page.locator('body')).toHaveText('old release');
    await page.goto('about:blank');
    deployed = true;
    await page.goto(bookmark);
    await expect(page.locator('body')).toHaveText('new release');
    await expect(page).toHaveURL(bookmark);
    const documents = requests.filter((value) => new URL(value).pathname === base);
    // The second visit reused cached HTML; only the release-specific navigation
    // went to the server. This reproduces the Pages/bookmark bug without mocks.
    expect(documents).toHaveLength(2);
    expect(new URL(documents[1]).searchParams.get('_viewer_release')).toBe(release.buildId);
  } finally {
    await context.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
