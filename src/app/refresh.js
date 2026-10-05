/** app/refresh: see docs/architecture.md for responsibilities. */
import {
  drawBar,
  drawGraph,
  drawSunburst,
  renderComponentView,
  renderList,
  renderMappingView,
  syncTargetAutoSelectionUi,
} from './actions.js';
import { catalogStore, componentStore, mappingStore, uiStore } from './store.js';
import { isFilterActive } from '../features/catalog/selectors.js';
import { isComponentFilterActive } from '../features/components/filters.js';
import { parseSearchQuery } from '../shared/search.js';
import { msGetSelected } from '../shared/ui/multiselect.js';

export function RefreshViews() {
  uiStore.uiState.catalogExpandOverride = null;
  catalogStore.state.qRaw = (uiStore.els.q.value || '').trim();
  catalogStore.state.searchQuery = parseSearchQuery(catalogStore.state.qRaw);
  catalogStore.state.groups = msGetSelected(uiStore.els.group, uiStore.els.groupMenu);
  catalogStore.state.subgroups = msGetSelected(uiStore.els.subgroup, uiStore.els.subgroupMenu);
  catalogStore.state.classes = msGetSelected(uiStore.els.cls, uiStore.els.clsMenu);
  catalogStore.state.secs = msGetSelected(uiStore.els.sec, uiStore.els.secMenu);
  catalogStore.state.targets = msGetSelected(uiStore.els.target, uiStore.els.targetMenu);
  syncTargetAutoSelectionUi();
  catalogStore.state.tags = msGetSelected(uiStore.els.tag, uiStore.els.tagMenu);
  catalogStore.state.efforts = msGetSelected(uiStore.els.effort, uiStore.els.effortMenu);
  catalogStore.state.modalverbs = msGetSelected(uiStore.els.modalverb, uiStore.els.modalverbMenu);
  catalogStore.state.documentations = msGetSelected(
    uiStore.els.documentation,
    uiStore.els.documentationMenu,
  );
  catalogStore.state.actionwords = msGetSelected(
    uiStore.els.actionword,
    uiStore.els.actionwordMenu,
  );
  catalogStore.state.securityTargets = msGetSelected(
    uiStore.els.securityTarget,
    uiStore.els.securityTargetMenu,
  );
  if (!isFilterActive()) {
    catalogStore.state.openTopics = {};
    catalogStore.state.openPractices = {};
    catalogStore.state.openGroups = {};
  }
  renderList();
  refreshChartsIfVisible();
}

export function refreshComponentViews() {
  uiStore.uiState.componentExpandOverride = null;
  componentStore.componentState.qRaw = (
    (uiStore.compEls.q && uiStore.compEls.q.value) ||
    ''
  ).trim();
  componentStore.componentState.searchQuery = parseSearchQuery(componentStore.componentState.qRaw);
  componentStore.componentState.types = msGetSelected(
    uiStore.compEls.type,
    uiStore.compEls.typeMenu,
  );
  componentStore.componentState.sources = msGetSelected(
    uiStore.compEls.source,
    uiStore.compEls.sourceMenu,
  );
  componentStore.componentState.names = msGetSelected(
    uiStore.compEls.name,
    uiStore.compEls.nameMenu,
  );
  componentStore.componentState.capabilityNames = msGetSelected(
    uiStore.compEls.capability,
    uiStore.compEls.capabilityMenu,
  );
  if (!isComponentFilterActive()) {
    componentStore.componentState.openComponents = {};
    componentStore.componentState.openCapabilities = {};
    componentStore.componentState.openImplementations = {};
  }
  renderComponentView();
  refreshChartsIfVisible();
}

export function refreshMappingViews() {
  mappingStore.mappingState.qRaw = (
    (uiStore.mappingEls.q && uiStore.mappingEls.q.value) ||
    ''
  ).trim();
  mappingStore.mappingState.searchQuery = parseSearchQuery(mappingStore.mappingState.qRaw);
  mappingStore.mappingState.practices = msGetSelected(
    uiStore.mappingEls.practice,
    uiStore.mappingEls.practiceMenu,
  );
  mappingStore.mappingState.relationships = msGetSelected(
    uiStore.mappingEls.relationship,
    uiStore.mappingEls.relationshipMenu,
  );
  mappingStore.mappingState.sourceCatalogs = msGetSelected(
    uiStore.mappingEls.sourceCatalog,
    uiStore.mappingEls.sourceCatalogMenu,
  );
  mappingStore.mappingState.targetCatalogs = msGetSelected(
    uiStore.mappingEls.targetCatalog,
    uiStore.mappingEls.targetCatalogMenu,
  );
  mappingStore.mappingState.rationales = msGetSelected(
    uiStore.mappingEls.rationale,
    uiStore.mappingEls.rationaleMenu,
  );
  mappingStore.mappingState.statuses = msGetSelected(
    uiStore.mappingEls.status,
    uiStore.mappingEls.statusMenu,
  );
  renderMappingView();
  refreshChartsIfVisible();
}

export function refreshChartsIfVisible() {
  if (!uiStore.els.graphTab.classList.contains('hidden')) drawGraph();
  if (!uiStore.els.sunburstTab.classList.contains('hidden')) drawSunburst();
  if (!uiStore.els.barTab.classList.contains('hidden')) drawBar();
}
