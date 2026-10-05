/** infrastructure/repository: see docs/architecture.md for responsibilities. */
import {
  BSI_CONTROL_LAYER_CATALOGS_DIRECTORY,
  BSI_CONTROL_LAYER_PREFIX,
  BSI_CONTROL_LAYER_SOURCES_DIRECTORY,
  BSI_REPOSITORY_METADATA_CACHE_KEY,
  BSI_REPOSITORY_RAW_ROOT,
} from '../config.js';
import {
  getOscalDocumentIdentifier,
  getOscalDocumentTitle,
  normalizeOscalDocumentIdentifier,
} from '../domain/documents.js';

export function getRepositoryFileName(path) {
  var parts = String(path || '').split('/');
  return parts[parts.length - 1] || path;
}

export function buildRepositoryRawUrl(path) {
  return (
    BSI_REPOSITORY_RAW_ROOT +
    String(path || '')
      .split('/')
      .map(function (part) {
        return encodeURIComponent(part);
      })
      .join('/')
  );
}

export function getRepositoryJsonFiles(tree, prefix, catalogOnly, excludedPrefixes) {
  var entries = tree && Array.isArray(tree.tree) ? tree.tree : [];
  var exclusions = Array.isArray(excludedPrefixes) ? excludedPrefixes : [];
  var files = [];
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var path = entry && entry.path ? String(entry.path) : '';
    if (entry.type !== 'blob' || path.indexOf(prefix) !== 0 || !/\.json$/i.test(path)) continue;
    var excluded = false;
    for (var j = 0; j < exclusions.length; j++) {
      if (path.indexOf(exclusions[j]) === 0) {
        excluded = true;
        break;
      }
    }
    if (excluded) continue;
    if (catalogOnly && !/catalog\.json$/i.test(path)) continue;
    files.push({
      name: getRepositoryFileName(path),
      path: path,
      sha: String(entry.sha || ''),
      url: buildRepositoryRawUrl(path),
    });
  }
  files.sort(function (a, b) {
    return (
      a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }) ||
      a.path.localeCompare(b.path, 'de', { sensitivity: 'base' })
    );
  });
  return files;
}

export function isControlLayerSourceCatalogPath(path) {
  var value = String(path || '');
  if (value.indexOf(BSI_CONTROL_LAYER_PREFIX) !== 0) return false;
  var segments = value.slice(BSI_CONTROL_LAYER_PREFIX.length).split('/');
  return (
    segments.length >= 4 &&
    String(segments[0] || '').trim() !== '' &&
    String(segments[1] || '').toLowerCase() === BSI_CONTROL_LAYER_SOURCES_DIRECTORY &&
    String(segments[2] || '').toLowerCase() === BSI_CONTROL_LAYER_CATALOGS_DIRECTORY
  );
}

export function appendRepositoryOptions(selectEl, label, files) {
  if (!selectEl || !files.length) return;
  var parent = label ? document.createElement('optgroup') : selectEl;
  if (label) parent.label = label;
  for (var i = 0; i < files.length; i++) {
    var option = document.createElement('option');
    option.value = files[i].url;
    option.textContent = files[i].title || files[i].fallbackTitle || 'OSCAL-Dokument';
    option.dataset.fileName = files[i].name;
    option.dataset.documentTitle = files[i].title || '';
    option.dataset.documentId = files[i].documentId || '';
    option.title = option.textContent;
    parent.appendChild(option);
  }
  if (label) selectEl.appendChild(parent);
}

export function repositoryFallbackTitle(file) {
  return String((file && file.name) || 'OSCAL-Dokument')
    .replace(/\.json$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim();
}

export function readRepositoryMetadataCache() {
  try {
    var stored = localStorage.getItem(BSI_REPOSITORY_METADATA_CACHE_KEY);
    var parsed = stored ? JSON.parse(stored) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (err) {
    return {};
  }
}

export function applyRepositoryMetadataCache(files, cache) {
  var list = Array.isArray(files) ? files : [];
  var pending = [];
  for (var i = 0; i < list.length; i++) {
    var file = list[i];
    file.fallbackTitle = repositoryFallbackTitle(file);
    file.documentId = '';
    file.metadataLoaded = false;
    var cached = cache && cache[file.path];
    if (
      file.sha &&
      cached &&
      cached.sha === file.sha &&
      typeof cached.title === 'string' &&
      cached.title.trim() &&
      typeof cached.documentId === 'string'
    ) {
      file.title = cached.title.trim();
      file.documentId = normalizeOscalDocumentIdentifier(cached.documentId);
      file.metadataLoaded = true;
    } else {
      file.title = file.fallbackTitle;
      pending.push(file);
    }
  }
  return pending;
}

export function persistRepositoryMetadataCache(currentFiles) {
  var next = {};
  var files = Array.isArray(currentFiles) ? currentFiles : [];
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    if (file.sha && file.metadataLoaded && typeof file.title === 'string' && file.title.trim()) {
      next[file.path] = {
        sha: file.sha,
        title: file.title.trim(),
        documentId: file.documentId || '',
      };
    }
  }
  try {
    localStorage.setItem(BSI_REPOSITORY_METADATA_CACHE_KEY, JSON.stringify(next));
  } catch (err) {
    // Der Viewer bleibt auch ohne verfügbaren Browser-Speicher vollständig nutzbar.
  }
}

export function sortRepositoryFiles(files) {
  var list = Array.isArray(files) ? files : [];
  list.sort(function (a, b) {
    return (
      String(a.title || a.fallbackTitle || a.name || '').localeCompare(
        String(b.title || b.fallbackTitle || b.name || ''),
        'de',
        { sensitivity: 'base' },
      ) || String(a.path || '').localeCompare(String(b.path || ''), 'de', { sensitivity: 'base' })
    );
  });
  return list;
}

export function compareRepositoryDuplicatePreference(a, b) {
  var aName = getRepositoryFileName(a && a.path);
  var bName = getRepositoryFileName(b && b.path);
  return (
    aName.length - bName.length ||
    String((a && a.path) || '').length - String((b && b.path) || '').length ||
    String((a && a.path) || '').localeCompare(String((b && b.path) || ''), 'de', {
      sensitivity: 'base',
    })
  );
}

export function deduplicateRepositoryFilesByDocumentId(files) {
  var list = Array.isArray(files) ? files : [];
  var unique = [];
  var indexByDocumentId = Object.create(null);
  for (var i = 0; i < list.length; i++) {
    var file = list[i];
    var key = normalizeOscalDocumentIdentifier(file && file.documentId);
    if (!key) {
      unique.push(file);
      continue;
    }
    if (typeof indexByDocumentId[key] === 'undefined') {
      indexByDocumentId[key] = unique.length;
      unique.push(file);
      continue;
    }
    var existingIndex = indexByDocumentId[key];
    if (compareRepositoryDuplicatePreference(file, unique[existingIndex]) < 0) {
      unique[existingIndex] = file;
    }
  }
  return unique;
}

export function enrichRepositoryMetadata(files, cache) {
  var list = Array.isArray(files) ? files : [];
  var nextIndex = 0;
  function worker() {
    if (nextIndex >= list.length) return Promise.resolve();
    var file = list[nextIndex++];
    return fetch(file.url, { credentials: 'omit', cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        file.title = getOscalDocumentTitle(json, file.fallbackTitle);
        file.documentId = getOscalDocumentIdentifier(json);
        file.metadataLoaded = true;
        if (file.sha)
          cache[file.path] = { sha: file.sha, title: file.title, documentId: file.documentId };
      })
      .catch(function () {
        file.title = file.fallbackTitle;
        file.documentId = '';
        file.metadataLoaded = false;
      })
      .then(worker);
  }
  var workers = [];
  var count = Math.min(6, list.length);
  for (var i = 0; i < count; i++) workers.push(worker());
  return Promise.all(workers);
}
