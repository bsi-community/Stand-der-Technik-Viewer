/** features/catalog/selectors: see docs/architecture.md for responsibilities. */
import { catalogStore } from '../../app/store.js';
import { matchesSearchText } from '../../shared/search.js';
import { getEffortDisplayValue } from '../../shared/ui/effort-tooltip.js';

export function baseMatches(c) {
  return matches(c);
}

export function isFilterActive() {
  if (catalogStore.state.searchQuery.groups.length) return true;
  if (
    catalogStore.allGroups.length &&
    catalogStore.state.groups.length !== catalogStore.allGroups.length
  )
    return true;
  if (
    catalogStore.allSubgroups.length &&
    catalogStore.state.subgroups.length !== catalogStore.allSubgroups.length
  )
    return true;
  if (
    catalogStore.allClasses.length &&
    catalogStore.state.classes.length !== catalogStore.allClasses.length
  )
    return true;
  if (catalogStore.allSecs.length && catalogStore.state.secs.length !== catalogStore.allSecs.length)
    return true;
  var baseTargetsLen = catalogStore.allTargets.length + 1; // + '__none__'
  if (catalogStore.allTargets.length && catalogStore.state.targets.length !== baseTargetsLen)
    return true;
  var baseTagsLen = catalogStore.allTags.length + 1; // + '__notags__'
  if (catalogStore.allTags.length && catalogStore.state.tags.length !== baseTagsLen) return true;
  if (
    catalogStore.allEfforts.length &&
    catalogStore.state.efforts.length !== catalogStore.allEfforts.length
  )
    return true;
  if (
    catalogStore.allModalverbs.length &&
    catalogStore.state.modalverbs.length !== catalogStore.allModalverbs.length
  )
    return true;
  if (
    catalogStore.allDocumentations.length &&
    catalogStore.state.documentations.length !== catalogStore.allDocumentations.length
  )
    return true;
  if (
    catalogStore.allActionwords.length &&
    catalogStore.state.actionwords.length !== catalogStore.allActionwords.length
  )
    return true;
  if (
    catalogStore.allSecurityTargets.length &&
    catalogStore.state.securityTargets.length !== catalogStore.allSecurityTargets.length
  )
    return true;
  return false;
}

export function matches(c) {
  // read current selections (already set by RefreshViews)
  if (catalogStore.allGroups.length && catalogStore.state.groups.length === 0) return false;
  if (catalogStore.allSubgroups.length && catalogStore.state.subgroups.length === 0) return false;
  if (catalogStore.allClasses.length && catalogStore.state.classes.length === 0) return false;
  if (catalogStore.allSecs.length && catalogStore.state.secs.length === 0) return false;
  if (catalogStore.allTargets.length && catalogStore.state.targets.length === 0) return false;
  if (catalogStore.allTags.length && catalogStore.state.tags.length === 0) return false;
  if (catalogStore.allEfforts.length && catalogStore.state.efforts.length === 0) return false;
  if (catalogStore.allModalverbs.length && catalogStore.state.modalverbs.length === 0) return false;
  if (catalogStore.allDocumentations.length && catalogStore.state.documentations.length === 0)
    return false;
  if (catalogStore.allSecurityTargets.length && catalogStore.state.securityTargets.length === 0)
    return false;

  // Erste OSCAL-Gruppenebene: je nach erkanntem Katalog entweder Praktiken oder allgemeine Gruppen/Themen.
  if (
    catalogStore.allGroups.length &&
    catalogStore.state.groups.length !== catalogStore.allGroups.length
  ) {
    var g = (c.groupPath && c.groupPath[0]) || '';
    if (catalogStore.state.groups.indexOf(g) === -1) return false;
  }

  // Zweite OSCAL-Gruppenebene; tiefere Verschachtelungen erzeugen bewusst keine weiteren Filterfelder.
  if (
    catalogStore.allSubgroups.length &&
    catalogStore.state.subgroups.length !== catalogStore.allSubgroups.length
  ) {
    var subgroup = (c.groupPath && c.groupPath[1]) || '';
    if (catalogStore.state.subgroups.indexOf(subgroup) === -1) return false;
  }

  // Quellkatalog / Herkunft
  if (
    catalogStore.allClasses.length &&
    catalogStore.state.classes.length !== catalogStore.allClasses.length
  ) {
    if (catalogStore.state.classes.indexOf(c.cls || '') === -1) return false;
  }

  // Sicherheitsniveau
  if (
    catalogStore.allSecs.length &&
    catalogStore.state.secs.length !== catalogStore.allSecs.length
  ) {
    if (catalogStore.state.secs.indexOf(c.sec || '') === -1) return false;
  }

  // Zielobjektkategorien (mindestens eins passt); automatisch ergänzte Eltern bleiben normal abwählbar.
  var baseTargetsLen = catalogStore.allTargets.length + 1; // + '__none__'
  if (catalogStore.allTargets.length && catalogStore.state.targets.length !== baseTargetsLen) {
    var okT = false;
    var ta = c.targetsArr || [];
    for (var i = 0; i < catalogStore.state.targets.length; i++) {
      var v = catalogStore.state.targets[i];
      if (v === '__none__') {
        if (!ta || ta.length === 0) {
          okT = true;
          break;
        }
      } else {
        if (ta.indexOf(v) !== -1) {
          okT = true;
          break;
        }
      }
    }
    if (!okT) return false;
  }

  // Tags (Inklusion mit 'Ohne Tags')
  if (catalogStore.allTags.length) {
    var baseTagsLen = catalogStore.allTags.length + 1; // + '__notags__' (Ohne Tags)
    if (catalogStore.state.tags.length !== baseTagsLen) {
      var selHasNoTags = catalogStore.state.tags.indexOf('__notags__') !== -1;
      var ct = c.tagsArr || [];

      if (!ct || ct.length === 0) {
        if (!selHasNoTags) return false; // ohne Tags nur wenn 'Ohne Tags' gewählt
      } else {
        var okTag = false;
        for (var ti = 0; ti < catalogStore.state.tags.length; ti++) {
          var tagv = catalogStore.state.tags[ti];
          if (tagv === '__notags__') continue;
          if (ct.indexOf(tagv) !== -1) {
            okTag = true;
            break;
          }
        }
        if (!okTag) return false;
      }
    }
  }

  // Aufwaende (effort_level wurde bei der Extraktion bereits zu n/a normalisiert)
  if (
    catalogStore.allEfforts.length &&
    catalogStore.state.efforts.length !== catalogStore.allEfforts.length
  ) {
    var effortDisplay = getEffortDisplayValue(c.effort || '');
    if (catalogStore.state.efforts.indexOf(effortDisplay) === -1) return false;
  }

  // Modalverb
  if (
    catalogStore.allModalverbs.length &&
    catalogStore.state.modalverbs.length !== catalogStore.allModalverbs.length
  ) {
    var mvArr = c.modalverbsArr || [];
    var okMv = false;
    for (var mvi = 0; mvi < catalogStore.state.modalverbs.length; mvi++) {
      if (mvArr.indexOf(catalogStore.state.modalverbs[mvi]) !== -1) {
        okMv = true;
        break;
      }
    }
    if (!okMv) return false;
  }

  // Dokumentationsempfehlungen
  if (
    catalogStore.allDocumentations.length &&
    catalogStore.state.documentations.length !== catalogStore.allDocumentations.length
  ) {
    var docArr = c.documentationArr || [];
    var okDoc = false;
    for (var dci = 0; dci < catalogStore.state.documentations.length; dci++) {
      if (docArr.indexOf(catalogStore.state.documentations[dci]) !== -1) {
        okDoc = true;
        break;
      }
    }
    if (!okDoc) return false;
  }

  // Handlungswörter
  if (
    catalogStore.allActionwords.length &&
    catalogStore.state.actionwords.length !== catalogStore.allActionwords.length
  ) {
    var awArr = c.actionwordsArr || [];
    if (catalogStore.state.actionwords.length === 0) {
      if (awArr.length !== 0) return false;
    } else {
      var okAw = false;
      for (var awi = 0; awi < catalogStore.state.actionwords.length; awi++) {
        if (awArr.indexOf(catalogStore.state.actionwords[awi]) !== -1) {
          okAw = true;
          break;
        }
      }
      if (!okAw) return false;
    }
  }

  // Schutzziele: mindestens eines der ausgewaehlten Ziele muss mit einem Wert groesser 0 zugeordnet sein.
  if (
    catalogStore.allSecurityTargets.length &&
    catalogStore.state.securityTargets.length !== catalogStore.allSecurityTargets.length
  ) {
    var controlSecurityTargets = c.assignedSecurityTargets || [];
    var matchesSecurityTarget = false;
    for (var sti = 0; sti < catalogStore.state.securityTargets.length; sti++) {
      if (controlSecurityTargets.indexOf(catalogStore.state.securityTargets[sti]) !== -1) {
        matchesSecurityTarget = true;
        break;
      }
    }
    if (!matchesSecurityTarget) return false;
  }

  // Freitextsuche
  if (!matchesSearchText(c.searchText, catalogStore.state.searchQuery)) return false;
  return true;
}
