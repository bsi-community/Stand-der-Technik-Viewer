/** Coordinates catalog parsing and its UI effects. */
import { parseCatalog } from '../domain/catalog.js';
import { catalogStore, uiStore } from './store.js';
import { syncComponentParamMaps } from './actions.js';
import { showMsg } from '../shared/ui/messages.js';
export function processCatalog(root) {
  catalogStore.state = parseCatalog(root, catalogStore.state);
  syncComponentParamMaps();
  uiStore.els.countInfo.textContent = catalogStore.state.controls.length + ' Anforderungen';
  if (!catalogStore.state.controls.length)
    showMsg(
      '<strong>Keine Anforderungen gefunden.</strong><br/>Erwartet: <code>catalog.controls</code> oder <code>catalog.groups[*].controls</code>.',
      true,
    );
}
