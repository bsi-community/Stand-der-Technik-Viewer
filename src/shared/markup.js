/** shared/markup: see docs/architecture.md for responsibilities. */
import { catalogStore, componentStore, uiStore } from '../app/store.js';
import { replaceParams } from '../domain/parameters.js';
import { escapeHtml, highlightParamsInEscaped } from './html.js';
import { highlightSearchInHtml } from './search.js';
import { getBackMatterResource, getBackMatterResourceLabel, resolveResourceUrl } from './urls.js';

export function renderTextWithParams(raw, paramMap, searchTerm) {
  var replaced = replaceParams(raw, paramMap);
  return renderInlineMarkup(replaced, searchTerm);
}

export function renderMarkupWithParams(raw, paramMap, searchTerm) {
  var replaced = replaceParams(raw, paramMap);
  return renderMarkupMultiline(replaced, searchTerm);
}

export function renderHighlightedInline(raw, searchTerm) {
  return highlightSearchInHtml(escapeHtml(raw == null ? '' : String(raw)), searchTerm);
}

export function resolveCatalogResourceUrl(rawUrl) {
  return resolveResourceUrl(
    rawUrl,
    catalogStore.state.catalogResourcesByUuid,
    catalogStore.state.catalogBaseUrl,
  );
}

export function buildCatalogLinkHtml(label, rawUrl, searchTerm) {
  var href = resolveCatalogResourceUrl(rawUrl);
  var resourceLabel = '';
  if ((label == null || label === '') && String(rawUrl || '').charAt(0) === '#') {
    resourceLabel = getBackMatterResourceLabel(
      getBackMatterResource(catalogStore.state.catalogResourcesByUuid, rawUrl),
    );
  }
  var labelHtml = renderHighlightedInline(
    label == null || label === '' ? resourceLabel || rawUrl : label,
    searchTerm,
  );
  if (!href) return labelHtml;
  return (
    '<a class="catalog-link" href="' +
    escapeHtml(href) +
    '" target="_blank" rel="noopener noreferrer">' +
    labelHtml +
    '</a>'
  );
}

export function getActiveResourceMap() {
  return uiStore.uiState.dataMode === 'component'
    ? componentStore.componentState.resourceByUuid
    : catalogStore.state.catalogResourcesByUuid;
}

export function getActiveBaseUrl() {
  return uiStore.uiState.dataMode === 'component'
    ? componentStore.componentState.baseUrl
    : catalogStore.state.catalogBaseUrl;
}

export function buildActiveLinkHtml(label, rawUrl, searchTerm) {
  var resourceMap = getActiveResourceMap();
  var href = resolveResourceUrl(rawUrl, resourceMap, getActiveBaseUrl());
  var resourceLabel = '';
  if ((label == null || label === '') && String(rawUrl || '').charAt(0) === '#') {
    resourceLabel = getBackMatterResourceLabel(getBackMatterResource(resourceMap, rawUrl));
  }
  var labelHtml = renderHighlightedInline(
    label == null || label === '' ? resourceLabel || rawUrl : label,
    searchTerm,
  );
  if (!href) return labelHtml;
  return (
    '<a class="catalog-link" href="' +
    escapeHtml(href) +
    '" target="_blank" rel="noopener noreferrer">' +
    labelHtml +
    '</a>'
  );
}

export function parseMarkdownImage(text) {
  var m = String(text || '').match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
  if (!m) return null;
  return { alt: m[1] || '', src: m[2] || '', title: m[3] || '' };
}

export function renderMarkdownImageHtml(img, searchTerm, standalone) {
  if (!img || !img.src) return '';
  var src = resolveResourceUrl(img.src, getActiveResourceMap(), getActiveBaseUrl());
  if (!src)
    return renderHighlightedInline(
      '![' + (img.alt || '') + '](' + (img.src || '') + ')',
      searchTerm,
    );
  var titleAttr = img.title ? ' title="' + escapeHtml(img.title) + '"' : '';
  var imgTag =
    '<img src="' +
    escapeHtml(src) +
    '" alt="' +
    escapeHtml(img.alt || '') +
    '"' +
    titleAttr +
    ' loading="lazy" decoding="async" referrerpolicy="no-referrer">';
  if (!standalone) return imgTag;
  return '<figure>' + imgTag + '</figure>';
}

export function renderInlineMarkup(text, searchTerm) {
  var out = escapeHtml(text == null ? '' : String(text));
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function (_, alt, src, title) {
    return renderMarkdownImageHtml(
      { alt: alt || '', src: src || '', title: title || '' },
      searchTerm,
      false,
    );
  });
  // Markdown links first
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function (_, label, href) {
    return buildActiveLinkHtml(label, href, searchTerm);
  });
  // Bare URLs
  out = out.replace(/(^|[\s(>])((https?:\/\/)[^\s<)]+)/g, function (_, pfx, href) {
    return pfx + buildActiveLinkHtml(href, href, searchTerm);
  });
  // Basic inline markdown
  out = highlightParamsInEscaped(out);
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  return highlightSearchInHtml(out, searchTerm);
}

var _markupRenderCache = {};

var _markupRenderCacheOrder = [];

var _markupRenderCacheMax = 800;

export function getMarkupCache(key) {
  return Object.prototype.hasOwnProperty.call(_markupRenderCache, key)
    ? _markupRenderCache[key]
    : null;
}

export function setMarkupCache(key, val) {
  if (!Object.prototype.hasOwnProperty.call(_markupRenderCache, key)) {
    _markupRenderCacheOrder.push(key);
    if (_markupRenderCacheOrder.length > _markupRenderCacheMax) {
      var oldKey = _markupRenderCacheOrder.shift();
      delete _markupRenderCache[oldKey];
    }
  }
  _markupRenderCache[key] = val;
}

export function renderMarkupMultiline(text, searchTerm) {
  var raw = String(text == null ? '' : text).replace(/\r\n/g, '\n');
  if (!raw.trim()) return '<span>-</span>';
  var cacheKey = String(searchTerm || '') + '\u001f' + raw;
  var cached = getMarkupCache(cacheKey);
  if (cached !== null) return cached;

  var lines = raw.split('\n');
  var html = [];
  var inCode = false;
  var inUl = false;
  var inOl = false;
  var codeBuf = [];
  var paraBuf = [];

  function flushPara() {
    if (!paraBuf.length) return;
    var paraText = paraBuf.join(' ').trim();
    var imageOnly = parseMarkdownImage(paraText);
    if (imageOnly) {
      html.push(renderMarkdownImageHtml(imageOnly, searchTerm, true));
    } else {
      html.push('<p>' + renderInlineMarkup(paraText, searchTerm) + '</p>');
    }
    paraBuf = [];
  }
  function closeLists() {
    if (inUl) {
      html.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      html.push('</ol>');
      inOl = false;
    }
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var trim = line.trim();

    if (trim.indexOf('```') === 0) {
      flushPara();
      closeLists();
      if (inCode) {
        html.push('<pre><code>' + escapeHtml(codeBuf.join('\n')) + '</code></pre>');
        codeBuf = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    if (!trim) {
      flushPara();
      closeLists();
      continue;
    }

    // Basic markdown table support
    if (trim.indexOf('|') !== -1 && i + 1 < lines.length) {
      var nextTrim = lines[i + 1].trim();
      if (/^\|?[\s:\-|]+\|?$/.test(nextTrim) && nextTrim.indexOf('|') !== -1) {
        flushPara();
        closeLists();
        var parseRow = function (row) {
          var r = row.trim();
          if (r.charAt(0) === '|') r = r.slice(1);
          if (r.charAt(r.length - 1) === '|') r = r.slice(0, -1);
          return r.split('|').map(function (c) {
            return c.trim();
          });
        };
        var headers = parseRow(trim);
        var rows = [];
        i += 2;
        while (i < lines.length) {
          var tr = lines[i].trim();
          if (!tr || tr.indexOf('|') === -1) break;
          rows.push(parseRow(tr));
          i++;
        }
        i -= 1;
        html.push('<div class="catalog-table-scroll"><table><thead><tr>');
        for (var hi = 0; hi < headers.length; hi++) {
          html.push('<th>' + renderInlineMarkup(headers[hi], searchTerm) + '</th>');
        }
        html.push('</tr></thead><tbody>');
        for (var ri = 0; ri < rows.length; ri++) {
          html.push('<tr>');
          for (var ci = 0; ci < rows[ri].length; ci++) {
            html.push('<td>' + renderInlineMarkup(rows[ri][ci], searchTerm) + '</td>');
          }
          html.push('</tr>');
        }
        html.push('</tbody></table></div>');
        continue;
      }
    }

    var hm = trim.match(/^(#{1,6})\s+(.+)$/);
    if (hm) {
      flushPara();
      closeLists();
      var level = hm[1].length;
      html.push('<h' + level + '>' + renderInlineMarkup(hm[2], searchTerm) + '</h' + level + '>');
      continue;
    }

    var um = trim.match(/^[-*]\s+(.+)$/);
    if (um) {
      flushPara();
      if (inOl) {
        html.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        html.push('<ul>');
        inUl = true;
      }
      html.push('<li>' + renderInlineMarkup(um[1], searchTerm) + '</li>');
      continue;
    }

    var om = trim.match(/^\d+\.\s+(.+)$/);
    if (om) {
      flushPara();
      if (inUl) {
        html.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        html.push('<ol>');
        inOl = true;
      }
      html.push('<li>' + renderInlineMarkup(om[1], searchTerm) + '</li>');
      continue;
    }

    if (trim.indexOf('>') === 0) {
      flushPara();
      closeLists();
      html.push(
        '<blockquote>' +
          renderInlineMarkup(trim.replace(/^>\s?/, ''), searchTerm) +
          '</blockquote>',
      );
      continue;
    }

    paraBuf.push(trim);
  }

  flushPara();
  closeLists();
  if (inCode) {
    html.push('<pre><code>' + escapeHtml(codeBuf.join('\n')) + '</code></pre>');
  }

  var rendered = html.join('');
  setMarkupCache(cacheKey, rendered);
  return rendered;
}
