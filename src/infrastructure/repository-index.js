/** One shared, fresh inventory per viewer session, also used by dependency imports. */
import {
  BSI_REPOSITORY_TREE_URL,
  BSI_CONTROL_LAYER_PREFIX,
  BSI_CONTROL_LAYER_MAPPINGS_PREFIX,
  BSI_IMPLEMENTATION_LAYER_PREFIX,
} from '../config.js';
import {
  getRepositoryJsonFiles,
  isControlLayerSourceCatalogPath,
  readRepositoryMetadataCache,
  applyRepositoryMetadataCache,
  enrichRepositoryMetadata,
  persistRepositoryMetadataCache,
} from './repository.js';
import { fetchRepositoryJson } from './repository-fetch.js';

let currentRequest;
export function loadRepositoryIndex({ retry = false } = {}) {
  if (retry) currentRequest = null;
  if (currentRequest) return currentRequest;
  currentRequest = fetchRepositoryJson(BSI_REPOSITORY_TREE_URL).then(async (tree) => {
    if (tree.truncated || !Array.isArray(tree.tree))
      throw new Error('Die GitHub-Dateiliste ist unvollständig.');
    const catalogs = getRepositoryJsonFiles(tree, BSI_CONTROL_LAYER_PREFIX, false, [
      BSI_CONTROL_LAYER_MAPPINGS_PREFIX,
    ]);
    const mappings = getRepositoryJsonFiles(tree, BSI_CONTROL_LAYER_MAPPINGS_PREFIX, false);
    const components = getRepositoryJsonFiles(tree, BSI_IMPLEMENTATION_LAYER_PREFIX, false);
    for (const file of catalogs) {
      file.kind = 'catalog';
      file.category = isControlLayerSourceCatalogPath(file.path)
        ? 'Quellkataloge'
        : 'Anwenderkataloge';
    }
    for (const file of mappings) {
      file.kind = 'mapping';
      file.category = 'Mappings';
    }
    for (const file of components) {
      file.kind = 'component';
      file.category = 'Komponentendefinitionen';
    }
    const files = [...catalogs, ...components, ...mappings];
    const cache = readRepositoryMetadataCache();
    await enrichRepositoryMetadata(applyRepositoryMetadataCache(files, cache), cache);
    persistRepositoryMetadataCache(files);
    return files;
  });
  return currentRequest;
}
