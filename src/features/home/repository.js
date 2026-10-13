/** features/home/repository: see docs/architecture.md for responsibilities. */
import { refreshWorkspaceRepositoryControls, renderRegistryHome } from '../../app/actions.js';
import { uiStore } from '../../app/store.js';
import { loadRepositoryIndex } from '../../infrastructure/repository-index.js';
import {
  appendRepositoryOptions,
  deduplicateRepositoryFilesByDocumentId,
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

export function publishRepositoryFiles(
  sourceCatalogs,
  userCatalogs,
  componentDefinitions,
  mappings,
) {
  var uniqueFiles = deduplicateRepositoryFilesByDocumentId(
    userCatalogs.concat(sourceCatalogs, componentDefinitions, mappings),
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
  mappings = uniqueFiles.filter(function (file) {
    return file.kind === 'mapping';
  });
  sortRepositoryFiles(mappings);
  uiStore.registryState.mappings = mappings;
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
  prepareRepositorySelect(uiStore.mappingEls.bsiSelect, 'Aus dem Repository auswählen');
  appendRepositoryOptions(uiStore.mappingEls.bsiSelect, '', mappings);
  if (uiStore.mappingEls.bsiSelect) uiStore.mappingEls.bsiSelect.disabled = !mappings.length;
  if (uiStore.mappingEls.bsiStatus)
    uiStore.mappingEls.bsiStatus.textContent = mappings.length + ' aktuelle Mappings verfügbar.';
  refreshWorkspaceRepositoryControls('mapping');
  refreshWorkspaceRepositoryControls('catalog');
  refreshWorkspaceRepositoryControls('component');
  if (uiStore.uiState.view === 'home') renderRegistryHome();
}

export function loadBsiRepositoryOptions() {
  const retry = uiStore.registryState.status === 'error';
  uiStore.registryState.status = 'loading';
  uiStore.registryState.catalogs = [];
  uiStore.registryState.components = [];
  uiStore.registryState.mappings = [];
  uiStore.registryState.error = '';
  for (var controls of [uiStore.els, uiStore.compEls, uiStore.mappingEls]) {
    prepareRepositorySelect(controls.bsiSelect, 'Repository-Inhalte werden geladen…');
    if (controls.bsiSelect) controls.bsiSelect.disabled = true;
    if (controls.bsiStatus)
      controls.bsiStatus.textContent = 'Aktuelle Dateiliste wird von GitHub abgerufen.';
  }
  for (var mode of ['catalog', 'component', 'mapping']) refreshWorkspaceRepositoryControls(mode);
  if (uiStore.uiState.view === 'home') renderRegistryHome();
  return loadRepositoryIndex({ retry })
    .then(function (files) {
      // Keep failed metadata entries selectable for manual retry, but never use
      // them as identity evidence for automatic catalog loading.
      const visible = files.filter(
        (file) =>
          file.model === file.kind ||
          (!file.metadataLoaded && (file.kind !== 'catalog' || /catalog\.json$/i.test(file.path))),
      );
      publishRepositoryFiles(
        visible.filter((file) => file.kind === 'catalog' && file.category === 'Quellkataloge'),
        visible.filter((file) => file.kind === 'catalog' && file.category === 'Anwenderkataloge'),
        visible.filter((file) => file.kind === 'component'),
        visible.filter((file) => file.kind === 'mapping'),
      );
    })
    .catch(function (err) {
      uiStore.registryState.status = 'error';
      uiStore.registryState.error = String(err && err.message ? err.message : err);
      showRepositoryLoadError(uiStore.els.bsiSelect, uiStore.els.bsiStatus);
      showRepositoryLoadError(uiStore.compEls.bsiSelect, uiStore.compEls.bsiStatus);
      showRepositoryLoadError(uiStore.mappingEls.bsiSelect, uiStore.mappingEls.bsiStatus);
      refreshWorkspaceRepositoryControls('mapping');
      refreshWorkspaceRepositoryControls('catalog');
      refreshWorkspaceRepositoryControls('component');
      if (uiStore.uiState.view === 'home') renderRegistryHome();
    });
}
