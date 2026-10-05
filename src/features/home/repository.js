/** features/home/repository: see docs/architecture.md for responsibilities. */
import { refreshWorkspaceRepositoryControls, renderRegistryHome } from '../../app/actions.js';
import { uiStore } from '../../app/store.js';
import {
  BSI_CONTROL_LAYER_MAPPINGS_PREFIX,
  BSI_CONTROL_LAYER_PREFIX,
  BSI_IMPLEMENTATION_LAYER_PREFIX,
  BSI_REPOSITORY_TREE_URL,
} from '../../config.js';
import {
  appendRepositoryOptions,
  applyRepositoryMetadataCache,
  deduplicateRepositoryFilesByDocumentId,
  enrichRepositoryMetadata,
  getRepositoryJsonFiles,
  isControlLayerSourceCatalogPath,
  persistRepositoryMetadataCache,
  readRepositoryMetadataCache,
  sortRepositoryFiles,
} from '../../infrastructure/repository.js';

export function prepareRepositorySelect(selectEl, placeholder) {
  if (!selectEl) return;
  selectEl.innerHTML = '';
  var option = document.createElement('option');
  option.value = '';
  option.textContent = placeholder;
  option.selected = true;
  option.disabled = true;
  option.hidden = true;
  selectEl.appendChild(option);
}

export function showRepositoryLoadError(selectEl, statusEl) {
  prepareRepositorySelect(selectEl, 'Repository-Inhalte konnten nicht geladen werden');
  if (selectEl) selectEl.disabled = true;
  if (statusEl)
    statusEl.textContent =
      'GitHub ist derzeit nicht erreichbar. Lokale Dateien und URL-Uploads funktionieren weiterhin.';
}

export function tagRepositoryFiles(files, kind, category) {
  var list = Array.isArray(files) ? files : [];
  for (var i = 0; i < list.length; i++) {
    list[i].kind = kind;
    list[i].category = category;
  }
  return list;
}

export function publishRepositoryFiles(sourceCatalogs, userCatalogs, componentDefinitions) {
  var uniqueFiles = deduplicateRepositoryFilesByDocumentId(
    userCatalogs.concat(sourceCatalogs, componentDefinitions),
  );
  userCatalogs = uniqueFiles.filter(function (file) {
    return file.kind === 'catalog' && file.category === 'Anwenderkataloge';
  });
  sourceCatalogs = uniqueFiles.filter(function (file) {
    return file.kind === 'catalog' && file.category === 'Quellkataloge';
  });
  componentDefinitions = uniqueFiles.filter(function (file) {
    return file.kind === 'component';
  });
  sortRepositoryFiles(userCatalogs);
  sortRepositoryFiles(sourceCatalogs);
  sortRepositoryFiles(componentDefinitions);
  uiStore.registryState.catalogs = userCatalogs.concat(sourceCatalogs);
  uiStore.registryState.components = componentDefinitions;
  uiStore.registryState.status = 'ready';
  uiStore.registryState.error = '';

  prepareRepositorySelect(uiStore.els.bsiSelect, 'Aus dem Repository auswählen');
  appendRepositoryOptions(uiStore.els.bsiSelect, 'Anwenderkataloge', userCatalogs);
  appendRepositoryOptions(uiStore.els.bsiSelect, 'Quellkataloge', sourceCatalogs);
  if (uiStore.els.bsiSelect)
    uiStore.els.bsiSelect.disabled = !(sourceCatalogs.length || userCatalogs.length);
  if (uiStore.els.bsiStatus)
    uiStore.els.bsiStatus.textContent =
      sourceCatalogs.length + userCatalogs.length + ' aktuelle Kataloge verfügbar.';

  prepareRepositorySelect(uiStore.compEls.bsiSelect, 'Aus dem Repository auswählen');
  appendRepositoryOptions(uiStore.compEls.bsiSelect, '', componentDefinitions);
  if (uiStore.compEls.bsiSelect) uiStore.compEls.bsiSelect.disabled = !componentDefinitions.length;
  if (uiStore.compEls.bsiStatus)
    uiStore.compEls.bsiStatus.textContent =
      componentDefinitions.length + ' aktuelle Komponentendefinitionen verfügbar.';
  refreshWorkspaceRepositoryControls('catalog');
  refreshWorkspaceRepositoryControls('component');
  if (uiStore.uiState.view === 'home') renderRegistryHome();
}

export function loadBsiRepositoryOptions() {
  uiStore.registryState.status = 'loading';
  uiStore.registryState.catalogs = [];
  uiStore.registryState.components = [];
  uiStore.registryState.error = '';
  if (uiStore.uiState.view === 'home') renderRegistryHome();
  return fetch(BSI_REPOSITORY_TREE_URL, { credentials: 'omit', cache: 'no-store' })
    .then(function (res) {
      if (!res.ok) {
        throw new Error('GitHub API HTTP ' + res.status);
      }
      return res.json();
    })
    .then(function (tree) {
      if (tree.truncated) {
        throw new Error('Die GitHub-Dateiliste ist unvollständig.');
      }
      var controlLayerJsonFiles = getRepositoryJsonFiles(tree, BSI_CONTROL_LAYER_PREFIX, false, [
        BSI_CONTROL_LAYER_MAPPINGS_PREFIX,
      ]);
      var sourceCatalogs = [];
      var userCatalogs = [];
      for (var i = 0; i < controlLayerJsonFiles.length; i++) {
        if (isControlLayerSourceCatalogPath(controlLayerJsonFiles[i].path)) {
          sourceCatalogs.push(controlLayerJsonFiles[i]);
        } else if (
          controlLayerJsonFiles[i].path.indexOf('/sources/') === -1 &&
          /catalog\.json$/i.test(controlLayerJsonFiles[i].path)
        ) {
          userCatalogs.push(controlLayerJsonFiles[i]);
        }
      }
      var componentDefinitions = getRepositoryJsonFiles(
        tree,
        BSI_IMPLEMENTATION_LAYER_PREFIX,
        false,
      );
      tagRepositoryFiles(userCatalogs, 'catalog', 'Anwenderkataloge');
      tagRepositoryFiles(sourceCatalogs, 'catalog', 'Quellkataloge');
      tagRepositoryFiles(componentDefinitions, 'component', 'Komponentendefinitionen');
      var allFiles = userCatalogs.concat(sourceCatalogs, componentDefinitions);
      var metadataCache = readRepositoryMetadataCache();
      var pendingFiles = applyRepositoryMetadataCache(allFiles, metadataCache);

      // Ausschließlich die frisch geladene GitHub-Dateiliste bestimmt den sichtbaren Bestand.
      // Titel und Document IDs unveränderter Dateien kommen aus dem SHA-gebundenen Cache.
      if (!pendingFiles.length) {
        persistRepositoryMetadataCache(allFiles);
        publishRepositoryFiles(sourceCatalogs, userCatalogs, componentDefinitions);
        return;
      }
      return enrichRepositoryMetadata(pendingFiles, metadataCache).then(function () {
        persistRepositoryMetadataCache(allFiles);
        publishRepositoryFiles(sourceCatalogs, userCatalogs, componentDefinitions);
      });
    })
    .catch(function (err) {
      uiStore.registryState.status = 'error';
      uiStore.registryState.error = String(err && err.message ? err.message : err);
      showRepositoryLoadError(uiStore.els.bsiSelect, uiStore.els.bsiStatus);
      showRepositoryLoadError(uiStore.compEls.bsiSelect, uiStore.compEls.bsiStatus);
      refreshWorkspaceRepositoryControls('catalog');
      refreshWorkspaceRepositoryControls('component');
      if (uiStore.uiState.view === 'home') renderRegistryHome();
    });
}
