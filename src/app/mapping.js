/** Coordinates mapping parsing and its UI effects. */
import { parseMappingCollection } from '../domain/mapping.js';
import { mappingStore, uiStore } from './store.js';
export function processMappingCollection(root) {
  mappingStore.mappingState = parseMappingCollection(root, mappingStore.mappingState.baseUrl);
  uiStore.mappingEls.countInfo.textContent =
    mappingStore.mappingState.entries.length + ' Mapping-Beziehungen';
}
