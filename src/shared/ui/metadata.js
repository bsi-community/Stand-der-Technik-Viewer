/** shared/ui/metadata: see docs/architecture.md for responsibilities. */
import { escapeHtml } from '../html.js';
import { renderHighlightedInline, renderMarkupMultiline } from '../markup.js';
import { getBackMatterResource, getBackMatterResourceLabel, resolveResourceUrl } from '../urls.js';

export function formatCatalogKey(key) {
  return String(key || '').replace(/-/g, ' ');
}

export function hasDisplayValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) {
    for (var ai = 0; ai < value.length; ai++) {
      if (hasDisplayValue(value[ai])) return true;
    }
    return false;
  }
  if (typeof value === 'object') {
    var keys = Object.keys(value);
    for (var ki = 0; ki < keys.length; ki++) {
      if (hasDisplayValue(value[keys[ki]])) return true;
    }
    return false;
  }
  return true;
}

export function getDisplayRows(rows) {
  return (rows || []).filter(function (row) {
    return !!(row && row.name && hasDisplayValue(row.value));
  });
}

export function getObjectDisplayRows(obj, leadingRows, excludedKeys) {
  var rows = getDisplayRows(leadingRows);
  var excluded = {};
  for (var ei = 0; ei < (excludedKeys || []).length; ei++) excluded[excludedKeys[ei]] = true;
  var keys = Object.keys(obj || {});
  for (var ki = 0; ki < keys.length; ki++) {
    var key = keys[ki];
    if (excluded[key] || !hasDisplayValue(obj[key])) continue;
    rows.push({ name: key, value: obj[key] });
  }
  return rows;
}

export function buildGenericValueNode(val, searchTerm, resourceMap, baseUrl) {
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
    for (var ai = 0; ai < displayItems.length; ai++) {
      var itemWrap = document.createElement('div');
      if (
        displayItems[ai] &&
        typeof displayItems[ai] === 'object' &&
        !Array.isArray(displayItems[ai])
      ) {
        itemWrap.appendChild(
          buildGenericObjectInline(displayItems[ai], searchTerm, resourceMap, baseUrl),
        );
      } else if (typeof displayItems[ai] === 'string') {
        itemWrap.innerHTML =
          '<div class="catalog-md">' +
          renderMarkupMultiline(displayItems[ai], searchTerm) +
          '</div>';
      } else {
        itemWrap.innerHTML = renderHighlightedInline(String(displayItems[ai]), searchTerm);
      }
      wrap.appendChild(itemWrap);
    }
    return wrap;
  }

  if (typeof val === 'object') {
    wrap.appendChild(buildGenericObjectInline(val, searchTerm, resourceMap, baseUrl));
    return wrap;
  }

  if (typeof val === 'string') {
    wrap.innerHTML = '<div class="catalog-md">' + renderMarkupMultiline(val, searchTerm) + '</div>';
    return wrap;
  }

  wrap.innerHTML = renderHighlightedInline(String(val), searchTerm);
  return wrap;
}

export function buildGenericObjectInline(obj, searchTerm, resourceMap, baseUrl) {
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
    var v = obj[k];
    if (k === 'props' && Array.isArray(v)) {
      appendPropertiesSection(block, v, searchTerm, resourceMap, baseUrl);
      continue;
    }
    var row = document.createElement('div');
    row.className = 'catalog-object-field';
    var label = document.createElement('strong');
    label.innerHTML = renderHighlightedInline(formatCatalogKey(k) + ': ', searchTerm);
    row.appendChild(label);
    if (typeof v === 'string' && (k === 'href' || k === 'url')) {
      var linkWrap = document.createElement('span');
      linkWrap.innerHTML = buildDocumentLinkHtml(v, v, searchTerm, resourceMap, baseUrl);
      row.appendChild(linkWrap);
    } else {
      var valueNode = buildGenericValueNode(v, searchTerm, resourceMap, baseUrl);
      if (k === 'description' && typeof v === 'string') {
        (valueNode.querySelector('.catalog-md') || valueNode).classList.add(
          'js-collapsible-description',
        );
      }
      row.appendChild(valueNode);
    }
    block.appendChild(row);
  }
  return block;
}

export function buildGenericTable(rows, searchTerm, resourceMap, baseUrl) {
  var table = document.createElement('table');
  table.className = 'catalog-table';
  var tbody = document.createElement('tbody');
  var displayRows = getDisplayRows(rows);
  for (var i = 0; i < displayRows.length; i++) {
    var row = displayRows[i];
    var tr = document.createElement('tr');
    var th = document.createElement('th');
    th.innerHTML = renderHighlightedInline(formatCatalogKey(row.name), searchTerm);
    var td = document.createElement('td');
    var valueNode = buildGenericValueNode(row.value, searchTerm, resourceMap, baseUrl);
    if (row.name === 'description' && typeof row.value === 'string') {
      (valueNode.querySelector('.catalog-md') || valueNode).classList.add(
        'js-collapsible-description',
      );
    }
    td.appendChild(valueNode);
    tr.appendChild(th);
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}

export function appendGenericSection(parent, title, rows, searchTerm, resourceMap, baseUrl) {
  var displayRows = getDisplayRows(rows);
  if (!displayRows.length) return;

  var section = document.createElement('section');
  section.className = 'catalog-section';
  if (title) {
    var heading = document.createElement('h4');
    heading.className = 'catalog-section-title';
    heading.innerHTML = renderHighlightedInline(title, searchTerm);
    section.appendChild(heading);
  }
  section.appendChild(buildGenericTable(displayRows, searchTerm, resourceMap, baseUrl));
  parent.appendChild(section);
}

export function appendGenericObjectList(parent, title, items, searchTerm, resourceMap, baseUrl) {
  var displayItems = Array.isArray(items) ? items.filter(hasDisplayValue) : [];
  if (!displayItems.length) return;

  var section = document.createElement('section');
  section.className = 'catalog-section';
  var heading = document.createElement('h4');
  heading.className = 'catalog-section-title';
  heading.innerHTML = renderHighlightedInline(title, searchTerm);
  section.appendChild(heading);
  for (var i = 0; i < displayItems.length; i++) {
    var item = document.createElement('div');
    item.className = 'catalog-subitem';
    item.appendChild(buildGenericObjectInline(displayItems[i], searchTerm, resourceMap, baseUrl));
    section.appendChild(item);
  }
  parent.appendChild(section);
}

export function appendPropertiesSection(parent, props, searchTerm, resourceMap, baseUrl) {
  var displayProps = Array.isArray(props) ? props.filter(hasDisplayValue) : [];
  if (!displayProps.length) return;

  var details = document.createElement('details');
  details.innerHTML = '<summary><strong>Properties</strong></summary>';

  var prepared = [];
  var hasClass = false;
  var hasExtra = false;
  for (var pi = 0; pi < displayProps.length; pi++) {
    var preparedProp = displayProps[pi] || {};
    var extraRows = [];
    if (preparedProp.uuid) extraRows.push({ name: 'uuid', value: preparedProp.uuid });
    if (preparedProp.remarks) extraRows.push({ name: 'remarks', value: preparedProp.remarks });
    var propKeys = Object.keys(preparedProp);
    for (var pk = 0; pk < propKeys.length; pk++) {
      if (
        propKeys[pk] === 'name' ||
        propKeys[pk] === 'value' ||
        propKeys[pk] === 'ns' ||
        propKeys[pk] === 'class' ||
        propKeys[pk] === 'uuid' ||
        propKeys[pk] === 'remarks'
      )
        continue;
      extraRows.push({ name: propKeys[pk], value: preparedProp[propKeys[pk]] });
    }
    if (preparedProp.class) hasClass = true;
    if (extraRows.length) hasExtra = true;
    prepared.push({ prop: preparedProp, extraRows: extraRows });
  }

  var wrap = document.createElement('div');
  wrap.className = 'catalog-table-scroll component-properties';
  var table = document.createElement('table');
  table.className = 'component-property-table';
  table.innerHTML =
    '<thead><tr><th>Name</th><th>Wert</th><th>Namespace</th>' +
    (hasClass ? '<th>Klasse</th>' : '') +
    (hasExtra ? '<th>Weitere Angaben</th>' : '') +
    '</tr></thead>';
  var tbody = document.createElement('tbody');

  for (var i = 0; i < prepared.length; i++) {
    var prop = prepared[i].prop;
    var tr = document.createElement('tr');

    var nameTd = document.createElement('td');
    nameTd.innerHTML = prop.name
      ? '<strong>' + renderHighlightedInline(prop.name, searchTerm) + '</strong>'
      : '<span class="component-property-empty">–</span>';

    var valueTd = document.createElement('td');
    valueTd.innerHTML =
      prop.value != null && prop.value !== ''
        ? renderHighlightedInline(String(prop.value), searchTerm)
        : '<span class="component-property-empty">–</span>';

    var nsTd = document.createElement('td');
    if (prop.ns) {
      nsTd.innerHTML = buildDocumentLinkHtml(prop.ns, prop.ns, searchTerm, resourceMap, baseUrl);
    } else {
      nsTd.innerHTML = '<span class="component-property-empty">–</span>';
    }

    tr.appendChild(nameTd);
    tr.appendChild(valueTd);
    tr.appendChild(nsTd);
    if (hasClass) {
      var classTd = document.createElement('td');
      classTd.innerHTML = prop.class
        ? renderHighlightedInline(String(prop.class), searchTerm)
        : '<span class="component-property-empty">–</span>';
      tr.appendChild(classTd);
    }
    if (hasExtra) {
      var extraTd = document.createElement('td');
      if (prepared[i].extraRows.length) {
        extraTd.appendChild(
          buildGenericTable(prepared[i].extraRows, searchTerm, resourceMap, baseUrl),
        );
      } else {
        extraTd.innerHTML = '<span class="component-property-empty">–</span>';
      }
      tr.appendChild(extraTd);
    }
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  wrap.appendChild(table);
  details.appendChild(wrap);
  parent.appendChild(details);
}

export function appendRemainingObjectFields(
  parent,
  title,
  obj,
  excludedKeys,
  searchTerm,
  resourceMap,
  baseUrl,
) {
  var excluded = {};
  for (var i = 0; i < (excludedKeys || []).length; i++) {
    excluded[excludedKeys[i]] = true;
  }
  var keys = Object.keys(obj || {});
  var rows = [];
  for (var k = 0; k < keys.length; k++) {
    if (excluded[keys[k]]) continue;
    if (!hasDisplayValue(obj[keys[k]])) continue;
    rows.push({ name: keys[k], value: obj[keys[k]] });
  }
  if (rows.length) {
    appendGenericSection(parent, title, rows, searchTerm, resourceMap, baseUrl);
  }
}

export function buildDocumentLinkHtml(label, rawUrl, searchTerm, resourceMap, baseUrl) {
  var href = resolveResourceUrl(rawUrl, resourceMap, baseUrl);
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
