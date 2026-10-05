/** app/catalog-lookup: see docs/architecture.md for responsibilities. */
import { catalogStore, sourceStore } from '../app/store.js';
import { buildParamMap, partText } from '../domain/parameters.js';
import { valueOfProp } from '../domain/properties.js';
import { looksUuidLikeId, normalizeControlRef } from '../domain/references.js';

export function normalizeSourceMatchValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

export function addCatalogRef(refMap, value) {
  var raw = String(value || '').trim();
  if (!raw) return;
  refMap[raw] = true;
  var normalized = normalizeControlRef(raw);
  if (normalized) refMap[normalized] = true;
  if (looksUuidLikeId(normalized)) refMap[normalized.toLowerCase()] = true;
}

export function addCatalogControlLookup(controlMap, key, entry) {
  var raw = String(key || '').trim();
  if (!raw) return;
  controlMap[raw] = entry;
  var normalized = normalizeControlRef(raw);
  if (normalized) controlMap[normalized] = entry;
  if (looksUuidLikeId(normalized)) controlMap[normalized.toLowerCase()] = entry;
}

export function collectCatalogRefs(node, refMap, controlMap, isControl) {
  if (!node || typeof node !== 'object') return;
  var id = String(node.id || '').trim();
  var uuid = String(node.uuid || valueOfProp(node.props, 'alt-identifier') || '').trim();
  var label = valueOfProp(node.props, 'label') || '';
  addCatalogRef(refMap, id);
  addCatalogRef(refMap, uuid);
  addCatalogRef(refMap, label);
  if (isControl && controlMap) {
    var entry = {
      id: label || id || '',
      rawId: id,
      labelId: String(label || '').trim(),
      uuid: uuid,
      raw: node,
    };
    addCatalogControlLookup(controlMap, id, entry);
    addCatalogControlLookup(controlMap, uuid, entry);
    addCatalogControlLookup(controlMap, label, entry);
  }
  var controls = Array.isArray(node.controls) ? node.controls : [];
  for (var ci = 0; ci < controls.length; ci++) {
    collectCatalogRefs(controls[ci], refMap, controlMap, true);
  }
  var groups = Array.isArray(node.groups) ? node.groups : [];
  for (var gi = 0; gi < groups.length; gi++) {
    collectCatalogRefs(groups[gi], refMap, controlMap, false);
  }
}

export function buildCatalogSourceMeta(root, fallbackLabel) {
  var cat = root && (root.catalog || root);
  var refs = {};
  var controls = {};
  collectCatalogRefs(cat, refs, controls, false);
  var title =
    (cat && cat.metadata && cat.metadata.title) || (cat && cat.title) || fallbackLabel || '';
  return {
    catalogUuid: String((cat && cat.uuid) || '').trim(),
    catalogTitle: String(title || '').trim(),
    controlRefs: refs,
    controlLookup: controls,
  };
}

export function catalogSourceHasControlRef(source, controlRef) {
  if (!source || !source.controlRefs) return false;
  var key = normalizeControlRef(controlRef);
  return !!(key && (source.controlRefs[key] || source.controlRefs[key.toLowerCase()]));
}

export function catalogSourceMatchesRequirement(source, req) {
  if (!source || !req) return false;
  var candidates = [req.source, req.sourceLabel, req.catalogControlUuid];
  var sourceValues = [source.catalogUuid, source.catalogTitle, source.label];
  for (var i = 0; i < candidates.length; i++) {
    var candidate = normalizeSourceMatchValue(candidates[i]);
    if (!candidate) continue;
    if (candidate.charAt(0) === '#') candidate = candidate.slice(1);
    for (var j = 0; j < sourceValues.length; j++) {
      var sourceValue = normalizeSourceMatchValue(sourceValues[j]);
      if (!sourceValue) continue;
      if (candidate === sourceValue) return true;
      if (sourceValue.indexOf(candidate) !== -1 || candidate.indexOf(sourceValue) !== -1)
        return true;
    }
  }
  return false;
}

export function findCatalogSourceIndexByControlRef(controlRef) {
  for (var i = 0; i < sourceStore.loadedCatalogSources.length; i++) {
    if (catalogSourceHasControlRef(sourceStore.loadedCatalogSources[i], controlRef)) return i;
  }
  return -1;
}

export function findCatalogSourceIndexForRequirement(req) {
  if (!req) return -1;
  if (getCatalogControlByRef(req.controlId)) return sourceStore.activeCatalogSourceIndex;
  var fallbackIndex = -1;
  for (var i = 0; i < sourceStore.loadedCatalogSources.length; i++) {
    var source = sourceStore.loadedCatalogSources[i];
    var matchesSource = catalogSourceMatchesRequirement(source, req);
    var hasRef = catalogSourceHasControlRef(source, req.controlId);
    if (matchesSource && hasRef) return i;
    if (hasRef && fallbackIndex === -1) fallbackIndex = i;
  }
  return fallbackIndex;
}

export function getCatalogControlByRef(controlRef) {
  var key = normalizeControlRef(controlRef);
  if (!key) return null;
  return (
    catalogStore.state.uuidMap.get(key) ||
    catalogStore.state.uuidMap.get(key.toLowerCase()) ||
    catalogStore.state.idMap.get(key) ||
    null
  );
}

export function getCatalogSourceControlByRef(source, controlRef) {
  if (!source || !source.controlLookup) return null;
  var key = normalizeControlRef(controlRef);
  return key ? source.controlLookup[key] || source.controlLookup[key.toLowerCase()] || null : null;
}

export function getAnyCatalogControlByRef(controlRef) {
  var active = getCatalogControlByRef(controlRef);
  if (active) return active;
  for (var i = 0; i < sourceStore.loadedCatalogSources.length; i++) {
    var found = getCatalogSourceControlByRef(sourceStore.loadedCatalogSources[i], controlRef);
    if (found) return found;
  }
  return null;
}

export function findCatalogControlForRequirement(req) {
  if (!req) return { control: null, sourceIndex: -1 };
  var sourceIndex = findCatalogSourceIndexForRequirement(req);
  if (sourceIndex >= 0 && sourceIndex < sourceStore.loadedCatalogSources.length) {
    if (sourceIndex === sourceStore.activeCatalogSourceIndex) {
      var activeControl = getCatalogControlByRef(req.controlId);
      if (activeControl) return { control: activeControl, sourceIndex: sourceIndex };
    }
    var sourceControl = getCatalogSourceControlByRef(
      sourceStore.loadedCatalogSources[sourceIndex],
      req.controlId,
    );
    if (sourceControl) return { control: sourceControl, sourceIndex: sourceIndex };
  }
  return { control: getAnyCatalogControlByRef(req.controlId), sourceIndex: sourceIndex };
}

export function getCatalogStatementProse(control) {
  if (!control) return '';
  var rawParts = control.raw && Array.isArray(control.raw.parts) ? control.raw.parts : null;
  var rawStatement = partText(rawParts, 'statement');
  if (rawStatement) return rawStatement;
  if (control.statement) return control.statement;
  var parts = Array.isArray(control.parts) ? control.parts : null;
  return partText(parts, 'statement');
}

export function getCatalogPreviewParamMap(control) {
  if (!control) return {};
  if (control.paramMap) return control.paramMap;
  return buildParamMap((control.raw && control.raw.params) || []);
}

export function getCatalogControlTitle(control) {
  return String((control && (control.title || (control.raw && control.raw.title))) || '').trim();
}

export function getCatalogControlDisplayId(controlRef) {
  var control = getAnyCatalogControlByRef(controlRef);
  return control ? control.labelId || control.id || control.rawId || '' : '';
}

export function getCatalogControlUuid(controlRef) {
  var control = getAnyCatalogControlByRef(controlRef);
  if (control && control.uuid) return control.uuid;
  var key = normalizeControlRef(controlRef);
  return looksUuidLikeId(key) ? key : '';
}
