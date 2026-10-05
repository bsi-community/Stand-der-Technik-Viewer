/** domain/catalog: see docs/architecture.md for responsibilities. */
import { createCatalogState } from './state.js';
import { SECURITY_TARGET_DEFINITIONS } from '../config.js';
import {
  detectCatalogGroupMode,
  formatCatalogGroupOptionLabel,
  isKnownPracticeGroup,
} from './catalog-groups.js';
import { buildParamMap, partText } from './parameters.js';
import {
  controlDeclaresTargetObjectCategories,
  extractActionWords,
  extractControlSecurityMetadata,
  extractDocumentation,
  extractEffortInfo,
  extractModalverbs,
  extractSecLevels,
  extractTags,
  extractTargets,
  valueOfProp,
} from './properties.js';
import { ObjMap } from '../shared/collections.js';

export function parseCatalog(root, previous = createCatalogState()) {
  const state = { ...previous };
  state.controls = [];
  state.idMap = new ObjMap();
  state.uuidMap = new ObjMap();
  state.edgesBase = [];
  state.groups = [];
  state.subgroups = [];
  state.targets = [];
  state.autoSelectedTargets = [];
  state.hasTargetObjectCategories = false;
  state.topics = [];
  state.topicById = new ObjMap();
  state.childrenByTopic = {};
  state.childrenByPractice = {};
  state.groupRoots = [];
  state.groupByKey = new ObjMap();
  state.groupLabelsByLevel = [{}, {}];
  state.controlsByGroup = {};
  state.ungroupedControls = [];
  state.openTopics = {};
  state.openControls = {};
  state.practices = [];
  state.practiceById = new ObjMap();
  state.topicsByPractice = {};
  state.openPractices = {};
  state.openGroups = {};
  state.catalogGroupMode = 'none';
  state.catalogUuid = '';
  state.catalogMetadata = null;
  state.catalogBackMatter = null;
  state.catalogResourcesByUuid = new ObjMap();

  var catCandidate = root && (root.catalog || root.profile || root.component || root);
  if (!catCandidate) {
    throw new Error(
      'Ungültige JSON-Struktur: Erwartet ein "catalog" / "profile" / "component" Objekt.',
    );
  }
  var cat = catCandidate;
  state.catalogGroupMode = detectCatalogGroupMode(cat.groups);
  var fallbackGroupName =
    (cat.metadata && (cat.metadata.title || cat.title)) || cat.title || 'Katalog';
  state.catalogUuid = cat.uuid || '';
  state.catalogMetadata = cat.metadata || null;
  state.catalogBackMatter = cat['back-matter'] || null;
  var resources = (state.catalogBackMatter && state.catalogBackMatter.resources) || [];
  for (var ri = 0; ri < resources.length; ri++) {
    if (resources[ri] && resources[ri].uuid) {
      state.catalogResourcesByUuid.set(resources[ri].uuid, resources[ri]);
    }
  }

  // Control sammeln und in Anzeige-Objekt transformieren
  function collectControl(c, path, topicId, practiceId, groupKey, parentId, enhDepth) {
    var labelId = valueOfProp(c.props, 'label') || '';
    var rawId = c.id || '';
    var id =
      labelId || rawId || c.title || (c.uuid ? 'id-' + String(c.uuid).substring(0, 8) : 'ohne-id');
    // Enhancement controls: remember parent + nesting depth for indented rendering
    var enhParentId = parentId || '';
    var enhDepthVal = enhDepth || 0;
    var uuid = c.uuid || valueOfProp(c.props, 'alt-identifier') || '';
    var cls = c.class || '';
    var secLevelsArr = extractSecLevels(c.props);
    var secLevel = secLevelsArr.join(', ');
    var effortInfo = extractEffortInfo(c.props);
    var effort = effortInfo.value;
    var effortLabel = effortInfo.label;
    var parts = Array.isArray(c.parts)
      ? c.parts.map(function (p) {
          return { id: p.id, name: p.name, prose: p.prose || '', props: p.props || [] };
        })
      : [];
    var targetsArr = extractTargets(c.props, parts);
    if (controlDeclaresTargetObjectCategories(c.props, parts))
      state.hasTargetObjectCategories = true;
    var tagsArr = extractTags(c.props, parts);
    var modalverbsArr = extractModalverbs(c.props, parts);
    var documentationArr = extractDocumentation(c.props, parts);
    var actionWordsArr = extractActionWords(c.props, parts);
    var securityMetadata = extractControlSecurityMetadata(c.props);
    var threatsArr = securityMetadata.threats;
    var securityTargetSearchValues = [];
    for (var sti = 0; sti < SECURITY_TARGET_DEFINITIONS.length; sti++) {
      var securityTargetDefinition = SECURITY_TARGET_DEFINITIONS[sti];
      var securityTargetValues = securityMetadata.targetValues[securityTargetDefinition.key] || [];
      if (securityTargetValues.length) {
        securityTargetSearchValues.push(
          securityTargetDefinition.key,
          securityTargetDefinition.label,
          securityTargetValues.join(', '),
        );
      }
    }
    var taxonomyL1 = valueOfProp(c.props, 'Taxonomy-L1') || '';
    var taxonomyL2 = valueOfProp(c.props, 'Taxonomy-L2') || '';
    var taxonomyL3 = valueOfProp(c.props, 'Taxonomy-L3') || '';
    var taxonomyL4 = valueOfProp(c.props, 'Taxonomy-L4') || '';
    var paramMap = buildParamMap(c.params);
    var remarks = c.remarks || '';

    var topicObj = topicId && state.topicById.has(topicId) ? state.topicById.get(topicId) : null;
    var topicIdVal = topicObj ? topicObj.id : '';
    var topicTitleVal = topicObj ? topicObj.title || '' : '';
    var topicUuidVal = topicObj ? topicObj.uuid || '' : '';

    // build searchable haystack (for Volltextsuche)
    var allProse = '';
    if (parts) {
      for (var pi = 0; pi < parts.length; pi++) {
        if (parts[pi] && parts[pi].prose) allProse += ' ' + parts[pi].prose;
      }
    }
    var hay = [
      id,
      rawId,
      labelId,
      c.title || '',
      uuid,
      cls,
      secLevel,
      effortLabel,
      targetsArr.join(', '),
      tagsArr.join(', '),
      modalverbsArr.join(', '),
      documentationArr.join(', '),
      actionWordsArr.join(', '),
      threatsArr.join(', '),
      securityTargetSearchValues.join(', '),
      taxonomyL1,
      taxonomyL2,
      taxonomyL3,
      taxonomyL4,
      remarks,
      allProse,
      topicIdVal,
      topicTitleVal,
    ]
      .join(' \n ')
      .toLowerCase();

    var entry = {
      id: id,
      rawId: rawId,
      labelId: labelId,
      uuid: uuid,
      title: c.title || '',
      class: cls,
      cls: cls,
      sec_level: secLevel,
      sec: secLevel,
      effort: effort,
      effortLabel: effortLabel,
      target: targetsArr.join(', '),
      targetsArr: targetsArr,
      tags: tagsArr.join(', '),
      tagsArr: tagsArr,
      modalverbs: modalverbsArr.join(', '),
      modalverbsArr: modalverbsArr,
      documentation: documentationArr.join(', '),
      documentationArr: documentationArr,
      actionwords: actionWordsArr.join(', '),
      actionwordsArr: actionWordsArr,
      threats: threatsArr.join(', '),
      threatsArr: threatsArr,
      securityTargetValues: securityMetadata.targetValues,
      assignedSecurityTargets: securityMetadata.assignedTargets,
      taxonomyL1: taxonomyL1,
      taxonomyL2: taxonomyL2,
      taxonomyL3: taxonomyL3,
      taxonomyL4: taxonomyL4,
      practiceId: practiceId || '',
      groupKey: groupKey || '',
      topicId: topicIdVal,
      topicTitle: topicTitleVal,
      topicUuid: topicUuidVal,
      parentId: enhParentId,
      enhDepth: enhDepthVal,
      parts: parts,
      raw: c,
      remarks: remarks,
      searchText: hay,
      statement: partText(parts, 'statement'),
      guidance: partText(parts, 'guidance'),
      links: c.links || [],
      path: [].concat(path),
      groupPath: groupKey ? [].concat(path) : [],
      paramMap: paramMap,
    };
    state.controls.push(entry);
    state.idMap.set(id, entry);
    if (rawId && rawId !== id) {
      state.idMap.set(rawId, entry);
    }
    if (uuid) {
      state.uuidMap.set(uuid, entry);
      state.uuidMap.set(String(uuid).toLowerCase(), entry);
    }
    if (groupKey) {
      if (!state.controlsByGroup[groupKey]) state.controlsByGroup[groupKey] = [];
      state.controlsByGroup[groupKey].push(entry);
    }
    if (topicIdVal) {
      if (!state.childrenByTopic[topicIdVal]) state.childrenByTopic[topicIdVal] = [];
      state.childrenByTopic[topicIdVal].push(entry);
    } else if (practiceId) {
      if (!state.childrenByPractice[practiceId]) state.childrenByPractice[practiceId] = [];
      state.childrenByPractice[practiceId].push(entry);
    } else if (!groupKey) {
      state.ungroupedControls.push(entry);
    }
    if (Array.isArray(c.controls)) {
      for (var i = 0; i < c.controls.length; i++) {
        collectControl(c.controls[i], path, topicId, practiceId, groupKey, id, enhDepthVal + 1);
      }
    }
  }
  // Walk in the same order as in the JSON: if groups exist, traverse them; otherwise traverse top-level controls.
  // Gruppen rekursiv durchlaufen. Semantisch als Praktik/Thema werden nur Treffer aus practices.csv behandelt.
  function walkGroup(grp, gpath, currentTopicId, currentPracticeId, parentKey, groupKey) {
    var groupTitle = String(grp.title || '').trim();
    var label = grp.id || valueOfProp(grp.props, 'label') || groupTitle || fallbackGroupName;
    var path = (gpath || []).concat([label]);
    var depth = (gpath || []).length;
    if (depth < 2) {
      state.groupLabelsByLevel[depth][label] = formatCatalogGroupOptionLabel(label, groupTitle);
    }
    var topicId = currentTopicId || '';
    var practiceId = currentPracticeId || '';
    var gid = String(grp.id || '');
    var gkey = String(groupKey || '');
    if (gkey) {
      var gEntry = {
        key: gkey,
        id: gid,
        title: grp.title || '',
        uuid: grp.uuid || valueOfProp(grp.props, 'alt-identifier') || '',
        path: [].concat(path),
        parentKey: parentKey || '',
        children: [],
      };
      state.groupByKey.set(gkey, gEntry);
      if (parentKey) {
        var parent = state.groupByKey.get(parentKey);
        if (parent && Array.isArray(parent.children)) parent.children.push(gkey);
      } else {
        state.groupRoots.push(gkey);
      }
    }
    // Eine Praktik ist ausschließlich eine erkannte Gruppe der ersten Ebene.
    if (state.catalogGroupMode === 'practices' && depth === 0 && isKnownPracticeGroup(grp)) {
      practiceId = gid;
      if (practiceId && !state.practiceById.has(practiceId)) {
        var puuid = valueOfProp(grp.props, 'alt-identifier') || '';
        var ptitle = grp.title || grp.id || '';
        var pEntry = {
          id: practiceId,
          title: ptitle,
          uuid: puuid,
          path: [].concat(path),
          searchText: (String(practiceId) + ' ' + String(ptitle)).toLowerCase(),
        };
        state.practices.push(pEntry);
        state.practiceById.set(practiceId, pEntry);
        if (!state.topicsByPractice[practiceId]) state.topicsByPractice[practiceId] = [];
      }
    }
    // In einem Praktiken-Katalog entspricht nur die direkt darunterliegende Gruppenebene den Themen.
    if (state.catalogGroupMode === 'practices' && depth === 1) {
      topicId = String(grp.id || '');
      if (topicId && !state.topicById.has(topicId)) {
        var tuuid = valueOfProp(grp.props, 'alt-identifier') || '';
        var ttitle = grp.title || grp.id || '';
        var topicEntry = {
          id: topicId,
          title: ttitle,
          uuid: tuuid,
          path: [].concat(path),
          searchText: (String(topicId) + ' ' + String(ttitle)).toLowerCase(),
          practiceId: practiceId,
        };
        state.topics.push(topicEntry);
        state.topicById.set(topicId, topicEntry);
        if (!state.childrenByTopic[topicId]) state.childrenByTopic[topicId] = [];
        if (practiceId) {
          if (!state.topicsByPractice[practiceId]) state.topicsByPractice[practiceId] = [];
          state.topicsByPractice[practiceId].push(topicEntry);
        }
      }
    }
    if (Array.isArray(grp.controls)) {
      for (var j = 0; j < grp.controls.length; j++) {
        collectControl(grp.controls[j], path, topicId, practiceId, gkey);
      }
    }
    if (Array.isArray(grp.groups)) {
      for (var k = 0; k < grp.groups.length; k++) {
        walkGroup(grp.groups[k], path, topicId, practiceId, gkey, gkey + '.' + k);
      }
    }
  }
  if (Array.isArray(cat.groups)) {
    for (var g = 0; g < cat.groups.length; g++) {
      walkGroup(cat.groups[g], [], '', '', '', 'g' + g);
    }
  }
  if (Array.isArray(cat.controls)) {
    for (var tc = 0; tc < cat.controls.length; tc++) {
      collectControl(cat.controls[tc], [fallbackGroupName], '', '', '');
    }
  }

  for (var x = 0; x < state.controls.length; x++) {
    var c = state.controls[x];
    if (!Array.isArray(c.links)) continue;
    for (var y = 0; y < c.links.length; y++) {
      var L = c.links[y];
      var rel = (L.rel || '').toLowerCase();
      var ref = String(L.href || '').replace(/^#/, '');
      var tgt = state.idMap.get(ref);
      if (tgt) {
        state.edgesBase.push({ source: c.id, target: tgt.id, rel: rel });
      }
    }
  }
  return state;
}
