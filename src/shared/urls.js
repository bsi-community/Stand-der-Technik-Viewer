/** shared/urls: see docs/architecture.md for responsibilities. */

export function normalizeCatalogUrl(input) {
  var url = String(input || '').trim();
  if (!url) return '';
  // GitHub-Blob-Links in Raw-Links umschreiben
  if (url.indexOf('github.com/') !== -1 && url.indexOf('/blob/') !== -1) {
    url = url.replace('github.com/', 'raw.githubusercontent.com/').replace('/blob/', '/');
  }
  try {
    var resolved = new URL(url, window.location.href);
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
      throw new Error('Nur HTTP- und HTTPS-URLs werden unterstützt.');
    }
    return resolved.href;
  } catch (err) {
    throw new Error('Ungültige OSCAL-URL: ' + url, { cause: err });
  }
}

export function isExternalLink(s) {
  return typeof s === 'string' && /^(https?:\/\/)/i.test(s.trim());
}

export function getBackMatterResource(resourceMap, rawUrl) {
  var url = String(rawUrl || '').trim();
  if (!url || url.charAt(0) !== '#') return null;
  var key = url.slice(1);
  if (!resourceMap || !resourceMap.get) return null;
  return resourceMap.get(key) || resourceMap.get(key.toLowerCase());
}

export function getBackMatterResourceHref(resource) {
  if (!resource) return '';
  var rlinks = Array.isArray(resource.rlinks) ? resource.rlinks : [];
  for (var i = 0; i < rlinks.length; i++) {
    if (rlinks[i] && rlinks[i].href) return rlinks[i].href;
  }
  return '';
}

export function getBackMatterResourceLabel(resource) {
  if (!resource) return '';
  if (resource.title) return resource.title;
  if (resource.citation && resource.citation.text) return resource.citation.text;
  if (resource.description) return String(resource.description).replace(/\s+/g, ' ').trim();
  return resource.uuid || '';
}

export function resolveResourceUrl(rawUrl, resourceMap, baseUrl) {
  var url = String(rawUrl || '').trim();
  if (!url) return '';
  if (/^data:image\//i.test(url)) return url;
  if (url.charAt(0) === '#') {
    var resource = getBackMatterResource(resourceMap, url);
    var linked = getBackMatterResourceHref(resource);
    if (linked)
      return resolveResourceUrl(
        linked,
        resourceMap,
        resource && resource.__baseUrl ? resource.__baseUrl : baseUrl,
      );
    return '';
  }
  if (/^(https?:)?\/\//i.test(url)) {
    try {
      return new URL(url, window.location.href).href;
    } catch (_e) {
      return url;
    }
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return '';
  if (baseUrl) {
    try {
      return new URL(url, baseUrl).href;
    } catch (_err) {}
  }
  return '';
}
