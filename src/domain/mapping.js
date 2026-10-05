/** domain/mapping: see docs/architecture.md for responsibilities. */
import { createMappingState } from './state.js';
import { uniqueList } from '../shared/collections.js';

export function mappingArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

export function mappingRefId(item) {
  return String((item && (item['id-ref'] || item.id || item.uuid)) || '').trim();
}

export function mappingResourceLabel(resource) {
  if (!resource) return 'Unbekannte Ressource';
  return String(
    resource.href || resource.title || resource.uuid || resource.type || 'Unbekannte Ressource',
  );
}

export function mappingPracticeFromRef(ref) {
  var id = String(ref || '').trim();
  if (!id) return '';
  var first = id.split('.')[0];
  return first || id;
}

export function parseMappingCollection(root, baseUrl = '') {
  const state = createMappingState();
  state.baseUrl = baseUrl;
  var doc = root && root['mapping-collection'];
  if (!doc) throw new Error('Kein OSCAL mapping-collection Root gefunden.');
  state.documentUuid = doc.uuid || '';
  state.metadata = doc.metadata || null;
  state.provenance = doc.provenance || null;
  state.backMatter = doc['back-matter'] || null;

  var provenance = doc.provenance || {};
  var mappings = mappingArray(doc.mappings || doc.mapping);
  for (var mi = 0; mi < mappings.length; mi++) {
    var group = mappings[mi] || {};
    var sourceResource = group['source-resource'] || {};
    var targetResource = group['target-resource'] || {};
    var sourceCatalog = mappingResourceLabel(sourceResource);
    var targetCatalog = mappingResourceLabel(targetResource);
    var maps = mappingArray(group.maps || group.map);
    var groupSourceRefs = [];
    var groupTargetRefs = [];
    for (var gri = 0; gri < maps.length; gri++) {
      var groupMap = maps[gri] || {};
      groupSourceRefs = groupSourceRefs.concat(
        mappingArray(groupMap.sources || groupMap.source)
          .map(mappingRefId)
          .filter(Boolean),
      );
      groupTargetRefs = groupTargetRefs.concat(
        mappingArray(groupMap.targets || groupMap.target)
          .map(mappingRefId)
          .filter(Boolean),
      );
    }
    groupSourceRefs = uniqueList(groupSourceRefs);
    groupTargetRefs = uniqueList(groupTargetRefs);
    for (var ri = 0; ri < maps.length; ri++) {
      var rawMap = maps[ri] || {};
      var sources = mappingArray(rawMap.sources || rawMap.source);
      var targets = mappingArray(rawMap.targets || rawMap.target);
      var sourceRefs = sources.map(mappingRefId).filter(Boolean);
      var targetRefs = targets.map(mappingRefId).filter(Boolean);
      var rationale =
        rawMap['matching-rationale'] ||
        rawMap['method-rationale'] ||
        group['matching-rationale'] ||
        group['method-rationale'] ||
        provenance['matching-rationale'] ||
        '';
      var method = rawMap.method || group.method || provenance.method || '';
      var status = rawMap.status || group.status || provenance.status || '';
      var relationship = String(rawMap.relationship || 'unspecified').trim();
      var practices = uniqueList(targetRefs.map(mappingPracticeFromRef).filter(Boolean));
      var searchText = [
        sourceCatalog,
        targetCatalog,
        relationship,
        rationale,
        method,
        status,
        sourceRefs.join(' '),
        targetRefs.join(' '),
        practices.join(' '),
        rawMap.remarks || '',
        group.remarks || '',
      ]
        .join(' ')
        .toLowerCase();
      state.entries.push({
        uuid: rawMap.uuid || '',
        relationship: relationship,
        sources: sources,
        targets: targets,
        sourceRefs: sourceRefs,
        targetRefs: targetRefs,
        sourceCatalogRefs: groupSourceRefs,
        targetCatalogRefs: groupTargetRefs,
        sourceResource: sourceResource,
        targetResource: targetResource,
        sourceCatalog: sourceCatalog,
        targetCatalog: targetCatalog,
        practices: practices,
        rationale: String(rationale || ''),
        method: String(method || ''),
        status: String(status || ''),
        confidence:
          rawMap['confidence-score'] ||
          group['confidence-score'] ||
          provenance['confidence-score'] ||
          '',
        searchText: searchText,
        raw: rawMap,
      });
    }
  }
  readMappingNotesAndGaps(doc, state);
  return state;
}

export function mappingNotes(raw) {
  var notes = [];
  if (raw.remarks) notes.push({ text: String(raw.remarks) });
  mappingArray(raw.qualifiers).forEach(function (q) {
    if (!q) return;
    var label =
      'Einschränkung (' + [q.subject, q.predicate, q.category].filter(Boolean).join(' · ') + ')';
    if (q.description) notes.push({ label: label, text: String(q.description) });
    if (q.remarks && q.remarks !== q.description) notes.push({ text: String(q.remarks) });
  });
  return notes;
}

export function readMappingNotesAndGaps(doc, state) {
  state.entries.forEach(function (entry) {
    entry.notes = mappingNotes(entry.raw || {});
    entry.searchText +=
      ' ' +
      entry.notes
        .map(function (n) {
          return (n.label || '') + ' ' + n.text;
        })
        .join(' ')
        .toLowerCase();
  });
  state.gapGroups = [];
  state.gapWarnings = [];
  mappingArray(doc.mappings || doc.mapping).forEach(function (group, index) {
    ['source', 'target'].forEach(function (side) {
      var summary = group[side + '-gap-summary'];
      if (!summary) return;
      var resource = group[side + '-resource'] || {};
      var label =
        'Mapping ' +
        (index + 1) +
        ' · ' +
        (side === 'source' ? 'Quelle: ' : 'Ziel: ') +
        mappingResourceLabel(resource);
      var ids = [],
        seen = Object.create(null);
      mappingArray(summary['unmapped-controls']).forEach(function (selector) {
        mappingArray(selector['with-ids']).forEach(function (id) {
          if (typeof id === 'string' && id && !seen[id]) {
            seen[id] = true;
            ids.push(id);
          }
        });
        if (mappingArray(selector.matching).length || selector['with-child-controls'] === 'yes') {
          state.gapWarnings.push({ label: label, selector: selector });
        }
      });
      if (ids.length) state.gapGroups.push({ label: label, ids: ids });
    });
  });
}

export function mappingRelationshipSymbol(relationship) {
  var symbols = {
    'equivalent-to': '↔',
    'equal-to': '=',
    'subset-of': '⊂',
    'superset-of': '⊃',
    'intersects-with': '∩',
    'no-relationship': '∅',
  };
  return symbols[relationship] || '→';
}
