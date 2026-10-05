/** features/visualizations/target-hierarchy: see docs/architecture.md for responsibilities. */
import { RefreshViews } from '../../app/actions.js';
import { catalogStore, hierarchyStore, uiStore } from '../../app/store.js';
import * as d3 from 'd3';
import { applyTargetAncestorsForCheckedOptions } from '../catalog/target-filter.js';
import { loadTargetHierarchy } from '../../infrastructure/target-hierarchy.js';

export function clearTargetHierarchyCanvas() {
  if (!uiStore.els.targetHierarchyCanvas) return;
  while (uiStore.els.targetHierarchyCanvas.firstChild)
    uiStore.els.targetHierarchyCanvas.removeChild(uiStore.els.targetHierarchyCanvas.firstChild);
}

export function resetTargetHierarchyDetails() {
  var details = uiStore.els.targetHierarchyDetails;
  if (!details) return;
  details.classList.add('is-empty');
  details.removeAttribute('data-entry-key');
  details.setAttribute('aria-label', 'Details zur Zielobjektkategorie');
  details.scrollTop = 0;
  while (details.firstChild) details.removeChild(details.firstChild);
  var eyebrow = document.createElement('div');
  eyebrow.className = 'target-hierarchy-details-eyebrow';
  eyebrow.textContent = 'Kategorie-Details';
  details.appendChild(eyebrow);
  var heading = document.createElement('h3');
  heading.textContent = 'Kategorie auswählen';
  details.appendChild(heading);
  var copy = document.createElement('p');
  copy.textContent =
    'Bewege den Mauszeiger über eine Zielobjektkategorie oder fokussiere sie mit der Tastatur. Die zugehörigen Angaben erscheinen hier, ohne die Grafik zu verdecken.';
  details.appendChild(copy);
  setTargetHierarchyActiveNode(null);
}

export function setTargetHierarchyActiveNode(node) {
  var activeNodes = uiStore.els.targetHierarchyCanvas
    ? uiStore.els.targetHierarchyCanvas.querySelectorAll('.target-hierarchy-node.is-active')
    : [];
  for (var i = 0; i < activeNodes.length; i++) activeNodes[i].classList.remove('is-active');
  if (node && node.classList) node.classList.add('is-active');
}

export function appendTargetHierarchyDetailsRow(list, label, value) {
  var term = document.createElement('dt');
  term.textContent = label;
  list.appendChild(term);
  var description = document.createElement('dd');
  description.textContent = value || 'Nicht angegeben';
  list.appendChild(description);
}

export function showTargetHierarchyDetails(entry, node) {
  var details = uiStore.els.targetHierarchyDetails;
  if (!details || !entry) return;
  var entryKey = String(entry.uuid || entry.name || '');
  if (
    entryKey &&
    details.getAttribute('data-entry-key') === entryKey &&
    !details.classList.contains('is-empty')
  ) {
    setTargetHierarchyActiveNode(node);
    return;
  }
  details.classList.remove('is-empty');
  details.setAttribute('data-entry-key', entryKey);
  details.setAttribute('aria-label', 'Details zur Zielobjektkategorie ' + entry.name);
  details.scrollTop = 0;
  while (details.firstChild) details.removeChild(details.firstChild);
  var eyebrow = document.createElement('div');
  eyebrow.className = 'target-hierarchy-details-eyebrow';
  eyebrow.textContent = 'Kategorie-Details';
  details.appendChild(eyebrow);
  var heading = document.createElement('h3');
  heading.textContent = entry.name;
  details.appendChild(heading);
  var list = document.createElement('dl');
  appendTargetHierarchyDetailsRow(
    list,
    'Kategorie',
    entry.category && entry.category !== '-' ? entry.category : 'Nicht angegeben',
  );
  appendTargetHierarchyDetailsRow(
    list,
    'Definition',
    entry.definition || 'Keine Definition hinterlegt',
  );
  appendTargetHierarchyDetailsRow(
    list,
    'Synonyme',
    entry.synonyms && entry.synonyms.length
      ? entry.synonyms.join(', ')
      : 'Keine Synonyme hinterlegt',
  );
  details.appendChild(list);
  setTargetHierarchyActiveNode(node);
}

export function renderTargetHierarchyStatus(title, text, retry) {
  clearTargetHierarchyCanvas();
  if (!uiStore.els.targetHierarchyCanvas) return;
  if (uiStore.els.targetHierarchyFitBtn) {
    uiStore.els.targetHierarchyFitBtn.disabled = true;
    uiStore.els.targetHierarchyFitBtn.onclick = null;
  }
  var status = document.createElement('div');
  status.className = 'target-hierarchy-status';
  var card = document.createElement('div');
  card.className = 'target-hierarchy-status-card';
  var heading = document.createElement('strong');
  heading.textContent = title;
  card.appendChild(heading);
  var copy = document.createElement('div');
  copy.textContent = text;
  card.appendChild(copy);
  if (retry) {
    var button = document.createElement('button');
    button.className = 'btn';
    button.type = 'button';
    button.textContent = 'Erneut laden';
    button.addEventListener('click', function () {
      hierarchyStore.targetHierarchyState.status = 'idle';
      hierarchyStore.targetHierarchyState.error = null;
      renderTargetHierarchyView();
    });
    card.appendChild(button);
  }
  status.appendChild(card);
  uiStore.els.targetHierarchyCanvas.appendChild(status);
}

export function targetHierarchyLabelLines(value) {
  var text = String(value || '').trim();
  if (text.length <= 24) return [text];
  var words = text.split(/\s+/);
  var lines = [''];
  for (var i = 0; i < words.length; i++) {
    var candidate = (lines[lines.length - 1] ? lines[lines.length - 1] + ' ' : '') + words[i];
    if (candidate.length <= 24 || !lines[lines.length - 1]) {
      lines[lines.length - 1] = candidate;
    } else if (lines.length < 2) {
      lines.push(words[i]);
    } else {
      lines[1] += ' ' + words[i];
    }
  }
  if (lines.length === 1 && lines[0].length > 24) lines = [lines[0].slice(0, 21) + '…'];
  if (lines.length > 1 && lines[1].length > 24) lines[1] = lines[1].slice(0, 21) + '…';
  return lines.slice(0, 2);
}

export function renderTargetHierarchyView() {
  resetTargetHierarchyDetails();
  if (!uiStore.els.targetHierarchyCanvas) return;
  if (!catalogStore.state.hasTargetObjectCategories) {
    renderTargetHierarchyStatus(
      'Keine Zielobjekthierarchie verfügbar',
      'Der aktive Katalog verwendet die OSCAL-Property „target_object_categories“ nicht.',
      false,
    );
    return;
  }
  if (hierarchyStore.targetHierarchyState.status === 'error') {
    var errorText =
      hierarchyStore.targetHierarchyState.error && hierarchyStore.targetHierarchyState.error.message
        ? hierarchyStore.targetHierarchyState.error.message
        : 'Die aktuelle BSI-Zielobjekthierarchie konnte nicht geladen werden.';
    renderTargetHierarchyStatus(
      'Zielobjekthierarchie konnte nicht geladen werden',
      errorText,
      true,
    );
    return;
  }
  if (hierarchyStore.targetHierarchyState.status !== 'ready') {
    renderTargetHierarchyStatus(
      'Aktuelle Zielobjekthierarchie wird geladen',
      'Die Namespace-Datei wird direkt aus dem öffentlichen BSI Stand der Technik Repository abgerufen.',
      false,
    );
    loadTargetHierarchy()
      .then(function () {
        if (
          uiStore.uiState.view === 'target-hierarchy' &&
          catalogStore.state.hasTargetObjectCategories
        ) {
          applyTargetAncestorsForCheckedOptions();
          RefreshViews();
          renderTargetHierarchyView();
        }
      })
      .catch(function () {
        if (
          uiStore.uiState.view === 'target-hierarchy' &&
          catalogStore.state.hasTargetObjectCategories
        )
          renderTargetHierarchyView();
      });
    return;
  }
  if (typeof d3 === 'undefined') {
    renderTargetHierarchyStatus(
      'Visualisierung nicht verfügbar',
      'D3.js konnte nicht geladen werden.',
      false,
    );
    return;
  }
  if (!hierarchyStore.targetHierarchyState.roots.length) {
    renderTargetHierarchyStatus(
      'Keine Zielobjektkategorien verfügbar',
      'Die geladene Namespace-Datei enthält keine darstellbaren Kategorien.',
      false,
    );
    return;
  }

  clearTargetHierarchyCanvas();
  var canvas = uiStore.els.targetHierarchyCanvas;
  if (uiStore.els.targetHierarchyFitBtn) uiStore.els.targetHierarchyFitBtn.disabled = false;
  var canvasWidth = canvas.clientWidth || 1000;
  var canvasHeight = canvas.clientHeight || 700;
  hierarchyStore.targetHierarchyRenderedCanvasWidth = canvasWidth;
  hierarchyStore.targetHierarchyRenderedCanvasHeight = canvasHeight;
  var width = Math.max(720, canvasWidth);
  var height = Math.max(560, canvasHeight);
  var nodeWidth = 188;
  var nodeHeight = 50;
  var horizontalGap = 238;
  var verticalGap = 72;
  var virtualRoot = {
    name: 'Zielobjektkategorien',
    children: hierarchyStore.targetHierarchyState.roots,
  };
  var root = d3.hierarchy(virtualRoot, function (item) {
    return item.children;
  });
  d3
    .tree()
    .nodeSize([verticalGap, horizontalGap])
    .separation(function (a, b) {
      return a.parent === b.parent ? 1 : 1.18;
    })(root);
  var nodes = root.descendants().filter(function (item) {
    return item.depth > 0;
  });
  var links = root.links().filter(function (item) {
    return item.source.depth > 0;
  });
  var minTreeX =
    d3.min(nodes, function (item) {
      return item.x;
    }) || 0;
  var palette = [
    '#279f92',
    '#ef8a25',
    '#9654b5',
    '#34a59a',
    '#f2a325',
    '#b95182',
    '#3c91b5',
    '#667f9b',
  ];
  var colorByRoot = Object.create(null);
  for (var ri = 0; ri < hierarchyStore.targetHierarchyState.roots.length; ri++)
    colorByRoot[hierarchyStore.targetHierarchyState.roots[ri].uuid] = palette[ri % palette.length];
  function nodeX(item) {
    return 44 + (item.depth - 1) * horizontalGap;
  }
  function nodeY(item) {
    return 44 + (item.x - minTreeX);
  }
  function nodeColor(item) {
    var base = d3.color(colorByRoot[item.data.rootUuid] || palette[0]);
    return item.depth > 1
      ? base.brighter(Math.min(0.42, (item.depth - 1) * 0.11)).formatHex()
      : base.formatHex();
  }

  var svg = d3
    .select(canvas)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', '0 0 ' + width + ' ' + height)
    .attr('role', 'img')
    .attr('aria-label', 'Hierarchie der BSI-Zielobjektkategorien');
  var defs = svg.append('defs');
  defs
    .append('marker')
    .attr('id', 'targetHierarchyArrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 8)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#91a39e');
  var graph = svg.append('g');
  graph
    .selectAll('.target-hierarchy-link')
    .data(links)
    .enter()
    .append('path')
    .attr('class', 'target-hierarchy-link')
    .attr('marker-end', 'url(#targetHierarchyArrow)')
    .attr('d', function (link) {
      var sourceX = nodeX(link.source) + nodeWidth;
      var sourceY = nodeY(link.source) + nodeHeight / 2;
      var targetX = nodeX(link.target);
      var targetY = nodeY(link.target) + nodeHeight / 2;
      var middle = (sourceX + targetX) / 2;
      return (
        'M' +
        sourceX +
        ',' +
        sourceY +
        ' C' +
        middle +
        ',' +
        sourceY +
        ' ' +
        middle +
        ',' +
        targetY +
        ' ' +
        targetX +
        ',' +
        targetY
      );
    });
  var node = graph
    .selectAll('.target-hierarchy-node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'target-hierarchy-node')
    .attr('transform', function (item) {
      return 'translate(' + nodeX(item) + ',' + nodeY(item) + ')';
    })
    .attr('tabindex', 0)
    .attr('role', 'img')
    .attr('aria-controls', 'targetHierarchyDetails')
    .attr('aria-label', function (item) {
      return item.data.name + '. Kategorie: ' + (item.data.category || 'nicht angegeben') + '.';
    });
  node
    .append('rect')
    .attr('width', nodeWidth)
    .attr('height', nodeHeight)
    .attr('rx', 8)
    .attr('fill', nodeColor);
  node.each(function (item) {
    var lines = targetHierarchyLabelLines(item.data.name);
    var text = d3
      .select(this)
      .append('text')
      .attr('x', nodeWidth / 2)
      .attr('text-anchor', 'middle');
    for (var li = 0; li < lines.length; li++) {
      text
        .append('tspan')
        .attr('x', nodeWidth / 2)
        .attr('y', lines.length === 1 ? 30 : li === 0 ? 21 : 37)
        .text(lines[li]);
    }
  });
  node
    .on('mouseenter', function (event, item) {
      showTargetHierarchyDetails(item.data, this);
    })
    .on('focus', function (event, item) {
      showTargetHierarchyDetails(item.data, this);
    })
    .on('click', function (event, item) {
      showTargetHierarchyDetails(item.data, this);
    });

  var zoom = d3
    .zoom()
    .scaleExtent([0.18, 2.6])
    .on('zoom', function (event) {
      graph.attr('transform', event.transform);
    });
  svg.call(zoom);
  function fitHierarchy() {
    var bounds = graph.node().getBBox();
    if (!bounds.width || !bounds.height) return;
    var padding = 48;
    var scale = Math.min(
      1.12,
      Math.min((width - padding * 2) / bounds.width, (height - padding * 2) / bounds.height),
    );
    if (!isFinite(scale) || scale <= 0) scale = 1;
    var tx = width / 2 - scale * (bounds.x + bounds.width / 2);
    var ty = height / 2 - scale * (bounds.y + bounds.height / 2);
    svg
      .transition()
      .duration(320)
      .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }
  if (uiStore.els.targetHierarchyFitBtn) uiStore.els.targetHierarchyFitBtn.onclick = fitHierarchy;

  var summary = document.createElement('div');
  summary.className = 'target-hierarchy-summary';
  var summaryTitle = document.createElement('strong');
  summaryTitle.textContent = 'Zielobjektkategorien';
  summary.appendChild(summaryTitle);
  var counts = document.createElement('span');
  counts.textContent =
    'Alle: ' +
    hierarchyStore.targetHierarchyState.count +
    ' · Wurzelknoten: ' +
    hierarchyStore.targetHierarchyState.roots.length +
    ' · Hierarchieebenen: ' +
    (hierarchyStore.targetHierarchyState.maxDepth + 1);
  summary.appendChild(counts);
  var direction = document.createElement('span');
  direction.className = 'direction';
  direction.textContent = 'Elternknoten → Kindknoten · Allgemein → Speziell';
  summary.appendChild(direction);
  canvas.appendChild(summary);
  requestAnimationFrame(fitHierarchy);
}
