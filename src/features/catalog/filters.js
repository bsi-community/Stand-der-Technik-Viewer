/** features/catalog/filters: see docs/architecture.md for responsibilities. */
import { bindExportButton } from '../../app/print.js';
import { bindResetButton } from '../../app/reset.js';
import { catalogStore, uiStore } from '../../app/store.js';
import { SECURITY_TARGET_DEFINITIONS } from '../../config.js';
import {
  catalogHierarchyOptionLabel,
  catalogPrimaryGroupAllLabel,
  catalogSecondaryGroupAllLabel,
  syncCatalogHierarchyFilterVisibility,
} from './hierarchy-filters.js';
import { splitMulti, uniqueList } from '../../shared/collections.js';
import { msSetItems } from '../../shared/ui/multiselect.js';

export function renderFilters() {
  var groupsRaw = [],
    subgroupsRaw = [];
  for (var i = 0; i < catalogStore.state.controls.length; i++) {
    var hierarchy = catalogStore.state.controls[i].groupPath || [];
    if (hierarchy[0]) groupsRaw.push(hierarchy[0]);
    if (hierarchy[1]) subgroupsRaw.push(hierarchy[1]);
  }
  catalogStore.allGroups = uniqueList(groupsRaw).sort(function (a, b) {
    return a.localeCompare(b, 'de', { numeric: true });
  });
  catalogStore.allSubgroups = uniqueList(subgroupsRaw).sort(function (a, b) {
    return a.localeCompare(b, 'de', { numeric: true });
  });
  var primaryOptions = catalogStore.allGroups.map(function (value) {
    return { value: value, label: catalogHierarchyOptionLabel(0, value) };
  });
  var secondaryOptions = catalogStore.allSubgroups.map(function (value) {
    return { value: value, label: catalogHierarchyOptionLabel(1, value) };
  });
  msSetItems(
    uiStore.els.group,
    uiStore.els.groupMenu,
    catalogPrimaryGroupAllLabel(),
    primaryOptions,
  );
  msSetItems(
    uiStore.els.subgroup,
    uiStore.els.subgroupMenu,
    catalogSecondaryGroupAllLabel(),
    secondaryOptions,
  );
  syncCatalogHierarchyFilterVisibility();
  var classesRaw = [];
  for (var j = 0; j < catalogStore.state.controls.length; j++) {
    var c = catalogStore.state.controls[j].class || '';
    if (c) classesRaw.push(c);
  }
  catalogStore.allClasses = uniqueList(classesRaw).sort();
  msSetItems(uiStore.els.cls, uiStore.els.clsMenu, 'Alle Quellkataloge', catalogStore.allClasses);
  var secRaw = [];
  for (let s = 0; s < catalogStore.state.controls.length; s++) {
    var v = catalogStore.state.controls[s].sec_level || '';
    if (v) {
      var parts2 = splitMulti(v);
      if (!parts2.length && v) {
        parts2 = [String(v)];
      }
      for (var p2 = 0; p2 < parts2.length; p2++) {
        var t2 = String(parts2[p2]).trim();
        if (t2) secRaw.push(t2);
      }
    }
  }
  catalogStore.allSecs = uniqueList(secRaw).sort();
  msSetItems(uiStore.els.sec, uiStore.els.secMenu, 'Alle Sicherheitsniveaus', catalogStore.allSecs);
  var targetsRaw = [];
  for (let k = 0; k < catalogStore.state.controls.length; k++) {
    var controlTargets = catalogStore.state.controls[k].targetsArr || [];
    for (var p = 0; p < controlTargets.length; p++) {
      var targetValue = String(controlTargets[p] || '').trim();
      if (targetValue) targetsRaw.push(targetValue);
    }
  }
  catalogStore.allTargets = uniqueList(targetsRaw).sort(function (a, b) {
    return a.localeCompare(b, 'de', { numeric: true });
  });
  msSetItems(
    uiStore.els.target,
    uiStore.els.targetMenu,
    'Alle Zielobjektkategorien',
    catalogStore.allTargets,
  );

  // Tags (each control may have multiple)
  var tagsRaw = [];
  for (var ci = 0; ci < catalogStore.state.controls.length; ci++) {
    var ta = catalogStore.state.controls[ci].tagsArr || [];
    for (let k = 0; k < ta.length; k++) {
      var s = String(ta[k]).trim();
      if (s) tagsRaw.push(s);
    }
  }
  catalogStore.allTags = uniqueList(tagsRaw).sort();
  msSetItems(uiStore.els.tag, uiStore.els.tagMenu, 'Alle Tags', catalogStore.allTags);

  // Aufwaende (effort_level wird unabhaengig vom Quellwert als n/a angezeigt)
  var effortOrder = ['n/a', '1', '2', '3', '4', '5'];
  catalogStore.allEfforts = effortOrder.slice();
  msSetItems(uiStore.els.effort, uiStore.els.effortMenu, 'Alle Aufwände', catalogStore.allEfforts);

  // Modalverben
  var mvRaw = [];
  for (var mi = 0; mi < catalogStore.state.controls.length; mi++) {
    var mva = catalogStore.state.controls[mi].modalverbsArr || [];
    for (var mj = 0; mj < mva.length; mj++) {
      var mv = String(mva[mj] || '')
        .trim()
        .toUpperCase();
      if (mv) mvRaw.push(mv);
    }
  }
  var preferredMv = ['MUSS', 'SOLLTE', 'KANN'];
  var mvAll = uniqueList(mvRaw);
  var mvOrdered = [];
  for (var mp = 0; mp < preferredMv.length; mp++) {
    if (mvAll.indexOf(preferredMv[mp]) !== -1) mvOrdered.push(preferredMv[mp]);
  }
  for (var mx = 0; mx < mvAll.length; mx++) {
    if (mvOrdered.indexOf(mvAll[mx]) === -1) mvOrdered.push(mvAll[mx]);
  }
  catalogStore.allModalverbs = mvOrdered;
  msSetItems(
    uiStore.els.modalverb,
    uiStore.els.modalverbMenu,
    'Alle Modalverben',
    catalogStore.allModalverbs,
  );

  // Dokumentationsempfehlungen
  var docsRaw = [];
  for (var di = 0; di < catalogStore.state.controls.length; di++) {
    var da = catalogStore.state.controls[di].documentationArr || [];
    for (var dj = 0; dj < da.length; dj++) {
      var dv = String(da[dj] || '').trim();
      if (dv) docsRaw.push(dv);
    }
  }
  catalogStore.allDocumentations = uniqueList(docsRaw).sort();
  msSetItems(
    uiStore.els.documentation,
    uiStore.els.documentationMenu,
    'Alle Dokumentationsempfehlungen',
    catalogStore.allDocumentations,
  );

  // Handlungswörter
  var awRaw = [];
  for (var ai = 0; ai < catalogStore.state.controls.length; ai++) {
    var aa = catalogStore.state.controls[ai].actionwordsArr || [];
    for (var aj = 0; aj < aa.length; aj++) {
      var av = String(aa[aj] || '').trim();
      if (av) awRaw.push(av);
    }
  }
  catalogStore.allActionwords = uniqueList(awRaw).sort();
  msSetItems(
    uiStore.els.actionword,
    uiStore.els.actionwordMenu,
    'Alle Handlungswörter',
    catalogStore.allActionwords,
  );

  // Schutzziele werden angeboten, sobald mindestens eine Control mit einem Wert groesser 0 zugeordnet ist.
  var representedSecurityTargets = {};
  for (var si = 0; si < catalogStore.state.controls.length; si++) {
    var assignedTargets = catalogStore.state.controls[si].assignedSecurityTargets || [];
    for (var sj = 0; sj < assignedTargets.length; sj++)
      representedSecurityTargets[assignedTargets[sj]] = true;
  }
  var securityTargetOptions = [];
  catalogStore.allSecurityTargets = [];
  for (var sd = 0; sd < SECURITY_TARGET_DEFINITIONS.length; sd++) {
    var securityDefinition = SECURITY_TARGET_DEFINITIONS[sd];
    if (!representedSecurityTargets[securityDefinition.key]) continue;
    catalogStore.allSecurityTargets.push(securityDefinition.key);
    securityTargetOptions.push({ value: securityDefinition.key, label: securityDefinition.label });
  }
  msSetItems(
    uiStore.els.securityTarget,
    uiStore.els.securityTargetMenu,
    'Alle Schutzziele',
    securityTargetOptions,
  );
  bindResetButton();
  bindExportButton();
}
