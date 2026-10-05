/** features/mappings/selectors: see docs/architecture.md for responsibilities. */
import { mappingStore } from '../../app/store.js';
import { matchesSearchText } from '../../shared/search.js';

export function mappingEntryMatches(entry) {
  if (!matchesSearchText(entry.searchText, mappingStore.mappingState.searchQuery)) return false;
  if (
    mappingStore.allMappingPractices.length &&
    mappingStore.mappingState.practices.length !== mappingStore.allMappingPractices.length
  ) {
    var practiceMatch = false;
    for (var p = 0; p < mappingStore.mappingState.practices.length; p++) {
      if (entry.practices.indexOf(mappingStore.mappingState.practices[p]) !== -1) {
        practiceMatch = true;
        break;
      }
    }
    if (!practiceMatch) return false;
  }
  if (
    mappingStore.allMappingRelationships.length &&
    mappingStore.mappingState.relationships.length !==
      mappingStore.allMappingRelationships.length &&
    mappingStore.mappingState.relationships.indexOf(entry.relationship) === -1
  )
    return false;
  if (
    mappingStore.allMappingSourceCatalogs.length &&
    mappingStore.mappingState.sourceCatalogs.length !==
      mappingStore.allMappingSourceCatalogs.length &&
    mappingStore.mappingState.sourceCatalogs.indexOf(entry.sourceCatalogDisplay) === -1
  )
    return false;
  if (
    mappingStore.allMappingTargetCatalogs.length &&
    mappingStore.mappingState.targetCatalogs.length !==
      mappingStore.allMappingTargetCatalogs.length &&
    mappingStore.mappingState.targetCatalogs.indexOf(entry.targetCatalogDisplay) === -1
  )
    return false;
  if (
    mappingStore.allMappingRationales.length &&
    mappingStore.mappingState.rationales.length !== mappingStore.allMappingRationales.length &&
    mappingStore.mappingState.rationales.indexOf(entry.rationale) === -1
  )
    return false;
  if (
    mappingStore.allMappingStatuses.length &&
    mappingStore.mappingState.statuses.length !== mappingStore.allMappingStatuses.length &&
    mappingStore.mappingState.statuses.indexOf(entry.status) === -1
  )
    return false;
  return true;
}
