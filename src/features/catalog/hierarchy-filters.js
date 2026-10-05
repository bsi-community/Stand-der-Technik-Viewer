/** features/catalog/hierarchy-filters: see docs/architecture.md for responsibilities. */
import { catalogStore, uiStore } from '../../app/store.js';

export function catalogPrimaryGroupAllLabel() {
  return catalogStore.state.catalogGroupMode === 'practices'
    ? 'Alle Praktiken'
    : 'Alle Gruppen/Themen';
}

export function catalogSecondaryGroupAllLabel() {
  return catalogStore.state.catalogGroupMode === 'practices'
    ? 'Alle Themen'
    : 'Alle Untergruppen/Unterthemen';
}

export function catalogPrimaryGroupFacetLabel() {
  if (catalogStore.state.catalogGroupMode === 'practices') return 'Praktiken';
  if (catalogStore.state.catalogGroupMode === 'groups') return 'Gruppen/Themen';
  return 'Katalogbereich';
}

export function catalogSecondaryGroupFacetLabel() {
  return catalogStore.state.catalogGroupMode === 'practices'
    ? 'Themen'
    : 'Untergruppen/Unterthemen';
}

export function catalogHierarchyOptionLabel(level, value) {
  var maps = catalogStore.state.groupLabelsByLevel || [];
  var labels = maps[level] || {};
  return labels[value] || value;
}

export function syncCatalogHierarchyFilterVisibility() {
  var showPrimary = catalogStore.allGroups.length > 0;
  var showSecondary = catalogStore.allSubgroups.length > 0;
  if (uiStore.els.group) {
    uiStore.els.group.classList.toggle('hidden', !showPrimary);
    if (!showPrimary) uiStore.els.group.open = false;
  }
  if (uiStore.els.subgroup) {
    uiStore.els.subgroup.classList.toggle('hidden', !showSecondary);
    if (!showSecondary) uiStore.els.subgroup.open = false;
  }
  if (uiStore.els.filterCount) {
    uiStore.els.filterCount.textContent =
      'Suche und ' + (9 + (showPrimary ? 1 : 0) + (showSecondary ? 1 : 0)) + ' Filter';
  }
}
