/** app/loaders: see docs/architecture.md for responsibilities. */
import { updateViewerQueryParam } from './navigation.js';
import { addCatalogSource, addComponentSource, addMappingSource } from './sources.js';
import { detectOscalKind, oscalKindLabel } from '../domain/documents.js';
import { escapeHtml } from '../shared/html.js';
import { showMsg } from '../shared/ui/messages.js';
import { normalizeCatalogUrl } from '../shared/urls.js';
import { ensureCatalogDependencies } from './catalog-dependencies.js';
import { isKern } from '../shared/ui/kern.js';
import { beginImport, urlValidationError } from '../shared/ui/import-feedback.js';

/** A single lifecycle for all local inputs, including simultaneous multi-file imports. */
function loadLocalDocument(file, kind) {
  if (!file) return Promise.resolve('');
  const finish = beginImport(kind, file.name);
  return new Promise((resolve) => {
    const reader = new FileReader();
    function fail(error) {
      const message = String(error.message || error);
      showMsg(
        '<strong>Datei konnte nicht geladen werden:</strong><br/><code>' +
          escapeHtml(file.name + ': ' + message) +
          '</code>',
        true,
      );
      finish(message);
      resolve('');
    }
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result || '');
        const detected = detectOscalKind(json);
        if (detected !== kind)
          throw new Error(
            'Erwartet wurde ' +
              oscalKindLabel(kind) +
              '. Bitte eine passende OSCAL-JSON-Datei auswählen.',
          );
        if (kind !== 'catalog') await ensureCatalogDependencies(json);
        const entry = { label: file.name, json, baseUrl: '' };
        if (kind === 'catalog') addCatalogSource(entry);
        else if (kind === 'component') addComponentSource(entry);
        else addMappingSource(entry);
        finish();
        resolve(kind);
      } catch (error) {
        fail(error);
      }
    };
    reader.onerror = () => fail(new Error('Die Datei konnte nicht gelesen werden.'));
    reader.onabort = () => fail(new Error('Das Lesen wurde abgebrochen.'));
    reader.readAsText(file);
  });
}

export function loadCatalogFile(file) {
  return loadLocalDocument(file, 'catalog');
}

export function addOscalUrlSource(kind, json, url, sourceLabel) {
  var detected = detectOscalKind(json);
  if (!detected) {
    throw new Error(
      'Die URL enthält keinen unterstützten OSCAL-Root (catalog, component-definition oder mapping-collection).',
    );
  }
  if (kind && detected !== kind) {
    throw new Error(
      'Erwartet wurde ' +
        oscalKindLabel(kind) +
        ', geladen wurde jedoch ' +
        oscalKindLabel(detected) +
        '.',
    );
  }
  var entry = { label: sourceLabel || url, json: json, baseUrl: url };
  if (detected === 'catalog') addCatalogSource(entry);
  else if (detected === 'component') addComponentSource(entry);
  else addMappingSource(entry);
  return detected;
}

const pendingUrls = new Map();

export function loadOscalFromUrl(rawUrl, expectedKind, sourceLabel, errorPrefix) {
  var url;
  try {
    url = normalizeCatalogUrl(rawUrl);
    if (isKern() && !url) throw new Error('Bitte eine Dokument-URL eingeben.');
  } catch (err) {
    urlValidationError(expectedKind, err.message);
    showMsg(
      '<strong>' +
        (errorPrefix || 'Fehler beim Laden der URL:') +
        '</strong><br/><code>' +
        escapeHtml(String(err.message || err)) +
        '</code>',
      true,
    );
    return Promise.resolve('');
  }
  if (!url) return Promise.resolve('');
  const key = `${expectedKind}:${url}`;
  if (pendingUrls.has(key)) return pendingUrls.get(key);
  const finish = beginImport(expectedKind, sourceLabel || url);
  const request = fetch(url, { credentials: 'same-origin', cache: 'no-store' })
    .then(function (res) {
      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }
      return res.json();
    })
    .then(async function (json) {
      const detected = detectOscalKind(json);
      if (detected && detected !== 'catalog' && (!expectedKind || expectedKind === detected))
        await ensureCatalogDependencies(json, url);
      const kind = addOscalUrlSource(expectedKind, json, url, sourceLabel);
      finish();
      return kind;
    })
    .catch(function (err) {
      finish(String(err.message || err));
      urlValidationError(expectedKind, String(err.message || err));
      showMsg(
        '<strong>' +
          (errorPrefix || 'Fehler beim Laden der URL:') +
          '</strong><br/><code>' +
          escapeHtml(String(err.message || err)) +
          '</code>',
        true,
      );
      return '';
    })
    .finally(() => pendingUrls.delete(key));
  pendingUrls.set(key, request);
  return request;
}

export function persistLoadedOscalUrl(rawUrl, kind, sourceLabel) {
  var url;
  try {
    url = normalizeCatalogUrl(rawUrl);
  } catch (_err) {
    return;
  }
  if (!url) return;
  updateViewerQueryParam('url', url);
  updateViewerQueryParam('kind', kind);
  updateViewerQueryParam('label', sourceLabel || null);
}

export function loadCatalogFromUrl(rawUrl, sourceLabel) {
  return loadOscalFromUrl(
    rawUrl,
    'catalog',
    sourceLabel,
    'Fehler beim Laden der Katalog-URL:',
  ).then(function (kind) {
    if (kind) persistLoadedOscalUrl(rawUrl, kind, sourceLabel);
    return kind;
  });
}

export function loadComponentFile(file) {
  return loadLocalDocument(file, 'component');
}

export function loadComponentFromUrl(rawUrl, sourceLabel) {
  return loadOscalFromUrl(
    rawUrl,
    'component',
    sourceLabel,
    'Fehler beim Laden der Component-URL:',
  ).then(function (kind) {
    if (kind) persistLoadedOscalUrl(rawUrl, kind, sourceLabel);
    return kind;
  });
}

export function loadMappingFile(file) {
  return loadLocalDocument(file, 'mapping');
}

export function loadMappingFromUrl(rawUrl, sourceLabel) {
  return loadOscalFromUrl(
    rawUrl,
    'mapping',
    sourceLabel,
    'Fehler beim Laden der Mapping-URL:',
  ).then(function (kind) {
    if (kind) persistLoadedOscalUrl(rawUrl, kind, sourceLabel);
    return kind;
  });
}
