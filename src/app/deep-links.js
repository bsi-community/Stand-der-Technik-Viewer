/** app/deep-links: see docs/architecture.md for responsibilities. */
import { switchTab } from './actions.js';
import { loadOscalFromUrl } from './loaders.js';
import { uiStore } from './store.js';
import { normalizeOscalKind } from '../domain/documents.js';
import { escapeHtml } from '../shared/html.js';
import { showMsg } from '../shared/ui/messages.js';

export function switchToOscalKind(kind) {
  if (kind === 'component') switchTab('components');
  else if (kind === 'mapping') switchTab('mappings');
  else switchTab('list');
}

export function getOscalKindUrlInput(kind) {
  if (kind === 'component') return uiStore.compEls.urlInput;
  if (kind === 'mapping') return uiStore.mappingEls.urlInput;
  return uiStore.els.urlInput;
}

export function loadOscalDeepLink() {
  var params;
  try {
    params = new URLSearchParams(window.location.search || '');
  } catch (_err) {
    return Promise.resolve(false);
  }
  var urls = params
    .getAll('url')
    .map(function (url) {
      return String(url || '').trim();
    })
    .filter(Boolean);
  if (!urls.length) return Promise.resolve(false);

  var rawKind = params.get('kind') || params.get('type') || '';
  var expectedKind = normalizeOscalKind(rawKind);
  if (rawKind && !expectedKind) {
    showMsg(
      '<strong>Deep Link konnte nicht geöffnet werden:</strong><br/>Unbekannter Dokumenttyp <code>' +
        escapeHtml(rawKind) +
        '</code>. Unterstützt werden <code>catalog</code>, <code>component-definition</code> und <code>mapping-collection</code>.',
      true,
    );
    return Promise.resolve(false);
  }

  var sourceLabel = params.get('label') || params.get('title') || '';
  if (expectedKind) {
    switchToOscalKind(expectedKind);
    var knownInput = getOscalKindUrlInput(expectedKind);
    if (knownInput) knownInput.value = urls[0];
  }
  showMsg(
    '<strong>OSCAL-Dokument wird über den Link geladen:</strong><br/><code>' +
      escapeHtml(urls[0]) +
      '</code>',
    false,
  );

  var chain = Promise.resolve(true);
  urls.forEach(function (url, index) {
    chain = chain.then(function () {
      return loadOscalFromUrl(
        url,
        expectedKind,
        urls.length === 1 ? sourceLabel : '',
        'Deep Link konnte nicht geladen werden:',
      ).then(function (detectedKind) {
        if (!detectedKind) return false;
        switchToOscalKind(detectedKind);
        var input = getOscalKindUrlInput(detectedKind);
        if (input && index === 0) input.value = url;
        return true;
      });
    });
  });
  return chain;
}

export function restoreViewerStateFromUrl() {
  var params;
  try {
    params = new URLSearchParams(window.location.search || '');
  } catch (_err) {
    return Promise.resolve(false);
  }

  var primary = params.get('primary_tab') || '';
  var secondary = params.get('secondary_tab') || '';
  var allowedPrimary = { home: true, list: true, components: true, mappings: true };
  var allowedSecondary = { graph: true, sunburst: true, bar: true, 'target-hierarchy': true };
  if (!allowedPrimary[primary]) primary = '';
  if (!allowedSecondary[secondary]) secondary = '';

  return loadOscalDeepLink().then(function (loaded) {
    if (primary) switchTab(primary);
    if (secondary) switchTab(secondary);
    return loaded;
  });
}
