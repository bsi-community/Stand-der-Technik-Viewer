/** features/components/graph-data: see docs/architecture.md for responsibilities. */
import { componentStore } from '../../app/store.js';
import { getCatalogControlDisplayId } from '../../app/catalog-lookup.js';
import { componentOwnerName } from '../../app/components.js';
import { matchesComponentOwner } from './selectors.js';
import { StrSet } from '../../shared/collections.js';

export function getMatchedComponentOwners() {
  var matchedCaps = [],
    matchedComps = [];
  for (var i = 0; i < componentStore.componentState.capabilities.length; i++) {
    if (matchesComponentOwner(componentStore.componentState.capabilities[i]))
      matchedCaps.push(componentStore.componentState.capabilities[i]);
  }
  for (var c = 0; c < componentStore.componentState.components.length; c++) {
    if (matchesComponentOwner(componentStore.componentState.components[c]))
      matchedComps.push(componentStore.componentState.components[c]);
  }
  return { capabilities: matchedCaps, components: matchedComps };
}

export function buildComponentGraphData() {
  var matched = getMatchedComponentOwners();
  var nodes = [];
  var links = [];
  var seen = new StrSet();

  function addNode(node) {
    if (!node || !node.id || seen.has(node.id)) return;
    seen.add(node.id);
    nodes.push(node);
  }

  function addOwnerNodes(list) {
    for (var i = 0; i < list.length; i++) {
      var owner = list[i];
      addNode({
        id: (owner.kind === 'capability' ? 'cap:' : 'cmp:') + (owner.uuid || owner.name),
        label: componentOwnerName(owner),
        nodeType: owner.kind,
        owner: owner,
      });
      var impls = owner.controlImplementations || [];
      for (var ii = 0; ii < impls.length; ii++) {
        var reqs = impls[ii].requirements || [];
        for (var r = 0; r < reqs.length; r++) {
          var req = reqs[r];
          var reqNodeId = 'req:' + req.id;
          addNode({
            id: reqNodeId,
            label:
              req.catalogControlId ||
              getCatalogControlDisplayId(req.controlId) ||
              req.controlId ||
              'Requirement',
            nodeType: 'requirement',
            owner: owner,
            requirement: req,
          });
          links.push({
            source: (owner.kind === 'capability' ? 'cap:' : 'cmp:') + (owner.uuid || owner.name),
            target: reqNodeId,
            rel: 'implements',
          });
        }
      }
    }
  }

  addOwnerNodes(matched.capabilities);
  addOwnerNodes(matched.components);

  for (var c = 0; c < matched.capabilities.length; c++) {
    var cap = matched.capabilities[c];
    var incs = cap.incorporatesComponents || [];
    for (var ic = 0; ic < incs.length; ic++) {
      var compUuid = (incs[ic] && incs[ic]['component-uuid']) || '';
      var comp = componentStore.componentState.componentByUuid.get(compUuid);
      if (comp && matchesComponentOwner(comp)) {
        addNode({
          id: 'cmp:' + (comp.uuid || comp.name),
          label: componentOwnerName(comp),
          nodeType: 'component',
          owner: comp,
        });
        links.push({
          source: 'cap:' + (cap.uuid || cap.name),
          target: 'cmp:' + (comp.uuid || comp.name),
          rel: 'incorporates',
        });
      }
    }
  }

  return { nodes: nodes, links: links };
}
