/** features/components/implementation-view: see docs/architecture.md for responsibilities. */
import { openComponentLocation } from '../../app/actions.js';
import { componentStore, uiStore } from '../../app/store.js';
import { componentOwnerName } from '../../app/components.js';
import { isComponentFilterActive } from './filters.js';
import { renderImplementationRequirementsTable } from './requirements-view.js';
import { escapeHtml } from '../../shared/html.js';
import {
  renderHighlightedInline,
  renderMarkupMultiline,
  renderMarkupWithParams,
} from '../../shared/markup.js';
import { buildDocumentLinkHtml } from '../../shared/ui/metadata.js';
import {
  getBackMatterResource,
  getBackMatterResourceLabel,
  resolveResourceUrl,
} from '../../shared/urls.js';

export function appendImplementationSections(container, owner, searchTerm) {
  var impls = owner.controlImplementations || [];
  if (!impls.length) {
    if (owner && owner.kind === 'capability') return;
    var empty = document.createElement('div');
    empty.className = 'component-empty';
    empty.textContent = 'Keine Implementierungsnachweise vorhanden.';
    container.appendChild(empty);
    return;
  }

  for (var i = 0; i < impls.length; i++) {
    var impl = impls[i];
    var details = document.createElement('details');
    var implKey = impl.key || (owner.uuid || owner.name) + '::' + (impl.uuid || i);
    details.open =
      uiStore.uiState.componentExpandOverride === true
        ? true
        : uiStore.uiState.componentExpandOverride === false
          ? false
          : isComponentFilterActive()
            ? true
            : !!componentStore.componentState.openImplementations[implKey];
    details.addEventListener(
      'toggle',
      (function (key, el) {
        return function () {
          uiStore.uiState.componentExpandOverride = null;
          componentStore.componentState.openImplementations[key] = el.open;
        };
      })(implKey, details),
    );
    var reqCount = impl.requirements.length;
    var summary = document.createElement('summary');
    summary.innerHTML =
      '<span class="component-summary"><strong>Anforderungserfüllung</strong><span class="badge">' +
      escapeHtml(reqCount + ' Anforderungen') +
      '</span></span>' +
      '<span class="component-source" style="display:block;margin-top:6px"><strong>Quelle:</strong> ' +
      buildDocumentLinkHtml(
        impl.sourceLabel,
        impl.source,
        searchTerm,
        componentStore.componentState.resourceByUuid,
        componentStore.componentState.baseUrl,
      ) +
      '</span>';
    details.appendChild(summary);

    var body = document.createElement('div');
    body.className = 'component-children';
    if (String(impl.description || '').trim()) {
      var implDescription = document.createElement('div');
      implDescription.className =
        'implementation-overview-description catalog-md js-collapsible-description';
      implDescription.innerHTML = renderMarkupWithParams(
        impl.description,
        impl.paramMap,
        searchTerm,
      );
      body.appendChild(implDescription);
    }
    body.appendChild(renderImplementationRequirementsTable(impl, searchTerm));

    details.appendChild(body);
    container.appendChild(details);
  }
}

export function appendCapabilityComponentsSection(parent, owner, searchTerm) {
  var items = owner && owner.incorporatesComponents;
  if (!items || !items.length) return;

  var section = document.createElement('section');
  section.className = 'catalog-section';
  var heading = document.createElement('h4');
  heading.className = 'catalog-section-title';
  heading.innerHTML = renderHighlightedInline('Incorporates Components', searchTerm);
  section.appendChild(heading);

  var table = document.createElement('table');
  table.className = 'catalog-table';
  var tbody = document.createElement('tbody');

  for (var i = 0; i < items.length; i++) {
    var item = items[i] || {};
    var refUuid = item['component-uuid'] || '';
    var refComp = componentStore.componentState.componentByUuid.get(refUuid);
    var refTitle = refComp ? componentOwnerName(refComp) : item.title || refUuid || 'Komponente';
    var refDescription = String(item.description || '').trim();
    var titleNorm = String(refTitle || '')
      .trim()
      .toLowerCase();
    var descNorm = refDescription.toLowerCase();
    var showDescription = !!refDescription && refDescription !== refTitle && descNorm !== titleNorm;

    var tr = document.createElement('tr');
    var th = document.createElement('th');
    th.style.width = '34%';
    th.innerHTML =
      '<div class="catalog-item-label">Component</div>' +
      '<div><code>' +
      renderHighlightedInline(refUuid || '–', searchTerm) +
      '</code></div>';
    if (refComp) {
      var gotoWrap = document.createElement('div');
      gotoWrap.style.marginTop = '8px';
      var gotoBtn = document.createElement('button');
      gotoBtn.className = 'btn small component-ref-btn';
      gotoBtn.type = 'button';
      gotoBtn.textContent = 'Zum Eintrag';
      gotoBtn.addEventListener(
        'click',
        (function (comp) {
          return function () {
            openComponentLocation(comp);
          };
        })(refComp),
      );
      gotoWrap.appendChild(gotoBtn);
      th.appendChild(gotoWrap);
    }

    var td = document.createElement('td');
    var titleDiv = document.createElement('div');
    titleDiv.className = 'catalog-md';
    titleDiv.innerHTML =
      '<p><strong>' + renderHighlightedInline(refTitle, searchTerm) + '</strong></p>';
    td.appendChild(titleDiv);
    if (showDescription) {
      var descDiv = document.createElement('div');
      descDiv.className = 'catalog-md js-collapsible-description';
      descDiv.innerHTML = renderMarkupMultiline(refDescription, searchTerm);
      td.appendChild(descDiv);
    }

    tr.appendChild(th);
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  section.appendChild(table);
  parent.appendChild(section);
}

export function appendDocumentLinksSection(parent, links, searchTerm) {
  if (!links || !links.length) return;

  var details = document.createElement('details');
  details.innerHTML = '<summary><strong>Links und Dokumentationen</strong></summary>';

  var wrap = document.createElement('div');
  wrap.className = 'component-link-list';

  for (var i = 0; i < links.length; i++) {
    var link = links[i] || {};
    var rawHref = String(link.href || '').trim();
    var resource = getBackMatterResource(componentStore.componentState.resourceByUuid, rawHref);
    var resolvedUrl = resolveResourceUrl(
      rawHref,
      componentStore.componentState.resourceByUuid,
      componentStore.componentState.baseUrl,
    );
    var title = link.text || getBackMatterResourceLabel(resource) || rawHref || 'Link';
    var card = document.createElement('div');
    card.className = 'component-link-card';

    var titleEl = document.createElement('div');
    titleEl.className = 'component-link-title';
    titleEl.innerHTML = renderHighlightedInline(title, searchTerm);
    card.appendChild(titleEl);

    var urlEl = document.createElement('div');
    urlEl.className = 'component-link-url';
    if (resolvedUrl) {
      urlEl.innerHTML =
        '<a href="' +
        escapeHtml(resolvedUrl) +
        '" target="_blank" rel="noopener noreferrer">' +
        renderHighlightedInline(resolvedUrl, searchTerm) +
        '</a>';
    } else if (rawHref) {
      urlEl.innerHTML = renderHighlightedInline(rawHref, searchTerm);
    } else {
      urlEl.textContent = 'Keine URL vorhanden.';
    }
    card.appendChild(urlEl);

    var meta = document.createElement('div');
    meta.className = 'component-link-meta';
    if (rawHref) {
      var hrefChip = document.createElement('span');
      hrefChip.className = 'kv';
      hrefChip.innerHTML =
        '<strong>href:</strong> <code>' +
        renderHighlightedInline(
          rawHref.charAt(0) === '#' ? rawHref.slice(1) : rawHref,
          searchTerm,
        ) +
        '</code>';
      meta.appendChild(hrefChip);
    }
    if (link.rel) {
      var relChip = document.createElement('span');
      relChip.className = 'kv';
      relChip.innerHTML =
        '<strong>rel:</strong> <code>' +
        renderHighlightedInline(String(link.rel), searchTerm) +
        '</code>';
      meta.appendChild(relChip);
    }
    if (meta.childElementCount) {
      card.appendChild(meta);
    }

    wrap.appendChild(card);
  }

  details.appendChild(wrap);
  parent.appendChild(details);
}
