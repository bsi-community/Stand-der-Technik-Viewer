/** features/sources/empty-state: see docs/architecture.md for responsibilities. */
import {
  loadCatalogFile,
  loadCatalogFromUrl,
  loadComponentFile,
  loadComponentFromUrl,
  loadMappingFile,
  loadMappingFromUrl,
} from '../../app/actions.js';
import { uiStore } from '../../app/store.js';
import { escapeHtml } from '../../shared/html.js';
import { bindDropzone } from '../../shared/ui/dropzone.js';

export function getWorkspaceUploadConfig(mode) {
  var configs = {
    catalog: {
      title: 'Noch kein OSCAL-Katalog geladen',
      localTitle: 'Lokale Katalogdatei laden',
      localDescription:
        'Ziehe einen oder mehrere OSCAL Catalogs in die Fläche oder öffne per Klick den Dateibrowser.',
      dropLabel: 'Datei hierher ziehen',
      dropHint: 'oder klicken, um einen oder mehrere OSCAL Catalogs auszuwählen',
      dropAria: 'OSCAL Catalog per Drag and Drop oder Dateibrowser laden',
      fileInput: uiStore.els.file,
      fileLoader: loadCatalogFile,
      urlTitle: 'Katalog über URL laden',
      urlDescription:
        'Füge eine direkte HTTPS-Adresse zu einer JSON-Datei ein. GitHub-Links werden bei Bedarf als Raw-URL verarbeitet.',
      urlPlaceholder: 'Katalog-URL einfügen (JSON)',
      urlInput: uiStore.els.urlInput,
      urlLoader: loadCatalogFromUrl,
      repositoryTitle: 'Aus dem öffentlichen BSI Repository laden',
      repositoryDescription:
        'Wähle einen aktuellen Anwender- oder Quellkatalog direkt aus dem Stand der Technik GitHub Repository.',
      repositorySelect: uiStore.els.bsiSelect,
      repositoryStatus: uiStore.els.bsiStatus,
    },
    component: {
      title: 'Noch keine OSCAL-Komponentendefinition geladen',
      localTitle: 'Lokale Komponentendefinition laden',
      localDescription:
        'Ziehe eine oder mehrere OSCAL-Komponentendefinitionen in die Fläche oder öffne per Klick den Dateibrowser.',
      dropLabel: 'Datei hierher ziehen',
      dropHint: 'oder klicken, um eine oder mehrere Komponentendefinitionen auszuwählen',
      dropAria: 'OSCAL-Komponentendefinition per Drag and Drop oder Dateibrowser laden',
      fileInput: uiStore.compEls.file,
      fileLoader: loadComponentFile,
      urlTitle: 'Komponentendefinition über URL laden',
      urlDescription:
        'Füge eine direkte HTTPS-Adresse zu einer JSON-Datei ein. GitHub-Links werden bei Bedarf als Raw-URL verarbeitet.',
      urlPlaceholder: 'Komponentendefinition-URL einfügen (JSON)',
      urlInput: uiStore.compEls.urlInput,
      urlLoader: loadComponentFromUrl,
      repositoryTitle: 'Aus dem öffentlichen BSI Repository laden',
      repositoryDescription:
        'Wähle eine aktuelle Komponentendefinition direkt aus dem Stand der Technik GitHub Repository.',
      repositorySelect: uiStore.compEls.bsiSelect,
      repositoryStatus: uiStore.compEls.bsiStatus,
    },
    mapping: {
      title: 'Noch kein OSCAL Control Mapping geladen',
      localTitle: 'Lokale Mapping-Datei laden',
      localDescription:
        'Ziehe eine oder mehrere OSCAL Mapping Collections in die Fläche oder öffne per Klick den Dateibrowser.',
      dropLabel: 'Datei hierher ziehen',
      dropHint: 'oder klicken, um eine oder mehrere Mapping Collections auszuwählen',
      dropAria: 'OSCAL Control Mapping per Drag and Drop oder Dateibrowser laden',
      fileInput: uiStore.mappingEls.file,
      fileLoader: loadMappingFile,
      urlTitle: 'Mapping über URL laden',
      urlDescription:
        'Füge eine direkte HTTPS-Adresse zu einer JSON-Datei ein. GitHub-Blob-Links werden automatisch auf Raw-URLs umgeschrieben.',
      urlPlaceholder: 'Control-Mapping-URL einfügen (JSON)',
      urlInput: uiStore.mappingEls.urlInput,
      urlLoader: loadMappingFromUrl,
      repositoryTitle: '',
      repositoryDescription: '',
      repositorySelect: null,
      repositoryStatus: null,
    },
  };
  return configs[mode] || configs.catalog;
}

export function createWorkspaceUploadOption(step, title, description, optionClass) {
  var option = document.createElement('section');
  option.className = 'workspace-upload-option ' + optionClass;
  var header = document.createElement('div');
  header.className = 'workspace-upload-option-header';
  header.innerHTML =
    '<span class="workspace-upload-step" aria-hidden="true">' +
    step +
    '</span>' +
    '<div><h4>' +
    escapeHtml(title) +
    '</h4><p>' +
    escapeHtml(description) +
    '</p></div>';
  option.appendChild(header);
  return option;
}

export function refreshWorkspaceRepositoryControls(mode) {
  var cfg = getWorkspaceUploadConfig(mode);
  if (!cfg.repositorySelect) return;
  var targets = document.querySelectorAll('select[data-workspace-repository="' + mode + '"]');
  for (var i = 0; i < targets.length; i++) {
    targets[i].innerHTML = cfg.repositorySelect.innerHTML;
    targets[i].disabled = cfg.repositorySelect.disabled;
    targets[i].value = '';
  }
  var statuses = document.querySelectorAll('[data-workspace-repository-status="' + mode + '"]');
  for (var s = 0; s < statuses.length; s++) {
    statuses[s].textContent = cfg.repositoryStatus ? cfg.repositoryStatus.textContent : '';
  }
}

export function renderWorkspaceEmptyState(container, mode) {
  var cfg = getWorkspaceUploadConfig(mode);
  var empty = document.createElement('section');
  empty.className = 'workspace-empty-state';
  empty.setAttribute('role', 'region');
  empty.setAttribute('aria-labelledby', 'workspace-empty-title-' + mode);

  var inner = document.createElement('div');
  inner.className = 'workspace-empty-inner';
  var title = document.createElement('h3');
  title.id = 'workspace-empty-title-' + mode;
  title.textContent = cfg.title;
  inner.appendChild(title);

  var intro = document.createElement('p');
  intro.className = 'workspace-empty-intro';
  intro.textContent =
    'Wähle den passenden Ladeweg. Alle lokalen Dateien werden ausschließlich in deinem Browser verarbeitet.';
  inner.appendChild(intro);

  var options = document.createElement('div');
  options.className =
    'workspace-upload-options' + (cfg.repositorySelect ? '' : ' without-repository');

  var localOption = createWorkspaceUploadOption('1', cfg.localTitle, cfg.localDescription, 'local');
  var dropzone = document.createElement('div');
  dropzone.className = 'dropzone workspace-upload-dropzone';
  dropzone.setAttribute('role', 'button');
  dropzone.setAttribute('tabindex', '0');
  dropzone.setAttribute('aria-label', cfg.dropAria);
  dropzone.innerHTML =
    '<strong>' +
    escapeHtml(cfg.dropLabel) +
    '</strong><span>' +
    escapeHtml(cfg.dropHint) +
    '</span>';
  localOption.appendChild(dropzone);
  bindDropzone(dropzone, cfg.fileInput, cfg.fileLoader);
  options.appendChild(localOption);

  var urlOption = createWorkspaceUploadOption('2', cfg.urlTitle, cfg.urlDescription, 'url');
  var urlRow = document.createElement('div');
  urlRow.className = 'workspace-upload-url-row';
  var urlInput = document.createElement('input');
  urlInput.className = 'input workspace-upload-url-input';
  urlInput.type = 'url';
  urlInput.placeholder = cfg.urlPlaceholder;
  urlInput.autocomplete = 'off';
  urlInput.spellcheck = false;
  urlInput.setAttribute('aria-label', cfg.urlTitle);
  if (cfg.urlInput) urlInput.value = cfg.urlInput.value || '';
  var urlButton = document.createElement('button');
  urlButton.className = 'btn';
  urlButton.type = 'button';
  urlButton.textContent = 'Von URL laden';
  function submitWorkspaceUrl() {
    if (cfg.urlInput) cfg.urlInput.value = urlInput.value;
    cfg.urlLoader(urlInput.value);
  }
  urlButton.addEventListener('click', submitWorkspaceUrl);
  urlInput.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      submitWorkspaceUrl();
    }
  });
  urlRow.appendChild(urlInput);
  urlRow.appendChild(urlButton);
  urlOption.appendChild(urlRow);
  options.appendChild(urlOption);

  if (cfg.repositorySelect) {
    var repositoryOption = createWorkspaceUploadOption(
      '3',
      cfg.repositoryTitle,
      cfg.repositoryDescription,
      'repository',
    );
    var repositorySelect = document.createElement('select');
    repositorySelect.className = 'input repository-select workspace-upload-repository';
    repositorySelect.setAttribute('data-workspace-repository', mode);
    repositorySelect.setAttribute('aria-label', cfg.repositoryTitle);
    repositorySelect.addEventListener('change', function () {
      var selected = repositorySelect.options[repositorySelect.selectedIndex];
      var url = repositorySelect.value;
      if (url)
        cfg.urlLoader(
          url,
          selected && selected.dataset.documentTitle ? selected.dataset.documentTitle : '',
        );
      repositorySelect.value = '';
    });
    repositoryOption.appendChild(repositorySelect);
    var repositoryStatus = document.createElement('p');
    repositoryStatus.className = 'workspace-upload-status';
    repositoryStatus.setAttribute('data-workspace-repository-status', mode);
    repositoryStatus.setAttribute('aria-live', 'polite');
    repositoryOption.appendChild(repositoryStatus);
    options.appendChild(repositoryOption);
  }

  inner.appendChild(options);
  empty.appendChild(inner);
  container.appendChild(empty);
  refreshWorkspaceRepositoryControls(mode);
  return empty;
}
