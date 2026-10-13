/** Import only catalogs proven to exist in the current public BSI inventory. */
import { sourceStore } from './store.js';
import { addCatalogSources } from './sources.js';
import { loadRepositoryIndex } from '../infrastructure/repository-index.js';
import { fetchRepositoryJson } from '../infrastructure/repository-fetch.js';
import {
  catalogIdentity,
  collectCatalogReferences,
  matchingCatalogs,
} from '../domain/catalog-references.js';

function alreadyLoaded(identity) {
  return sourceStore.loadedCatalogSources.some((source) => {
    const loaded = catalogIdentity(source.json, source.baseUrl);
    return (
      (identity.uuid && identity.uuid === loaded.uuid) ||
      (identity.path && identity.path === loaded.path) ||
      identity.ids.some((id) => loaded.ids.includes(id))
    );
  });
}

/** Missing dependencies must never turn a valid local/URL import into a failure. */
export async function ensureCatalogDependencies(json, baseUrl = '') {
  const references = collectCatalogReferences(json, baseUrl, sourceStore.loadedComponentSources);
  const loaded = sourceStore.loadedCatalogSources.map((source) =>
    catalogIdentity(source.json, source.baseUrl),
  );
  const missing = references.filter((ref) => !matchingCatalogs(ref, loaded).length);
  if (!missing.length) return;
  try {
    const files = await loadRepositoryIndex();
    const candidates = files
      .filter(
        (file) => file.kind === 'catalog' && (file.model === 'catalog' || !file.metadataLoaded),
      )
      .map((file) => ({
        ...file,
        ids: file.documentIds || [],
        uuid: file.documentUuid || '',
        title: file.metadataLoaded ? file.title : '',
      }));
    const wanted = new Map();
    for (const reference of missing) {
      for (const file of matchingCatalogs(reference, candidates)) {
        if (!wanted.has(file.url)) wanted.set(file.url, { file, references: [] });
        wanted.get(file.url).references.push(reference);
      }
    }
    const queue = [...wanted.values()];
    const entries = [];
    let next = 0;
    async function worker() {
      while (next < queue.length) {
        const { file, references: refs } = queue[next++];
        if (alreadyLoaded(file)) continue;
        try {
          const catalog = await fetchRepositoryJson(file.url, { retain: true });
          if (!catalog?.catalog) continue;
          const actual = catalogIdentity(catalog, file.url);
          if (!refs.some((ref) => matchingCatalogs(ref, [actual]).length)) continue;
          if (!alreadyLoaded(actual))
            entries.push({
              json: catalog,
              baseUrl: file.url,
              label: actual.title,
              identity: actual,
            });
        } catch {
          // Existing missing-catalog guidance remains available after an individual failure.
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(4, queue.length) }, worker));
    // Recheck after waiting: concurrent document imports may have loaded the same catalog.
    const order = new Map(queue.map((item, index) => [item.file.url, index]));
    entries.sort((a, b) => order.get(a.baseUrl) - order.get(b.baseUrl));
    const unique = [];
    for (const entry of entries) {
      if (alreadyLoaded(entry.identity)) continue;
      if (
        unique.some(
          (other) =>
            (other.identity.uuid && other.identity.uuid === entry.identity.uuid) ||
            other.identity.ids.some((id) => entry.identity.ids.includes(id)),
        )
      )
        continue;
      unique.push(entry);
    }
    if (unique.length) addCatalogSources(unique, { preserveActive: true });
  } catch {
    // An unavailable/truncated repository must not block the parent document.
  }
}
