/** features/selection: see docs/architecture.md for responsibilities. */
import { renderComponentView, renderList } from '../app/actions.js';
import { catalogStore, componentStore, mappingStore, uiStore } from '../app/store.js';
import { securityTargetLabel } from '../domain/properties.js';
import {
  catalogHierarchyOptionLabel,
  catalogPrimaryGroupFacetLabel,
  catalogSecondaryGroupFacetLabel,
} from './catalog/hierarchy-filters.js';
import { escapeHtml } from '../shared/html.js';
import { createChip, formatChipValues } from '../shared/ui/overview.js';

export function collectCatalogActiveFilterChips() {
  var chips = [];
  if (catalogStore.state.searchQuery.groups.length) {
    chips.push('Suche: ' + catalogStore.state.qRaw);
  }
  if (
    catalogStore.allGroups.length &&
    catalogStore.state.groups.length &&
    catalogStore.state.groups.length !== catalogStore.allGroups.length
  ) {
    chips.push(
      catalogPrimaryGroupFacetLabel() +
        ': ' +
        formatChipValues(
          catalogStore.state.groups.map(function (value) {
            return catalogHierarchyOptionLabel(0, value);
          }),
          2,
        ),
    );
  }
  if (
    catalogStore.allSubgroups.length &&
    catalogStore.state.subgroups.length &&
    catalogStore.state.subgroups.length !== catalogStore.allSubgroups.length
  ) {
    chips.push(
      catalogSecondaryGroupFacetLabel() +
        ': ' +
        formatChipValues(
          catalogStore.state.subgroups.map(function (value) {
            return catalogHierarchyOptionLabel(1, value);
          }),
          2,
        ),
    );
  }
  if (
    catalogStore.allClasses.length &&
    catalogStore.state.classes.length &&
    catalogStore.state.classes.length !== catalogStore.allClasses.length
  ) {
    chips.push('Quellkataloge: ' + formatChipValues(catalogStore.state.classes, 2));
  }
  if (
    catalogStore.allSecs.length &&
    catalogStore.state.secs.length &&
    catalogStore.state.secs.length !== catalogStore.allSecs.length
  ) {
    chips.push('Sicherheitsniveaus: ' + formatChipValues(catalogStore.state.secs, 2));
  }
  if (catalogStore.allTargets.length) {
    var targetBase = catalogStore.allTargets.length + 1;
    if (catalogStore.state.targets.length && catalogStore.state.targets.length !== targetBase) {
      var targetChip =
        'Zielobjekte: ' +
        formatChipValues(
          catalogStore.state.targets.map(function (v) {
            return v === '__none__' ? 'Ohne Zielobjekt' : v;
          }),
          2,
        );
      if (catalogStore.state.autoSelectedTargets.length)
        targetChip +=
          ' (' + catalogStore.state.autoSelectedTargets.length + ' automatisch ausgewählt)';
      chips.push(targetChip);
    }
  }
  if (catalogStore.allTags.length) {
    var tagBase = catalogStore.allTags.length + 1;
    if (catalogStore.state.tags.length && catalogStore.state.tags.length !== tagBase) {
      chips.push(
        'Tags: ' +
          formatChipValues(
            catalogStore.state.tags.map(function (v) {
              return v === '__notags__' ? 'Ohne Tags' : v;
            }),
            2,
          ),
      );
    }
  }
  if (
    catalogStore.allEfforts.length &&
    catalogStore.state.efforts.length &&
    catalogStore.state.efforts.length !== catalogStore.allEfforts.length
  ) {
    chips.push('Aufwand: ' + formatChipValues(catalogStore.state.efforts, 3));
  }
  if (
    catalogStore.allModalverbs.length &&
    catalogStore.state.modalverbs.length &&
    catalogStore.state.modalverbs.length !== catalogStore.allModalverbs.length
  ) {
    chips.push('Modalverben: ' + formatChipValues(catalogStore.state.modalverbs, 3));
  }
  if (
    catalogStore.allDocumentations.length &&
    catalogStore.state.documentations.length &&
    catalogStore.state.documentations.length !== catalogStore.allDocumentations.length
  ) {
    chips.push('Dokumentation: ' + formatChipValues(catalogStore.state.documentations, 2));
  }
  if (
    catalogStore.allActionwords.length &&
    catalogStore.state.actionwords.length &&
    catalogStore.state.actionwords.length !== catalogStore.allActionwords.length
  ) {
    chips.push('Handlungswörter: ' + formatChipValues(catalogStore.state.actionwords, 2));
  }
  if (
    catalogStore.allSecurityTargets.length &&
    catalogStore.state.securityTargets.length !== catalogStore.allSecurityTargets.length
  ) {
    chips.push(
      'Schutzziele: ' +
        (catalogStore.state.securityTargets.length
          ? formatChipValues(catalogStore.state.securityTargets.map(securityTargetLabel), 3)
          : 'keine Auswahl'),
    );
  }
  return chips;
}

export function collectComponentActiveFilterChips() {
  var chips = [];
  if (componentStore.componentState.searchQuery.groups.length) {
    chips.push('Suche: ' + componentStore.componentState.qRaw);
  }
  if (
    componentStore.allComponentTypes.length &&
    componentStore.componentState.types.length &&
    componentStore.componentState.types.length !== componentStore.allComponentTypes.length
  ) {
    chips.push('Typen: ' + formatChipValues(componentStore.componentState.types, 2));
  }
  if (
    componentStore.allComponentSources.length &&
    componentStore.componentState.sources.length &&
    componentStore.componentState.sources.length !== componentStore.allComponentSources.length
  ) {
    chips.push('Quellen: ' + formatChipValues(componentStore.componentState.sources, 2));
  }
  if (
    componentStore.allComponentNames.length &&
    componentStore.componentState.names.length &&
    componentStore.componentState.names.length !== componentStore.allComponentNames.length
  ) {
    chips.push('Komponenten: ' + formatChipValues(componentStore.componentState.names, 2));
  }
  if (
    componentStore.allCapabilityNames.length &&
    componentStore.componentState.capabilityNames.length &&
    componentStore.componentState.capabilityNames.length !==
      componentStore.allCapabilityNames.length
  ) {
    chips.push(
      'Capabilities: ' + formatChipValues(componentStore.componentState.capabilityNames, 2),
    );
  }
  return chips;
}

export function collectMappingActiveFilterChips() {
  var chips = [];
  if (mappingStore.mappingState.searchQuery.groups.length) {
    chips.push('Suche: ' + mappingStore.mappingState.qRaw);
  }
  if (
    mappingStore.allMappingPractices.length &&
    mappingStore.mappingState.practices.length !== mappingStore.allMappingPractices.length
  ) {
    chips.push('Praktiken: ' + formatChipValues(mappingStore.mappingState.practices, 3));
  }
  if (
    mappingStore.allMappingRelationships.length &&
    mappingStore.mappingState.relationships.length !== mappingStore.allMappingRelationships.length
  ) {
    chips.push('Relationships: ' + formatChipValues(mappingStore.mappingState.relationships, 2));
  }
  if (
    mappingStore.allMappingSourceCatalogs.length &&
    mappingStore.mappingState.sourceCatalogs.length !== mappingStore.allMappingSourceCatalogs.length
  ) {
    chips.push('Source: ' + formatChipValues(mappingStore.mappingState.sourceCatalogs, 1));
  }
  if (
    mappingStore.allMappingTargetCatalogs.length &&
    mappingStore.mappingState.targetCatalogs.length !== mappingStore.allMappingTargetCatalogs.length
  ) {
    chips.push('Target: ' + formatChipValues(mappingStore.mappingState.targetCatalogs, 1));
  }
  if (
    mappingStore.allMappingRationales.length &&
    mappingStore.mappingState.rationales.length !== mappingStore.allMappingRationales.length
  ) {
    chips.push('Matching: ' + formatChipValues(mappingStore.mappingState.rationales, 2));
  }
  if (
    mappingStore.allMappingStatuses.length &&
    mappingStore.mappingState.statuses.length !== mappingStore.allMappingStatuses.length
  ) {
    chips.push('Status: ' + formatChipValues(mappingStore.mappingState.statuses, 2));
  }
  return chips;
}

export function renderSelectionState(container, title, subtitle, chips) {
  if (!container) return;
  container.innerHTML = '';
  var head = document.createElement('div');
  head.className = 'selection-header';
  head.innerHTML =
    '<div class="selection-title">' +
    escapeHtml(title) +
    '</div><div class="selection-subtitle">' +
    escapeHtml(subtitle) +
    '</div>';
  container.appendChild(head);
  var wrap = document.createElement('div');
  wrap.className = 'chip-list';
  if (chips && chips.length) {
    for (var i = 0; i < chips.length; i++) {
      var chip = createChip(chips[i], 'filter-chip');
      wrap.appendChild(chip);
    }
  } else {
    wrap.appendChild(createChip('Keine aktiven Einschränkungen', 'filter-chip neutral'));
  }
  container.appendChild(wrap);
}

export function setCatalogExpansion(open) {
  uiStore.uiState.catalogExpandOverride = !!open;
  catalogStore.state.openTopics = {};
  catalogStore.state.openControls = {};
  catalogStore.state.openPractices = {};
  catalogStore.state.openGroups = {};
  if (open) {
    for (var ci = 0; ci < catalogStore.state.controls.length; ci++) {
      catalogStore.state.openControls[catalogStore.state.controls[ci].id] = true;
    }
    for (var ti = 0; ti < catalogStore.state.topics.length; ti++) {
      catalogStore.state.openTopics[catalogStore.state.topics[ti].id] = true;
    }
    for (var pi = 0; pi < catalogStore.state.practices.length; pi++) {
      catalogStore.state.openPractices[catalogStore.state.practices[pi].id] = true;
    }
    for (var gi = 0; gi < catalogStore.state.groupRoots.length; gi++) {
      var stack = [catalogStore.state.groupRoots[gi]];
      while (stack.length) {
        var key = stack.pop();
        catalogStore.state.openGroups[key] = true;
        var grp = catalogStore.state.groupByKey.get(key);
        var kids = grp && Array.isArray(grp.children) ? grp.children : [];
        for (var kc = 0; kc < kids.length; kc++) {
          stack.push(kids[kc]);
        }
      }
    }
  }
  renderList();
}

export function setComponentExpansion(open) {
  uiStore.uiState.componentExpandOverride = !!open;
  componentStore.componentState.openComponents = {};
  componentStore.componentState.openCapabilities = {};
  componentStore.componentState.openImplementations = {};
  if (open) {
    for (var ci = 0; ci < componentStore.componentState.components.length; ci++) {
      var comp = componentStore.componentState.components[ci];
      componentStore.componentState.openComponents[comp.uuid || comp.name] = true;
      for (var ii = 0; ii < comp.controlImplementations.length; ii++) {
        componentStore.componentState.openImplementations[comp.controlImplementations[ii].key] =
          true;
      }
    }
    for (var ca = 0; ca < componentStore.componentState.capabilities.length; ca++) {
      var cap = componentStore.componentState.capabilities[ca];
      componentStore.componentState.openCapabilities[cap.uuid || cap.name] = true;
      for (var ic = 0; ic < cap.controlImplementations.length; ic++) {
        componentStore.componentState.openImplementations[cap.controlImplementations[ic].key] =
          true;
      }
    }
  }
  renderComponentView();
}
