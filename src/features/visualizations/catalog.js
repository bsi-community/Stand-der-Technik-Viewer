/** features/visualizations/catalog: see docs/architecture.md for responsibilities. */
import { renderList, switchTab } from '../../app/actions.js';
import { catalogStore, uiStore } from '../../app/store.js';
import { SDT_PRACTICES } from '../../config.js';
import * as d3 from 'd3';
import { openGroupChain } from '../catalog/card.js';
import { catalogPrimaryGroupFacetLabel } from '../catalog/hierarchy-filters.js';
import { baseMatches, matches } from '../catalog/selectors.js';
import {
  addBarAxisTitles,
  addSunburstCenterLabel,
  addSunburstSegmentLabels,
  renderChartLegend,
  renderSunburstLegend,
  sunburstChartCenterX,
  sunburstInnerRadius,
} from './common.js';
import { drawComponentBar, drawComponentGraph, drawComponentSunburst } from './components.js';
import { drawMappingBar, drawMappingGraph, drawMappingSunburst } from './mappings.js';
import { StrSet, makeSetFromArray, splitMulti, uniqueList } from '../../shared/collections.js';
import { cssId } from '../../shared/dom.js';
import { escapeHtml } from '../../shared/html.js';
import { showMsg } from '../../shared/ui/messages.js';

export function drawGraph() {
  if (uiStore.uiState.dataMode === 'component') {
    drawComponentGraph();
    return;
  }
  if (uiStore.uiState.dataMode === 'mapping') {
    drawMappingGraph();
    return;
  }
  try {
    var el = document.getElementById('graph');
    if (!el) return;
    el.classList.remove('chart-unavailable');
    el.innerHTML =
      '<div class="graph-toolbar"><button id="fitBtn" class="btn" title="Alles anzeigen">Alles anzeigen</button></div>';

    if (typeof d3 === 'undefined') {
      el.innerHTML =
        '<div class="card">Die Diagrammbibliothek konnte nicht geladen werden. Bitte lade die Seite erneut.</div>';
      uiStore.els.graphInfo.textContent = 'Graph: 0 Knoten';
      return;
    }

    function normalizeEdges(edges) {
      var out = [];
      if (!edges || !edges.length) return out;
      for (var i = 0; i < edges.length; i++) {
        var e = edges[i];
        if (!e) continue;
        var s = e.source && typeof e.source === 'object' ? e.source.id : e.source;
        var t = e.target && typeof e.target === 'object' ? e.target.id : e.target;
        s = String(s);
        t = String(t);
        var rel = e.rel || '';
        // Bei "required"-Beziehungen soll der Pfeil von der Voraussetzung zur abhängigen Anforderung zeigen.
        if (rel === 'required') {
          var tmp = s;
          s = t;
          t = tmp;
        }
        out.push({ source: s, target: t, rel: rel });
      }
      return out;
    }

    var normEdges = normalizeEdges(catalogStore.state.edgesBase);

    var primary = [];
    for (var i = 0; i < catalogStore.state.controls.length; i++) {
      var c = catalogStore.state.controls[i];
      if (baseMatches(c)) primary.push(c);
    }
    var primaryIds = makeSetFromArray(
      primary.map(function (c) {
        return c.id;
      }),
    );

    var incidentEdges = [];
    for (var ie = 0; ie < normEdges.length; ie++) {
      var e = normEdges[ie];
      if (primaryIds.has(e.source) || primaryIds.has(e.target)) incidentEdges.push(e);
    }

    var nodeIdSet = new StrSet();
    for (var p = 0; p < primary.length; p++) {
      nodeIdSet.add(primary[p].id);
    }
    for (var j = 0; j < incidentEdges.length; j++) {
      nodeIdSet.add(incidentEdges[j].source);
      nodeIdSet.add(incidentEdges[j].target);
    }

    var ids = nodeIdSet.values();
    var nodes = [];
    for (var n = 0; n < ids.length; n++) {
      var cn = catalogStore.state.idMap.get(ids[n]);
      if (cn) {
        nodes.push({
          id: cn.id,
          title: cn.title,
          group: (cn.path && cn.path[0]) || '',
          cls: cn.class || '',
          topicId: cn.topicId || '',
          groupKey: cn.groupKey || '',
        });
      }
    }
    var links = [];
    for (var m = 0; m < incidentEdges.length; m++) {
      links.push({
        source: incidentEdges[m].source,
        target: incidentEdges[m].target,
        rel: incidentEdges[m].rel,
      });
    }

    if (!nodes.length) {
      el.classList.add('chart-unavailable');
      el.innerHTML =
        '<div class="card">Keine Daten für den Graphen in der aktuellen Filterung.</div>';
      uiStore.els.graphInfo.textContent = 'Graph: 0 Knoten / 0 Kanten';
      return;
    }

    renderChartLegend(
      el,
      'Legende – Kataloge',
      [
        { type: 'node', color: '#24364b', label: 'Anforderung' },
        { type: 'line', color: '#5f8fe6', label: 'Verwandte Anforderung (related)' },
        {
          type: 'line',
          color: '#c9871f',
          label: 'Voraussetzung → abhängige Anforderung (required)',
          arrow: true,
        },
      ],
      'graph-legend',
      'Knoten können angeklickt werden, um direkt zur Anforderung zu wechseln.',
    );

    var width = el.clientWidth || (el.parentElement && el.parentElement.clientWidth) || 900;
    var height = el.clientHeight || 600;
    var svg = d3.select(el).append('svg').attr('width', width).attr('height', height);
    var g = svg.append('g');

    svg
      .append('defs')
      .append('marker')
      .attr('id', 'depArrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#c9871f');

    var sim = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id(function (d) {
            return d.id;
          })
          .distance(120)
          .strength(0.25),
      )
      .force('charge', d3.forceManyBody().strength(-240))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(40));

    var link = g
      .selectAll('.link')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', function (d) {
        return d.rel === 'required' ? '#c9871f' : '#5f8fe6';
      })
      .attr('stroke-width', 1.5)
      .attr('marker-end', function (d) {
        return d.rel === 'required' ? 'url(#depArrow)' : null;
      })
      .attr('opacity', 0.9);
    link.append('title').text(function (d) {
      return d.rel === 'required'
        ? 'required: Voraussetzung → abhängige Anforderung'
        : 'related: verwandte Anforderungen';
    });

    var node = g
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(
        d3
          .drag()
          .on('start', function (ev, d) {
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', function (ev, d) {
            d.fx = ev.x;
            d.fy = ev.y;
          })
          .on('end', function (ev, d) {
            d.fx = null;
            d.fy = null;
          }),
      );

    node
      .append('circle')
      .attr('r', 10)
      .attr('fill', '#24364b')
      .attr('stroke', '#5f8fe6')
      .attr('stroke-width', 1.5);
    node
      .append('text')
      .text(function (d) {
        return d.id;
      })
      .attr('x', 14)
      .attr('y', 4)
      .attr('font-size', '12px')
      .attr('fill', '#162434');
    node.on('click', function (ev, d) {
      switchTab('list');
      if (d.groupKey) {
        openGroupChain(d.groupKey);
      }
      var topicId = d.topicId || '';
      if (topicId) {
        catalogStore.state.openTopics[topicId] = true;
        var topic =
          catalogStore.state.topicById && catalogStore.state.topicById.get
            ? catalogStore.state.topicById.get(topicId)
            : null;
        if (topic && topic.practiceId) {
          catalogStore.state.openPractices[topic.practiceId] = true;
        }
      }
      catalogStore.state.openControls[d.id] = true;
      renderList();
      setTimeout(function () {
        var card = document.getElementById('card-' + cssId(d.id));
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.add('highlight');
          setTimeout(function () {
            card.classList.remove('highlight');
          }, 1500);
        }
      }, 0);
    });

    var autoFitDone = false;
    var userInteracted = false;

    var zoom = d3
      .zoom()
      .scaleExtent([0.03, 10])
      .on('zoom', function (event) {
        g.attr('transform', event.transform);
        if (event.sourceEvent) {
          userInteracted = true;
        }
      });
    svg.call(zoom);

    function fitToScreenInternal() {
      var minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = Infinity * -1;
      for (var i = 0; i < nodes.length; i++) {
        var nx = nodes[i].x || 0,
          ny = nodes[i].y || 0;
        if (nx < minX) minX = nx;
        if (nx > maxX) maxX = nx;
        if (ny < minY) minY = ny;
        if (ny > maxY) maxY = ny;
      }
      var padding = 40;
      var bw = maxX - minX + padding * 2;
      var bh = maxY - minY + padding * 2;
      var scale = Math.min((el.clientWidth || 900) / bw, (el.clientHeight || 600) / bh);
      if (!isFinite(scale) || scale <= 0) scale = 1;
      if (scale < 0.03) scale = 0.03;
      if (scale > 10) scale = 10;
      var tx = ((el.clientWidth || 900) - scale * (minX + maxX)) / 2;
      var ty = ((el.clientHeight || 600) - scale * (minY + maxY)) / 2;
      svg
        .transition()
        .duration(400)
        .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }

    function autoFitToScreen() {
      if (autoFitDone || userInteracted) return;
      autoFitDone = true;
      fitToScreenInternal();
    }

    function manualFitToScreen() {
      fitToScreenInternal();
    }

    var fitBtn = document.getElementById('fitBtn');
    if (fitBtn) {
      fitBtn.addEventListener('click', manualFitToScreen);
    }

    sim.on('tick', function () {
      link
        .attr('x1', function (d) {
          return d.source.x;
        })
        .attr('y1', function (d) {
          return d.source.y;
        })
        .attr('x2', function (d) {
          return d.target.x;
        })
        .attr('y2', function (d) {
          return d.target.y;
        });
      node.attr('transform', function (d) {
        return 'translate(' + d.x + ',' + d.y + ')';
      });
    });
    sim.on('end', autoFitToScreen);

    uiStore.els.graphInfo.textContent =
      'Graph: ' + nodes.length + ' Knoten / ' + links.length + ' Kanten';
  } catch (e) {
    showMsg(
      '<strong>Fehler beim Rendern des Graphen:</strong><br/><code>' +
        escapeHtml(String(e.message || e)) +
        '</code>',
      true,
    );
  }
}

export function incrementDiagramCount(bucket, key) {
  var label = String(key || '').trim() || 'Ohne Angabe';
  bucket[label] = (bucket[label] || 0) + 1;
}

export function buildCatalogDiagramStats() {
  var result = { counts: {}, modalverbs: {}, securityLevels: {} };
  for (var i = 0; i < catalogStore.state.controls.length; i++) {
    var control = catalogStore.state.controls[i];
    if (!matches(control)) continue;
    var group = (control.groupPath && control.groupPath[0]) || 'Ohne Gruppe';
    incrementDiagramCount(result.counts, group);
    if (!result.modalverbs[group]) result.modalverbs[group] = {};
    if (!result.securityLevels[group]) result.securityLevels[group] = {};

    var modalValues = Array.isArray(control.modalverbsArr)
      ? control.modalverbsArr.slice()
      : splitMulti(control.modalverbs);
    modalValues = uniqueList(
      modalValues
        .map(function (value) {
          return String(value || '').trim();
        })
        .filter(Boolean),
    );
    if (!modalValues.length) modalValues = ['Ohne Angabe'];
    for (var mi = 0; mi < modalValues.length; mi++)
      incrementDiagramCount(result.modalverbs[group], modalValues[mi]);

    var securityValues = uniqueList(
      splitMulti(control.sec)
        .map(function (value) {
          return String(value || '').trim();
        })
        .filter(Boolean),
    );
    if (!securityValues.length) securityValues = ['Ohne Angabe'];
    for (var si = 0; si < securityValues.length; si++)
      incrementDiagramCount(result.securityLevels[group], securityValues[si]);
  }
  return result;
}

export function diagramGroupTitle(group) {
  var normalized = String(group || '')
    .trim()
    .toUpperCase();
  for (var i = 0; i < SDT_PRACTICES.length; i++) {
    if (SDT_PRACTICES[i].id === normalized) return SDT_PRACTICES[i].title;
  }
  return String(group || 'Ohne Gruppe');
}

export function appendDiagramTooltipCounts(lines, heading, counts) {
  lines.push(heading + ':');
  var keys = Object.keys(counts || {}).sort(function (a, b) {
    return a.localeCompare(b, 'de');
  });
  if (!keys.length) {
    lines.push('Ohne Angabe: 0');
    return;
  }
  for (var i = 0; i < keys.length; i++) lines.push(keys[i] + ': ' + counts[keys[i]]);
}

export function buildDiagramTooltip(group, value, stats) {
  var lines = [diagramGroupTitle(group) + ' (' + group + '): ' + value];
  appendDiagramTooltipCounts(lines, 'Modalverben', stats.modalverbs[group]);
  appendDiagramTooltipCounts(lines, 'Sicherheitsniveaus', stats.securityLevels[group]);
  return lines.join('\n');
}

export function drawSunburst() {
  if (uiStore.uiState.dataMode === 'component') {
    drawComponentSunburst();
    return;
  }
  if (uiStore.uiState.dataMode === 'mapping') {
    drawMappingSunburst();
    return;
  }
  var container = document.getElementById('sunburst');
  container.innerHTML = '';
  if (typeof d3 === 'undefined') {
    container.innerHTML = '<div class="card">D3 wurde nicht geladen.</div>';
    return;
  }

  var diagramStats = buildCatalogDiagramStats();
  var counts = diagramStats.counts;
  var keys = Object.keys(counts).sort(function (a, b) {
    return counts[b] - counts[a] || a.localeCompare(b, 'de');
  });
  if (!keys.length) {
    container.innerHTML = '<div class="card">Keine Daten für die aktuelle Filterung.</div>';
    return;
  }

  var data = {
    name: catalogPrimaryGroupFacetLabel(),
    children: keys.map(function (k) {
      return { name: k, value: counts[k] };
    }),
  };

  var w = container.clientWidth || 900;
  var h = container.clientHeight || 600;
  var r = Math.min(w, h) / 2 - 30;

  var color = d3.scaleOrdinal(d3.schemeTableau10).domain(keys);

  var root = d3.hierarchy(data).sum(function (d) {
    return d.value || 0;
  });
  d3.partition().size([2 * Math.PI, r])(root);

  renderSunburstLegend(
    container,
    catalogPrimaryGroupFacetLabel(),
    keys.map(function (key) {
      return { type: 'swatch', color: color(key), label: key, value: counts[key] };
    }),
  );

  var svg = d3.select(container).append('svg').attr('width', w).attr('height', h);
  var g = svg
    .append('g')
    .attr('transform', 'translate(' + sunburstChartCenterX(w, r) + ',' + h / 2 + ')');

  var arc = d3
    .arc()
    .startAngle(function (d) {
      return d.x0;
    })
    .endAngle(function (d) {
      return d.x1;
    })
    .innerRadius(function (d) {
      return sunburstInnerRadius(d, r, 0.38);
    })
    .outerRadius(function (d) {
      return d.y1;
    });

  var nodes = root.descendants().filter(function (d) {
    return d.depth;
  });

  g.selectAll('path')
    .data(nodes)
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', function (d) {
      return color(d.data.name);
    })
    .attr('stroke', '#ffffff')
    .append('title')
    .text(function (d) {
      return buildDiagramTooltip(d.data.name, d.value, diagramStats);
    });
  addSunburstSegmentLabels(g, nodes, r, 0.38, function (d) {
    return d.data.name;
  });
  addSunburstCenterLabel(g, 'Katalog', root.value, 'Anforderungen');
}

export function drawBar() {
  if (uiStore.uiState.dataMode === 'component') {
    drawComponentBar();
    return;
  }
  if (uiStore.uiState.dataMode === 'mapping') {
    drawMappingBar();
    return;
  }
  var container = document.getElementById('bar');
  container.innerHTML = '';
  if (typeof d3 === 'undefined') {
    container.innerHTML = '<div class="card">D3 wurde nicht geladen.</div>';
    return;
  }

  var diagramStats = buildCatalogDiagramStats();
  var counts = diagramStats.counts;
  var keys = Object.keys(counts).sort();
  if (!keys.length) {
    container.innerHTML = '<div class="card">Keine Daten für die aktuelle Filterung.</div>';
    return;
  }

  var data = keys.map(function (k) {
    return { group: k, value: counts[k] };
  });

  var margin = { top: 30, right: 20, bottom: 108, left: 76 };
  var w = (container.clientWidth || 900) - margin.left - margin.right;
  var h = (container.clientHeight || 600) - margin.top - margin.bottom;

  var svg = d3
    .select(container)
    .append('svg')
    .attr('width', w + margin.left + margin.right)
    .attr('height', h + margin.top + margin.bottom);
  var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var x = d3.scaleBand().domain(keys).range([0, w]).padding(0.2);
  var y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data, function (d) {
        return d.value;
      }),
    ])
    .nice()
    .range([h, 0]);

  var color = d3.scaleOrdinal(d3.schemeTableau10).domain(keys);

  g.append('g')
    .attr('transform', 'translate(0,' + h + ')')
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('transform', 'rotate(-25)')
    .style('text-anchor', 'end')
    .attr('fill', '#40566f');
  g.append('g')
    .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format('d')))
    .selectAll('text')
    .attr('fill', '#40566f');
  g.selectAll('.domain, .tick line').attr('stroke', '#c3d1e0');

  g.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', function (d) {
      return x(d.group);
    })
    .attr('y', function (d) {
      return y(d.value);
    })
    .attr('width', x.bandwidth())
    .attr('height', function (d) {
      return h - y(d.value);
    })
    .attr('fill', function (d) {
      return color(d.group);
    })
    .append('title')
    .text(function (d) {
      return buildDiagramTooltip(d.group, d.value, diagramStats);
    });

  g.selectAll('.bar-label')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'bar-label')
    .attr('x', function (d) {
      return x(d.group) + x.bandwidth() / 2;
    })
    .attr('y', function (d) {
      return y(d.value) - 6;
    })
    .attr('text-anchor', 'middle')
    .attr('fill', '#1b3148')
    .style('font-size', '12px')
    .text(function (d) {
      return d.value;
    });
  addBarAxisTitles(g, w, h, margin, catalogPrimaryGroupFacetLabel(), 'Anzahl Anforderungen');
}
