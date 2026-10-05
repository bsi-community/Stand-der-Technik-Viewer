/** app/components: see docs/architecture.md for responsibilities. */
import { componentStore, sourceStore, uiStore } from '../app/store.js';
import {
  getCatalogControlByRef,
  getCatalogControlDisplayId,
  getCatalogControlUuid,
} from './catalog-lookup.js';
import { buildParamMap, mergeParamMaps, replaceParams } from '../domain/parameters.js';
import { createComponentState } from '../domain/state.js';
import { showMsg } from '../shared/ui/messages.js';
import { getBackMatterResource, getBackMatterResourceLabel } from '../shared/urls.js';

export function componentOwnerName(entry) {
  return entry.kind === 'capability'
    ? entry.name || entry.title || 'Capability'
    : entry.title || entry.name || 'Komponente';
}

export function extractConfigCommands(props) {
  var out = [];
  var items = Array.isArray(props) ? props : [];
  for (var i = 0; i < items.length; i++) {
    var prop = items[i];
    if (!prop) continue;
    var name = String(prop.name || '')
      .trim()
      .toLowerCase();
    if (name !== 'config-commands' && name !== 'config-command') continue;
    var value = prop.value == null ? '' : String(prop.value);
    var remarks = prop.remarks == null ? '' : String(prop.remarks);
    if (!value.trim() && !remarks.trim()) continue;
    out.push({
      name: prop.name || 'config-commands',
      value: value,
      remarks: remarks,
      ns: prop.ns || '',
      raw: prop,
    });
  }
  return out;
}

export function createImplementationEntry(impl, owner) {
  var source = String((impl && impl.source) || '').trim();
  var sourceResource = getBackMatterResource(componentStore.componentState.resourceByUuid, source);
  var sourceLabel = sourceResource ? getBackMatterResourceLabel(sourceResource) : source;
  var implEntry = {
    key:
      (owner.uuid || owner.id || owner.name || 'owner') +
      '::' +
      ((impl && impl.uuid) || sourceLabel || 'impl'),
    uuid: (impl && impl.uuid) || '',
    source: source,
    sourceLabel: sourceLabel || source || 'Ohne Quelle',
    description: (impl && impl.description) || '',
    props: (impl && impl.props) || [],
    links: (impl && impl.links) || [],
    setParameters: (impl && impl['set-parameters']) || [],
    localParamMap: buildParamMap((impl && impl['set-parameters']) || [], 'param-id'),
    paramMap: {},
    responsibleRoles: (impl && impl['responsible-roles']) || [],
    remarks: (impl && impl.remarks) || '',
    raw: impl || {},
    ownerUuid: owner.uuid,
    ownerKind: owner.kind,
    ownerName: componentOwnerName(owner),
    requirements: [],
  };
  var reqs = (impl && impl['implemented-requirements']) || [];
  for (var i = 0; i < reqs.length; i++) {
    var req = reqs[i] || {};
    var reqKey =
      (owner.uuid || owner.id || owner.name || 'owner') +
      '::' +
      (implEntry.uuid || implEntry.sourceLabel || 'impl') +
      '::' +
      (req.uuid || req['control-id'] || 'req-' + i);
    var reqEntry = {
      id: reqKey,
      uuid: req.uuid || '',
      controlId: req['control-id'] || '',
      catalogControlId: '',
      catalogControlUuid: '',
      description: req.description || '',
      props: req.props || [],
      configCommands: extractConfigCommands(req.props),
      links: req.links || [],
      setParameters: req['set-parameters'] || [],
      localParamMap: buildParamMap(req['set-parameters'] || [], 'param-id'),
      paramMap: {},
      responsibleRoles: req['responsible-roles'] || [],
      remarks: req.remarks || '',
      raw: req,
      source: implEntry.source,
      sourceLabel: implEntry.sourceLabel,
      ownerUuid: owner.uuid,
      ownerKind: owner.kind,
      ownerName: componentOwnerName(owner),
      implKey: '',
      statements: [],
    };
    reqEntry.implKey = implEntry.key;
    var stmts = req.statements || [];
    for (var s = 0; s < stmts.length; s++) {
      var stmt = stmts[s] || {};
      reqEntry.statements.push({
        id: reqKey + '::stmt::' + (stmt.uuid || stmt['statement-id'] || s),
        statementId: stmt['statement-id'] || '',
        uuid: stmt.uuid || '',
        description: stmt.description || '',
        props: stmt.props || [],
        links: stmt.links || [],
        paramMap: {},
        responsibleRoles: stmt['responsible-roles'] || [],
        remarks: stmt.remarks || '',
        raw: stmt,
      });
    }
    implEntry.requirements.push(reqEntry);
    if (reqEntry.controlId) {
      if (!componentStore.componentState.controlRefMap[reqEntry.controlId])
        componentStore.componentState.controlRefMap[reqEntry.controlId] = [];
      componentStore.componentState.controlRefMap[reqEntry.controlId].push(reqEntry);
    }
  }
  return implEntry;
}

export function buildComponentSearchText(owner) {
  var parts = [
    owner.uuid,
    owner.type,
    replaceParams(owner.title, owner.paramMap),
    owner.name,
    owner.importDocumentTitle,
    owner.importDocumentUuid,
    owner.importSourceLabel,
    replaceParams(owner.description, owner.paramMap),
    replaceParams(owner.purpose, owner.paramMap),
    replaceParams(owner.remarks, owner.paramMap),
  ];
  var impls = owner.controlImplementations || [];
  for (var i = 0; i < impls.length; i++) {
    var impl = impls[i];
    parts.push(
      impl.uuid,
      impl.source,
      impl.sourceLabel,
      replaceParams(impl.description, impl.paramMap),
      replaceParams(impl.remarks, impl.paramMap),
    );
    var reqs = impl.requirements || [];
    for (var r = 0; r < reqs.length; r++) {
      var req = reqs[r];
      req.catalogControlId = getCatalogControlDisplayId(req.controlId);
      req.catalogControlUuid = getCatalogControlUuid(req.controlId);
      parts.push(
        req.controlId,
        req.catalogControlId,
        req.catalogControlUuid,
        req.uuid,
        replaceParams(req.description, req.paramMap),
        replaceParams(req.remarks, req.paramMap),
      );
      var configCommands = req.configCommands || [];
      for (var cc = 0; cc < configCommands.length; cc++) {
        parts.push(configCommands[cc].value, configCommands[cc].remarks);
      }
      var stmts = req.statements || [];
      for (var s = 0; s < stmts.length; s++) {
        parts.push(
          stmts[s].statementId,
          stmts[s].uuid,
          replaceParams(stmts[s].description, stmts[s].paramMap),
          replaceParams(stmts[s].remarks, stmts[s].paramMap),
        );
      }
    }
  }
  return parts.join(' \n ').toLowerCase();
}

export function getComponentDefinitionDocument(root) {
  return root && (root['component-definition'] || root.componentDefinition || root);
}

export function getComponentDefinitionUuid(root) {
  var doc = getComponentDefinitionDocument(root);
  return doc && doc.uuid ? String(doc.uuid).trim() : '';
}

export function normalizeBackMatterReference(ref) {
  var value = String(ref || '').trim();
  if (value.charAt(0) === '#') value = value.slice(1);
  return value;
}

export function getFirstResourceRlink(resource) {
  var rlinks = resource && Array.isArray(resource.rlinks) ? resource.rlinks : [];
  for (var i = 0; i < rlinks.length; i++) {
    if (rlinks[i] && rlinks[i].href) return rlinks[i].href;
  }
  return '';
}

export function setResourceBaseUrl(resource, baseUrl) {
  if (!resource) return;
  try {
    Object.defineProperty(resource, '__baseUrl', {
      value: baseUrl || '',
      configurable: true,
      writable: true,
      enumerable: false,
    });
  } catch (_err) {
    resource.__baseUrl = baseUrl || '';
  }
}

export function getResourceDocumentIdentifier(resource) {
  var ids = resource && Array.isArray(resource['document-ids']) ? resource['document-ids'] : [];
  for (var i = 0; i < ids.length; i++) {
    if (ids[i] && ids[i].identifier) return String(ids[i].identifier).trim();
  }
  return '';
}

export function getLoadedComponentSourceByDocumentUuid(documentUuid) {
  var target = String(documentUuid || '').trim();
  if (!target) return null;
  for (var i = 0; i < sourceStore.loadedComponentSources.length; i++) {
    var source = sourceStore.loadedComponentSources[i];
    var sourceUuid = source.componentDefinitionUuid || getComponentDefinitionUuid(source.json);
    source.componentDefinitionUuid = sourceUuid;
    if (sourceUuid && sourceUuid.toLowerCase() === target.toLowerCase()) {
      return { source: source, index: i };
    }
  }
  return null;
}

export function appendComponentDefinitionOwners(doc, origin) {
  origin = origin || {};
  var imported = !!origin.imported;
  var caps = Array.isArray(doc.capabilities) ? doc.capabilities : [];
  for (var c = 0; c < caps.length; c++) {
    var capRaw = caps[c] || {};
    var cap = {
      kind: 'capability',
      uuid: capRaw.uuid || '',
      type: '',
      name: capRaw.name || capRaw.title || 'Capability ' + (c + 1),
      title: capRaw.title || capRaw.name || '',
      description: capRaw.description || '',
      purpose: '',
      remarks: capRaw.remarks || '',
      props: capRaw.props || [],
      links: capRaw.links || [],
      protocols: capRaw.protocols || [],
      responsibleRoles: capRaw['responsible-roles'] || [],
      incorporatesComponents: capRaw['incorporates-components'] || [],
      imported: imported,
      importDocumentUuid: origin.documentUuid || '',
      importDocumentTitle: origin.documentTitle || '',
      importSourceLabel: origin.sourceLabel || '',
      paramMap: {},
      controlImplementations: [],
      raw: capRaw,
      sources: [],
    };
    var capImpls = capRaw['control-implementations'] || [];
    for (var ci = 0; ci < capImpls.length; ci++) {
      var capImpl = createImplementationEntry(capImpls[ci], cap);
      cap.controlImplementations.push(capImpl);
      if (capImpl.sourceLabel && cap.sources.indexOf(capImpl.sourceLabel) === -1)
        cap.sources.push(capImpl.sourceLabel);
    }
    cap.searchText = buildComponentSearchText(cap);
    componentStore.componentState.capabilities.push(cap);
    if (cap.uuid) {
      componentStore.componentState.capabilityByUuid.set(cap.uuid, cap);
    }
  }

  var comps = Array.isArray(doc.components) ? doc.components : [];
  for (var i = 0; i < comps.length; i++) {
    var raw = comps[i] || {};
    var comp = {
      kind: 'component',
      uuid: raw.uuid || '',
      type: raw.type || '',
      name: raw.title || raw.name || 'Komponente ' + (i + 1),
      title: raw.title || raw.name || '',
      description: raw.description || '',
      purpose: raw.purpose || '',
      remarks: raw.remarks || '',
      props: raw.props || [],
      links: raw.links || [],
      protocols: raw.protocols || [],
      responsibleRoles: raw['responsible-roles'] || [],
      imported: imported,
      importDocumentUuid: origin.documentUuid || '',
      importDocumentTitle: origin.documentTitle || '',
      importSourceLabel: origin.sourceLabel || '',
      paramMap: {},
      controlImplementations: [],
      raw: raw,
      sources: [],
    };
    var impls = raw['control-implementations'] || [];
    for (var ii = 0; ii < impls.length; ii++) {
      var implEntry = createImplementationEntry(impls[ii], comp);
      comp.controlImplementations.push(implEntry);
      if (implEntry.sourceLabel && comp.sources.indexOf(implEntry.sourceLabel) === -1)
        comp.sources.push(implEntry.sourceLabel);
    }
    comp.searchText = buildComponentSearchText(comp);
    componentStore.componentState.components.push(comp);
    if (comp.uuid) {
      componentStore.componentState.componentByUuid.set(comp.uuid, comp);
    }
  }
  return { components: comps.length, capabilities: caps.length };
}

export function resolveImportedComponentDefinitions(imports) {
  var statuses = [];
  var seen = {};
  if (componentStore.componentState.documentUuid)
    seen[componentStore.componentState.documentUuid.toLowerCase()] = true;
  for (var i = 0; i < (imports || []).length; i++) {
    var entry = imports[i] || {};
    var resourceUuid = normalizeBackMatterReference(entry.href);
    var resource = resourceUuid
      ? componentStore.componentState.resourceByUuid.get(resourceUuid) ||
        componentStore.componentState.resourceByUuid.get(resourceUuid.toLowerCase())
      : null;
    var documentUuid = getResourceDocumentIdentifier(resource);
    var status = {
      entry: entry,
      resource: resource,
      resourceUuid: resourceUuid,
      documentUuid: documentUuid,
      title: (resource && resource.title) || '',
      rlink: getFirstResourceRlink(resource),
      loaded: false,
      skipped: false,
      components: 0,
      capabilities: 0,
      sourceLabel: '',
      message: '',
    };
    if (!resource) {
      status.message = 'Die Back-Matter-Ressource wurde nicht gefunden.';
    } else if (!documentUuid) {
      status.message = 'Die Back-Matter-Ressource enthält keine document-ids.identifier UUID.';
    } else {
      var match = getLoadedComponentSourceByDocumentUuid(documentUuid);
      if (match && match.source) {
        status.loaded = true;
        status.sourceLabel = match.source.label || '';
        var importedDoc = getComponentDefinitionDocument(match.source.json);
        var seenKey = documentUuid.toLowerCase();
        if (seen[seenKey]) {
          status.skipped = true;
          status.message =
            'Die Komponentendefinition ist bereits in der aktuellen Ansicht enthalten.';
        } else {
          seen[seenKey] = true;
          var importedResources =
            (importedDoc && importedDoc['back-matter'] && importedDoc['back-matter'].resources) ||
            [];
          for (var ir = 0; ir < importedResources.length; ir++) {
            if (importedResources[ir] && importedResources[ir].uuid) {
              setResourceBaseUrl(importedResources[ir], match.source.baseUrl || '');
              componentStore.componentState.resourceByUuid.set(
                importedResources[ir].uuid,
                importedResources[ir],
              );
              componentStore.componentState.resourceByUuid.set(
                String(importedResources[ir].uuid).toLowerCase(),
                importedResources[ir],
              );
            }
          }
          var counts = appendComponentDefinitionOwners(importedDoc, {
            imported: true,
            documentUuid: documentUuid,
            documentTitle: status.title || status.sourceLabel || documentUuid,
            sourceLabel: status.sourceLabel,
          });
          status.components = counts.components;
          status.capabilities = counts.capabilities;
          componentStore.componentState.importedDocumentUuids[documentUuid] = true;
        }
      } else {
        status.message =
          'Die importierte Komponentendefinition kann nicht angezeigt werden, da sie zur Zeit im Viewer nicht hochgeladen ist.';
      }
    }
    statuses.push(status);
  }
  componentStore.componentState.importStatuses = statuses;
}

export function getCatalogParamMapForControl(controlRef) {
  var control = getCatalogControlByRef(controlRef);
  return control && control.paramMap ? control.paramMap : {};
}

export function syncComponentParamMaps() {
  var owners = componentStore.componentState.capabilities.concat(
    componentStore.componentState.components,
  );
  for (var o = 0; o < owners.length; o++) {
    var owner = owners[o];
    owner.paramMap = {};
    var impls = owner.controlImplementations || [];
    for (var i = 0; i < impls.length; i++) {
      var impl = impls[i];
      impl.paramMap = mergeParamMaps({}, impl.localParamMap);
      owner.paramMap = mergeParamMaps(owner.paramMap, impl.paramMap);
      var reqs = impl.requirements || [];
      for (var r = 0; r < reqs.length; r++) {
        var req = reqs[r];
        req.paramMap = mergeParamMaps(getCatalogParamMapForControl(req.controlId), impl.paramMap);
        req.paramMap = mergeParamMaps(req.paramMap, req.localParamMap);
        owner.paramMap = mergeParamMaps(owner.paramMap, req.paramMap);
        var stmts = req.statements || [];
        for (var s = 0; s < stmts.length; s++) {
          stmts[s].paramMap = req.paramMap;
        }
      }
    }
    owner.searchText = buildComponentSearchText(owner);
  }
}

export function processComponentDefinition(root) {
  var baseUrl = componentStore.componentState.baseUrl;
  componentStore.componentState = createComponentState();
  componentStore.componentState.baseUrl = baseUrl;

  var doc = getComponentDefinitionDocument(root);
  if (
    !doc ||
    (!doc.metadata && !Array.isArray(doc.components) && !Array.isArray(doc.capabilities))
  ) {
    throw new Error('Ungültige JSON-Struktur: Erwartet ein "component-definition" Objekt.');
  }
  componentStore.componentState.documentUuid = doc.uuid || '';
  componentStore.componentState.metadata = doc.metadata || null;
  componentStore.componentState.backMatter = doc['back-matter'] || null;
  componentStore.componentState.imports = doc['import-component-definitions'] || [];

  var resources =
    (componentStore.componentState.backMatter &&
      componentStore.componentState.backMatter.resources) ||
    [];
  for (var ri = 0; ri < resources.length; ri++) {
    if (resources[ri] && resources[ri].uuid) {
      setResourceBaseUrl(resources[ri], componentStore.componentState.baseUrl || '');
      componentStore.componentState.resourceByUuid.set(resources[ri].uuid, resources[ri]);
      componentStore.componentState.resourceByUuid.set(
        String(resources[ri].uuid).toLowerCase(),
        resources[ri],
      );
    }
  }

  appendComponentDefinitionOwners(doc, {
    imported: false,
    documentUuid: componentStore.componentState.documentUuid,
    documentTitle:
      (componentStore.componentState.metadata && componentStore.componentState.metadata.title) ||
      '',
    sourceLabel:
      (sourceStore.loadedComponentSources[sourceStore.activeComponentSourceIndex] &&
        sourceStore.loadedComponentSources[sourceStore.activeComponentSourceIndex].label) ||
      '',
  });
  resolveImportedComponentDefinitions(componentStore.componentState.imports);

  for (var cp = 0; cp < componentStore.componentState.capabilities.length; cp++) {
    var capEntry = componentStore.componentState.capabilities[cp];
    var capKey = capEntry.uuid || capEntry.name;
    if (!componentStore.componentState.capabilityComponents[capKey])
      componentStore.componentState.capabilityComponents[capKey] = [];
    var incs = capEntry.incorporatesComponents || [];
    for (var ic = 0; ic < incs.length; ic++) {
      var compUuid = (incs[ic] && incs[ic]['component-uuid']) || '';
      if (!compUuid) continue;
      var linkedComp = componentStore.componentState.componentByUuid.get(compUuid);
      if (linkedComp) {
        componentStore.componentState.capabilityComponents[capKey].push(linkedComp);
        if (!componentStore.componentState.componentCapabilityKeys[compUuid])
          componentStore.componentState.componentCapabilityKeys[compUuid] = [];
        if (
          componentStore.componentState.componentCapabilityKeys[compUuid].indexOf(capKey) === -1
        ) {
          componentStore.componentState.componentCapabilityKeys[compUuid].push(capKey);
        }
      }
      if (!componentStore.componentState.componentToCapabilities[compUuid])
        componentStore.componentState.componentToCapabilities[compUuid] = [];
      if (
        componentStore.componentState.componentToCapabilities[compUuid].indexOf(capEntry.name) ===
        -1
      ) {
        componentStore.componentState.componentToCapabilities[compUuid].push(capEntry.name);
      }
    }
  }

  syncComponentParamMaps();

  uiStore.compEls.countInfo.textContent =
    componentStore.componentState.components.length +
    ' Komponenten / ' +
    componentStore.componentState.capabilities.length +
    ' Capabilities';
  if (
    !componentStore.componentState.components.length &&
    !componentStore.componentState.capabilities.length
  ) {
    showMsg(
      '<strong>Keine Komponenten gefunden.</strong><br/>Erwartet: <code>component-definition.components</code> und/oder <code>component-definition.capabilities</code>.',
      true,
    );
  }
}
