/** app/sources: see docs/architecture.md for responsibilities. */
import {
  RefreshViews,
  processComponentDefinition,
  refreshComponentViews,
  refreshMappingViews,
  renderComponentFilters,
  renderComponentView,
  renderFilters,
  renderMappingFilters,
  renderMappingView,
  renderTargetHierarchyView,
  switchTab,
} from './actions.js';
import { updateVisualizationContext } from './navigation.js';
import { clearCatalogUI, clearComponentUI, clearMappingUI } from './reset.js';
import { catalogStore, componentStore, mappingStore, sourceStore, uiStore } from './store.js';
import { processCatalog } from './catalog.js';
import { buildCatalogSourceMeta } from '../app/catalog-lookup.js';
import { getComponentDefinitionUuid } from '../app/components.js';
import { getOscalDocumentTitle } from '../domain/documents.js';
import { processMappingCollection } from './mapping.js';
import {
  refreshCatalogSourceSelect,
  refreshComponentSourceSelect,
  refreshMappingSourceSelect,
} from '../features/sources/picker.js';
import { ensureTargetHierarchyForActiveCatalog } from '../infrastructure/target-hierarchy.js';
import { hideMsg } from '../shared/ui/messages.js';

export function activateCatalogSource(index) {
  if (index < 0 || index >= sourceStore.loadedCatalogSources.length) return;
  var source = sourceStore.loadedCatalogSources[index];
  sourceStore.activeCatalogSourceIndex = index;
  refreshCatalogSourceSelect();
  uiStore.els.fileInfo.textContent = 'Katalog: ' + source.label;
  catalogStore.state.catalogBaseUrl = source.baseUrl || '';
  processCatalog(source.json);
  renderFilters();
  RefreshViews();
  updateVisualizationContext();
  if (uiStore.uiState.view === 'target-hierarchy') {
    if (catalogStore.state.hasTargetObjectCategories) renderTargetHierarchyView();
    else switchTab('list');
  }
  ensureTargetHierarchyForActiveCatalog();
  if (uiStore.uiState.view === 'components') {
    renderComponentView();
  }
  if (mappingStore.mappingState.entries.length) {
    renderMappingFilters();
    if (uiStore.uiState.view === 'mappings') {
      renderMappingView();
    }
  }
  hideMsg();
}

export function activateComponentSource(index) {
  if (index < 0 || index >= sourceStore.loadedComponentSources.length) return;
  var source = sourceStore.loadedComponentSources[index];
  sourceStore.activeComponentSourceIndex = index;
  refreshComponentSourceSelect();
  uiStore.compEls.fileInfo.textContent = 'Komponentendefinition: ' + source.label;
  componentStore.componentState.baseUrl = source.baseUrl || '';
  processComponentDefinition(source.json);
  renderComponentFilters();
  refreshComponentViews();
  hideMsg();
}

export function activateMappingSource(index) {
  if (index < 0 || index >= sourceStore.loadedMappingSources.length) return;
  var source = sourceStore.loadedMappingSources[index];
  sourceStore.activeMappingSourceIndex = index;
  refreshMappingSourceSelect();
  uiStore.mappingEls.fileInfo.textContent = 'Mappings: ' + source.label;
  mappingStore.mappingState.baseUrl = source.baseUrl || '';
  processMappingCollection(source.json);
  renderMappingFilters();
  refreshMappingViews();
  hideMsg();
}

export function addCatalogSource(entry) {
  var meta = buildCatalogSourceMeta(entry.json, entry.label);
  entry.catalogUuid = meta.catalogUuid;
  entry.catalogTitle = meta.catalogTitle;
  entry.originalLabel = entry.label || '';
  entry.label = meta.catalogTitle || entry.label;
  entry.controlRefs = meta.controlRefs;
  entry.controlLookup = meta.controlLookup;
  sourceStore.loadedCatalogSources.push(entry);
  activateCatalogSource(sourceStore.loadedCatalogSources.length - 1);
  if (uiStore.els.file) uiStore.els.file.value = '';
}

export function addComponentSource(entry) {
  entry.originalLabel = entry.label || '';
  entry.label = getOscalDocumentTitle(entry.json, entry.label);
  entry.componentDefinitionUuid = getComponentDefinitionUuid(entry.json);
  sourceStore.loadedComponentSources.push(entry);
  activateComponentSource(sourceStore.loadedComponentSources.length - 1);
  if (uiStore.compEls.file) uiStore.compEls.file.value = '';
}

export function addMappingSource(entry) {
  entry.originalLabel = entry.label || '';
  entry.label = getOscalDocumentTitle(entry.json, entry.label);
  sourceStore.loadedMappingSources.push(entry);
  activateMappingSource(sourceStore.loadedMappingSources.length - 1);
  if (uiStore.mappingEls.file) uiStore.mappingEls.file.value = '';
}

export function removeCatalogSource(index) {
  if (index < 0 || index >= sourceStore.loadedCatalogSources.length) return;
  sourceStore.loadedCatalogSources.splice(index, 1);
  if (!sourceStore.loadedCatalogSources.length) {
    sourceStore.activeCatalogSourceIndex = -1;
    refreshCatalogSourceSelect();
    clearCatalogUI();
    return;
  }
  if (index < sourceStore.activeCatalogSourceIndex) {
    sourceStore.activeCatalogSourceIndex--;
  } else if (index === sourceStore.activeCatalogSourceIndex) {
    sourceStore.activeCatalogSourceIndex = Math.min(
      index,
      sourceStore.loadedCatalogSources.length - 1,
    );
  }
  activateCatalogSource(sourceStore.activeCatalogSourceIndex);
}

export function removeComponentSource(index) {
  if (index < 0 || index >= sourceStore.loadedComponentSources.length) return;
  sourceStore.loadedComponentSources.splice(index, 1);
  if (!sourceStore.loadedComponentSources.length) {
    sourceStore.activeComponentSourceIndex = -1;
    refreshComponentSourceSelect();
    clearComponentUI();
    return;
  }
  if (index < sourceStore.activeComponentSourceIndex) {
    sourceStore.activeComponentSourceIndex--;
  } else if (index === sourceStore.activeComponentSourceIndex) {
    sourceStore.activeComponentSourceIndex = Math.min(
      index,
      sourceStore.loadedComponentSources.length - 1,
    );
  }
  activateComponentSource(sourceStore.activeComponentSourceIndex);
}

export function removeMappingSource(index) {
  if (index < 0 || index >= sourceStore.loadedMappingSources.length) return;
  sourceStore.loadedMappingSources.splice(index, 1);
  if (!sourceStore.loadedMappingSources.length) {
    sourceStore.activeMappingSourceIndex = -1;
    refreshMappingSourceSelect();
    clearMappingUI();
    return;
  }
  if (index < sourceStore.activeMappingSourceIndex) {
    sourceStore.activeMappingSourceIndex--;
  } else if (index === sourceStore.activeMappingSourceIndex) {
    sourceStore.activeMappingSourceIndex = Math.min(
      index,
      sourceStore.loadedMappingSources.length - 1,
    );
  }
  activateMappingSource(sourceStore.activeMappingSourceIndex);
}
