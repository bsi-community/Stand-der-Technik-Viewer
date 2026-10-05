/** features/components/owner-view: see docs/architecture.md for responsibilities. */
import { componentStore, uiStore } from '../../app/store.js';
import { componentOwnerName } from '../../app/components.js';
import { isComponentFilterActive } from './filters.js';
import {
  appendCapabilityComponentsSection,
  appendDocumentLinksSection,
  appendImplementationSections,
} from './implementation-view.js';
import { cssId } from '../../shared/dom.js';
import { escapeHtml } from '../../shared/html.js';
import { renderHighlightedInline, renderMarkupWithParams } from '../../shared/markup.js';
import { openJsonModal } from '../../shared/ui/messages.js';
import {
  appendGenericObjectList,
  appendPropertiesSection,
  appendRemainingObjectFields,
} from '../../shared/ui/metadata.js';

export function renderComponentOwner(owner, searchTerm, options) {
  options = options || {};
  var wrapper = document.createElement('details');
  wrapper.className = 'practice-group';
  var stateKey = owner.uuid || owner.name;
  wrapper.id = 'component-wrapper-' + cssId(stateKey);
  if (owner.kind === 'capability') {
    wrapper.classList.add('topic-group');
    wrapper.open =
      uiStore.uiState.componentExpandOverride === true
        ? true
        : uiStore.uiState.componentExpandOverride === false
          ? false
          : isComponentFilterActive()
            ? true
            : !!componentStore.componentState.openCapabilities[stateKey];
    wrapper.addEventListener('toggle', function () {
      uiStore.uiState.componentExpandOverride = null;
      componentStore.componentState.openCapabilities[stateKey] = wrapper.open;
    });
  } else {
    wrapper.open =
      uiStore.uiState.componentExpandOverride === true
        ? true
        : uiStore.uiState.componentExpandOverride === false
          ? false
          : isComponentFilterActive()
            ? true
            : !!componentStore.componentState.openComponents[stateKey];
    wrapper.addEventListener('toggle', function () {
      uiStore.uiState.componentExpandOverride = null;
      componentStore.componentState.openComponents[stateKey] = wrapper.open;
    });
  }

  var summary = document.createElement('summary');
  summary.className = owner.kind === 'capability' ? 'topic-summary' : 'practice-summary';
  var countReq = 0;
  for (var i = 0; i < owner.controlImplementations.length; i++) {
    countReq += owner.controlImplementations[i].requirements.length;
  }
  var label = owner.kind === 'capability' ? 'Capability' : 'Typ: ' + (owner.type || 'Komponente');
  var headerClass = owner.kind === 'capability' ? 'topic-header' : 'practice-header';
  var titleClass = owner.kind === 'capability' ? 'topic-title' : 'practice-title';
  var summaryHtml =
    '<div class="' +
    headerClass +
    '"><div class="' +
    titleClass +
    '"><mark>' +
    renderHighlightedInline(label, searchTerm) +
    '</mark> – ' +
    renderHighlightedInline(componentOwnerName(owner), searchTerm) +
    '</div>';
  if (countReq > 0) {
    summaryHtml += '<span class="badge">' + escapeHtml(countReq + ' Anforderungen') + '</span>';
  }
  summaryHtml +=
    '</div>' +
    '<div class="meta" style="margin-top:6px"><span class="kv"><strong>UUID:</strong> <code>' +
    renderHighlightedInline(owner.uuid || '–', searchTerm) +
    '</code></span></div>';
  if (owner.imported) {
    summaryHtml +=
      '<div class="meta" style="margin-top:6px"><span class="kv"><strong>Importierte Definition:</strong> ' +
      renderHighlightedInline(
        owner.importDocumentTitle ||
          owner.importSourceLabel ||
          owner.importDocumentUuid ||
          'Unbekannt',
        searchTerm,
      ) +
      '</span></div>';
  }
  summary.innerHTML = summaryHtml;
  wrapper.appendChild(summary);

  var body = document.createElement('div');
  body.className = owner.kind === 'capability' ? 'topic-children' : 'practice-children';
  var card = document.createElement('article');
  card.className = 'card component-card ' + (owner.kind === 'capability' ? 'capability' : '');
  card.id = 'component-owner-' + cssId(stateKey);
  if (String(owner.description || '').trim()) {
    var desc = document.createElement('div');
    desc.className =
      'catalog-md js-collapsible-description' +
      (owner.kind === 'capability' ? ' capability-description' : '');
    desc.innerHTML = renderMarkupWithParams(owner.description, owner.paramMap, searchTerm);
    card.appendChild(desc);
  }
  if (owner.purpose) {
    var pur = document.createElement('details');
    pur.open = true;
    pur.innerHTML =
      '<summary><strong>Zweck</strong></summary><div class="catalog-md">' +
      renderMarkupWithParams(owner.purpose, owner.paramMap, searchTerm) +
      '</div>';
    card.appendChild(pur);
  }
  if (owner.remarks) {
    var rem = document.createElement('details');
    rem.innerHTML =
      '<summary><strong>Remarks</strong></summary><div class="catalog-md">' +
      renderMarkupWithParams(owner.remarks, owner.paramMap, searchTerm) +
      '</div>';
    card.appendChild(rem);
  }
  if (owner.kind === 'component' && owner.links && owner.links.length) {
    appendDocumentLinksSection(card, owner.links, searchTerm);
  }
  if (
    owner.kind === 'capability' &&
    !options.childComponents &&
    owner.incorporatesComponents &&
    owner.incorporatesComponents.length
  ) {
    appendCapabilityComponentsSection(card, owner, searchTerm);
  }
  appendPropertiesSection(
    card,
    owner.props,
    searchTerm,
    componentStore.componentState.resourceByUuid,
    componentStore.componentState.baseUrl,
  );
  if (owner.kind !== 'component' && owner.links && owner.links.length)
    appendGenericObjectList(
      card,
      'Links',
      owner.links,
      searchTerm,
      componentStore.componentState.resourceByUuid,
      componentStore.componentState.baseUrl,
    );
  if (owner.protocols && owner.protocols.length)
    appendGenericObjectList(
      card,
      'Protokolle',
      owner.protocols,
      searchTerm,
      componentStore.componentState.resourceByUuid,
      componentStore.componentState.baseUrl,
    );
  appendRemainingObjectFields(
    card,
    'Weitere Felder',
    owner.raw,
    owner.kind === 'capability'
      ? [
          'uuid',
          'name',
          'title',
          'description',
          'remarks',
          'props',
          'links',
          'protocols',
          'responsible-roles',
          'incorporates-components',
          'control-implementations',
        ]
      : [
          'uuid',
          'type',
          'title',
          'name',
          'description',
          'purpose',
          'remarks',
          'props',
          'links',
          'protocols',
          'responsible-roles',
          'control-implementations',
        ],
    searchTerm,
    componentStore.componentState.resourceByUuid,
    componentStore.componentState.baseUrl,
  );
  appendImplementationSections(card, owner, searchTerm);

  if (card.childElementCount) {
    if (
      owner.kind === 'capability' &&
      card.childElementCount === 1 &&
      card.querySelector('.capability-description')
    ) {
      card.classList.add('capability-description-only');
    }
    var actions = document.createElement('div');
    actions.className = 'component-card-actions';
    var jsonBtn = document.createElement('button');
    jsonBtn.className = 'btn small';
    jsonBtn.type = 'button';
    jsonBtn.textContent = 'JSON';
    jsonBtn.addEventListener('click', function () {
      openJsonModal(owner.raw, jsonBtn);
    });
    actions.appendChild(jsonBtn);
    card.appendChild(actions);
    body.appendChild(card);
  }
  if (owner.kind === 'capability' && options.childComponents && options.childComponents.length) {
    for (var cc = 0; cc < options.childComponents.length; cc++) {
      body.appendChild(renderComponentOwner(options.childComponents[cc], searchTerm));
    }
  }
  wrapper.appendChild(body);
  return wrapper;
}
