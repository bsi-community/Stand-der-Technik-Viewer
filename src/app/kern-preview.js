/** Presentation-only entry point. Uses existing loading and rendering paths. */
import { addCatalogSource, addMappingSource, activateCatalogSource } from './sources.js';
import { switchTab } from './actions.js';

export async function prepareKernPreview() {
  const skip = document.createElement('a');
  skip.className = 'kern-skip';
  skip.href = '#viewerMain';
  skip.textContent = 'Zum Inhalt springen';
  document.body.prepend(skip);
  const main = document.querySelector('main');
  main.id = 'viewerMain';
  main.tabIndex = -1;
  const title = document.querySelector('header h1');
  title.textContent = 'Stand der Technik';
  const version = document.getElementById('viewerVersion');
  title.appendChild(version);
  document.getElementById('viewSubtitle').textContent =
    'Viewer für Anforderungen, Umsetzungen und Mappings';
  const bar = document.createElement('div');
  bar.className = 'kern-preview-bar';
  bar.innerHTML =
    '<p><strong>KERN UX · Testversion</strong> <span class="kern-font-note" id="previewFontStatus">Fira Sans · BundesSans noch nicht hinterlegt</span></p><nav class="kern-preview-nav" aria-label="Vergleichsansichten"><a href="?">Startseite</a><a href="?preview=catalog">Anforderung &amp; Filter</a><a href="?preview=mapping">Mapping-Vergleich</a><a href="?design=legacy">Bisherige Gestaltung</a></nav>';
  document.querySelector('header').before(bar);
  const scenario = new URLSearchParams(location.search).get('preview');
  const active = bar.querySelector(
    scenario === 'catalog'
      ? '[href="?preview=catalog"]'
      : scenario === 'mapping'
        ? '[href="?preview=mapping"]'
        : '[href="?"]',
  );
  active.setAttribute('aria-current', 'page');
  if (['catalog', 'mapping'].includes(scenario)) {
    bar.querySelector('[href="?design=legacy"]').href = `?design=legacy&preview=${scenario}`;
  }
  const fonts = import.meta.env.VIEWER_BUNDESSANS;
  if (fonts) {
    try {
      await Promise.all(
        fonts.map(async ({ file, weight, style }) => {
          const url = new URL(
            `${import.meta.env.BASE_URL}assets/bundessans/${file}`,
            location.origin,
          );
          const face = new FontFace('BundesSans Web', `url("${url.href}")`, {
            weight: String(weight),
            style,
            display: 'swap',
          });
          document.fonts.add(await face.load());
        }),
      );
      document.documentElement.style.setProperty(
        '--viewer-font',
        '"BundesSans Web", "Fira Sans", sans-serif',
      );
      document.getElementById('previewFontStatus').textContent = 'BundesSans Web';
      document.documentElement.dataset.viewerFont = 'bundessans';
    } catch {
      document.getElementById('previewFontStatus').textContent =
        'Fira Sans · BundesSans konnte nicht geladen werden';
    }
  }
}

export async function loadPreviewScenario() {
  const scenario = new URLSearchParams(location.search).get('preview');
  if (!['catalog', 'mapping'].includes(scenario)) return;
  const { source, target, mapping, sourceUrl, targetUrl } = await import('../preview/documents.js');
  addCatalogSource({ label: 'Beispielkatalog Organisation', json: source, baseUrl: sourceUrl });
  if (scenario === 'mapping') {
    addCatalogSource({ label: 'Beispielkatalog Technik', json: target, baseUrl: targetUrl });
    addMappingSource({ label: 'Beispielmapping', json: mapping, baseUrl: '' });
    switchTab('mappings');
    document.querySelector('#mappingPanel details[data-section="filters"]').open = true;
  } else {
    activateCatalogSource(0);
    switchTab('list');
    document.querySelector('#catalogPanel details[data-section="filters"]').open = true;
    const first = document.querySelector('#listTab .control-card');
    if (first) {
      let parent = first.parentElement;
      while (parent && parent.id !== 'listTab') {
        if (parent.tagName === 'DETAILS') parent.open = true;
        parent = parent.parentElement;
      }
      first.open = true;
    }
  }
  const note = document.createElement('p');
  note.className = 'kern-demo-note';
  note.textContent =
    'Beispieldaten für den Designvergleich · keine BSI-Anforderungen und keine fachlich geprüfte Zuordnung.';
  document.querySelector('main').prepend(note);
}
