/** app/loaders: see docs/architecture.md for responsibilities. */
import { updateViewerQueryParam } from './navigation.js';
import { addCatalogSource, addComponentSource, addMappingSource } from './sources.js';
import { detectOscalKind, oscalKindLabel } from '../domain/documents.js';
import { escapeHtml } from '../shared/html.js';
import { showMsg } from '../shared/ui/messages.js';
import { normalizeCatalogUrl } from '../shared/urls.js';

export function loadCatalogFile(f) {
  if (!f) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      var fileText = e.target.result || '';
      var json = JSON.parse(fileText);
      addCatalogSource({ label: f.name, json: json, baseUrl: '' });
    } catch (err) {
      showMsg(
        '<strong>Fehler beim Laden der JSON:</strong><br/><code>' +
          escapeHtml(String(err.message || err)) +
          '</code>',
        true,
      );
    }
  };
  reader.onerror = function () {
    showMsg('<strong>Fehler beim Lesen der Datei.</strong>', true);
  };
  reader.readAsText(f);
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

export function loadOscalFromUrl(rawUrl, expectedKind, sourceLabel, errorPrefix) {
  var url;
  try {
    url = normalizeCatalogUrl(rawUrl);
  } catch (err) {
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
  return fetch(url, { credentials: 'same-origin', cache: 'no-store' })
    .then(function (res) {
      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }
      return res.json();
    })
    .then(function (json) {
      return addOscalUrlSource(expectedKind, json, url, sourceLabel);
    })
    .catch(function (err) {
      showMsg(
        '<strong>' +
          (errorPrefix || 'Fehler beim Laden der URL:') +
          '</strong><br/><code>' +
          escapeHtml(String(err.message || err)) +
          '</code>',
        true,
      );
      return '';
    });
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

export function loadComponentFile(f) {
  if (!f) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      var fileText = e.target.result || '';
      var json = JSON.parse(fileText);
      addComponentSource({ label: f.name, json: json, baseUrl: '' });
    } catch (err) {
      showMsg(
        '<strong>Fehler beim Laden der Komponentendefinition:</strong><br/><code>' +
          escapeHtml(String(err.message || err)) +
          '</code>',
        true,
      );
    }
  };
  reader.onerror = function () {
    showMsg('<strong>Fehler beim Lesen der Datei.</strong>', true);
  };
  reader.readAsText(f);
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

export function loadMappingFile(f) {
  if (!f) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      var fileText = e.target.result || '';
      var json = JSON.parse(fileText);
      if (!json || !json['mapping-collection'])
        throw new Error('Kein OSCAL mapping-collection Root gefunden.');
      addMappingSource({ label: f.name, json: json, baseUrl: '' });
    } catch (err) {
      showMsg(
        '<strong>Fehler beim Laden des Control Mappings:</strong><br/><code>' +
          escapeHtml(String(err.message || err)) +
          '</code>',
        true,
      );
    }
  };
  reader.onerror = function () {
    showMsg('<strong>Fehler beim Lesen der Mapping-Datei.</strong>', true);
  };
  reader.readAsText(f);
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
