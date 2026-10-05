/** shared/ui/overview: see docs/architecture.md for responsibilities. */
import { uiStore } from '../../app/store.js';
import { escapeHtml } from '../html.js';

export function updateHeaderSubtitle(view) {
  if (!uiStore.els.viewSubtitle) return;
  var map = {
    home: 'Aktuelle Inhalte aus dem öffentlichen Stand der Technik Repository durchsuchen und öffnen.',
    list: 'Visuell aufbereitete Lese- und Filterungsmöglichkeit für OSCAL-Inhalte.',
    components:
      'Komponentendefinitionen, Capabilities und implementierte Anforderungen strukturiert prüfen.',
    mappings: 'Control-Beziehungen zwischen Katalogen als filterbaren Crosswalk analysieren.',
    graph: 'Beziehungen und Abhängigkeiten als Netz visualisieren und gezielt anspringen.',
    sunburst: 'Verteilungen verdichtet lesen, um Schwerpunkte schnell zu erkennen.',
    bar: 'Mengenverhältnisse zwischen Gruppen, Themen oder Quellen direkt vergleichen.',
    'target-hierarchy':
      'Vererbungsbeziehungen der aktuellen BSI-Zielobjektkategorien nachvollziehen.',
  };
  uiStore.els.viewSubtitle.textContent = map[view] || map.list;
}

export function formatChipValues(values, maxCount) {
  var vals = Array.isArray(values) ? values.slice(0) : [];
  if (!vals.length) return '';
  var max = maxCount || 2;
  if (vals.length <= max) return vals.join(', ');
  return vals.slice(0, max).join(', ') + ' +' + (vals.length - max);
}

export function createChip(text, extraClass) {
  var chip = document.createElement('span');
  chip.className = extraClass || '';
  chip.textContent = text;
  return chip;
}

export function renderOverviewCard(config) {
  if (!uiStore.els.viewSummary) return;
  if (!config) {
    uiStore.els.viewSummary.innerHTML = '';
    uiStore.els.viewSummary.classList.add('hidden');
    return;
  }
  uiStore.els.viewSummary.innerHTML = '';
  uiStore.els.viewSummary.classList.remove('hidden');

  var top = document.createElement('div');
  top.className = 'overview-top';
  top.innerHTML =
    '<div><h2>' +
    escapeHtml(config.title) +
    '</h2><p>' +
    escapeHtml(config.description) +
    '</p></div>';
  uiStore.els.viewSummary.appendChild(top);

  var stats = document.createElement('div');
  stats.className = 'overview-grid';
  var statItems = config.stats || [];
  for (var i = 0; i < statItems.length; i++) {
    var item = statItems[i];
    var card = document.createElement('div');
    card.className = 'overview-stat';
    card.innerHTML =
      '<div class="overview-stat-label">' +
      escapeHtml(item.label) +
      '</div><div class="overview-stat-value">' +
      escapeHtml(String(item.value)) +
      '</div>' +
      (item.note ? '<div class="overview-stat-note">' + escapeHtml(item.note) + '</div>' : '');
    stats.appendChild(card);
  }
  uiStore.els.viewSummary.appendChild(stats);

  var filterTitle = document.createElement('div');
  filterTitle.className = 'overview-section-title';
  filterTitle.textContent = 'Aktueller Fokus';
  uiStore.els.viewSummary.appendChild(filterTitle);

  var chipWrap = document.createElement('div');
  chipWrap.className = 'overview-chip-list';
  var chips = config.chips || [];
  if (chips.length) {
    for (var c = 0; c < chips.length; c++) {
      chipWrap.appendChild(createChip(chips[c], 'overview-chip'));
    }
  } else {
    chipWrap.appendChild(createChip('Keine aktiven Einschränkungen', 'overview-chip neutral'));
  }
  uiStore.els.viewSummary.appendChild(chipWrap);

  if (config.actions && config.actions.length) {
    var actionTitle = document.createElement('div');
    actionTitle.className = 'overview-section-title';
    actionTitle.textContent = 'Schnellaktionen';
    uiStore.els.viewSummary.appendChild(actionTitle);

    var actions = document.createElement('div');
    actions.className = 'overview-actions';
    for (var a = 0; a < config.actions.length; a++) {
      var action = config.actions[a];
      var btn = document.createElement('button');
      btn.className = 'btn small';
      btn.type = 'button';
      btn.textContent = action.label;
      btn.addEventListener('click', action.onClick);
      actions.appendChild(btn);
    }
    uiStore.els.viewSummary.appendChild(actions);
  }
}

export function withDataMode(mode, fn) {
  var prev = uiStore.uiState.dataMode;
  uiStore.uiState.dataMode = mode;
  try {
    return fn();
  } finally {
    uiStore.uiState.dataMode = prev;
  }
}
