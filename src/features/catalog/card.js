/** features/catalog/card: see docs/architecture.md for responsibilities. */
import { renderList, switchTab } from '../../app/actions.js';
import { catalogStore, uiStore } from '../../app/store.js';
import { renderSecurityTargetMeta } from './security-targets.js';
import { cssId } from '../../shared/dom.js';
import { escapeHtml } from '../../shared/html.js';
import {
  renderHighlightedInline,
  renderMarkupWithParams,
  renderTextWithParams,
} from '../../shared/markup.js';
import { containsAnySearchTerm } from '../../shared/search.js';
import { bindEffortTooltip, getEffortDisplayValue } from '../../shared/ui/effort-tooltip.js';
import { openJsonModal } from '../../shared/ui/messages.js';

export function renderCard(c) {
  var div = document.createElement('details');
  div.className = 'card control-card';
  div.id = 'card-' + cssId(c.id);
  // Enhancement controls (nested controls) should be displayed indented under their parent
  if (c && c.enhDepth && c.enhDepth > 0) {
    div.classList.add('enhancement');
    div.style.setProperty('--enh-indent', c.enhDepth * 1.35 + 'rem');
  }
  div.open =
    uiStore.uiState.catalogExpandOverride === true
      ? true
      : uiStore.uiState.catalogExpandOverride === false
        ? false
        : !!catalogStore.state.openControls[c.id];
  div.addEventListener('toggle', function (ev) {
    if (ev.target !== div) return;
    uiStore.uiState.catalogExpandOverride = null;
    catalogStore.state.openControls[c.id] = div.open;
  });
  var titleHtml = renderTextWithParams(c.title, c.paramMap, catalogStore.state.qRaw);
  var statementHtml = renderMarkupWithParams(c.statement, c.paramMap, catalogStore.state.qRaw);
  var guidanceHtml = renderMarkupWithParams(c.guidance, c.paramMap, catalogStore.state.qRaw);
  var remarksHtml = renderMarkupWithParams(c.remarks, c.paramMap, catalogStore.state.qRaw);
  var effortMetaHtml = '';
  if (c.effort) {
    var rawEffort = String(c.effort);
    var effortShown = getEffortDisplayValue(rawEffort);
    effortMetaHtml =
      '<span class="kv effort-hover" data-effort="' +
      escapeHtml(rawEffort) +
      '"><strong>' +
      renderHighlightedInline(c.effortLabel || 'Aufwand', catalogStore.state.qRaw) +
      ':</strong> <code>' +
      renderHighlightedInline(effortShown, catalogStore.state.qRaw) +
      '</code></span>';
  }

  var summary = document.createElement('summary');
  summary.className = 'control-summary';
  summary.innerHTML =
    '' +
    '<span class="control-summary-id"><mark>' +
    renderHighlightedInline(c.id, catalogStore.state.qRaw) +
    '</mark></span>' +
    '<span class="control-summary-title">' +
    titleHtml +
    '</span>';
  div.appendChild(summary);

  var body = document.createElement('div');
  body.className = 'control-card-body';
  body.innerHTML =
    '' +
    '<div class="meta">' +
    '<span class="kv"><strong>UUID:</strong> <code>' +
    renderHighlightedInline(c.uuid || '–', catalogStore.state.qRaw) +
    '</code></span>' +
    (c.class
      ? '<span class="kv"><strong>Quellkatalog:</strong> <code>' +
        renderHighlightedInline(c.class, catalogStore.state.qRaw) +
        '</code></span>'
      : '') +
    (c.sec_level
      ? '<span class="kv"><strong>Sicherheitsniveau:</strong> <code>' +
        renderHighlightedInline(c.sec_level, catalogStore.state.qRaw) +
        '</code></span>'
      : '') +
    effortMetaHtml +
    (c.topicId
      ? '<span class="kv"><strong>Thema:</strong> <code>' +
        renderHighlightedInline(c.topicId, catalogStore.state.qRaw) +
        '</code>' +
        (c.topicTitle
          ? ' – ' + renderHighlightedInline(c.topicTitle, catalogStore.state.qRaw)
          : '') +
        '</span>'
      : '') +
    (c.target
      ? '<span class="kv"><strong>Zielobjektkategorie:</strong> <code>' +
        renderHighlightedInline(c.target, catalogStore.state.qRaw) +
        '</code></span>'
      : '') +
    (c.modalverbs
      ? '<span class="kv"><strong>Modalverben:</strong> <code>' +
        renderHighlightedInline(c.modalverbs, catalogStore.state.qRaw) +
        '</code></span>'
      : '') +
    (c.documentation
      ? '<span class="kv"><strong>Dokumentationsempfehlung:</strong> <code>' +
        renderHighlightedInline(c.documentation, catalogStore.state.qRaw) +
        '</code></span>'
      : '') +
    (c.actionwords
      ? '<span class="kv"><strong>Handlungswörter:</strong> <code>' +
        renderHighlightedInline(c.actionwords, catalogStore.state.qRaw) +
        '</code></span>'
      : '') +
    (c.tags
      ? '<span class="kv"><strong>Tags:</strong> <code>' +
        renderHighlightedInline(c.tags, catalogStore.state.qRaw) +
        '</code></span>'
      : '') +
    renderSecurityTargetMeta(c) +
    (c.threats
      ? '<span class="kv"><strong>BSI G0-Gefährdungen:</strong> <code>' +
        renderHighlightedInline(c.threats, catalogStore.state.qRaw) +
        '</code></span>'
      : '') +
    (c.taxonomyL1
      ? '<span class="kv"><strong>Taxonomy-L1:</strong> <code>' +
        renderHighlightedInline(c.taxonomyL1, catalogStore.state.qRaw) +
        '</code></span>'
      : '') +
    (c.taxonomyL2
      ? '<span class="kv"><strong>Taxonomy-L2:</strong> <code>' +
        renderHighlightedInline(c.taxonomyL2, catalogStore.state.qRaw) +
        '</code></span>'
      : '') +
    (c.taxonomyL3
      ? '<span class="kv"><strong>Taxonomy-L3:</strong> <code>' +
        renderHighlightedInline(c.taxonomyL3, catalogStore.state.qRaw) +
        '</code></span>'
      : '') +
    (c.taxonomyL4
      ? '<span class="kv"><strong>Taxonomy-L4:</strong> <code>' +
        renderHighlightedInline(c.taxonomyL4, catalogStore.state.qRaw) +
        '</code></span>'
      : '') +
    '</div>';
  bindEffortTooltip(body);

  var details = document.createElement('div');
  if (c.statement) {
    var st = document.createElement('details');
    st.open = true;
    st.innerHTML =
      '<summary><strong>Statement</strong></summary><div class="catalog-md">' +
      statementHtml +
      '</div>';
    details.appendChild(st);
  }
  if (c.guidance) {
    var gu = document.createElement('details');
    if (containsAnySearchTerm(c.guidance, catalogStore.state.searchQuery)) {
      gu.open = true;
    }
    gu.innerHTML =
      '<summary><strong>Guidance</strong></summary><div class="catalog-md">' +
      guidanceHtml +
      '</div>';
    details.appendChild(gu);
  }
  if (c.remarks) {
    var re = document.createElement('details');
    if (containsAnySearchTerm(c.remarks, catalogStore.state.searchQuery)) {
      re.open = true;
    }
    re.innerHTML =
      '<summary><strong>Remarks</strong></summary><div class="catalog-md">' +
      remarksHtml +
      '</div>';
    details.appendChild(re);
  }
  if (Array.isArray(c.parts)) {
    for (var p = 0; p < c.parts.length; p++) {
      var part = c.parts[p];
      if (!part || !part.prose) continue;
      if (part.name === 'statement' || part.name === 'guidance') continue;
      var proseHtml = renderMarkupWithParams(part.prose, c.paramMap, catalogStore.state.qRaw);
      var di = document.createElement('details');
      di.innerHTML =
        '<summary><strong>' +
        escapeHtml(part.name || part.id || 'Part') +
        '</strong></summary><div class="catalog-md">' +
        proseHtml +
        '</div>';
      details.appendChild(di);
    }
  }
  if (details.childElementCount) body.appendChild(details);

  var required = [],
    related = [];
  if (Array.isArray(c.links)) {
    for (var r = 0; r < c.links.length; r++) {
      var L = c.links[r];
      var rel = (L.rel || '').toLowerCase();
      var ref = String(L.href || '').replace(/^#/, '');
      var tgt = catalogStore.state.idMap.get(ref);
      if (!tgt) continue;
      if (rel === 'required') required.push(tgt);
      else if (rel === 'related') related.push(tgt);
    }
  }
  var relWrap = document.createElement('div');
  if (required.length) {
    var b1 = document.createElement('div');
    b1.style.marginTop = '10px';
    b1.innerHTML =
      '<div class="rel-label"><span class="badge ok">abhängig von (required)</span></div>';
    var g1 = document.createElement('div');
    g1.className = 'rel-group';
    var l1 = document.createElement('div');
    l1.className = 'rel';
    for (var a = 0; a < required.length; a++) {
      l1.appendChild(renderRelItem(required[a], 'required'));
    }
    g1.appendChild(l1);
    b1.appendChild(g1);
    relWrap.appendChild(b1);
  }
  if (related.length) {
    var b2 = document.createElement('div');
    b2.style.marginTop = '10px';
    b2.innerHTML = '<div class="rel-label"><span class="badge">verwandt (related)</span></div>';
    var g2 = document.createElement('div');
    g2.className = 'rel-group';
    var l2 = document.createElement('div');
    l2.className = 'rel';
    for (var b = 0; b < related.length; b++) {
      l2.appendChild(renderRelItem(related[b], 'related'));
    }
    g2.appendChild(l2);
    b2.appendChild(g2);
    relWrap.appendChild(b2);
  }
  if (relWrap.childElementCount) body.appendChild(relWrap);

  var actions = document.createElement('div');
  actions.style.marginTop = '10px';
  actions.style.display = 'flex';
  actions.style.justifyContent = 'flex-end';
  var jsonBtn = document.createElement('button');
  jsonBtn.className = 'btn small';
  jsonBtn.type = 'button';
  jsonBtn.textContent = 'JSON';
  jsonBtn.addEventListener('click', function () {
    if (c.raw) {
      openJsonModal(c.raw, jsonBtn);
    }
  });
  actions.appendChild(jsonBtn);
  body.appendChild(actions);
  div.appendChild(body);

  return div;
}

export function openGroupChain(groupKey) {
  var key = String(groupKey || '');
  while (key) {
    catalogStore.state.openGroups[key] = true;
    var g =
      catalogStore.state.groupByKey && catalogStore.state.groupByKey.get
        ? catalogStore.state.groupByKey.get(key)
        : null;
    key = g && g.parentKey ? g.parentKey : '';
  }
}

export function renderRelItem(t, kind) {
  var el = document.createElement('div');
  el.className = 'rel-item ' + (kind === 'required' ? 'required' : 'related');
  var stHtml = renderMarkupWithParams(t.statement, t.paramMap, catalogStore.state.qRaw);
  var titleHtml = renderTextWithParams(t.title, t.paramMap, catalogStore.state.qRaw);
  el.innerHTML =
    '' +
    '<div><strong>' +
    renderHighlightedInline(t.id, catalogStore.state.qRaw) +
    '</strong> – ' +
    titleHtml +
    '</div>' +
    '<div class="meta">' +
    '<span class="kv"><strong>UUID:</strong> <code>' +
    renderHighlightedInline(t.uuid || '–', catalogStore.state.qRaw) +
    '</code></span>' +
    (t.topicId
      ? '<span class="kv"><strong>Thema:</strong> <code>' +
        renderHighlightedInline(t.topicId, catalogStore.state.qRaw) +
        '</code>' +
        (t.topicTitle
          ? ' – ' + renderHighlightedInline(t.topicTitle, catalogStore.state.qRaw)
          : '') +
        '</span>'
      : '') +
    '</div>' +
    (t.statement
      ? '<div class="hint catalog-md" style="margin-top:6px">' + stHtml + '</div>'
      : '') +
    '<div style="margin-top:10px"><button class="btn small btn-goto" type="button" style="width:auto">Zum Eintrag</button></div>';
  el.querySelector('.btn-goto').addEventListener('click', function () {
    switchTab('list');
    if (t.groupKey) {
      openGroupChain(t.groupKey);
    }
    if (t.topicId) {
      catalogStore.state.openTopics[t.topicId] = true;
      var topic =
        catalogStore.state.topicById && catalogStore.state.topicById.get
          ? catalogStore.state.topicById.get(t.topicId)
          : null;
      if (topic && topic.practiceId) {
        catalogStore.state.openPractices[topic.practiceId] = true;
      }
    }
    catalogStore.state.openControls[t.id] = true;
    renderList();
    setTimeout(function () {
      var card = document.getElementById('card-' + cssId(t.id));
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('highlight');
        setTimeout(function () {
          card.classList.remove('highlight');
        }, 1500);
      }
    }, 0);
  });
  return el;
}
