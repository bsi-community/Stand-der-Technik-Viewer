/** Catalog identities and reference resolution; no network or application state. */
const list = (value) => (Array.isArray(value) ? value : []);
const text = (value) => (typeof value === 'string' ? value.trim() : '');
const unique = (values) => [...new Set(values.filter(Boolean))];
const repository = 'BSI-Bund/Stand-der-Technik-Bibliothek';
const rawRoot = `https://raw.githubusercontent.com/${repository}/main/`;

export function normalizeDocumentId(value) {
  const id = text(value);
  const uuid = id.replace(/^urn:uuid:/i, '');
  return /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(uuid)
    ? uuid.toLowerCase()
    : id;
}

export function documentIds(item) {
  return unique(list(item?.['document-ids']).map((id) => normalizeDocumentId(id?.identifier)));
}

/** Exact repository paths only; a basename or foreign host never becomes a repo match. */
export function publicCatalogPath(href, baseUrl = '') {
  const value = text(href);
  if (!value || value.startsWith('#') || value.includes('\\')) return '';
  try {
    let url;
    if (
      /^\/?control_layer\//.test(value) ||
      (!baseUrl && /^(?:\.\.?\/)*control_layer\//.test(value))
    )
      url = new URL(value.replace(/^(?:\/|(?:\.\.?\/)*)/, ''), rawRoot);
    else {
      let base = baseUrl;
      if (base.startsWith(`https://github.com/${repository}/blob/main/`))
        base = base
          .replace('https://github.com/', 'https://raw.githubusercontent.com/')
          .replace('/blob/main/', '/main/');
      url = base ? new URL(value, base) : new URL(value);
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return '';
    let prefix;
    if (url.hostname === 'raw.githubusercontent.com') prefix = `/${repository}/main/`;
    else if (url.hostname === 'github.com') prefix = `/${repository}/blob/main/`;
    else return '';
    if (!url.pathname.startsWith(prefix)) return '';
    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    if (!path.startsWith('control_layer/') || path.startsWith('control_layer/Mappings/')) return '';
    if (path.split('/').some((part) => part === '..' || part === '.') || path.includes('\\'))
      return '';
    return /\.json$/i.test(path) ? path : '';
  } catch {
    return '';
  }
}

/** Read only the resource actually referenced by source/href, never unrelated citations. */
export function describeCatalogReference(resource, backMatter, baseUrl = '') {
  const href = text(resource?.href || resource?.source);
  const resources = list(backMatter?.resources);
  const linked = href.startsWith('#')
    ? resources.find((item) => text(item?.uuid).toLowerCase() === href.slice(1).toLowerCase())
    : resources.find((item) =>
        list(item?.rlinks).some((link) => {
          if (text(link?.href) === href && href) return true;
          const path = publicCatalogPath(href, baseUrl);
          return path && publicCatalogPath(link?.href, baseUrl) === path;
        }),
      );
  // document-ids belongs to back-matter resources. Scoped props are OSCAL's
  // extension mechanism; they are not standard document-id fields on an implementation.
  const resourceIds = documentIds(linked);
  const extensionIds = list(resource?.props)
    .filter((prop) => prop?.name === 'document-id')
    .map((prop) => normalizeDocumentId(prop.value));
  const uriId = /^urn:uuid:/i.test(href) ? normalizeDocumentId(href) : '';
  const ids = resourceIds.length ? resourceIds : unique([...extensionIds, uriId]);
  const links = list(resource?.links).filter(
    (link) => text(link?.href) === href || ['source', 'catalog'].includes(link?.rel),
  );
  const paths = unique(
    [
      href,
      ...list(linked?.rlinks).map((link) => link?.href),
      ...links.map((link) => link?.href),
    ].map((value) => publicCatalogPath(value, baseUrl)),
  );
  const titles = unique([linked?.title, ...links.map((link) => link?.text)].map(text));
  return {
    ids,
    paths,
    titles,
    href,
    allowUuid: !resourceIds.length && !extensionIds.length && Boolean(uriId),
  };
}

export function collectCatalogReferences(json, baseUrl = '', importedSources = []) {
  const root = json?.['component-definition'] || json?.['mapping-collection'];
  if (!root) return [];
  const contexts = [{ root, baseUrl }];
  const visited = new Set([root]);
  // Follow only explicit imports to definitions already loaded by the user.
  // import-component-definitions never authorizes downloading arbitrary URLs.
  if (json['component-definition']) {
    for (let index = 0; index < contexts.length; index++) {
      const context = contexts[index];
      for (const item of list(context.root['import-component-definitions'])) {
        const ref = describeCatalogReference(item, context.root['back-matter'], context.baseUrl);
        for (const source of importedSources) {
          const doc = source.json?.['component-definition'];
          if (!doc || visited.has(doc)) continue;
          const ids = [...documentIds(doc.metadata), normalizeDocumentId(doc.uuid)];
          let sameUrl = false;
          try {
            sameUrl = new URL(item.href, context.baseUrl).href === source.baseUrl;
          } catch {
            /* A local fragment has no network base. */
          }
          if (ref.ids.some((id) => ids.includes(id)) || sameUrl) {
            visited.add(doc);
            contexts.push({ root: doc, baseUrl: source.baseUrl || '' });
          }
        }
      }
    }
  }
  const refs = [];
  for (const context of contexts) {
    const resources = [...list(context.root['back-matter']?.resources)];
    for (const imported of contexts) {
      if (imported === context) continue;
      for (const resource of list(imported.root['back-matter']?.resources)) {
        // Keep relative rlinks tied to their containing imported document.
        resources.push({
          ...resource,
          rlinks: list(resource.rlinks).map((link) => {
            const path = publicCatalogPath(link?.href, imported.baseUrl);
            return {
              ...link,
              href: path ? rawRoot + path.split('/').map(encodeURIComponent).join('/') : link?.href,
            };
          }),
        });
      }
    }
    const backMatter = { resources };
    if (json['component-definition']) {
      for (const owner of [...list(context.root.components), ...list(context.root.capabilities)])
        for (const implementation of list(owner?.['control-implementations']))
          refs.push(describeCatalogReference(implementation, backMatter, context.baseUrl));
    } else {
      for (const mapping of list(context.root.mappings))
        for (const side of ['source-resource', 'target-resource'])
          if (mapping?.[side])
            refs.push(describeCatalogReference(mapping[side], backMatter, context.baseUrl));
    }
  }
  const seen = new Set();
  return refs.filter((ref) => {
    const key = JSON.stringify([ref.ids, ref.paths, ref.titles, ref.allowUuid]);
    if (seen.has(key) || !(ref.ids.length || ref.paths.length || ref.titles.length)) return false;
    seen.add(key);
    return true;
  });
}

export function catalogIdentity(json, baseUrl = '') {
  const catalog = json?.catalog;
  return {
    ids: documentIds(catalog?.metadata),
    uuid: normalizeDocumentId(catalog?.uuid),
    title: text(catalog?.metadata?.title),
    path: publicCatalogPath(baseUrl),
  };
}

/** An explicit identifier is authoritative, including when it has no match. */
export function matchingCatalogs(reference, candidates) {
  if (reference.ids.length)
    return candidates.filter((file) =>
      reference.ids.some(
        (id) => file.ids.includes(id) || (reference.allowUuid && file.uuid === id),
      ),
    );
  const byPath = candidates.filter((file) => reference.paths.includes(file.path));
  if (byPath.length) return byPath;
  return candidates.filter((file) => file.title && reference.titles.includes(file.title));
}
