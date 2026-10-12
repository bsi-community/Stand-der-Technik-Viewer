import { test, expect } from '@playwright/test';
import { catalog, component, mapping, hierarchyCsv } from '../fixtures/documents.js';

const largeCatalog = structuredClone(catalog);
largeCatalog.catalog.metadata.title = 'Synthetischer Katalog mit 1000 Anforderungen';
largeCatalog.catalog.groups = Array.from({ length: 20 }, (_, g) => ({
  id: `practice-${g + 1}`,
  title: `Praktik ${g + 1}`,
  controls: Array.from({ length: 50 }, (_, c) => ({
    id: `P${g + 1}-${c + 1}`,
    title: `Beispielanforderung ${g + 1}.${c + 1}`,
    parts: [{ name: 'statement', prose: 'Synthetische Anforderung für die Layoutprüfung.' }],
    links: c ? [{ rel: 'related', href: `#P${g + 1}-${c}` }] : [],
  })),
}));

async function upload(page, tab, input, json) {
  await page.locator(`#tab-${tab}`).click();
  await page.locator(input).setInputFiles({
    name: 'visual-fixture.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(json)),
  });
  const info =
    tab === 'list' ? '#fileInfo' : tab === 'components' ? '#compFileInfo' : '#mappingFileInfo';
  const data = json.catalog || json['component-definition'] || json['mapping-collection'];
  await expect(page.locator(info)).toContainText(data.metadata.title);
}

test.beforeEach(async ({ page }) => {
  await page.route('https://**/*', (route) => {
    if (route.request().url().endsWith('.csv'))
      return route.fulfill({ body: hierarchyCsv, contentType: 'text/csv' });
    if (route.request().url() === 'https://example.org/catalog.json')
      return route.fulfill({ json: catalog });
    return route.fulfill({ json: { tree: [] } });
  });
  await page.goto('./');
});

// These assertions catch the original regression (legend in normal flow plus
// native media height:auto) and stale D3 dimensions after an actual window resize.
// Each chart has its own budget and diagnostics: tracing 1000 moving SVG nodes is
// much more expensive on a shared CI runner than on a local development machine.
for (const mode of ['catalog', 'component', 'mapping']) {
  for (const chart of ['graph', 'sunburst', 'bar']) {
    test(`${mode}: ${chart} stays inside its frame after resizing`, async ({ page }, testInfo) => {
      test.setTimeout(60000);
      await upload(page, 'list', '#file', mode === 'catalog' ? largeCatalog : catalog);
      if (mode === 'component') await upload(page, 'components', '#compFile', component);
      if (mode === 'mapping') await upload(page, 'mappings', '#mappingFile', mapping);
      await page.locator(`#tab-${chart}`).click();
      await expect(page.locator(`#${chart} svg`)).toBeVisible();
      for (const width of [1920, 1280, 800]) {
        await page.setViewportSize({ width, height: width === 1280 ? 720 : 1000 });
        await expect
          .poll(async () =>
            page.locator(`#${chart}`).evaluate((el) => {
              const svg = el.querySelector('svg'),
                rect = svg.getBoundingClientRect(),
                frame = el.getBoundingClientRect();
              return Math.max(
                Math.abs(rect.x - frame.x - 1),
                Math.abs(rect.y - frame.y - 1),
                Math.abs(rect.width - el.clientWidth),
                Math.abs(rect.height - el.clientHeight),
                Math.abs(Number(svg.getAttribute('width')) - el.clientWidth),
                Math.abs(Number(svg.getAttribute('height')) - el.clientHeight),
              );
            }),
          )
          .toBeLessThan(2);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        if (chart === 'bar') {
          const ticks = await page
            .locator('#bar svg > g > g:nth-child(2) .tick text')
            .allTextContents();
          expect(new Set(ticks).size).toBe(ticks.length);
        }
        if (chart !== 'bar') {
          await expect(page.locator(`#${chart} .chart-legend`)).toHaveCSS('position', 'absolute');
          const geometry = await page.locator(`#${chart}`).evaluate((el) => {
            const frame = el.getBoundingClientRect(),
              legend = el.querySelector('.chart-legend').getBoundingClientRect();
            const paths = [...el.querySelectorAll('svg > g > path')].map((p) =>
              p.getBoundingClientRect(),
            );
            return {
              legendInside:
                legend.left >= frame.left &&
                legend.right <= frame.right &&
                legend.top >= frame.top &&
                legend.bottom <= frame.bottom,
              sectorsInside: paths.every(
                (p) =>
                  p.left >= frame.left &&
                  p.right <= frame.right &&
                  p.top >= frame.top &&
                  p.bottom <= frame.bottom,
              ),
              legendClear: paths.every((p) => p.right + 8 <= legend.left),
            };
          });
          expect(geometry.legendInside).toBe(true);
          if (chart === 'sunburst') {
            expect(geometry.sectorsInside).toBe(true);
            expect(geometry.legendClear).toBe(true);
            expect(
              await page.locator('#sunburst').evaluate((el) => {
                const center = [
                  ...el.querySelectorAll('.sunburst-center-title, .sunburst-center-value'),
                ].map((t) => t.getBoundingClientRect());
                return [...el.querySelectorAll('.sunburst-label-layer text')].every((t) => {
                  const r = t.getBoundingClientRect();
                  return center.every(
                    (c) =>
                      r.right <= c.left ||
                      r.left >= c.right ||
                      r.bottom <= c.top ||
                      r.top >= c.bottom,
                  );
                });
              }),
            ).toBe(true);
          }
        }
        if (chart === 'graph') {
          await expect
            .poll(
              async () =>
                page.locator('#graph').evaluate((el) => {
                  const f = el.getBoundingClientRect(),
                    g = el.querySelector('svg > g').getBoundingClientRect();
                  return (
                    g.left >= f.left && g.right <= f.right && g.top >= f.top && g.bottom <= f.bottom
                  );
                }),
              { timeout: 15000 },
            )
            .toBe(true);
        }
        if (width === 1280)
          await page
            .locator(`#${chart}`)
            .screenshot({ path: testInfo.outputPath(`${mode}-${chart}.png`) });
      }
    });
  }
}

test('chart dimensions follow their container without a window resize', async ({ page }) => {
  await upload(page, 'list', '#file', catalog);
  await page.locator('#tab-sunburst').click();
  const chart = page.locator('#sunburst');
  const viewport = page.viewportSize();
  await chart.evaluate((el) => {
    el.style.width = '640px';
    el.style.height = '480px';
  });
  await expect
    .poll(() =>
      chart.evaluate((el) => {
        const svg = el.querySelector('svg');
        return [Number(svg.getAttribute('width')), Number(svg.getAttribute('height'))];
      }),
    )
    .toEqual([638, 478]);
  expect(page.viewportSize()).toEqual(viewport);
});

test('remaining workspaces: expanded content, hierarchy details, dialog and empty states fit the page', async ({
  page,
}, testInfo) => {
  await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true });
  for (const tab of ['list', 'components', 'mappings']) {
    await page.locator(`#tab-${tab}`).click();
    await expect(page.locator('main .workspace-empty-state:visible')).toBeVisible();
  }
  await upload(page, 'list', '#file', catalog);
  await page.getByRole('button', { name: 'Alles aufklappen', exact: true }).click();
  await page
    .locator('.control-card')
    .first()
    .screenshot({ path: testInfo.outputPath('requirement.png') });
  await page
    .locator('.control-card')
    .first()
    .getByRole('button', { name: /^JSON(?: zu .+ anzeigen)?$/ })
    .click();
  await page.locator('.modal-card').screenshot({ path: testInfo.outputPath('json-dialog.png') });
  await page.keyboard.press('Escape');
  await page.locator('#tab-target-hierarchy').click();
  await expect(page.locator('#targetHierarchyCanvas svg')).toBeVisible();
  await expect(page.locator('#targetHierarchyDetails')).toHaveCSS('position', 'static');
  await page
    .locator('.target-hierarchy-view')
    .screenshot({ path: testInfo.outputPath('hierarchy.png') });
  await upload(page, 'components', '#compFile', component);
  await page.getByRole('button', { name: 'Alles aufklappen', exact: true }).click();
  await page.locator('#componentTab').screenshot({ path: testInfo.outputPath('components.png') });
  await upload(page, 'mappings', '#mappingFile', mapping);
  await page.locator('#mappingTab').screenshot({ path: testInfo.outputPath('mapping.png') });
  for (const width of [1280, 800]) {
    await page.setViewportSize({ width, height: 900 });
    for (const tab of ['list', 'components', 'mappings', 'target-hierarchy']) {
      if (tab === 'target-hierarchy') await page.locator('#tab-list').click();
      await page.locator(`#tab-${tab}`).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  }
});
