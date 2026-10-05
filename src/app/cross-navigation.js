/** app/cross-navigation: see docs/architecture.md for responsibilities. */
import { activateCatalogSource, renderComponentView, renderList, switchTab } from './actions.js';
import { catalogStore, componentStore, sourceStore, uiStore } from './store.js';
import {
  findCatalogSourceIndexByControlRef,
  findCatalogSourceIndexForRequirement,
  getCatalogControlByRef,
} from '../app/catalog-lookup.js';
import { openGroupChain } from '../features/catalog/card.js';
import { cssId } from '../shared/dom.js';
import { escapeHtml } from '../shared/html.js';
import { showMsg } from '../shared/ui/messages.js';

export function goToCatalogControl(controlRef, preferredCatalogIndex) {
  var ref = String(controlRef || '').trim();
  if (!ref) return;
  var target = getCatalogControlByRef(ref);
  if (!target) {
    var sourceIndex =
      typeof preferredCatalogIndex === 'number' && preferredCatalogIndex >= 0
        ? preferredCatalogIndex
        : findCatalogSourceIndexByControlRef(ref);
    if (sourceIndex >= 0 && sourceIndex !== sourceStore.activeCatalogSourceIndex) {
      activateCatalogSource(sourceIndex);
      target = getCatalogControlByRef(ref);
    }
  }
  if (!target) {
    showMsg(
      '<strong>Die referenzierte Anforderung wurde im geladenen Katalog nicht gefunden:</strong><br/><code>' +
        escapeHtml(ref) +
        '</code>',
      true,
    );
    return;
  }
  switchTab('list');
  if (target.groupKey) {
    openGroupChain(target.groupKey);
  }
  if (target.topicId) {
    catalogStore.state.openTopics[target.topicId] = true;
    var topic =
      catalogStore.state.topicById && catalogStore.state.topicById.get
        ? catalogStore.state.topicById.get(target.topicId)
        : null;
    if (topic && topic.practiceId) {
      catalogStore.state.openPractices[topic.practiceId] = true;
    }
  }
  catalogStore.state.openControls[target.id] = true;
  renderList();
  setTimeout(function () {
    var card = document.getElementById('card-' + cssId(target.id));
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('highlight');
      setTimeout(function () {
        card.classList.remove('highlight');
      }, 1500);
    }
  }, 0);
}

export function goToCatalogControlFromComponent(req) {
  if (!req) return;
  var ownerKey = req.ownerUuid || req.ownerName || '';
  var sourceIndex = findCatalogSourceIndexForRequirement(req);
  uiStore.uiState.componentReturnTarget = {
    ownerKey: ownerKey,
    ownerKind: req.ownerKind || 'component',
    implKey: req.implKey || '',
    anchorId: 'component-req-' + cssId(req.id),
  };
  goToCatalogControl(req.controlId, sourceIndex);
}

export function openComponentLocation(owner, req) {
  if (!owner) return;
  var key = owner.uuid || owner.name;
  if (owner.kind === 'capability') {
    componentStore.componentState.openCapabilities[key] = true;
  } else {
    componentStore.componentState.openComponents[key] = true;
    var ownerCaps = componentStore.componentState.componentCapabilityKeys[owner.uuid] || [];
    for (var oc = 0; oc < ownerCaps.length; oc++) {
      componentStore.componentState.openCapabilities[ownerCaps[oc]] = true;
    }
  }
  switchTab('components');
  renderComponentView();
  setTimeout(function () {
    var el = req
      ? document.getElementById('component-req-' + cssId(req.id))
      : document.getElementById('component-wrapper-' + cssId(key));
    if (!el && !req) {
      el = document.getElementById('component-owner-' + cssId(key));
    }
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('highlight');
      setTimeout(function () {
        el.classList.remove('highlight');
      }, 1500);
    }
  }, 0);
}
