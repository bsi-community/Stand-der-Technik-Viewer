/** features/mappings/filters: see docs/architecture.md for responsibilities. */
import { refreshMappingViews } from '../../app/actions.js';
import { mappingStore, uiStore } from '../../app/store.js';
import { getMappingCatalogDisplayTitle } from './resolution.js';
import { uniqueList } from '../../shared/collections.js';
import { renderMarkupMultiline } from '../../shared/markup.js';
import { msSetItems } from '../../shared/ui/multiselect.js';

export function renderMappingGaps(container) {
  var groups = mappingStore.mappingState.gapGroups || [];
  var count = groups.reduce(function (total, group) {
    return total + group.ids.length;
  }, 0);
  if (count) {
    var details = document.createElement('details');
    details.className = 'mapping-gap-summary';
    var summary = document.createElement('summary');
    summary.textContent = count + ' nicht zugeordnete Controls im gesamten Mapping-Dokument';
    details.appendChild(summary);
    groups.forEach(function (group) {
      var heading = document.createElement('p');
      heading.textContent = group.label;
      details.appendChild(heading);
      var list = document.createElement('ul');
      group.ids.forEach(function (id) {
        var item = document.createElement('li');
        item.textContent = id + ' — nicht zugeordnet';
        list.appendChild(item);
      });
      details.appendChild(list);
    });
    container.appendChild(details);
  }
  (mappingStore.mappingState.gapWarnings || []).forEach(function (warning) {
    var notice = document.createElement('div');
    notice.className = 'mapping-gap-warning';
    notice.setAttribute('role', 'status');
    var text = document.createElement('p');
    text.textContent =
      warning.label +
      ': Die Lückenliste kann unvollständig sein. Musterselektion und die Auswahl untergeordneter Controls werden nicht aufgelöst.';
    notice.appendChild(text);
    var details = document.createElement('details'),
      summary = document.createElement('summary'),
      selector = document.createElement('pre');
    summary.textContent = 'Nicht aufgelöster Selektor';
    selector.textContent = JSON.stringify(warning.selector, null, 2);
    details.appendChild(summary);
    details.appendChild(selector);
    notice.appendChild(details);
    container.appendChild(notice);
  });
}

export function appendMappingNotes(tbody, entry) {
  if (!entry.notes || !entry.notes.length) return;
  var row = document.createElement('tr');
  row.className = 'mapping-note-row';
  var cell = document.createElement('td');
  cell.colSpan = 7;
  entry.notes.forEach(function (note) {
    if (note.label) {
      var label = document.createElement('strong');
      label.textContent = note.label;
      cell.appendChild(label);
    }
    var body = document.createElement('div');
    body.className = 'catalog-md';
    body.innerHTML = renderMarkupMultiline(note.text, mappingStore.mappingState.qRaw);
    cell.appendChild(body);
  });
  row.appendChild(cell);
  tbody.appendChild(row);
}

export function renderMappingFilters() {
  var practices = [],
    relationships = [],
    sources = [],
    targets = [],
    rationales = [],
    statuses = [];
  for (var i = 0; i < mappingStore.mappingState.entries.length; i++) {
    var entry = mappingStore.mappingState.entries[i];
    entry.sourceCatalogDisplay = getMappingCatalogDisplayTitle(
      entry.sourceResource,
      entry.sourceCatalog,
      entry.sourceCatalogRefs || entry.sourceRefs,
    );
    entry.targetCatalogDisplay = getMappingCatalogDisplayTitle(
      entry.targetResource,
      entry.targetCatalog,
      entry.targetCatalogRefs || entry.targetRefs,
    );
    practices = practices.concat(entry.practices);
    relationships.push(entry.relationship);
    sources.push(entry.sourceCatalogDisplay);
    targets.push(entry.targetCatalogDisplay);
    if (entry.rationale) rationales.push(entry.rationale);
    if (entry.status) statuses.push(entry.status);
  }
  mappingStore.allMappingPractices = uniqueList(practices).sort(function (a, b) {
    return a.localeCompare(b, 'de', { numeric: true });
  });
  mappingStore.allMappingRelationships = uniqueList(relationships).sort();
  mappingStore.allMappingSourceCatalogs = uniqueList(sources).sort();
  mappingStore.allMappingTargetCatalogs = uniqueList(targets).sort();
  mappingStore.allMappingRationales = uniqueList(rationales).sort();
  mappingStore.allMappingStatuses = uniqueList(statuses).sort();
  msSetItems(
    uiStore.mappingEls.practice,
    uiStore.mappingEls.practiceMenu,
    'Alle Praktiken',
    mappingStore.allMappingPractices,
    refreshMappingViews,
  );
  msSetItems(
    uiStore.mappingEls.relationship,
    uiStore.mappingEls.relationshipMenu,
    'Alle Relationships',
    mappingStore.allMappingRelationships,
    refreshMappingViews,
  );
  msSetItems(
    uiStore.mappingEls.sourceCatalog,
    uiStore.mappingEls.sourceCatalogMenu,
    'Alle Source-Kataloge',
    mappingStore.allMappingSourceCatalogs,
    refreshMappingViews,
  );
  msSetItems(
    uiStore.mappingEls.targetCatalog,
    uiStore.mappingEls.targetCatalogMenu,
    'Alle Target-Kataloge',
    mappingStore.allMappingTargetCatalogs,
    refreshMappingViews,
  );
  msSetItems(
    uiStore.mappingEls.rationale,
    uiStore.mappingEls.rationaleMenu,
    'Alle Matching-Arten',
    mappingStore.allMappingRationales,
    refreshMappingViews,
  );
  msSetItems(
    uiStore.mappingEls.status,
    uiStore.mappingEls.statusMenu,
    'Alle Status',
    mappingStore.allMappingStatuses,
    refreshMappingViews,
  );
  mappingStore.mappingState.practices = mappingStore.allMappingPractices.slice();
  mappingStore.mappingState.relationships = mappingStore.allMappingRelationships.slice();
  mappingStore.mappingState.sourceCatalogs = mappingStore.allMappingSourceCatalogs.slice();
  mappingStore.mappingState.targetCatalogs = mappingStore.allMappingTargetCatalogs.slice();
  mappingStore.mappingState.rationales = mappingStore.allMappingRationales.slice();
  mappingStore.mappingState.statuses = mappingStore.allMappingStatuses.slice();
}
