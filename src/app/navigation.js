/** app/navigation: see docs/architecture.md for responsibilities. */
import {
  drawBar,
  drawGraph,
  drawSunburst,
  renderComponentView,
  renderList,
  renderMappingView,
  renderTargetHierarchyView,
  showHomePage,
} from './actions.js';
import { catalogStore, componentStore, uiStore } from './store.js';
import { resetTargetHierarchyDetails } from '../features/visualizations/target-hierarchy.js';
import { $$, cssId } from '../shared/dom.js';
import { hideEffortTooltip } from '../shared/ui/effort-tooltip.js';
import { updateHeaderSubtitle } from '../shared/ui/overview.js';

export function setSidebarMode(mode) {
  var isCatalog = mode === 'catalog';
  var isComponent = mode === 'component';
  var isMapping = mode === 'mapping';
  uiStore.els.catalogPanel.classList.toggle('hidden', !isCatalog);
  uiStore.els.componentPanel.classList.toggle('hidden', !isComponent);
  uiStore.els.mappingPanel.classList.toggle('hidden', !isMapping);
}

export function updateVisualizationContext() {
  var labels = { catalog: 'Kataloge', component: 'Komponentendefinitionen', mapping: 'Mappings' };
  var label = labels[uiStore.uiState.dataMode] || labels.catalog;
  var isHome = uiStore.uiState.view === 'home';
  var showTargetHierarchy =
    !isHome &&
    uiStore.uiState.dataMode === 'catalog' &&
    catalogStore.state.hasTargetObjectCategories;
  if (uiStore.els.visualContextLabel) {
    uiStore.els.visualContextLabel.hidden = isHome;
    uiStore.els.visualContextLabel.textContent = 'Auswertung von: ' + label;
    uiStore.els.visualContextLabel.title =
      'Die Visualisierungen verwenden die Daten des Arbeitsbereichs „' + label + '“.';
  }
  if (uiStore.els.targetHierarchyTabButton)
    uiStore.els.targetHierarchyTabButton.hidden = !showTargetHierarchy;
  if (uiStore.els.visualizationTabGroup) {
    uiStore.els.visualizationTabGroup.classList.toggle('is-disabled', isHome);
    uiStore.els.visualizationTabGroup.classList.toggle('has-target-hierarchy', showTargetHierarchy);
    uiStore.els.visualizationTabGroup.setAttribute('aria-disabled', isHome ? 'true' : 'false');
    var visualTabs = uiStore.els.visualizationTabGroup.querySelectorAll('.tab');
    for (var vt = 0; vt < visualTabs.length; vt++) {
      var unavailable =
        isHome || (visualTabs[vt] === uiStore.els.targetHierarchyTabButton && !showTargetHierarchy);
      visualTabs[vt].disabled = unavailable;
      visualTabs[vt].setAttribute('aria-disabled', unavailable ? 'true' : 'false');
    }
  }
  var modeTab =
    uiStore.uiState.dataMode === 'component'
      ? 'components'
      : uiStore.uiState.dataMode === 'mapping'
        ? 'mappings'
        : 'list';
  var tabs = $$('.tab');
  var isVisual =
    uiStore.uiState.view === 'graph' ||
    uiStore.uiState.view === 'sunburst' ||
    uiStore.uiState.view === 'bar' ||
    uiStore.uiState.view === 'target-hierarchy';
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].classList.toggle(
      'context-active',
      isVisual && tabs[i].getAttribute('data-tab') === modeTab,
    );
  }
}

export function restoreComponentReturnTarget() {
  var target = uiStore.uiState.componentReturnTarget;
  if (!target) return;
  uiStore.uiState.componentReturnTarget = null;
  if (target.ownerKind === 'capability') {
    componentStore.componentState.openCapabilities[target.ownerKey] = true;
  } else {
    componentStore.componentState.openComponents[target.ownerKey] = true;
    var ownerCaps = componentStore.componentState.componentCapabilityKeys[target.ownerKey] || [];
    for (var oc = 0; oc < ownerCaps.length; oc++) {
      componentStore.componentState.openCapabilities[ownerCaps[oc]] = true;
    }
  }
  if (target.implKey) {
    componentStore.componentState.openImplementations[target.implKey] = true;
  }
  setTimeout(function () {
    var el = document.getElementById(
      target.anchorId || 'component-wrapper-' + cssId(target.ownerKey),
    );
    if (!el) {
      el =
        document.getElementById('component-wrapper-' + cssId(target.ownerKey)) ||
        document.getElementById('component-owner-' + cssId(target.ownerKey));
    }
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('highlight');
      setTimeout(function () {
        el.classList.remove('highlight');
      }, 1500);
    }
  }, 0);
}

export function updateViewerQueryParam(key, value) {
  try {
    var url = new URL(window.location.href);
    if (value === null || value === undefined || value === '') url.searchParams.delete(key);
    else url.searchParams.set(key, String(value));
    window.history.replaceState({}, '', url.href);
  } catch (_err) {}
}

export function persistViewerTabState(name) {
  var primaryTabs = { home: true, list: true, components: true, mappings: true };
  var secondaryTabs = { graph: true, sunburst: true, bar: true, 'target-hierarchy': true };
  if (primaryTabs[name]) {
    updateViewerQueryParam('primary_tab', name);
    updateViewerQueryParam('secondary_tab', null);
    return;
  }
  if (!secondaryTabs[name]) return;
  var primary =
    uiStore.uiState.dataMode === 'component'
      ? 'components'
      : uiStore.uiState.dataMode === 'mapping'
        ? 'mappings'
        : 'list';
  updateViewerQueryParam('primary_tab', primary);
  updateViewerQueryParam('secondary_tab', name);
}

export function switchTab(name) {
  if (name === 'home') {
    persistViewerTabState(name);
    showHomePage(true);
    return;
  }
  if (
    name === 'target-hierarchy' &&
    (uiStore.uiState.dataMode !== 'catalog' || !catalogStore.state.hasTargetObjectCategories)
  ) {
    name = 'list';
  }
  persistViewerTabState(name);
  hideEffortTooltip();
  resetTargetHierarchyDetails();
  document.body.classList.remove('home-mode');
  if (uiStore.els.homeTab) uiStore.els.homeTab.classList.add('hidden');
  if (name === 'list') {
    uiStore.uiState.dataMode = 'catalog';
    setSidebarMode('catalog');
  }
  if (name === 'components') {
    uiStore.uiState.dataMode = 'component';
    setSidebarMode('component');
  }
  if (name === 'mappings') {
    uiStore.uiState.dataMode = 'mapping';
    setSidebarMode('mapping');
  }
  uiStore.uiState.view = name;
  updateHeaderSubtitle(name);
  var tabs = $$('.tab');
  for (var i = 0; i < tabs.length; i++) {
    var b = tabs[i];
    var active = b.getAttribute('data-tab') === name;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
  }
  updateVisualizationContext();
  uiStore.els.listTab.classList.add('hidden');
  uiStore.els.componentTab.classList.add('hidden');
  uiStore.els.mappingTab.classList.add('hidden');
  uiStore.els.graphTab.classList.add('hidden');
  uiStore.els.sunburstTab.classList.add('hidden');
  uiStore.els.barTab.classList.add('hidden');
  uiStore.els.targetHierarchyTab.classList.add('hidden');
  if (uiStore.els.viewSummary) {
    uiStore.els.viewSummary.classList.toggle(
      'hidden',
      !(name === 'list' || name === 'components' || name === 'mappings'),
    );
  }
  if (name === 'list') {
    uiStore.els.listTab.classList.remove('hidden');
    renderList();
  }
  if (name === 'components') {
    uiStore.els.componentTab.classList.remove('hidden');
    renderComponentView();
    restoreComponentReturnTarget();
  }
  if (name === 'mappings') {
    uiStore.els.mappingTab.classList.remove('hidden');
    renderMappingView();
  }
  if (name === 'graph') {
    uiStore.els.graphTab.classList.remove('hidden');
    drawGraph();
  }
  if (name === 'sunburst') {
    uiStore.els.sunburstTab.classList.remove('hidden');
    drawSunburst();
  }
  if (name === 'bar') {
    uiStore.els.barTab.classList.remove('hidden');
    drawBar();
  }
  if (name === 'target-hierarchy') {
    uiStore.els.targetHierarchyTab.classList.remove('hidden');
    renderTargetHierarchyView();
  }
}
