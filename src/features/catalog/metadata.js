/** features/catalog/metadata: see docs/architecture.md for responsibilities. */
import { catalogStore, uiStore } from '../../app/store.js';
import {
  renderHighlightedInline,
  renderInlineMarkup,
  renderMarkupMultiline,
} from '../../shared/markup.js';
import {
  formatCatalogKey,
  getDisplayRows,
  getObjectDisplayRows,
  hasDisplayValue,
} from '../../shared/ui/metadata.js';

export function buildCatalogValueNode(val) {
  var wrap = document.createElement('div');
  wrap.className = 'catalog-table-wrap';

  if (val == null || val === '') {
    wrap.textContent = '-';
    return wrap;
  }

  if (Array.isArray(val)) {
    var displayItems = val.filter(hasDisplayValue);
    if (!displayItems.length) {
      wrap.textContent = '-';
      return wrap;
    }
    var allScalars = true;
    var allObjects = true;
    for (var ai = 0; ai < displayItems.length; ai++) {
      var itemType = typeof displayItems[ai];
      if (displayItems[ai] !== null && itemType === 'object') {
        allScalars = false;
      } else {
        allObjects = false;
      }
    }

    // Scalar arrays (e.g. email-addresses, party-uuids) as plain stacked lines without bullets.
    if (allScalars) {
      for (var si = 0; si < displayItems.length; si++) {
        var line = document.createElement('div');
        if (typeof displayItems[si] === 'string') {
          line.innerHTML =
            '<div class="catalog-md">' +
            renderMarkupMultiline(displayItems[si], catalogStore.state.qRaw) +
            '</div>';
        } else {
          line.innerHTML = renderHighlightedInline(
            String(displayItems[si]),
            catalogStore.state.qRaw,
          );
        }
        wrap.appendChild(line);
      }
      return wrap;
    }

    // Object arrays (e.g. rlinks) as compact key/value lines, not nested tables.
    if (allObjects) {
      for (var oi = 0; oi < displayItems.length; oi++) {
        var compact = document.createElement('div');
        compact.className = 'catalog-subitem';
        compact.appendChild(buildCatalogObjectInline(displayItems[oi]));
        wrap.appendChild(compact);
      }
      return wrap;
    }

    for (var mi = 0; mi < displayItems.length; mi++) {
      var mixed = document.createElement('div');
      mixed.appendChild(buildCatalogValueNode(displayItems[mi]));
      wrap.appendChild(mixed);
    }
    return wrap;
  }

  if (typeof val === 'object') {
    wrap.appendChild(buildCatalogObjectInline(val));
    return wrap;
  }

  if (typeof val === 'string') {
    wrap.innerHTML =
      '<div class="catalog-md">' + renderMarkupMultiline(val, catalogStore.state.qRaw) + '</div>';
    return wrap;
  }

  wrap.innerHTML = renderHighlightedInline(String(val), catalogStore.state.qRaw);
  return wrap;
}

export function buildCatalogObjectInline(obj) {
  var block = document.createElement('div');
  var keys = Object.keys(obj || {}).filter(function (key) {
    return hasDisplayValue(obj[key]);
  });
  if (!keys.length) {
    block.textContent = '-';
    return block;
  }

  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var row = document.createElement('div');
    row.className = 'catalog-object-field';
    var label = document.createElement('strong');
    label.innerHTML = renderHighlightedInline(formatCatalogKey(k) + ': ', catalogStore.state.qRaw);
    row.appendChild(label);

    var v = obj[k];
    if (Array.isArray(v)) {
      if (!v.length) {
        row.appendChild(document.createTextNode('-'));
      } else {
        var arrWrap = document.createElement('span');
        for (var ai = 0; ai < v.length; ai++) {
          if (ai > 0) {
            arrWrap.appendChild(document.createTextNode(' | '));
          }
          var sub = v[ai];
          if (sub && typeof sub === 'object') {
            var href = sub.href || sub.url || '';
            if (href) {
              var a = document.createElement('a');
              a.className = 'catalog-link';
              a.href = href;
              a.target = '_blank';
              a.rel = 'noopener noreferrer';
              a.innerHTML = renderHighlightedInline(href, catalogStore.state.qRaw);
              arrWrap.appendChild(a);
            } else {
              var txt = document.createElement('span');
              txt.innerHTML = renderHighlightedInline(JSON.stringify(sub), catalogStore.state.qRaw);
              arrWrap.appendChild(txt);
            }
          } else if (typeof sub === 'string') {
            var s = document.createElement('span');
            s.innerHTML = renderInlineMarkup(sub, catalogStore.state.qRaw);
            arrWrap.appendChild(s);
          } else {
            var t = document.createElement('span');
            t.innerHTML = renderHighlightedInline(String(sub), catalogStore.state.qRaw);
            arrWrap.appendChild(t);
          }
        }
        row.appendChild(arrWrap);
      }
    } else if (v && typeof v === 'object') {
      if (v.href) {
        var link = document.createElement('a');
        link.className = 'catalog-link';
        link.href = v.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.innerHTML = renderHighlightedInline(String(v.href), catalogStore.state.qRaw);
        row.appendChild(link);
      } else {
        var nested = document.createElement('span');
        nested.innerHTML = renderHighlightedInline(JSON.stringify(v), catalogStore.state.qRaw);
        row.appendChild(nested);
      }
    } else if (typeof v === 'string') {
      var txtWrap = document.createElement('span');
      txtWrap.innerHTML = renderInlineMarkup(v, catalogStore.state.qRaw);
      row.appendChild(txtWrap);
    } else {
      var lit = document.createElement('span');
      lit.innerHTML = renderHighlightedInline(String(v), catalogStore.state.qRaw);
      row.appendChild(lit);
    }

    block.appendChild(row);
  }
  return block;
}

export function buildCatalogTable(rows) {
  var table = document.createElement('table');
  table.className = 'catalog-table';
  var tbody = document.createElement('tbody');
  var displayRows = getDisplayRows(rows);
  for (var i = 0; i < displayRows.length; i++) {
    var row = displayRows[i];
    var tr = document.createElement('tr');
    var th = document.createElement('th');
    th.innerHTML = renderHighlightedInline(formatCatalogKey(row.name), catalogStore.state.qRaw);
    var td = document.createElement('td');
    td.appendChild(buildCatalogValueNode(row.value));
    tr.appendChild(th);
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}

export function buildCatalogTableFromObject(obj) {
  var keys = Object.keys(obj || {});
  var rows = [];
  for (var i = 0; i < keys.length; i++) {
    rows.push({ name: keys[i], value: obj[keys[i]] });
  }
  return buildCatalogTable(rows);
}

export function appendCatalogSection(parent, title, rows) {
  var displayRows = getDisplayRows(rows);
  if (!displayRows.length) return;

  var section = document.createElement('section');
  section.className = 'catalog-section';

  if (title) {
    var heading = document.createElement('h4');
    heading.className = 'catalog-section-title';
    var tLower = String(title).toLowerCase();
    if (tLower === 'props' || tLower === 'resources') {
      heading.className += ' emphasis';
    }
    heading.innerHTML = renderHighlightedInline(title, catalogStore.state.qRaw);
    section.appendChild(heading);
  }

  section.appendChild(buildCatalogTable(displayRows));
  parent.appendChild(section);
}

export function appendCatalogObjectList(parent, title, items) {
  var displayItems = Array.isArray(items) ? items.filter(hasDisplayValue) : [];
  if (!displayItems.length) return;

  var section = document.createElement('section');
  section.className = 'catalog-section';

  var heading = document.createElement('h4');
  heading.className = 'catalog-section-title';
  var tLower = String(title || '').toLowerCase();
  if (tLower === 'basisdaten' || tLower === 'props' || tLower === 'resources') {
    heading.className += ' emphasis';
  }
  heading.innerHTML = renderHighlightedInline(title, catalogStore.state.qRaw);
  section.appendChild(heading);

  for (var i = 0; i < displayItems.length; i++) {
    var obj = displayItems[i] || {};
    var item = document.createElement('div');
    item.className = 'catalog-subitem';
    if (obj && typeof obj === 'object') {
      item.appendChild(buildCatalogTableFromObject(obj));
    } else {
      item.appendChild(buildCatalogTable([{ name: 'value', value: obj }]));
    }
    section.appendChild(item);
  }

  parent.appendChild(section);
}

export function renderMetadataInfo(container) {
  var meta = catalogStore.state.catalogMetadata || {};
  var rows = getObjectDisplayRows(meta, [{ name: 'uuid', value: catalogStore.state.catalogUuid }]);
  appendCatalogSection(container, '', rows);
}

export function renderBackMatterInfo(container) {
  var backMatter = catalogStore.state.catalogBackMatter || {};
  appendCatalogObjectList(container, 'Resources', backMatter.resources);

  var otherKeys = Object.keys(backMatter).filter(function (k) {
    return String(k).toLowerCase() !== 'resources';
  });
  for (var i = 0; i < otherKeys.length; i++) {
    var key = otherKeys[i];
    var val = backMatter[key];
    if (Array.isArray(val)) {
      appendCatalogObjectList(container, key, val);
    } else {
      appendCatalogSection(container, key, [{ name: key, value: val }]);
    }
  }
}

export function renderCatalogInfo() {
  var hasMeta =
    hasDisplayValue(catalogStore.state.catalogUuid) ||
    hasDisplayValue(catalogStore.state.catalogMetadata);
  var hasBackMatter = hasDisplayValue(catalogStore.state.catalogBackMatter);
  if (!hasMeta && !hasBackMatter) return;

  var heading = document.createElement('div');
  heading.className = 'catalog-info-heading';
  heading.textContent = 'Katalog Informationen';
  uiStore.els.listTab.appendChild(heading);

  if (hasMeta) {
    var metaDetails = document.createElement('details');
    metaDetails.className = 'catalog-info-box';
    var metaSummary = document.createElement('summary');
    metaSummary.innerHTML = '<strong>Metadaten</strong>';
    metaDetails.appendChild(metaSummary);
    var metaBody = document.createElement('div');
    metaBody.className = 'catalog-info-content';
    renderMetadataInfo(metaBody);
    metaDetails.appendChild(metaBody);
    uiStore.els.listTab.appendChild(metaDetails);
  }

  if (hasBackMatter) {
    var backDetails = document.createElement('details');
    backDetails.className = 'catalog-info-box';
    var backSummary = document.createElement('summary');
    backSummary.innerHTML = '<strong>Backmatter</strong>';
    backDetails.appendChild(backSummary);
    var backBody = document.createElement('div');
    backBody.className = 'catalog-info-content';
    renderBackMatterInfo(backBody);
    backDetails.appendChild(backBody);
    uiStore.els.listTab.appendChild(backDetails);
  }

  var sep = document.createElement('hr');
  sep.className = 'catalog-separator';
  uiStore.els.listTab.appendChild(sep);
}
