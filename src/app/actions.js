/** Application callbacks. Wired once by bootstrap before event handlers are bound.
 * Prevents import cycles between views, navigation and source activation.
 */
let actions;
export function configureActions(implementation) {
  actions = implementation;
}
export function switchTab(...args) {
  return actions.switchTab(...args);
}
export function RefreshViews(...args) {
  return actions.RefreshViews(...args);
}
export function refreshComponentViews(...args) {
  return actions.refreshComponentViews(...args);
}
export function refreshMappingViews(...args) {
  return actions.refreshMappingViews(...args);
}
export function refreshChartsIfVisible(...args) {
  return actions.refreshChartsIfVisible(...args);
}
export function renderList(...args) {
  return actions.renderList(...args);
}
export function renderComponentView(...args) {
  return actions.renderComponentView(...args);
}
export function renderMappingView(...args) {
  return actions.renderMappingView(...args);
}
export function drawGraph(...args) {
  return actions.drawGraph(...args);
}
export function drawSunburst(...args) {
  return actions.drawSunburst(...args);
}
export function drawBar(...args) {
  return actions.drawBar(...args);
}
export function renderTargetHierarchyView(...args) {
  return actions.renderTargetHierarchyView(...args);
}
export function renderRegistryHome(...args) {
  return actions.renderRegistryHome(...args);
}
export function refreshWorkspaceRepositoryControls(...args) {
  return actions.refreshWorkspaceRepositoryControls(...args);
}
export function renderFilters(...args) {
  return actions.renderFilters(...args);
}
export function renderComponentFilters(...args) {
  return actions.renderComponentFilters(...args);
}
export function renderMappingFilters(...args) {
  return actions.renderMappingFilters(...args);
}
export function renderRegistryBrowse(...args) {
  return actions.renderRegistryBrowse(...args);
}
export function goToCatalogControl(...args) {
  return actions.goToCatalogControl(...args);
}
export function goToCatalogControlFromComponent(...args) {
  return actions.goToCatalogControlFromComponent(...args);
}
export function openComponentLocation(...args) {
  return actions.openComponentLocation(...args);
}
export function restoreComponentReturnTarget(...args) {
  return actions.restoreComponentReturnTarget(...args);
}
export function setCatalogExpansion(...args) {
  return actions.setCatalogExpansion(...args);
}
export function setComponentExpansion(...args) {
  return actions.setComponentExpansion(...args);
}
export function activateCatalogSource(...args) {
  return actions.activateCatalogSource(...args);
}
export function activateComponentSource(...args) {
  return actions.activateComponentSource(...args);
}
export function activateMappingSource(...args) {
  return actions.activateMappingSource(...args);
}
export function removeCatalogSource(...args) {
  return actions.removeCatalogSource(...args);
}
export function removeComponentSource(...args) {
  return actions.removeComponentSource(...args);
}
export function removeMappingSource(...args) {
  return actions.removeMappingSource(...args);
}
export function loadCatalogFile(...args) {
  return actions.loadCatalogFile(...args);
}
export function loadComponentFile(...args) {
  return actions.loadComponentFile(...args);
}
export function loadMappingFile(...args) {
  return actions.loadMappingFile(...args);
}
export function loadCatalogFromUrl(...args) {
  return actions.loadCatalogFromUrl(...args);
}
export function loadComponentFromUrl(...args) {
  return actions.loadComponentFromUrl(...args);
}
export function loadMappingFromUrl(...args) {
  return actions.loadMappingFromUrl(...args);
}
export function showHomePage(...args) {
  return actions.showHomePage(...args);
}
export function renderCard(...args) {
  return actions.renderCard(...args);
}
export function renderRelItem(...args) {
  return actions.renderRelItem(...args);
}
export function syncTargetAutoSelectionUi(...args) {
  return actions.syncTargetAutoSelectionUi(...args);
}
export function handleTargetCheckboxChange(...args) {
  return actions.handleTargetCheckboxChange(...args);
}
export function syncComponentParamMaps(...args) {
  return actions.syncComponentParamMaps(...args);
}
export function processComponentDefinition(...args) {
  return actions.processComponentDefinition(...args);
}
