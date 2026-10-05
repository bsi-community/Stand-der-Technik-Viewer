/** app/reset: see docs/architecture.md for responsibilities. */
import {
  RefreshViews,
  refreshComponentViews,
  refreshMappingViews,
  renderComponentView,
  renderList,
  renderMappingFilters,
  renderMappingView,
  switchTab,
  syncComponentParamMaps,
} from './actions.js';
import { updateVisualizationContext } from './navigation.js';
import {
  catalogStore,
  componentStore,
  hierarchyStore,
  mappingStore,
  sourceStore,
  uiStore,
} from './store.js';
import { createComponentState, createMappingState } from '../domain/state.js';
import {
  catalogPrimaryGroupAllLabel,
  catalogSecondaryGroupAllLabel,
  syncCatalogHierarchyFilterVisibility,
} from '../features/catalog/hierarchy-filters.js';
import { renderSelectionState } from '../features/selection.js';
import {
  refreshCatalogSourceSelect,
  refreshComponentSourceSelect,
  refreshMappingSourceSelect,
} from '../features/sources/picker.js';
import { resetTargetHierarchyDetails } from '../features/visualizations/target-hierarchy.js';
import { ObjMap } from '../shared/collections.js';
import { escapeHtml } from '../shared/html.js';
import { parseSearchQuery } from '../shared/search.js';
import { showMsg } from '../shared/ui/messages.js';
import { msUpdateSummary } from '../shared/ui/multiselect.js';

export function clearCatalogUI() {
  uiStore.els.listTab.innerHTML = '';
  var g = document.querySelector('#graph');
  if (g)
    g.innerHTML =
      '<div class="graph-toolbar"><button id="fitBtn" class="btn" title="Alles anzeigen">Alles anzeigen</button></div>';
  var sb = document.querySelector('#sunburst');
  if (sb) sb.innerHTML = '';
  var bar = document.querySelector('#bar');
  if (bar) bar.innerHTML = '';
  uiStore.els.fileInfo.textContent = 'Katalog: keine Datei';
  uiStore.els.countInfo.textContent = '–';
  uiStore.els.graphInfo.textContent = 'Graph: 0 Knoten';
  uiStore.uiState.catalogExpandOverride = null;
  catalogStore.state.controls = [];
  catalogStore.state.idMap = new ObjMap();
  catalogStore.state.uuidMap = new ObjMap();
  catalogStore.state.edgesBase = [];
  catalogStore.state.searchQuery = parseSearchQuery('');
  catalogStore.state.qRaw = '';
  catalogStore.state.groups = [];
  catalogStore.state.subgroups = [];
  catalogStore.state.classes = [];
  catalogStore.state.secs = [];
  catalogStore.state.targets = [];
  catalogStore.state.autoSelectedTargets = [];
  catalogStore.state.hasTargetObjectCategories = false;
  catalogStore.state.tags = [];
  catalogStore.state.efforts = [];
  catalogStore.state.modalverbs = [];
  catalogStore.state.documentations = [];
  catalogStore.state.actionwords = [];
  catalogStore.state.securityTargets = [];
  catalogStore.state.topics = [];
  catalogStore.state.topicById = new ObjMap();
  catalogStore.state.childrenByTopic = {};
  catalogStore.state.childrenByPractice = {};
  catalogStore.state.groupRoots = [];
  catalogStore.state.groupByKey = new ObjMap();
  catalogStore.state.groupLabelsByLevel = [{}, {}];
  catalogStore.state.controlsByGroup = {};
  catalogStore.state.ungroupedControls = [];
  catalogStore.state.openTopics = {};
  catalogStore.state.openControls = {};
  catalogStore.state.practices = [];
  catalogStore.state.practiceById = new ObjMap();
  catalogStore.state.topicsByPractice = {};
  catalogStore.state.openPractices = {};
  catalogStore.state.openGroups = {};
  catalogStore.state.catalogGroupMode = 'none';
  catalogStore.state.catalogUuid = '';
  catalogStore.state.catalogMetadata = null;
  catalogStore.state.catalogBackMatter = null;
  catalogStore.state.catalogBaseUrl = '';
  catalogStore.state.catalogResourcesByUuid = new ObjMap();
  catalogStore.allGroups = [];
  catalogStore.allSubgroups = [];
  catalogStore.allClasses = [];
  catalogStore.allSecs = [];
  catalogStore.allTargets = [];
  catalogStore.allTags = [];
  catalogStore.allEfforts = [];
  catalogStore.allModalverbs = [];
  catalogStore.allDocumentations = [];
  catalogStore.allActionwords = [];
  catalogStore.allSecurityTargets = [];
  hierarchyStore.targetHierarchyActivationToken++;
  resetTargetHierarchyDetails();
  syncCatalogHierarchyFilterVisibility();
  if (uiStore.els.q) uiStore.els.q.value = '';
  syncComponentParamMaps();
  renderSelectionState(uiStore.els.selectionState, 'Katalogstatus', 'Kein Datensatz geladen', []);
  if (uiStore.uiState.view === 'list') {
    renderList();
  }
  if (uiStore.uiState.view === 'components') {
    renderComponentView();
  }
  if (mappingStore.mappingState.entries.length) {
    renderMappingFilters();
    if (uiStore.uiState.view === 'mappings') {
      renderMappingView();
    }
  }
  updateVisualizationContext();
  if (uiStore.uiState.view === 'target-hierarchy') switchTab('list');
  if (!sourceStore.loadedCatalogSources.length) {
    sourceStore.activeCatalogSourceIndex = -1;
    refreshCatalogSourceSelect();
  }
}

export function clearComponentUI() {
  uiStore.els.componentTab.innerHTML = '';
  var g = document.querySelector('#graph');
  if (g)
    g.innerHTML =
      '<div class="graph-toolbar"><button id="fitBtn" class="btn" title="Alles anzeigen">Alles anzeigen</button></div>';
  var sb = document.querySelector('#sunburst');
  if (sb) sb.innerHTML = '';
  var bar = document.querySelector('#bar');
  if (bar) bar.innerHTML = '';
  uiStore.compEls.fileInfo.textContent = 'Komponentendefinition: keine Datei';
  uiStore.compEls.countInfo.textContent = '–';
  uiStore.compEls.graphInfo.textContent = 'Graph: 0 Knoten';
  uiStore.uiState.componentExpandOverride = null;
  componentStore.componentState = createComponentState();
  renderSelectionState(
    uiStore.compEls.selectionState,
    'Status Komponentendefinitionen',
    'Kein Datensatz geladen',
    [],
  );
  if (uiStore.uiState.view === 'components') {
    renderComponentView();
  }
  if (!sourceStore.loadedComponentSources.length) {
    sourceStore.activeComponentSourceIndex = -1;
    refreshComponentSourceSelect();
  }
}

export function clearMappingUI() {
  uiStore.els.mappingTab.innerHTML = '';
  uiStore.mappingEls.fileInfo.textContent = 'Mappings: keine Datei';
  uiStore.mappingEls.countInfo.textContent = '–';
  mappingStore.mappingState = createMappingState();
  mappingStore.allMappingPractices = [];
  mappingStore.allMappingRelationships = [];
  mappingStore.allMappingSourceCatalogs = [];
  mappingStore.allMappingTargetCatalogs = [];
  mappingStore.allMappingRationales = [];
  mappingStore.allMappingStatuses = [];
  if (uiStore.mappingEls.q) uiStore.mappingEls.q.value = '';
  renderSelectionState(
    uiStore.mappingEls.selectionState,
    'Mappingstatus',
    'Kein Datensatz geladen',
    [],
  );
  if (uiStore.uiState.view === 'mappings') renderMappingView();
  if (!sourceStore.loadedMappingSources.length) {
    sourceStore.activeMappingSourceIndex = -1;
    refreshMappingSourceSelect();
  }
}

export function resetAllFilters() {
  try {
    if (uiStore.els.q) uiStore.els.q.value = '';
    catalogStore.state.autoSelectedTargets = [];

    function checkAll(menuEl, detailsEl, allLabel) {
      if (!menuEl || !detailsEl) return;
      const itemCbs = Array.from(menuEl.querySelectorAll('input[type="checkbox"]')).filter(
        (cb) => cb.dataset.value !== '__all__',
      );
      // If no items exist yet (e.g., before a catalog is loaded), just update summary.
      if (itemCbs.length === 0) {
        msUpdateSummary(detailsEl, allLabel, itemCbs);
        return;
      }
      itemCbs.forEach((cb) => {
        cb.checked = true;
      });

      const allCb = menuEl.querySelector('input[type="checkbox"][data-value="__all__"]');
      if (allCb) {
        allCb.checked = true;
        allCb.indeterminate = false;
      }
      msUpdateSummary(detailsEl, allLabel, itemCbs);
    }

    checkAll(uiStore.els.groupMenu, uiStore.els.group, catalogPrimaryGroupAllLabel());
    checkAll(uiStore.els.subgroupMenu, uiStore.els.subgroup, catalogSecondaryGroupAllLabel());
    checkAll(uiStore.els.clsMenu, uiStore.els.cls, 'Alle Quellkataloge');
    checkAll(uiStore.els.secMenu, uiStore.els.sec, 'Alle Sicherheitsniveaus');
    checkAll(uiStore.els.targetMenu, uiStore.els.target, 'Alle Zielobjektkategorien');
    checkAll(uiStore.els.tagMenu, uiStore.els.tag, 'Alle Tags');
    checkAll(uiStore.els.effortMenu, uiStore.els.effort, 'Alle Aufwände');
    checkAll(uiStore.els.modalverbMenu, uiStore.els.modalverb, 'Alle Modalverben');
    checkAll(
      uiStore.els.documentationMenu,
      uiStore.els.documentation,
      'Alle Dokumentationsempfehlungen',
    );
    checkAll(uiStore.els.actionwordMenu, uiStore.els.actionword, 'Alle Handlungswörter');
    checkAll(uiStore.els.securityTargetMenu, uiStore.els.securityTarget, 'Alle Schutzziele');
    var openDropdowns = document.querySelectorAll('details.ms[open]');
    for (var od = 0; od < openDropdowns.length; od++) {
      openDropdowns[od].open = false;
    }

    RefreshViews();
  } catch (err) {
    showMsg(
      '<strong>Fehler beim Zurücksetzen:</strong><br/><code>' +
        escapeHtml(String(err && err.message ? err.message : err)) +
        '</code>',
      true,
    );
  }
}

export function bindResetButton() {
  var btn = document.getElementById('resetBtn');
  if (btn && !btn._gsppBound) {
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      resetAllFilters();
    });
    btn._gsppBound = true;
  }
}

export function resetComponentFilters() {
  try {
    if (uiStore.compEls.q) uiStore.compEls.q.value = '';
    function checkAll(menuEl, detailsEl, allLabel) {
      if (!menuEl || !detailsEl) return;
      var itemCbs = Array.from(menuEl.querySelectorAll('input[type="checkbox"]')).filter(
        function (cb) {
          return cb.dataset.value !== '__all__';
        },
      );
      if (itemCbs.length === 0) {
        msUpdateSummary(detailsEl, allLabel, itemCbs);
        return;
      }
      itemCbs.forEach(function (cb) {
        cb.checked = true;
      });
      var allCb = menuEl.querySelector('input[type="checkbox"][data-value="__all__"]');
      if (allCb) {
        allCb.checked = true;
        allCb.indeterminate = false;
      }
      msUpdateSummary(detailsEl, allLabel, itemCbs);
    }
    checkAll(uiStore.compEls.typeMenu, uiStore.compEls.type, 'Alle Komponententypen');
    checkAll(uiStore.compEls.sourceMenu, uiStore.compEls.source, 'Alle Quellen');
    checkAll(uiStore.compEls.nameMenu, uiStore.compEls.name, 'Alle Komponenten');
    checkAll(uiStore.compEls.capabilityMenu, uiStore.compEls.capability, 'Alle Capabilities');
    var openDropdowns = document.querySelectorAll('#componentPanel details.ms[open]');
    for (var od = 0; od < openDropdowns.length; od++) {
      openDropdowns[od].open = false;
    }
    refreshComponentViews();
  } catch (err) {
    showMsg(
      '<strong>Fehler beim Zurücksetzen der Komponenten-Filter:</strong><br/><code>' +
        escapeHtml(String(err && err.message ? err.message : err)) +
        '</code>',
      true,
    );
  }
}

export function bindComponentResetButton() {
  var btn = uiStore.compEls.resetBtn;
  if (btn && !btn._gsppBound) {
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      resetComponentFilters();
    });
    btn._gsppBound = true;
  }
}

export function resetMappingFilters() {
  try {
    if (uiStore.mappingEls.q) uiStore.mappingEls.q.value = '';
    function checkAll(menuEl, detailsEl, allLabel) {
      if (!menuEl || !detailsEl) return;
      var itemCbs = Array.from(menuEl.querySelectorAll('input[type="checkbox"]')).filter(
        function (cb) {
          return cb.dataset.value !== '__all__';
        },
      );
      itemCbs.forEach(function (cb) {
        cb.checked = true;
      });
      var allCb = menuEl.querySelector('input[type="checkbox"][data-value="__all__"]');
      if (allCb) {
        allCb.checked = itemCbs.length > 0;
        allCb.indeterminate = false;
      }
      msUpdateSummary(detailsEl, allLabel, itemCbs);
    }
    checkAll(uiStore.mappingEls.practiceMenu, uiStore.mappingEls.practice, 'Alle Praktiken');
    checkAll(
      uiStore.mappingEls.relationshipMenu,
      uiStore.mappingEls.relationship,
      'Alle Relationships',
    );
    checkAll(
      uiStore.mappingEls.sourceCatalogMenu,
      uiStore.mappingEls.sourceCatalog,
      'Alle Source-Kataloge',
    );
    checkAll(
      uiStore.mappingEls.targetCatalogMenu,
      uiStore.mappingEls.targetCatalog,
      'Alle Target-Kataloge',
    );
    checkAll(uiStore.mappingEls.rationaleMenu, uiStore.mappingEls.rationale, 'Alle Matching-Arten');
    checkAll(uiStore.mappingEls.statusMenu, uiStore.mappingEls.status, 'Alle Status');
    var openDropdowns = document.querySelectorAll('#mappingPanel details.ms[open]');
    for (var i = 0; i < openDropdowns.length; i++) {
      openDropdowns[i].open = false;
    }
    refreshMappingViews();
  } catch (err) {
    showMsg(
      '<strong>Fehler beim Zurücksetzen der Mapping-Filter:</strong><br/><code>' +
        escapeHtml(String(err && err.message ? err.message : err)) +
        '</code>',
      true,
    );
  }
}

export function bindMappingResetButton() {
  var btn = uiStore.mappingEls.resetBtn;
  if (btn && !btn._gsppBound) {
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      resetMappingFilters();
    });
    btn._gsppBound = true;
  }
}
