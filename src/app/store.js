/** Explicit state containers shared by the application. Initialized by startViewer().
 * Domain parsing is progressively passed explicit model state; DOM references stay in uiStore.
 */
export const catalogStore = {
  state: undefined,
  allGroups: undefined,
  allSubgroups: undefined,
  allClasses: undefined,
  allSecs: undefined,
  allTargets: undefined,
  allTags: undefined,
  allEfforts: undefined,
  allModalverbs: undefined,
  allDocumentations: undefined,
  allActionwords: undefined,
  allSecurityTargets: undefined,
  _searchDebounceTimer: undefined,
};
export const componentStore = {
  componentState: undefined,
  allComponentTypes: undefined,
  allComponentSources: undefined,
  allComponentNames: undefined,
  allCapabilityNames: undefined,
  _componentSearchDebounceTimer: undefined,
};
export const mappingStore = {
  mappingState: undefined,
  allMappingPractices: undefined,
  allMappingRelationships: undefined,
  allMappingSourceCatalogs: undefined,
  allMappingTargetCatalogs: undefined,
  allMappingRationales: undefined,
  allMappingStatuses: undefined,
  _mappingSearchDebounceTimer: undefined,
};
export const uiStore = {
  uiState: undefined,
  els: undefined,
  compEls: undefined,
  mappingEls: undefined,
  registryState: undefined,
};
export const sourceStore = {
  loadedCatalogSources: undefined,
  loadedComponentSources: undefined,
  loadedMappingSources: undefined,
  activeCatalogSourceIndex: undefined,
  activeComponentSourceIndex: undefined,
  activeMappingSourceIndex: undefined,
};
export const hierarchyStore = {
  targetHierarchyState: undefined,
  targetHierarchyActivationToken: undefined,
  targetHierarchyResizeTimer: undefined,
  targetHierarchyRenderedCanvasWidth: undefined,
  targetHierarchyRenderedCanvasHeight: undefined,
};
