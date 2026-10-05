/** features/components/imports-view: see docs/architecture.md for responsibilities. */
import { renderHighlightedInline, renderMarkupMultiline } from '../../shared/markup.js';
import {
  buildDocumentLinkHtml,
  buildGenericObjectInline,
  buildGenericTable,
  hasDisplayValue,
} from '../../shared/ui/metadata.js';

export function appendImportedComponentDefinitions(
  parent,
  items,
  searchTerm,
  resourceMap,
  baseUrl,
  statuses,
) {
  if (!Array.isArray(items) || !hasDisplayValue(items)) return;
  for (var i = 0; i < items.length; i++) {
    if (!hasDisplayValue(items[i])) continue;
    var entry = items[i] || {};
    var status = Array.isArray(statuses) && statuses[i] ? statuses[i] : null;
    var item = document.createElement('div');
    item.className = 'catalog-subitem import-component-definition';

    if (entry.href) {
      var sourceField = document.createElement('div');
      sourceField.className = 'import-field';
      sourceField.innerHTML =
        '<div class="import-field-label">Quelle</div>' +
        '<div>' +
        buildDocumentLinkHtml(entry.href, entry.href, searchTerm, resourceMap, baseUrl) +
        '</div>';
      item.appendChild(sourceField);
    }

    if (entry.remarks) {
      var remarksField = document.createElement('div');
      remarksField.className = 'import-field';
      remarksField.innerHTML =
        '<div class="import-field-label">Remarks</div>' +
        '<div class="catalog-md import-remarks">' +
        renderMarkupMultiline(entry.remarks, searchTerm) +
        '</div>';
      item.appendChild(remarksField);
    }

    if (status) {
      if (status.title || status.documentUuid || status.rlink) {
        var targetField = document.createElement('div');
        targetField.className = 'import-field';
        var rows = [];
        if (status.title) rows.push({ name: 'Titel', value: status.title });
        if (status.documentUuid)
          rows.push({ name: 'Component-Definition-UUID', value: status.documentUuid });
        if (status.rlink) rows.push({ name: 'Relativer Pfad', value: status.rlink });
        targetField.appendChild(buildGenericTable(rows, searchTerm, resourceMap, baseUrl));
        item.appendChild(targetField);
      }
      var statusField = document.createElement('div');
      statusField.className = 'import-field';
      var statusText;
      if (status.loaded && !status.skipped) {
        statusText =
          'Wird angezeigt: ' +
          status.components +
          ' Komponenten / ' +
          status.capabilities +
          ' Capabilities';
        if (status.sourceLabel) statusText += ' aus "' + status.sourceLabel + '"';
      } else if (status.loaded && status.skipped) {
        statusText = status.message || 'Bereits enthalten.';
      } else {
        statusText =
          status.message ||
          'Die importierte Komponentendefinition kann nicht angezeigt werden, da sie zur Zeit im Viewer nicht hochgeladen ist.';
      }
      statusField.innerHTML =
        '<div class="import-field-label">Status</div><div>' +
        renderHighlightedInline(statusText, searchTerm) +
        '</div>';
      item.appendChild(statusField);
    }

    var remaining = {};
    var keys = Object.keys(entry);
    for (var k = 0; k < keys.length; k++) {
      if (keys[k] === 'href' || keys[k] === 'remarks') continue;
      remaining[keys[k]] = entry[keys[k]];
    }
    if (Object.keys(remaining).length) {
      var extra = document.createElement('div');
      extra.className = 'import-extra';
      extra.appendChild(buildGenericObjectInline(remaining, searchTerm, resourceMap, baseUrl));
      item.appendChild(extra);
    }

    if (item.childNodes.length) parent.appendChild(item);
  }
}
