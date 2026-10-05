/** app/bootstrap: see docs/architecture.md for responsibilities. */
import { configureActions } from './actions.js';
import {
  goToCatalogControl,
  goToCatalogControlFromComponent,
  openComponentLocation,
} from './cross-navigation.js';
import { restoreViewerStateFromUrl } from './deep-links.js';
import {
  loadCatalogFile,
  loadCatalogFromUrl,
  loadComponentFile,
  loadComponentFromUrl,
  loadMappingFile,
  loadMappingFromUrl,
} from './loaders.js';
import { restoreComponentReturnTarget, setSidebarMode, switchTab } from './navigation.js';
import { bindComponentExportButton, bindExportButton } from './print.js';
import {
  RefreshViews,
  refreshChartsIfVisible,
  refreshComponentViews,
  refreshMappingViews,
} from './refresh.js';
import { bindComponentResetButton, bindMappingResetButton, bindResetButton } from './reset.js';
import {
  activateCatalogSource,
  activateComponentSource,
  activateMappingSource,
  removeCatalogSource,
  removeComponentSource,
  removeMappingSource,
} from './sources.js';
import {
  catalogStore,
  componentStore,
  hierarchyStore,
  mappingStore,
  sourceStore,
  uiStore,
} from './store.js';
import { processComponentDefinition, syncComponentParamMaps } from '../app/components.js';
import { createCatalogState, createComponentState, createMappingState } from '../domain/state.js';
import { renderCard, renderRelItem } from '../features/catalog/card.js';
import { renderFilters } from '../features/catalog/filters.js';
import {
  bindTargetHelpUi,
  handleTargetCheckboxChange,
  syncTargetAutoSelectionUi,
} from '../features/catalog/target-filter.js';
import { renderList } from '../features/catalog/view.js';
import { renderComponentFilters } from '../features/components/filters.js';
import { renderComponentView } from '../features/components/view.js';
import { loadBsiRepositoryOptions } from '../features/home/repository.js';
import { renderRegistryBrowse, renderRegistryHome, showHomePage } from '../features/home/view.js';
import { renderMappingFilters } from '../features/mappings/filters.js';
import { renderMappingView } from '../features/mappings/view.js';
import {
  renderSelectionState,
  setCatalogExpansion,
  setComponentExpansion,
} from '../features/selection.js';
import { refreshWorkspaceRepositoryControls } from '../features/sources/empty-state.js';
import {
  refreshCatalogSourceSelect,
  refreshComponentSourceSelect,
  refreshMappingSourceSelect,
  setSourcePickerOpen,
} from '../features/sources/picker.js';
import { drawBar, drawGraph, drawSunburst } from '../features/visualizations/catalog.js';
import { renderTargetHierarchyView } from '../features/visualizations/target-hierarchy.js';
import { $ } from '../shared/dom.js';
import { bindDropzone } from '../shared/ui/dropzone.js';
import { closeJsonModal } from '../shared/ui/messages.js';
import { updateHeaderSubtitle } from '../shared/ui/overview.js';
import { bindStatusPillTooltips } from '../shared/ui/status.js';

export function startViewer() {
  configureActions({
    switchTab,
    RefreshViews,
    refreshComponentViews,
    refreshMappingViews,
    refreshChartsIfVisible,
    renderList,
    renderComponentView,
    renderMappingView,
    drawGraph,
    drawSunburst,
    drawBar,
    renderTargetHierarchyView,
    renderRegistryHome,
    refreshWorkspaceRepositoryControls,
    renderFilters,
    renderComponentFilters,
    renderMappingFilters,
    renderRegistryBrowse,
    goToCatalogControl,
    goToCatalogControlFromComponent,
    openComponentLocation,
    restoreComponentReturnTarget,
    setCatalogExpansion,
    setComponentExpansion,
    activateCatalogSource,
    activateComponentSource,
    activateMappingSource,
    removeCatalogSource,
    removeComponentSource,
    removeMappingSource,
    loadCatalogFile,
    loadComponentFile,
    loadMappingFile,
    loadCatalogFromUrl,
    loadComponentFromUrl,
    loadMappingFromUrl,
    showHomePage,
    renderCard,
    renderRelItem,
    syncTargetAutoSelectionUi,
    handleTargetCheckboxChange,
    syncComponentParamMaps,
    processComponentDefinition,
  });
  catalogStore.state = createCatalogState();

  componentStore.componentState = createComponentState();

  mappingStore.mappingState = createMappingState();

  uiStore.uiState = {
    dataMode: 'catalog',
    view: 'list',
    componentReturnTarget: null,
    catalogExpandOverride: null,
    componentExpandOverride: null,
  };

  sourceStore.loadedCatalogSources = [];

  sourceStore.loadedComponentSources = [];

  sourceStore.loadedMappingSources = [];

  sourceStore.activeCatalogSourceIndex = -1;

  sourceStore.activeComponentSourceIndex = -1;

  sourceStore.activeMappingSourceIndex = -1;

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

  hierarchyStore.targetHierarchyState = {
    status: 'idle',
    promise: null,
    error: null,
    ancestorsByName: Object.create(null),
    entries: [],
    roots: [],
    count: 0,
    maxDepth: 0,
  };

  hierarchyStore.targetHierarchyActivationToken = 0;

  componentStore.allComponentTypes = [];

  componentStore.allComponentSources = [];

  componentStore.allComponentNames = [];

  componentStore.allCapabilityNames = [];

  mappingStore.allMappingPractices = [];

  mappingStore.allMappingRelationships = [];

  mappingStore.allMappingSourceCatalogs = [];

  mappingStore.allMappingTargetCatalogs = [];

  mappingStore.allMappingRationales = [];

  mappingStore.allMappingStatuses = [];

  uiStore.els = {
    homeBtn: $('#homeBtn'),
    homeTab: $('#homeTab'),
    file: $('#file'),
    dropzone: $('#catalogDropzone'),
    sourceSelect: $('#catalogDatasetSelect'),
    sourcePicker: $('#catalogSourcePicker'),
    sourceButton: $('#catalogSourceButton'),
    sourcePickerMenu: $('#catalogSourceMenu'),
    urlInput: $('#urlInput'),
    urlLoadBtn: $('#urlLoadBtn'),
    bsiSelect: $('#bsiCatalogSelect'),
    bsiStatus: $('#bsiCatalogStatus'),
    q: $('#q'),
    group: $('#groupMS'),
    subgroup: $('#subgroupMS'),
    cls: $('#classMS'),
    sec: $('#secMS'),
    target: $('#targetMS'),
    targetHelp: $('#targetObjectHelpControl'),
    targetHelpTooltip: $('#targetObjectHelp'),
    tag: $('#tagMS'),
    effort: $('#effortMS'),
    modalverb: $('#modalverbMS'),
    documentation: $('#documentationMS'),
    actionword: $('#actionwordMS'),
    securityTarget: $('#securityTargetMS'),
    groupMenu: $('#groupMS_menu'),
    subgroupMenu: $('#subgroupMS_menu'),
    clsMenu: $('#classMS_menu'),
    secMenu: $('#secMS_menu'),
    targetMenu: $('#targetMS_menu'),
    tagMenu: $('#tagMS_menu'),
    effortMenu: $('#effortMS_menu'),
    modalverbMenu: $('#modalverbMS_menu'),
    documentationMenu: $('#documentationMS_menu'),
    actionwordMenu: $('#actionwordMS_menu'),
    securityTargetMenu: $('#securityTargetMS_menu'),
    filterCount: $('#catalogFilterCount'),
    resetBtn: $('#resetBtn'),
    exportPdfBtn: $('#exportPdfBtn'),
    catalogPanel: $('#catalogPanel'),
    componentPanel: $('#componentPanel'),
    mappingPanel: $('#mappingPanel'),
    viewSubtitle: $('#viewSubtitle'),
    visualContextLabel: $('#visualContextLabel'),
    visualizationTabGroup: $('#visualizationTabGroup'),
    viewSummary: $('#viewSummary'),
    selectionState: $('#catalogSelectionState'),
    fileInfo: $('#fileInfo'),
    countInfo: $('#countInfo'),
    graphInfo: $('#graphInfo'),
    listTab: $('#listTab'),
    componentTab: $('#componentTab'),
    mappingTab: $('#mappingTab'),
    graphTab: $('#graphTab'),
    sunburstTab: $('#sunburstTab'),
    barTab: $('#barTab'),
    targetHierarchyTab: $('#targetHierarchyTab'),
    targetHierarchyTabButton: $('#tab-target-hierarchy'),
    targetHierarchyCanvas: $('#targetHierarchyCanvas'),
    targetHierarchyFitBtn: $('#targetHierarchyFitBtn'),
    targetHierarchyDetails: $('#targetHierarchyDetails'),
    msg: $('#msg'),
    jsonModal: $('#jsonModal'),
    jsonModalBody: $('#jsonModalBody'),
    jsonModalClose: $('#jsonModalClose'),
  };

  uiStore.compEls = {
    file: $('#compFile'),
    dropzone: $('#componentDropzone'),
    sourceSelect: $('#componentDatasetSelect'),
    sourcePicker: $('#componentSourcePicker'),
    sourceButton: $('#componentSourceButton'),
    sourcePickerMenu: $('#componentSourceMenu'),
    urlInput: $('#compUrlInput'),
    urlLoadBtn: $('#compUrlLoadBtn'),
    bsiSelect: $('#bsiComponentSelect'),
    bsiStatus: $('#bsiComponentStatus'),
    q: $('#compQ'),
    type: $('#compTypeMS'),
    source: $('#compSourceMS'),
    name: $('#compNameMS'),
    capability: $('#compCapabilityMS'),
    typeMenu: $('#compTypeMS_menu'),
    sourceMenu: $('#compSourceMS_menu'),
    nameMenu: $('#compNameMS_menu'),
    capabilityMenu: $('#compCapabilityMS_menu'),
    fileInfo: $('#compFileInfo'),
    countInfo: $('#compCountInfo'),
    graphInfo: $('#compGraphInfo'),
    selectionState: $('#componentSelectionState'),
    resetBtn: $('#compResetBtn'),
    exportPdfBtn: $('#compExportPdfBtn'),
  };

  uiStore.mappingEls = {
    file: $('#mappingFile'),
    dropzone: $('#mappingDropzone'),
    sourceSelect: $('#mappingDatasetSelect'),
    sourcePicker: $('#mappingSourcePicker'),
    sourceButton: $('#mappingSourceButton'),
    sourcePickerMenu: $('#mappingSourceMenu'),
    urlInput: $('#mappingUrlInput'),
    urlLoadBtn: $('#mappingUrlLoadBtn'),
    q: $('#mappingQ'),
    practice: $('#mappingPracticeMS'),
    relationship: $('#mappingRelationshipMS'),
    sourceCatalog: $('#mappingSourceCatalogMS'),
    targetCatalog: $('#mappingTargetCatalogMS'),
    rationale: $('#mappingRationaleMS'),
    status: $('#mappingStatusMS'),
    practiceMenu: $('#mappingPracticeMS_menu'),
    relationshipMenu: $('#mappingRelationshipMS_menu'),
    sourceCatalogMenu: $('#mappingSourceCatalogMS_menu'),
    targetCatalogMenu: $('#mappingTargetCatalogMS_menu'),
    rationaleMenu: $('#mappingRationaleMS_menu'),
    statusMenu: $('#mappingStatusMS_menu'),
    fileInfo: $('#mappingFileInfo'),
    countInfo: $('#mappingCountInfo'),
    selectionState: $('#mappingSelectionState'),
    resetBtn: $('#mappingResetBtn'),
  };

  bindStatusPillTooltips();

  uiStore.registryState = {
    status: 'loading',
    catalogs: [],
    components: [],
    selectedModel: '',
    query: '',
    error: '',
  };

  hierarchyStore.targetHierarchyResizeTimer = 0;

  hierarchyStore.targetHierarchyRenderedCanvasWidth = 0;

  hierarchyStore.targetHierarchyRenderedCanvasHeight = 0;

  window.addEventListener(
    'resize',
    function () {
      if (uiStore.uiState.view !== 'target-hierarchy') return;
      clearTimeout(hierarchyStore.targetHierarchyResizeTimer);
      hierarchyStore.targetHierarchyResizeTimer = setTimeout(function () {
        if (!uiStore.els.targetHierarchyCanvas) return;
        var nextWidth = uiStore.els.targetHierarchyCanvas.clientWidth || 0;
        var nextHeight = uiStore.els.targetHierarchyCanvas.clientHeight || 0;
        if (
          hierarchyStore.targetHierarchyRenderedCanvasWidth &&
          hierarchyStore.targetHierarchyRenderedCanvasHeight &&
          Math.abs(nextWidth - hierarchyStore.targetHierarchyRenderedCanvasWidth) < 24 &&
          Math.abs(nextHeight - hierarchyStore.targetHierarchyRenderedCanvasHeight) < 24
        )
          return;
        renderTargetHierarchyView();
      }, 140);
    },
    { passive: true },
  );

  bindTargetHelpUi();

  if (uiStore.els.jsonModalClose) {
    uiStore.els.jsonModalClose.addEventListener('click', function () {
      closeJsonModal();
    });
  }

  if (uiStore.els.jsonModal) {
    uiStore.els.jsonModal.addEventListener('click', function (ev) {
      if (ev.target === uiStore.els.jsonModal) {
        closeJsonModal();
      }
    });
  }

  if (uiStore.els.homeBtn) {
    uiStore.els.homeBtn.addEventListener('click', function () {
      switchTab('home');
    });
  }

  document.getElementById('tab-list').addEventListener('click', function () {
    switchTab('list');
  });

  document.getElementById('tab-components').addEventListener('click', function () {
    switchTab('components');
  });

  document.getElementById('tab-mappings').addEventListener('click', function () {
    switchTab('mappings');
  });

  document.getElementById('tab-graph').addEventListener('click', function () {
    switchTab('graph');
  });

  document.getElementById('tab-sunburst').addEventListener('click', function () {
    switchTab('sunburst');
  });

  document.getElementById('tab-bar').addEventListener('click', function () {
    switchTab('bar');
  });

  document.getElementById('tab-target-hierarchy').addEventListener('click', function () {
    switchTab('target-hierarchy');
  });

  if (uiStore.els.sourceSelect) {
    uiStore.els.sourceSelect.addEventListener('change', function () {
      var index = parseInt(uiStore.els.sourceSelect.value, 10);
      if (!isNaN(index)) activateCatalogSource(index);
    });
  }

  if (uiStore.compEls.sourceSelect) {
    uiStore.compEls.sourceSelect.addEventListener('change', function () {
      var index = parseInt(uiStore.compEls.sourceSelect.value, 10);
      if (!isNaN(index)) activateComponentSource(index);
    });
  }

  if (uiStore.mappingEls.sourceSelect) {
    uiStore.mappingEls.sourceSelect.addEventListener('change', function () {
      var index = parseInt(uiStore.mappingEls.sourceSelect.value, 10);
      if (!isNaN(index)) activateMappingSource(index);
    });
  }

  if (uiStore.els.sourceButton) {
    uiStore.els.sourceButton.addEventListener('click', function (ev) {
      ev.preventDefault();
      var willOpen = uiStore.els.sourcePickerMenu.classList.contains('hidden');
      setSourcePickerOpen(
        uiStore.compEls.sourcePicker,
        uiStore.compEls.sourceButton,
        uiStore.compEls.sourcePickerMenu,
        false,
      );
      setSourcePickerOpen(
        uiStore.mappingEls.sourcePicker,
        uiStore.mappingEls.sourceButton,
        uiStore.mappingEls.sourcePickerMenu,
        false,
      );
      setSourcePickerOpen(
        uiStore.els.sourcePicker,
        uiStore.els.sourceButton,
        uiStore.els.sourcePickerMenu,
        willOpen,
      );
    });
  }

  if (uiStore.compEls.sourceButton) {
    uiStore.compEls.sourceButton.addEventListener('click', function (ev) {
      ev.preventDefault();
      var willOpen = uiStore.compEls.sourcePickerMenu.classList.contains('hidden');
      setSourcePickerOpen(
        uiStore.els.sourcePicker,
        uiStore.els.sourceButton,
        uiStore.els.sourcePickerMenu,
        false,
      );
      setSourcePickerOpen(
        uiStore.mappingEls.sourcePicker,
        uiStore.mappingEls.sourceButton,
        uiStore.mappingEls.sourcePickerMenu,
        false,
      );
      setSourcePickerOpen(
        uiStore.compEls.sourcePicker,
        uiStore.compEls.sourceButton,
        uiStore.compEls.sourcePickerMenu,
        willOpen,
      );
    });
  }

  if (uiStore.mappingEls.sourceButton) {
    uiStore.mappingEls.sourceButton.addEventListener('click', function (ev) {
      ev.preventDefault();
      var willOpen = uiStore.mappingEls.sourcePickerMenu.classList.contains('hidden');
      setSourcePickerOpen(
        uiStore.els.sourcePicker,
        uiStore.els.sourceButton,
        uiStore.els.sourcePickerMenu,
        false,
      );
      setSourcePickerOpen(
        uiStore.compEls.sourcePicker,
        uiStore.compEls.sourceButton,
        uiStore.compEls.sourcePickerMenu,
        false,
      );
      setSourcePickerOpen(
        uiStore.mappingEls.sourcePicker,
        uiStore.mappingEls.sourceButton,
        uiStore.mappingEls.sourcePickerMenu,
        willOpen,
      );
    });
  }

  document.addEventListener('click', function (ev) {
    if (uiStore.els.sourcePicker && !uiStore.els.sourcePicker.contains(ev.target)) {
      setSourcePickerOpen(
        uiStore.els.sourcePicker,
        uiStore.els.sourceButton,
        uiStore.els.sourcePickerMenu,
        false,
      );
    }
    if (uiStore.compEls.sourcePicker && !uiStore.compEls.sourcePicker.contains(ev.target)) {
      setSourcePickerOpen(
        uiStore.compEls.sourcePicker,
        uiStore.compEls.sourceButton,
        uiStore.compEls.sourcePickerMenu,
        false,
      );
    }
    if (uiStore.mappingEls.sourcePicker && !uiStore.mappingEls.sourcePicker.contains(ev.target)) {
      setSourcePickerOpen(
        uiStore.mappingEls.sourcePicker,
        uiStore.mappingEls.sourceButton,
        uiStore.mappingEls.sourcePickerMenu,
        false,
      );
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') {
      setSourcePickerOpen(
        uiStore.els.sourcePicker,
        uiStore.els.sourceButton,
        uiStore.els.sourcePickerMenu,
        false,
      );
      setSourcePickerOpen(
        uiStore.compEls.sourcePicker,
        uiStore.compEls.sourceButton,
        uiStore.compEls.sourcePickerMenu,
        false,
      );
      setSourcePickerOpen(
        uiStore.mappingEls.sourcePicker,
        uiStore.mappingEls.sourceButton,
        uiStore.mappingEls.sourcePickerMenu,
        false,
      );
    }
  });

  uiStore.els.file.addEventListener('change', function (ev) {
    var files = ev.target.files ? Array.prototype.slice.call(ev.target.files) : [];
    if (!files.length) return;
    for (var i = 0; i < files.length; i++) {
      loadCatalogFile(files[i]);
    }
  });

  if (uiStore.els.urlLoadBtn) {
    uiStore.els.urlLoadBtn.addEventListener('click', function (ev) {
      ev.preventDefault();
      loadCatalogFromUrl(uiStore.els.urlInput && uiStore.els.urlInput.value);
    });
  }

  if (uiStore.els.urlInput) {
    uiStore.els.urlInput.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        loadCatalogFromUrl(uiStore.els.urlInput.value);
      }
    });
  }

  if (uiStore.compEls.file) {
    uiStore.compEls.file.addEventListener('change', function (ev) {
      var files = ev.target.files ? Array.prototype.slice.call(ev.target.files) : [];
      if (!files.length) return;
      for (var i = 0; i < files.length; i++) {
        loadComponentFile(files[i]);
      }
    });
  }

  if (uiStore.compEls.urlLoadBtn) {
    uiStore.compEls.urlLoadBtn.addEventListener('click', function (ev) {
      ev.preventDefault();
      loadComponentFromUrl(uiStore.compEls.urlInput && uiStore.compEls.urlInput.value);
    });
  }

  if (uiStore.compEls.urlInput) {
    uiStore.compEls.urlInput.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        loadComponentFromUrl(uiStore.compEls.urlInput.value);
      }
    });
  }

  if (uiStore.mappingEls.file) {
    uiStore.mappingEls.file.addEventListener('change', function (ev) {
      var files = ev.target.files ? Array.prototype.slice.call(ev.target.files) : [];
      for (var i = 0; i < files.length; i++) {
        loadMappingFile(files[i]);
      }
    });
  }

  if (uiStore.mappingEls.urlLoadBtn) {
    uiStore.mappingEls.urlLoadBtn.addEventListener('click', function (ev) {
      ev.preventDefault();
      loadMappingFromUrl(uiStore.mappingEls.urlInput && uiStore.mappingEls.urlInput.value);
    });
  }

  if (uiStore.mappingEls.urlInput) {
    uiStore.mappingEls.urlInput.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        loadMappingFromUrl(uiStore.mappingEls.urlInput.value);
      }
    });
  }

  if (uiStore.els.bsiSelect) {
    uiStore.els.bsiSelect.addEventListener('change', function () {
      var option = uiStore.els.bsiSelect.options[uiStore.els.bsiSelect.selectedIndex];
      var url = uiStore.els.bsiSelect.value;
      if (url)
        loadCatalogFromUrl(
          url,
          option && option.dataset.documentTitle ? option.dataset.documentTitle : '',
        );
      uiStore.els.bsiSelect.value = '';
    });
  }

  if (uiStore.compEls.bsiSelect) {
    uiStore.compEls.bsiSelect.addEventListener('change', function () {
      var option = uiStore.compEls.bsiSelect.options[uiStore.compEls.bsiSelect.selectedIndex];
      var url = uiStore.compEls.bsiSelect.value;
      if (url)
        loadComponentFromUrl(
          url,
          option && option.dataset.documentTitle ? option.dataset.documentTitle : '',
        );
      uiStore.compEls.bsiSelect.value = '';
    });
  }

  loadBsiRepositoryOptions();

  bindDropzone(uiStore.els.dropzone, uiStore.els.file, loadCatalogFile);

  bindDropzone(uiStore.compEls.dropzone, uiStore.compEls.file, loadComponentFile);

  bindDropzone(uiStore.mappingEls.dropzone, uiStore.mappingEls.file, loadMappingFile);

  refreshCatalogSourceSelect();

  refreshComponentSourceSelect();

  refreshMappingSourceSelect();

  catalogStore._searchDebounceTimer = 0;

  uiStore.els.q.addEventListener('input', function () {
    clearTimeout(catalogStore._searchDebounceTimer);
    catalogStore._searchDebounceTimer = setTimeout(function () {
      RefreshViews();
    }, 120);
  });

  componentStore._componentSearchDebounceTimer = 0;

  if (uiStore.compEls.q) {
    uiStore.compEls.q.addEventListener('input', function () {
      clearTimeout(componentStore._componentSearchDebounceTimer);
      componentStore._componentSearchDebounceTimer = setTimeout(function () {
        refreshComponentViews();
      }, 120);
    });
  }

  mappingStore._mappingSearchDebounceTimer = 0;

  if (uiStore.mappingEls.q) {
    uiStore.mappingEls.q.addEventListener('input', function () {
      clearTimeout(mappingStore._mappingSearchDebounceTimer);
      mappingStore._mappingSearchDebounceTimer = setTimeout(function () {
        refreshMappingViews();
      }, 120);
    });
  }

  updateHeaderSubtitle('home');

  setSidebarMode('catalog');

  renderSelectionState(
    uiStore.compEls.selectionState,
    'Status Komponentendefinitionen',
    'Kein Datensatz geladen',
    [],
  );

  renderSelectionState(
    uiStore.mappingEls.selectionState,
    'Mappingstatus',
    'Kein Datensatz geladen',
    [],
  );

  showHomePage();

  bindResetButton();

  bindExportButton();

  bindComponentResetButton();

  bindComponentExportButton();

  bindMappingResetButton();

  restoreViewerStateFromUrl();
}
