/** Resource hints supplied by a mapping; these do not verify a catalog revision. */
import { mappingArray } from './mapping.js';

const text = (value) => (typeof value === 'string' ? value.trim() : '');

function referenceName(href) {
  if (!href || href.startsWith('#')) return href;
  const path = href.split(/[?#]/)[0].replace(/\\/g, '/');
  const name = path.slice(path.lastIndexOf('/') + 1) || href;
  try {
    return decodeURIComponent(name);
  } catch (_error) {
    return name;
  }
}

/** Local relative references must never resolve against the viewer's own URL. */
export function mappingReferenceUrl(href, baseUrl = '') {
  if (!href || href.startsWith('#')) return '';
  try {
    const url = baseUrl ? new URL(href, baseUrl) : new URL(href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch (_error) {
    return '';
  }
}

export function describeMappingResource(resource = {}, backMatter = null, baseUrl = '') {
  const href = text(resource.href);
  const linked = href.startsWith('#')
    ? mappingArray(backMatter?.resources).find(
        (item) => text(item?.uuid).toLowerCase() === href.slice(1).toLowerCase(),
      )
    : null;
  const references = [...new Set([href, ...mappingArray(linked?.rlinks).map((l) => text(l?.href))])]
    .filter(Boolean)
    .map((value) => ({ value, url: mappingReferenceUrl(value, baseUrl) }));
  // Extensions are publisher-defined hints, not a standard required version field.
  const versions = [];
  for (const [origin, item] of [
    ['Ressourcenreferenz', resource],
    ['Back Matter', linked],
  ]) {
    for (const prop of mappingArray(item?.props)) {
      if (!['version', 'catalog-version', 'document-version'].includes(prop?.name)) continue;
      if (!text(prop.value)) continue;
      versions.push({
        value: text(prop.value),
        origin,
        name: prop.name,
        namespace: text(prop.ns),
      });
    }
  }
  return {
    title:
      text(resource.title) ||
      text(linked?.title) ||
      referenceName(references.find((ref) => !ref.value.startsWith('#'))?.value || href) ||
      text(resource.uuid) ||
      'Katalogreferenz nicht angegeben',
    references,
    versions,
    type: text(resource.type),
  };
}
