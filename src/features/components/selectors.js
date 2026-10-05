/** features/components/selectors: see docs/architecture.md for responsibilities. */
import { componentStore } from '../../app/store.js';
import { componentOwnerName } from '../../app/components.js';
import { matchesSearchText } from '../../shared/search.js';

export function matchesComponentOwner(entry) {
  if (
    entry.kind === 'component' &&
    componentStore.allComponentTypes.length &&
    componentStore.componentState.types.length !== componentStore.allComponentTypes.length
  ) {
    if (componentStore.componentState.types.indexOf(entry.type || '') === -1) return false;
  }
  if (
    entry.kind === 'component' &&
    componentStore.allComponentNames.length &&
    componentStore.componentState.names.length !== componentStore.allComponentNames.length
  ) {
    if (componentStore.componentState.names.indexOf(componentOwnerName(entry)) === -1) return false;
  }
  if (
    entry.kind === 'capability' &&
    componentStore.allCapabilityNames.length &&
    componentStore.componentState.capabilityNames.length !==
      componentStore.allCapabilityNames.length
  ) {
    if (componentStore.componentState.capabilityNames.indexOf(componentOwnerName(entry)) === -1)
      return false;
  }
  if (
    entry.kind === 'component' &&
    componentStore.allCapabilityNames.length &&
    componentStore.componentState.capabilityNames.length !==
      componentStore.allCapabilityNames.length
  ) {
    var capNames = componentStore.componentState.componentToCapabilities[entry.uuid] || [];
    var okCap = false;
    for (var ci = 0; ci < componentStore.componentState.capabilityNames.length; ci++) {
      if (capNames.indexOf(componentStore.componentState.capabilityNames[ci]) !== -1) {
        okCap = true;
        break;
      }
    }
    if (!okCap) return false;
  }
  if (
    componentStore.allComponentSources.length &&
    componentStore.componentState.sources.length !== componentStore.allComponentSources.length
  ) {
    var okSource = false;
    for (var s = 0; s < componentStore.componentState.sources.length; s++) {
      if (entry.sources.indexOf(componentStore.componentState.sources[s]) !== -1) {
        okSource = true;
        break;
      }
    }
    if (!okSource) return false;
  }
  if (!matchesSearchText(entry.searchText, componentStore.componentState.searchQuery)) return false;
  return true;
}

export function getCapabilityComponents(owner) {
  if (!owner || owner.kind !== 'capability') return [];
  var key = owner.uuid || owner.name;
  return componentStore.componentState.capabilityComponents[key] || [];
}

export function getMatchedCapabilityComponents(owner) {
  var items = getCapabilityComponents(owner);
  var out = [];
  for (var i = 0; i < items.length; i++) {
    if (matchesComponentOwner(items[i])) out.push(items[i]);
  }
  return out;
}

export function getVisibleComponentCapabilityKeys(owner) {
  var keys =
    owner && owner.uuid
      ? componentStore.componentState.componentCapabilityKeys[owner.uuid] || []
      : [];
  var visible = [];
  for (var i = 0; i < keys.length; i++) {
    var cap = componentStore.componentState.capabilityByUuid.get(keys[i]) || null;
    if (cap && (matchesComponentOwner(cap) || getMatchedCapabilityComponents(cap).length)) {
      visible.push(keys[i]);
    }
  }
  return visible;
}
