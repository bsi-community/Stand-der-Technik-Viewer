/** features/components/filters: see docs/architecture.md for responsibilities. */
import { refreshComponentViews } from '../../app/actions.js';
import { bindComponentExportButton } from '../../app/print.js';
import { bindComponentResetButton } from '../../app/reset.js';
import { componentStore, uiStore } from '../../app/store.js';
import { componentOwnerName } from '../../app/components.js';
import { uniqueList } from '../../shared/collections.js';
import { msSetItems } from '../../shared/ui/multiselect.js';

export function renderComponentFilters() {
  var typesRaw = [],
    sourcesRaw = [],
    namesRaw = [],
    capsRaw = [];
  for (var i = 0; i < componentStore.componentState.components.length; i++) {
    var comp = componentStore.componentState.components[i];
    if (comp.type) typesRaw.push(comp.type);
    namesRaw.push(componentOwnerName(comp));
    for (var s = 0; s < comp.sources.length; s++) {
      if (comp.sources[s]) sourcesRaw.push(comp.sources[s]);
    }
  }
  for (var c = 0; c < componentStore.componentState.capabilities.length; c++) {
    capsRaw.push(componentOwnerName(componentStore.componentState.capabilities[c]));
    for (var sc = 0; sc < componentStore.componentState.capabilities[c].sources.length; sc++) {
      if (componentStore.componentState.capabilities[c].sources[sc])
        sourcesRaw.push(componentStore.componentState.capabilities[c].sources[sc]);
    }
  }
  componentStore.allComponentTypes = uniqueList(typesRaw).sort();
  componentStore.allComponentSources = uniqueList(sourcesRaw).sort();
  componentStore.allComponentNames = uniqueList(namesRaw).sort();
  componentStore.allCapabilityNames = uniqueList(capsRaw).sort();
  msSetItems(
    uiStore.compEls.type,
    uiStore.compEls.typeMenu,
    'Alle Komponententypen',
    componentStore.allComponentTypes,
    refreshComponentViews,
  );
  msSetItems(
    uiStore.compEls.source,
    uiStore.compEls.sourceMenu,
    'Alle Quellen',
    componentStore.allComponentSources,
    refreshComponentViews,
  );
  msSetItems(
    uiStore.compEls.name,
    uiStore.compEls.nameMenu,
    'Alle Komponenten',
    componentStore.allComponentNames,
    refreshComponentViews,
  );
  msSetItems(
    uiStore.compEls.capability,
    uiStore.compEls.capabilityMenu,
    'Alle Capabilities',
    componentStore.allCapabilityNames,
    refreshComponentViews,
  );
  bindComponentResetButton();
  bindComponentExportButton();
}

export function isComponentFilterActive() {
  if (componentStore.componentState.searchQuery.groups.length) return true;
  if (
    componentStore.allComponentTypes.length &&
    componentStore.componentState.types.length !== componentStore.allComponentTypes.length
  )
    return true;
  if (
    componentStore.allComponentSources.length &&
    componentStore.componentState.sources.length !== componentStore.allComponentSources.length
  )
    return true;
  if (
    componentStore.allComponentNames.length &&
    componentStore.componentState.names.length !== componentStore.allComponentNames.length
  )
    return true;
  if (
    componentStore.allCapabilityNames.length &&
    componentStore.componentState.capabilityNames.length !==
      componentStore.allCapabilityNames.length
  )
    return true;
  return false;
}
