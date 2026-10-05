/** features/catalog/view: see docs/architecture.md for responsibilities. */
import { renderCard, setCatalogExpansion } from '../../app/actions.js';
import { exportToPdf } from '../../app/print.js';
import { resetAllFilters } from '../../app/reset.js';
import { catalogStore, uiStore } from '../../app/store.js';
import { renderCatalogInfo } from './metadata.js';
import { isFilterActive, matches } from './selectors.js';
import { collectCatalogActiveFilterChips, renderSelectionState } from '../selection.js';
import { renderWorkspaceEmptyState } from '../sources/empty-state.js';
import { escapeHtml } from '../../shared/html.js';
import { renderHighlightedInline, renderTextWithParams } from '../../shared/markup.js';
import { hideEffortTooltip } from '../../shared/ui/effort-tooltip.js';
import { showMsg } from '../../shared/ui/messages.js';
import { renderOverviewCard } from '../../shared/ui/overview.js';

export function renderList() {
  try {
    hideEffortTooltip();
    uiStore.els.listTab.innerHTML = '';
    renderCatalogInfo();
    var matched = [];
    for (var i = 0; i < catalogStore.state.controls.length; i++) {
      var c = catalogStore.state.controls[i];
      if (matches(c)) matched.push(c);
    }
    var activeCatalogChips = collectCatalogActiveFilterChips();
    if (
      !catalogStore.state.controls.length &&
      !catalogStore.state.catalogMetadata &&
      !catalogStore.state.catalogBackMatter
    ) {
      renderSelectionState(
        uiStore.els.selectionState,
        'Katalogstatus',
        'Kein Datensatz geladen',
        [],
      );
      renderOverviewCard({
        title: 'Katalog-Workspace',
        description:
          'Lade einen OSCAL Catalog, um Anforderungen, optionale Gruppenstrukturen und Beziehungen in einer strukturierten Oberfläche zu analysieren.',
        stats: [
          { label: 'Geladen', value: '0', note: 'Anforderungen' },
          { label: 'Sichtbar', value: '0', note: 'Treffer' },
          { label: 'Gruppen/Themen', value: '0', note: 'Erste Gruppenebene' },
          { label: 'Untergruppen/Unterthemen', value: '0', note: 'Zweite Gruppenebene' },
        ],
        chips: [],
        actions: [],
      });
      renderWorkspaceEmptyState(uiStore.els.listTab, 'catalog');
      uiStore.els.graphInfo.textContent = 'Graph: 0 Knoten';
      return;
    }
    renderSelectionState(
      uiStore.els.selectionState,
      'Katalogfokus',
      matched.length + ' von ' + catalogStore.state.controls.length + ' Anforderungen sichtbar',
      activeCatalogChips,
    );
    renderOverviewCard({
      title: matched.length ? 'Kataloganalyse' : 'Keine Treffer im Katalog',
      description: matched.length
        ? 'Die Übersicht priorisiert sichtbare Treffer, aktive Einschränkungen und Schnellaktionen, damit Navigation und Auswertung ohne Suchaufwand funktionieren.'
        : 'Die aktuelle Suche oder Filterung liefert keine sichtbaren Anforderungen. Passe die Einschränkungen an oder setze sie gesammelt zurück.',
      stats: [
        {
          label: 'Geladen',
          value: String(catalogStore.state.controls.length),
          note: 'Anforderungen insgesamt',
        },
        {
          label: 'Sichtbar',
          value: String(matched.length),
          note: 'Treffer in der aktuellen Ansicht',
        },
        {
          label:
            catalogStore.state.catalogGroupMode === 'practices' ? 'Praktiken' : 'Gruppen/Themen',
          value: String(catalogStore.allGroups.length),
          note:
            catalogStore.state.catalogGroupMode === 'practices'
              ? 'Erkannte Praktiken'
              : 'Erste Gruppenebene',
        },
        {
          label:
            catalogStore.state.catalogGroupMode === 'practices'
              ? 'Themen'
              : 'Untergruppen/Unterthemen',
          value: String(catalogStore.allSubgroups.length),
          note: 'Zweite Gruppenebene',
        },
      ],
      chips: activeCatalogChips,
      actions: [
        { label: 'Filter zurücksetzen', onClick: resetAllFilters },
        {
          label: 'Alles aufklappen',
          onClick: function () {
            setCatalogExpansion(true);
          },
        },
        {
          label: 'Alles zuklappen',
          onClick: function () {
            setCatalogExpansion(false);
          },
        },
        { label: 'Als PDF exportieren', onClick: exportToPdf },
      ],
    });
    var matchedSet = {};
    for (var mi = 0; mi < matched.length; mi++) {
      matchedSet[matched[mi].id] = true;
    }
    if (!matched.length) {
      var emptyCard = document.createElement('div');
      emptyCard.className = 'card';
      emptyCard.textContent = 'Keine Ergebnisse für die aktuelle Filterung.';
      uiStore.els.listTab.appendChild(emptyCard);
      uiStore.els.graphInfo.textContent = 'Graph: 0 Knoten';
      return;
    }

    var hasTopics = catalogStore.state.topics && catalogStore.state.topics.length;
    var hasPractices = catalogStore.state.practices && catalogStore.state.practices.length;
    var hasGroups = catalogStore.state.groupRoots && catalogStore.state.groupRoots.length;
    var active = isFilterActive();
    var anyRendered = false;

    function renderTopics(topicList) {
      var frag = document.createDocumentFragment();
      for (var t = 0; t < topicList.length; t++) {
        var topic = topicList[t];
        var kids = catalogStore.state.childrenByTopic[topic.id] || [];
        var matchedKids = [];
        for (var k = 0; k < kids.length; k++) {
          if (matchedSet[kids[k].id]) matchedKids.push(kids[k]);
        }
        if (active) {
          if (matchedKids.length === 0) continue;
        }

        var details = document.createElement('details');
        details.className = 'topic-group';
        details.open =
          uiStore.uiState.catalogExpandOverride === true
            ? true
            : uiStore.uiState.catalogExpandOverride === false
              ? false
              : active
                ? matchedKids.length > 0
                : !!catalogStore.state.openTopics[topic.id];

        var summary = document.createElement('summary');
        summary.className = 'topic-summary';
        var topicTitleHtml = renderTextWithParams(topic.title, {}, catalogStore.state.qRaw);
        var countLabel = (active ? matchedKids.length : kids.length) + ' Anforderungen';
        summary.innerHTML =
          '' +
          '<div class="topic-header">' +
          '<div class="topic-title"><mark>' +
          escapeHtml(topic.id) +
          '</mark> – <strong>Thema</strong>: ' +
          topicTitleHtml +
          '</div>' +
          '<span class="badge">' +
          escapeHtml(countLabel) +
          '</span>' +
          '</div>' +
          (topic.uuid
            ? '<div class="meta" style="margin-top:6px"><span class="kv"><strong>UUID:</strong> <code>' +
              renderHighlightedInline(topic.uuid, catalogStore.state.qRaw) +
              '</code></span></div>'
            : '');
        details.appendChild(summary);

        var childWrap = document.createElement('div');
        childWrap.className = 'topic-children';
        if (matchedKids.length) {
          for (var cidx = 0; cidx < matchedKids.length; cidx++) {
            childWrap.appendChild(renderCard(matchedKids[cidx]));
          }
        } else {
          var empty = document.createElement('div');
          empty.className = 'note';
          empty.textContent = 'Keine Anforderungen in der aktuellen Filterung.';
          childWrap.appendChild(empty);
        }
        details.appendChild(childWrap);

        (function (id, el) {
          el.addEventListener('toggle', function () {
            uiStore.uiState.catalogExpandOverride = null;
            catalogStore.state.openTopics[id] = el.open;
          });
        })(topic.id, details);

        frag.appendChild(details);
        anyRendered = true;
      }
      return frag;
    }

    var groupCountMemoAll = {};
    var groupCountMemoMatched = {};

    function countGroupControls(groupKey, matchedOnly, memo) {
      memo = memo || {};
      var key = String(groupKey || '');
      if (Object.prototype.hasOwnProperty.call(memo, key)) return memo[key];
      var grp = catalogStore.state.groupByKey.get(key);
      if (!grp) {
        memo[key] = 0;
        return 0;
      }
      var direct = catalogStore.state.controlsByGroup[key] || [];
      var count = 0;
      if (matchedOnly) {
        for (var i = 0; i < direct.length; i++) {
          if (matchedSet[direct[i].id]) count++;
        }
      } else {
        count += direct.length;
      }
      var kids = Array.isArray(grp.children) ? grp.children : [];
      for (var ki = 0; ki < kids.length; ki++) {
        count += countGroupControls(kids[ki], matchedOnly, memo);
      }
      memo[key] = count;
      return count;
    }

    function renderGroupByKey(groupKey) {
      var grp = catalogStore.state.groupByKey.get(groupKey);
      if (!grp) return null;
      var direct = catalogStore.state.controlsByGroup[groupKey] || [];
      var matchedDirect = [];
      for (var d = 0; d < direct.length; d++) {
        if (matchedSet[direct[d].id]) matchedDirect.push(direct[d]);
      }
      var childFrag = document.createDocumentFragment();
      var childCount = 0;
      var kids = Array.isArray(grp.children) ? grp.children : [];
      for (var ci = 0; ci < kids.length; ci++) {
        var childNode = renderGroupByKey(kids[ci]);
        if (childNode) {
          childFrag.appendChild(childNode);
          childCount++;
        }
      }
      var groupHasMatch = matchedDirect.length > 0 || childCount > 0;
      if (active && !groupHasMatch) return null;

      var depth = Math.max(0, grp.path && grp.path.length ? grp.path.length - 1 : 0);
      var details = document.createElement('details');
      details.className = depth === 0 ? 'practice-group' : 'topic-group';
      details.open =
        uiStore.uiState.catalogExpandOverride === true
          ? true
          : uiStore.uiState.catalogExpandOverride === false
            ? false
            : active
              ? groupHasMatch
              : !!catalogStore.state.openGroups[groupKey];

      var summary = document.createElement('summary');
      summary.className = depth === 0 ? 'practice-summary' : 'topic-summary';
      var gTitleHtml = renderTextWithParams(grp.title || '', {}, catalogStore.state.qRaw);
      var gLabel = grp.id ? '<mark>' + escapeHtml(grp.id) + '</mark>' : '<strong>Gruppe</strong>';
      var countTotal = countGroupControls(
        groupKey,
        !!active,
        active ? groupCountMemoMatched : groupCountMemoAll,
      );
      var countLabel = countTotal + ' Anforderungen';
      if (depth === 0) {
        summary.innerHTML =
          '' +
          '<div class="practice-header">' +
          '<div class="practice-title">' +
          gLabel +
          (grp.title ? ' - ' + gTitleHtml : '') +
          '</div>' +
          '<span class="badge">' +
          escapeHtml(countLabel) +
          '</span>' +
          '</div>' +
          (grp.uuid
            ? '<div class="meta" style="margin-top:6px"><span class="kv"><strong>UUID:</strong> <code>' +
              renderHighlightedInline(grp.uuid, catalogStore.state.qRaw) +
              '</code></span></div>'
            : '');
      } else {
        summary.innerHTML =
          '' +
          '<div class="topic-header">' +
          '<div class="topic-title">' +
          gLabel +
          (grp.title ? ' - ' + gTitleHtml : '') +
          '</div>' +
          '<span class="badge">' +
          escapeHtml(countLabel) +
          '</span>' +
          '</div>' +
          (grp.uuid
            ? '<div class="meta" style="margin-top:6px"><span class="kv"><strong>UUID:</strong> <code>' +
              renderHighlightedInline(grp.uuid, catalogStore.state.qRaw) +
              '</code></span></div>'
            : '');
      }
      details.appendChild(summary);

      var childWrap = document.createElement('div');
      childWrap.className = depth === 0 ? 'practice-children' : 'topic-children';
      childWrap.appendChild(childFrag);
      for (var dc = 0; dc < matchedDirect.length; dc++) {
        childWrap.appendChild(renderCard(matchedDirect[dc]));
      }
      if (childWrap.childElementCount === 0) {
        var empty = document.createElement('div');
        empty.className = 'note';
        empty.textContent = 'Keine Anforderungen in der aktuellen Filterung.';
        childWrap.appendChild(empty);
      }
      details.appendChild(childWrap);

      (function (id, el) {
        el.addEventListener('toggle', function () {
          uiStore.uiState.catalogExpandOverride = null;
          catalogStore.state.openGroups[id] = el.open;
        });
      })(groupKey, details);

      anyRendered = true;
      return details;
    }

    if (hasGroups) {
      for (var gr = 0; gr < catalogStore.state.groupRoots.length; gr++) {
        var node = renderGroupByKey(catalogStore.state.groupRoots[gr]);
        if (node) uiStore.els.listTab.appendChild(node);
      }
    } else if (hasPractices) {
      for (var p = 0; p < catalogStore.state.practices.length; p++) {
        var prac = catalogStore.state.practices[p];
        var topics = catalogStore.state.topicsByPractice[prac.id] || [];
        var practiceDirect = catalogStore.state.childrenByPractice[prac.id] || [];
        var matchedDirect = [];
        for (var pd = 0; pd < practiceDirect.length; pd++) {
          if (matchedSet[practiceDirect[pd].id]) matchedDirect.push(practiceDirect[pd]);
        }
        // Filter topics by active search/filters
        var topicHasMatch = false;
        for (var ti = 0; ti < topics.length; ti++) {
          var kids = catalogStore.state.childrenByTopic[topics[ti].id] || [];
          for (var kj = 0; kj < kids.length; kj++) {
            if (matchedSet[kids[kj].id]) {
              topicHasMatch = true;
              break;
            }
          }
          if (topicHasMatch) break;
        }
        var practiceHasMatch = topicHasMatch || matchedDirect.length > 0;
        if (active && !practiceHasMatch) continue;

        var pDetails = document.createElement('details');
        pDetails.className = 'practice-group';
        pDetails.open =
          uiStore.uiState.catalogExpandOverride === true
            ? true
            : uiStore.uiState.catalogExpandOverride === false
              ? false
              : active
                ? practiceHasMatch
                : !!catalogStore.state.openPractices[prac.id];

        var pSummary = document.createElement('summary');
        pSummary.className = 'practice-summary';
        var pTitleHtml = renderTextWithParams(prac.title, {}, catalogStore.state.qRaw);
        var practiceTotal = practiceDirect.length,
          practiceMatched = matchedDirect.length;
        for (var pti = 0; pti < topics.length; pti++) {
          var pkids = catalogStore.state.childrenByTopic[topics[pti].id] || [];
          practiceTotal += pkids.length;
          for (var pk = 0; pk < pkids.length; pk++) {
            if (matchedSet[pkids[pk].id]) practiceMatched++;
          }
        }
        var practiceCountLabel = (active ? practiceMatched : practiceTotal) + ' Anforderungen';
        pSummary.innerHTML =
          '' +
          '<div class="practice-header">' +
          '<div class="practice-title"><mark>' +
          escapeHtml(prac.id) +
          '</mark> – <strong>Praktik</strong>: ' +
          pTitleHtml +
          '</div>' +
          '<span class="badge">' +
          escapeHtml(practiceCountLabel) +
          '</span>' +
          '</div>' +
          (prac.uuid
            ? '<div class="meta" style="margin-top:6px"><span class="kv"><strong>UUID:</strong> <code>' +
              renderHighlightedInline(prac.uuid, catalogStore.state.qRaw) +
              '</code></span></div>'
            : '');
        pDetails.appendChild(pSummary);

        var pChild = document.createElement('div');
        pChild.className = 'practice-children';
        pChild.appendChild(renderTopics(topics));
        if (matchedDirect.length) {
          var directWrap = document.createElement('div');
          directWrap.className = 'topic-children';
          for (var dc = 0; dc < matchedDirect.length; dc++) {
            directWrap.appendChild(renderCard(matchedDirect[dc]));
          }
          pChild.appendChild(directWrap);
        }
        pDetails.appendChild(pChild);

        (function (id, el) {
          el.addEventListener('toggle', function () {
            uiStore.uiState.catalogExpandOverride = null;
            catalogStore.state.openPractices[id] = el.open;
          });
        })(prac.id, pDetails);

        uiStore.els.listTab.appendChild(pDetails);
        anyRendered = true;
      }
    } else if (hasTopics) {
      uiStore.els.listTab.appendChild(renderTopics(catalogStore.state.topics));
    } else {
      for (var j = 0; j < matched.length; j++) {
        uiStore.els.listTab.appendChild(renderCard(matched[j]));
      }
      anyRendered = true;
    }

    // Render top-level controls separately only when the catalog also has a group hierarchy.
    // Without groups they were already rendered directly above and must not appear twice.
    if (
      (hasGroups || hasPractices || hasTopics) &&
      catalogStore.state.ungroupedControls &&
      catalogStore.state.ungroupedControls.length
    ) {
      var unc = [];
      for (var u = 0; u < catalogStore.state.ungroupedControls.length; u++) {
        if (matchedSet[catalogStore.state.ungroupedControls[u].id])
          unc.push(catalogStore.state.ungroupedControls[u]);
      }
      if (unc.length) {
        var head = document.createElement('div');
        head.className = 'card';
        head.innerHTML = '<div class="title"><h3>Ohne Thema</h3></div>';
        uiStore.els.listTab.appendChild(head);
        for (var ui = 0; ui < unc.length; ui++) {
          uiStore.els.listTab.appendChild(renderCard(unc[ui]));
        }
        anyRendered = true;
      }
    }

    if (!anyRendered) {
      var noneCard = document.createElement('div');
      noneCard.className = 'card';
      noneCard.textContent = 'Keine Ergebnisse für die aktuelle Filterung.';
      uiStore.els.listTab.appendChild(noneCard);
      uiStore.els.graphInfo.textContent = 'Graph: 0 Knoten';
      return;
    }
    uiStore.els.graphInfo.textContent = 'Graph: ' + matched.length + ' Knoten';
  } catch (e) {
    showMsg(
      '<strong>Fehler beim Rendern der Liste:</strong><br/><code>' +
        escapeHtml(String(e.message || e)) +
        '</code>',
      true,
    );
  }
}
