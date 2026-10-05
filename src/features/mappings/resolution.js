/** features/mappings/resolution: see docs/architecture.md for responsibilities. */
import { sourceStore } from '../../app/store.js';
import {
  getCatalogSourceControlByRef,
  getCatalogStatementProse,
} from '../../app/catalog-lookup.js';
import { uniqueList } from '../../shared/collections.js';

export function normalizeMappingResourceName(value) {
  var text = String(value || '').trim();
  try {
    text = decodeURIComponent(text);
  } catch (_e) {}
  text = text.split(/[?#]/)[0].replace(/\\/g, '/');
  text = text.slice(text.lastIndexOf('/') + 1).replace(/\.json$/i, '');
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function mappingCatalogMatchScore(source, resource, catalogLabel) {
  var wanted = normalizeMappingResourceName((resource && resource.href) || catalogLabel);
  if (!wanted) return 0;
  var values = [
    source && source.label,
    source && source.originalLabel,
    source && source.baseUrl,
    source && source.catalogTitle,
  ];
  var best = 0;
  for (var i = 0; i < values.length; i++) {
    var candidate = normalizeMappingResourceName(values[i]);
    if (!candidate) continue;
    if (candidate === wanted) best = Math.max(best, 100);
    else if (candidate.indexOf(wanted) !== -1 || wanted.indexOf(candidate) !== -1)
      best = Math.max(best, 60);
  }
  return best;
}

export function resolveMappingCatalogSource(resource, catalogLabel, refs) {
  var candidates = [];
  var referenceList = uniqueList(
    (refs || [])
      .map(function (ref) {
        return String(ref || '').trim();
      })
      .filter(Boolean),
  );
  for (var i = 0; i < sourceStore.loadedCatalogSources.length; i++) {
    var source = sourceStore.loadedCatalogSources[i];
    var refMatches = 0;
    for (var r = 0; r < referenceList.length; r++) {
      if (getCatalogSourceControlByRef(source, referenceList[r])) refMatches++;
    }
    candidates.push({
      source: source,
      refMatches: refMatches,
      resourceScore: mappingCatalogMatchScore(source, resource, catalogLabel),
    });
  }
  if (!candidates.length) return null;
  candidates.sort(function (a, b) {
    if (b.refMatches !== a.refMatches) return b.refMatches - a.refMatches;
    return b.resourceScore - a.resourceScore;
  });

  var best = candidates[0];
  var next = candidates[1] || null;
  if (best.refMatches > 0) {
    if (!next || best.refMatches > next.refMatches || best.resourceScore > next.resourceScore)
      return best.source;
    return null;
  }
  if (best.resourceScore > 0 && (!next || best.resourceScore > next.resourceScore))
    return best.source;
  return null;
}

export function resolveMappingControl(ref, resource, catalogLabel) {
  var candidates = [];
  for (var i = 0; i < sourceStore.loadedCatalogSources.length; i++) {
    var source = sourceStore.loadedCatalogSources[i];
    var control = getCatalogSourceControlByRef(source, ref);
    if (control) {
      candidates.push({
        source: source,
        control: control,
        score: mappingCatalogMatchScore(source, resource, catalogLabel),
      });
    }
  }
  if (!candidates.length) return null;
  candidates.sort(function (a, b) {
    return b.score - a.score;
  });
  if (candidates[0].score > 0 || candidates.length === 1) return candidates[0];
  return null;
}

export function mappingControlDetails(ref, resource, catalogLabel, preferredSource) {
  var preferredControl = preferredSource
    ? getCatalogSourceControlByRef(preferredSource, ref)
    : null;
  var resolved = preferredControl
    ? { source: preferredSource, control: preferredControl }
    : resolveMappingControl(ref, resource, catalogLabel);
  if (!resolved) {
    return { id: ref, title: '', prose: '', loaded: false, source: null, control: null };
  }
  var control = resolved.control;
  return {
    id: ref,
    title: String((control.raw && control.raw.title) || control.title || ''),
    prose: String(getCatalogStatementProse(control) || ''),
    loaded: true,
    source: resolved.source,
    control: control,
  };
}

export function getMappingCatalogDisplayTitle(resource, catalogLabel, refs) {
  var source = resolveMappingCatalogSource(resource, catalogLabel, refs);
  if (source) return source.catalogTitle || source.label || 'Katalogtitel nicht verfügbar';
  return 'Kein passender Katalog in Katalogansicht geladen';
}

export function collectMappingHeaderTitles(entries, side) {
  var seen = {};
  var titles = [];
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var title =
      side === 'source'
        ? getMappingCatalogDisplayTitle(
            entry.sourceResource,
            entry.sourceCatalog,
            entry.sourceCatalogRefs || entry.sourceRefs,
          )
        : getMappingCatalogDisplayTitle(
            entry.targetResource,
            entry.targetCatalog,
            entry.targetCatalogRefs || entry.targetRefs,
          );
    if (title && !seen[title]) {
      seen[title] = true;
      titles.push(title);
    }
  }
  return titles.length ? titles.join(' · ') : 'Kein passender Katalog in Katalogansicht geladen';
}
