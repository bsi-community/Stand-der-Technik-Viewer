/** infrastructure/target-hierarchy: see docs/architecture.md for responsibilities. */
import { RefreshViews, syncTargetAutoSelectionUi } from '../app/actions.js';
import { catalogStore, hierarchyStore } from '../app/store.js';
import { TARGET_OBJECT_CATEGORY_NAMESPACE_URL } from '../config.js';
import { buildTargetHierarchy } from '../domain/target-hierarchy.js';
import { applyTargetAncestorsForCheckedOptions } from '../features/catalog/target-filter.js';

export function loadTargetHierarchy() {
  if (hierarchyStore.targetHierarchyState.status === 'ready')
    return Promise.resolve(hierarchyStore.targetHierarchyState);
  if (hierarchyStore.targetHierarchyState.promise)
    return hierarchyStore.targetHierarchyState.promise;
  hierarchyStore.targetHierarchyState.status = 'loading';
  hierarchyStore.targetHierarchyState.error = null;
  hierarchyStore.targetHierarchyState.promise = fetch(TARGET_OBJECT_CATEGORY_NAMESPACE_URL, {
    cache: 'no-cache',
  })
    .then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.text();
    })
    .then(function (csvText) {
      if (csvText.length > 250000) throw new Error('Die CSV überschreitet die erlaubte Größe.');
      var hierarchy = buildTargetHierarchy(csvText);
      hierarchyStore.targetHierarchyState.status = 'ready';
      hierarchyStore.targetHierarchyState.ancestorsByName = hierarchy.ancestorsByName;
      hierarchyStore.targetHierarchyState.entries = hierarchy.entries;
      hierarchyStore.targetHierarchyState.roots = hierarchy.roots;
      hierarchyStore.targetHierarchyState.count = hierarchy.count;
      hierarchyStore.targetHierarchyState.maxDepth = hierarchy.maxDepth;
      return hierarchyStore.targetHierarchyState;
    })
    .catch(function (error) {
      hierarchyStore.targetHierarchyState.status = 'error';
      hierarchyStore.targetHierarchyState.promise = null;
      hierarchyStore.targetHierarchyState.error = error;
      throw error;
    });
  return hierarchyStore.targetHierarchyState.promise;
}

export function ensureTargetHierarchyForActiveCatalog() {
  var activationToken = ++hierarchyStore.targetHierarchyActivationToken;
  if (!catalogStore.state.hasTargetObjectCategories) {
    return;
  }
  loadTargetHierarchy()
    .then(function (hierarchy) {
      if (
        activationToken !== hierarchyStore.targetHierarchyActivationToken ||
        !catalogStore.state.hasTargetObjectCategories
      )
        return;
      applyTargetAncestorsForCheckedOptions();
      RefreshViews();
    })
    .catch(function () {
      if (
        activationToken !== hierarchyStore.targetHierarchyActivationToken ||
        !catalogStore.state.hasTargetObjectCategories
      )
        return;
      catalogStore.state.autoSelectedTargets = [];
      syncTargetAutoSelectionUi();
    });
}
