/** features/mappings/view: see docs/architecture.md for responsibilities. */
import { mappingStore, uiStore } from '../../app/store.js';
import { getCatalogPreviewParamMap } from '../../app/catalog-lookup.js';
import { mappingRelationshipSymbol } from '../../domain/mapping.js';
import { appendMappingNotes, renderMappingGaps } from './filters.js';
import { mappingControlDetails, resolveMappingCatalogSource } from './resolution.js';
import { appendMappingResourceHeader } from './resource-header.js';
import { mappingEntryMatches } from './selectors.js';
import { collectMappingActiveFilterChips, renderSelectionState } from '../selection.js';
import { renderWorkspaceEmptyState } from '../sources/empty-state.js';
import { escapeHtml } from '../../shared/html.js';
import { renderHighlightedInline, renderMarkupWithParams } from '../../shared/markup.js';
import { renderOverviewCard } from '../../shared/ui/overview.js';

export function appendMappingFieldCell(row, field, details, options) {
  options = options || {};
  var cell = document.createElement('td');
  cell.className = 'mapping-' + (options.side || 'control') + '-' + field + '-cell';
  if (options.rowSpan > 1) cell.rowSpan = options.rowSpan;
  if (!details) {
    cell.className += ' mapping-empty-cell';
    cell.textContent = '–';
    row.appendChild(cell);
    return cell;
  }
  if (field === 'id') {
    var id = document.createElement('div');
    id.className = 'mapping-id-value';
    id.innerHTML = renderHighlightedInline(details.id || '–', mappingStore.mappingState.qRaw);
    cell.appendChild(id);
  } else if (!details.loaded) {
    var missing = document.createElement('div');
    missing.className = 'mapping-catalog-missing';
    missing.textContent = 'Kein passender Katalog in Katalogansicht geladen';
    cell.appendChild(missing);
  } else if (field === 'title') {
    var title = document.createElement('div');
    title.className = 'mapping-title-value';
    title.innerHTML = details.title
      ? renderHighlightedInline(details.title, mappingStore.mappingState.qRaw)
      : '<span class="mapping-catalog-missing">Kein Titel in der Control vorhanden</span>';
    cell.appendChild(title);
  } else {
    var prose = document.createElement('div');
    prose.className = 'mapping-prose-value catalog-md';
    prose.innerHTML = details.prose
      ? renderMarkupWithParams(
          details.prose,
          getCatalogPreviewParamMap(details.control),
          mappingStore.mappingState.qRaw,
        )
      : '<span class="mapping-catalog-missing">Kein Prose-Text in der Control vorhanden</span>';
    cell.appendChild(prose);
  }
  row.appendChild(cell);
  return cell;
}

export function appendMappingInfoItem(list, label, value) {
  if (value === undefined || value === null || value === '') return;
  var dt = document.createElement('dt');
  dt.textContent = label;
  var dd = document.createElement('dd');
  dd.textContent = String(value);
  list.appendChild(dt);
  list.appendChild(dd);
}

export function renderMappingDocumentInfo(container) {
  var grid = document.createElement('div');
  grid.className = 'mapping-document-grid';
  var metadata = mappingStore.mappingState.metadata || {};
  var metaCard = document.createElement('section');
  metaCard.className = 'mapping-info-card';
  metaCard.innerHTML = '<h3>Mapping Collection</h3>';
  var metaList = document.createElement('dl');
  metaList.className = 'mapping-info-list';
  appendMappingInfoItem(metaList, 'Titel', metadata.title);
  appendMappingInfoItem(metaList, 'Version', metadata.version);
  appendMappingInfoItem(metaList, 'OSCAL', metadata['oscal-version']);
  appendMappingInfoItem(metaList, 'Letzte Änderung', metadata['last-modified']);
  appendMappingInfoItem(metaList, 'UUID', mappingStore.mappingState.documentUuid);
  metaCard.appendChild(metaList);
  grid.appendChild(metaCard);

  var provenance = mappingStore.mappingState.provenance || {};
  var provCard = document.createElement('section');
  provCard.className = 'mapping-info-card';
  provCard.innerHTML = '<h3>Provenance</h3>';
  var provList = document.createElement('dl');
  provList.className = 'mapping-info-list';
  appendMappingInfoItem(provList, 'Methode', provenance.method);
  appendMappingInfoItem(provList, 'Matching', provenance['matching-rationale']);
  appendMappingInfoItem(provList, 'Status', provenance.status);
  appendMappingInfoItem(provList, 'Confidence', provenance['confidence-score']);
  provCard.appendChild(provList);
  if (provenance['mapping-description']) {
    var desc = document.createElement('p');
    desc.innerHTML = renderMarkupWithParams(
      provenance['mapping-description'],
      {},
      mappingStore.mappingState.qRaw,
    );
    provCard.appendChild(desc);
  }
  grid.appendChild(provCard);
  container.appendChild(grid);
}

var mappingViewportScrollbarCleanup = null;

export function setupMappingViewportScrollbar(wrap, table) {
  if (mappingViewportScrollbarCleanup) {
    mappingViewportScrollbarCleanup();
    mappingViewportScrollbarCleanup = null;
  }
  var scrollbar = document.createElement('div');
  scrollbar.className = 'mapping-viewport-scrollbar';
  scrollbar.tabIndex = 0;
  scrollbar.setAttribute('role', 'scrollbar');
  scrollbar.setAttribute('aria-label', 'Mapping-Tabelle horizontal scrollen');
  scrollbar.setAttribute('aria-orientation', 'horizontal');
  var track = document.createElement('div');
  track.className = 'mapping-viewport-scrollbar-track';
  scrollbar.appendChild(track);
  uiStore.els.mappingTab.appendChild(scrollbar);

  var syncing = false;
  var frame = 0;
  function updateScrollbar() {
    frame = 0;
    if (!wrap.isConnected || !scrollbar.isConnected) return;
    var rect = wrap.getBoundingClientRect();
    var viewportWidth = document.documentElement.clientWidth;
    var viewportHeight = document.documentElement.clientHeight;
    var left = Math.max(0, rect.left);
    var right = Math.min(viewportWidth, rect.right);
    var hasOverflow = table.scrollWidth > wrap.clientWidth + 1;
    var intersectsViewport = rect.top < viewportHeight && rect.bottom > 0;
    scrollbar.classList.toggle('is-visible', hasOverflow && intersectsViewport && right > left);
    scrollbar.style.left = left + 'px';
    scrollbar.style.width = Math.max(0, right - left) + 'px';
    scrollbar.style.bottom = Math.max(0, viewportHeight - rect.bottom) + 'px';
    track.style.width = table.scrollWidth + 'px';
    scrollbar.setAttribute('aria-valuemin', '0');
    scrollbar.setAttribute(
      'aria-valuemax',
      String(Math.max(0, table.scrollWidth - wrap.clientWidth)),
    );
    scrollbar.setAttribute('aria-valuenow', String(Math.round(wrap.scrollLeft)));
    if (Math.abs(scrollbar.scrollLeft - wrap.scrollLeft) > 1)
      scrollbar.scrollLeft = wrap.scrollLeft;
  }
  function scheduleUpdate() {
    if (!frame) frame = requestAnimationFrame(updateScrollbar);
  }
  function syncFromTable() {
    if (syncing) return;
    syncing = true;
    scrollbar.scrollLeft = wrap.scrollLeft;
    scrollbar.setAttribute('aria-valuenow', String(Math.round(wrap.scrollLeft)));
    syncing = false;
  }
  function syncFromScrollbar() {
    if (syncing) return;
    syncing = true;
    wrap.scrollLeft = scrollbar.scrollLeft;
    scrollbar.setAttribute('aria-valuenow', String(Math.round(scrollbar.scrollLeft)));
    syncing = false;
  }
  function passVerticalWheelToPage(ev) {
    if (ev.shiftKey || Math.abs(ev.deltaX) >= Math.abs(ev.deltaY)) return;
    var scale =
      ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? document.documentElement.clientHeight : 1;
    window.scrollBy(0, ev.deltaY * scale);
    ev.preventDefault();
  }

  wrap.addEventListener('scroll', syncFromTable, { passive: true });
  wrap.addEventListener('wheel', passVerticalWheelToPage, { passive: false });
  scrollbar.addEventListener('scroll', syncFromScrollbar, { passive: true });
  scrollbar.addEventListener('wheel', passVerticalWheelToPage, { passive: false });
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  var resizeObserver =
    typeof ResizeObserver === 'function' ? new ResizeObserver(scheduleUpdate) : null;
  if (resizeObserver) {
    resizeObserver.observe(wrap);
    resizeObserver.observe(table);
  }
  updateScrollbar();

  mappingViewportScrollbarCleanup = function () {
    if (frame) cancelAnimationFrame(frame);
    wrap.removeEventListener('scroll', syncFromTable);
    wrap.removeEventListener('wheel', passVerticalWheelToPage);
    scrollbar.removeEventListener('scroll', syncFromScrollbar);
    scrollbar.removeEventListener('wheel', passVerticalWheelToPage);
    window.removeEventListener('scroll', scheduleUpdate);
    window.removeEventListener('resize', scheduleUpdate);
    if (resizeObserver) resizeObserver.disconnect();
    if (scrollbar.parentNode) scrollbar.parentNode.removeChild(scrollbar);
  };
}

export function renderMappingView() {
  if (!uiStore.els.mappingTab) return;
  if (mappingViewportScrollbarCleanup) {
    mappingViewportScrollbarCleanup();
    mappingViewportScrollbarCleanup = null;
  }
  uiStore.els.mappingTab.innerHTML = '';
  if (!mappingStore.mappingState.metadata && !mappingStore.mappingState.entries.length) {
    renderSelectionState(
      uiStore.mappingEls.selectionState,
      'Mappingstatus',
      'Kein Datensatz geladen',
      [],
    );
    renderOverviewCard({
      title: 'Mapping-Workspace',
      description:
        'Lade eine OSCAL Mapping Collection, um Source- und Target-Controls, Relationship-Typen und Mapping-Metadaten zu analysieren.',
      stats: [
        { label: 'Mappings', value: '0', note: 'Geladene Beziehungen' },
        { label: 'Relationships', value: '0', note: 'Unterschiedliche Typen' },
        { label: 'Katalogpaare', value: '0', note: 'Source zu Target' },
      ],
      chips: [],
    });
    renderWorkspaceEmptyState(uiStore.els.mappingTab, 'mapping');
    return;
  }

  var visible = mappingStore.mappingState.entries.filter(mappingEntryMatches);
  var chips = collectMappingActiveFilterChips();
  var pairKeys = {};
  for (var i = 0; i < mappingStore.mappingState.entries.length; i++) {
    pairKeys[
      mappingStore.mappingState.entries[i].sourceCatalog +
        ' → ' +
        mappingStore.mappingState.entries[i].targetCatalog
    ] = true;
  }
  renderSelectionState(
    uiStore.mappingEls.selectionState,
    'Mappingfokus',
    visible.length + ' von ' + mappingStore.mappingState.entries.length + ' Beziehungen sichtbar',
    chips,
  );
  renderOverviewCard({
    title: visible.length ? 'Mappinganalyse' : 'Keine Treffer im Mapping',
    description: visible.length
      ? 'Source- und Target-Controls werden je Mapping-Beziehung gegenübergestellt. Die mittlere Spalte zeigt die semantische Richtung aus Sicht der Source.'
      : 'Die aktuelle Suche oder Filterung blendet alle Beziehungen aus.',
    stats: [
      {
        label: 'Sichtbar',
        value: String(visible.length),
        note: 'von ' + mappingStore.mappingState.entries.length + ' Beziehungen',
      },
      {
        label: 'Relationships',
        value: String(mappingStore.allMappingRelationships.length),
        note: 'Beziehungstypen',
      },
      {
        label: 'Katalogpaare',
        value: String(Object.keys(pairKeys).length),
        note: 'Source zu Target',
      },
    ],
    chips: chips,
  });

  renderMappingDocumentInfo(uiStore.els.mappingTab);
  renderMappingGaps(uiStore.els.mappingTab);
  var wrap = document.createElement('div');
  wrap.className = 'mapping-table-wrap';
  var table = document.createElement('table');
  table.className = 'mapping-table';
  table.innerHTML =
    '' +
    '<colgroup>' +
    '<col class="mapping-prose-col"><col class="mapping-title-col"><col class="mapping-id-col">' +
    '<col class="mapping-relation-col">' +
    '<col class="mapping-id-col"><col class="mapping-title-col"><col class="mapping-prose-col">' +
    '</colgroup>' +
    '<thead>' +
    '<tr><th colspan="3" scope="colgroup" class="mapping-source-context"><strong>Source-Katalog und Controls</strong></th>' +
    '<th class="mapping-relation-context" aria-hidden="true"></th>' +
    '<th colspan="3" scope="colgroup" class="mapping-target-context"><strong>Target-Katalog und Controls</strong></th></tr>' +
    '<tr><th>Prose</th><th>Titel</th><th>ID</th><th class="mapping-relation-heading">Relationship</th><th>ID</th><th>Titel</th><th>Prose</th></tr>' +
    '</thead>';
  for (const side of ['source', 'target']) {
    appendMappingResourceHeader(
      table.querySelector('.mapping-' + side + '-context'),
      visible.length ? visible : mappingStore.mappingState.entries,
      side,
      mappingStore.mappingState,
    );
  }
  var tbody = document.createElement('tbody');
  if (!visible.length) {
    var emptyRow = document.createElement('tr');
    emptyRow.innerHTML =
      '<td colspan="7" class="mapping-empty">Keine Mapping-Beziehungen entsprechen den aktiven Filtern.</td>';
    tbody.appendChild(emptyRow);
  }
  for (var v = 0; v < visible.length; v++) {
    var entry = visible[v];
    var sourceCatalogSource = resolveMappingCatalogSource(
      entry.sourceResource,
      entry.sourceCatalog,
      entry.sourceCatalogRefs || entry.sourceRefs,
    );
    var targetCatalogSource = resolveMappingCatalogSource(
      entry.targetResource,
      entry.targetCatalog,
      entry.targetCatalogRefs || entry.targetRefs,
    );
    var sourceDetails = entry.sourceRefs.map(function (ref) {
      return mappingControlDetails(
        ref,
        entry.sourceResource,
        entry.sourceCatalog,
        sourceCatalogSource,
      );
    });
    var targetDetails = entry.targetRefs.map(function (ref) {
      return mappingControlDetails(
        ref,
        entry.targetResource,
        entry.targetCatalog,
        targetCatalogSource,
      );
    });
    if (!sourceDetails.length) sourceDetails = [{ id: '–', title: '', prose: '', loaded: false }];
    if (!targetDetails.length) targetDetails = [{ id: '–', title: '', prose: '', loaded: false }];
    var rowCount = Math.max(sourceDetails.length, targetDetails.length, 1);

    for (var ri = 0; ri < rowCount; ri++) {
      var row = document.createElement('tr');
      if (ri === 0) row.className = 'mapping-entry-start';

      var sourceSingle = sourceDetails.length === 1;
      if (!sourceSingle || ri === 0) {
        var sourceDetail = sourceSingle ? sourceDetails[0] : sourceDetails[ri] || null;
        var sourceSpan = sourceSingle ? rowCount : 1;
        appendMappingFieldCell(row, 'prose', sourceDetail, { rowSpan: sourceSpan, side: 'source' });
        appendMappingFieldCell(row, 'title', sourceDetail, { rowSpan: sourceSpan, side: 'source' });
        appendMappingFieldCell(row, 'id', sourceDetail, {
          rowSpan: sourceSpan,
          side: 'source',
        });
      }

      if (ri === 0) {
        var relationCell = document.createElement('td');
        relationCell.className = 'mapping-relation';
        relationCell.rowSpan = rowCount;
        relationCell.innerHTML =
          '<div class="mapping-relation-symbol" aria-hidden="true">' +
          mappingRelationshipSymbol(entry.relationship) +
          '</div>' +
          '<span class="mapping-relation-badge ' +
          escapeHtml(entry.relationship) +
          '">' +
          escapeHtml(entry.relationship) +
          '</span>' +
          '<div class="mapping-row-meta">' +
          (entry.rationale ? '<span>' + escapeHtml(entry.rationale) + '</span>' : '') +
          (entry.method ? '<span>· ' + escapeHtml(entry.method) + '</span>' : '') +
          (entry.status ? '<span>· ' + escapeHtml(entry.status) + '</span>' : '') +
          '</div>';
        relationCell.title = 'Relationship aus Sicht der Source: ' + entry.relationship;
        row.appendChild(relationCell);
      }

      var targetSingle = targetDetails.length === 1;
      if (!targetSingle || ri === 0) {
        var targetDetail = targetSingle ? targetDetails[0] : targetDetails[ri] || null;
        var targetSpan = targetSingle ? rowCount : 1;
        appendMappingFieldCell(row, 'id', targetDetail, {
          rowSpan: targetSpan,
          side: 'target',
        });
        appendMappingFieldCell(row, 'title', targetDetail, { rowSpan: targetSpan, side: 'target' });
        appendMappingFieldCell(row, 'prose', targetDetail, { rowSpan: targetSpan, side: 'target' });
      }
      tbody.appendChild(row);
    }
    appendMappingNotes(tbody, entry);
  }
  table.appendChild(tbody);
  wrap.appendChild(table);
  uiStore.els.mappingTab.appendChild(wrap);
  setupMappingViewportScrollbar(wrap, table);
}
