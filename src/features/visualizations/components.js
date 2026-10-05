/** features/visualizations/components: see docs/architecture.md for responsibilities. */
import { goToCatalogControlFromComponent, openComponentLocation } from '../../app/actions.js';
import { uiStore } from '../../app/store.js';
import * as d3 from 'd3';
import { getCatalogControlByRef } from '../../app/catalog-lookup.js';
import { componentOwnerName } from '../../app/components.js';
import { buildComponentGraphData, getMatchedComponentOwners } from '../components/graph-data.js';
import {
  addBarAxisTitles,
  addSunburstCenterLabel,
  addSunburstSegmentLabels,
  renderChartLegend,
  renderSunburstLegend,
  sunburstChartCenterX,
} from './common.js';
import { escapeHtml } from '../../shared/html.js';
import { showMsg } from '../../shared/ui/messages.js';
import { withDataMode } from '../../shared/ui/overview.js';

export function drawComponentGraph() {
  return withDataMode('component', function () {
    try {
      var el = document.getElementById('graph');
      if (!el) return;
      el.classList.remove('chart-unavailable');
      el.innerHTML =
        '<div class="graph-toolbar"><button id="fitBtn" class="btn" title="Alles anzeigen">Alles anzeigen</button></div>';
      if (typeof d3 === 'undefined') {
        el.innerHTML =
          '<div class="card">Die Diagrammbibliothek konnte nicht geladen werden. Bitte lade die Seite erneut.</div>';
        uiStore.compEls.graphInfo.textContent = 'Graph: 0 Knoten';
        return;
      }

      var data = buildComponentGraphData();
      var nodes = data.nodes,
        links = data.links;
      if (!nodes.length) {
        el.classList.add('chart-unavailable');
        el.innerHTML =
          '<div class="card">Keine Daten für den Graphen in der aktuellen Filterung.</div>';
        uiStore.compEls.graphInfo.textContent = 'Graph: 0 Knoten / 0 Kanten';
        return;
      }

      renderChartLegend(
        el,
        'Legende – Komponentendefinitionen',
        [
          { type: 'node', color: '#175cd3', label: 'Capability' },
          { type: 'node', color: '#24364b', label: 'Komponente' },
          { type: 'node', color: '#2f7d5b', label: 'Implementierte Anforderung' },
          { type: 'line', color: '#78a5f5', label: 'Capability integriert Komponente' },
          {
            type: 'line',
            color: '#6fab83',
            label: 'Komponente bzw. Capability implementiert Anforderung',
          },
        ],
        'graph-legend',
        'Knoten können angeklickt werden, um zum zugehörigen Eintrag zu wechseln.',
      );

      var width = el.clientWidth || 900,
        height = el.clientHeight || 600;
      var svg = d3.select(el).append('svg').attr('width', width).attr('height', height);
      var g = svg.append('g');
      var colorMap = { capability: '#175cd3', component: '#24364b', requirement: '#2f7d5b' };
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
            .strength(0.35),
        )
        .force('charge', d3.forceManyBody().strength(-250))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide(36));

      var link = g
        .selectAll('.link')
        .data(links)
        .enter()
        .append('line')
        .attr('stroke', function (d) {
          return d.rel === 'incorporates' ? '#78a5f5' : '#6fab83';
        })
        .attr('stroke-width', 1.8)
        .attr('opacity', 0.9);
      link.append('title').text(function (d) {
        return d.rel === 'incorporates'
          ? 'Capability integriert Komponente'
          : 'Implementiert Anforderung';
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
        .attr('fill', function (d) {
          return colorMap[d.nodeType] || '#4a5975';
        })
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.2);
      node
        .append('text')
        .text(function (d) {
          return d.label;
        })
        .attr('x', 14)
        .attr('y', 4)
        .attr('font-size', '12px')
        .attr('fill', '#162434');
      node.on('click', function (ev, d) {
        if (d.nodeType === 'requirement') {
          if (d.requirement && getCatalogControlByRef(d.requirement.controlId)) {
            goToCatalogControlFromComponent(d.requirement);
          } else {
            openComponentLocation(d.owner, d.requirement);
          }
        } else {
          openComponentLocation(d.owner);
        }
      });

      var zoom = d3
        .zoom()
        .scaleExtent([0.03, 10])
        .on('zoom', function (event) {
          g.attr('transform', event.transform);
        });
      svg.call(zoom);

      function fitToScreen() {
        var minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        for (var i = 0; i < nodes.length; i++) {
          var nx = nodes[i].x || 0,
            ny = nodes[i].y || 0;
          if (nx < minX) minX = nx;
          if (nx > maxX) maxX = nx;
          if (ny < minY) minY = ny;
          if (ny > maxY) maxY = ny;
        }
        var padding = 40;
        var bw = maxX - minX + padding * 2,
          bh = maxY - minY + padding * 2;
        var scale = Math.min((el.clientWidth || 900) / bw, (el.clientHeight || 600) / bh);
        if (!isFinite(scale) || scale <= 0) scale = 1;
        var tx = ((el.clientWidth || 900) - scale * (minX + maxX)) / 2;
        var ty = ((el.clientHeight || 600) - scale * (minY + maxY)) / 2;
        svg
          .transition()
          .duration(400)
          .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
      }

      var fitBtn = document.getElementById('fitBtn');
      if (fitBtn) {
        fitBtn.addEventListener('click', fitToScreen);
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
      sim.on('end', fitToScreen);
      uiStore.compEls.graphInfo.textContent =
        'Graph: ' + nodes.length + ' Knoten / ' + links.length + ' Kanten';
    } catch (e) {
      showMsg(
        '<strong>Fehler beim Rendern des Komponenten-Graphen:</strong><br/><code>' +
          escapeHtml(String(e.message || e)) +
          '</code>',
        true,
      );
    }
  });
}

export function drawComponentSunburst() {
  return withDataMode('component', function () {
    var container = document.getElementById('sunburst');
    container.innerHTML = '';
    if (typeof d3 === 'undefined') {
      container.innerHTML = '<div class="card">D3 wurde nicht geladen.</div>';
      return;
    }
    var matched = getMatchedComponentOwners();
    var dataItems = [];
    for (var i = 0; i < matched.components.length; i++) {
      var comp = matched.components[i];
      var impls = comp.controlImplementations || [];
      var reqCount = 0;
      for (var ii = 0; ii < impls.length; ii++) {
        reqCount += (impls[ii].requirements || []).length;
      }
      if (reqCount > 0) {
        dataItems.push({ name: componentOwnerName(comp), value: reqCount });
      }
    }
    if (!dataItems.length) {
      container.innerHTML =
        '<div class="card">Keine Komponenten mit implementierten Anforderungen in der aktuellen Filterung.</div>';
      return;
    }
    dataItems.sort(function (a, b) {
      return b.value - a.value || a.name.localeCompare(b.name, 'de');
    });
    var data = { name: 'Komponenten', children: dataItems };
    var w = container.clientWidth || 900,
      h = container.clientHeight || 600,
      r = Math.min(w, h) / 2 - 36;
    var root = d3.hierarchy(data).sum(function (d) {
      return d.value || 0;
    });
    d3.partition().size([2 * Math.PI, r])(root);
    var color = d3.scaleOrdinal(d3.schemeTableau10).domain(
      dataItems.map(function (item) {
        return item.name;
      }),
    );
    renderSunburstLegend(
      container,
      'Komponenten',
      dataItems.map(function (item) {
        return { type: 'swatch', color: color(item.name), label: item.name, value: item.value };
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
        return Math.max(d.y0, r * 0.48);
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
        return d.data.name + ': ' + d.value;
      });
    addSunburstSegmentLabels(g, nodes, r, 0.48, function (d) {
      return d.data.name;
    });
    addSunburstCenterLabel(g, 'Komponenten', root.value, 'Anforderungen');
  });
}

export function drawComponentBar() {
  return withDataMode('component', function () {
    var container = document.getElementById('bar');
    container.innerHTML = '';
    if (typeof d3 === 'undefined') {
      container.innerHTML = '<div class="card">D3 wurde nicht geladen.</div>';
      return;
    }
    var matched = getMatchedComponentOwners();
    var data = [];
    for (var i = 0; i < matched.components.length; i++) {
      var comp = matched.components[i];
      var impls = comp.controlImplementations || [];
      var reqCount = 0;
      for (var ii = 0; ii < impls.length; ii++) {
        reqCount += (impls[ii].requirements || []).length;
      }
      if (reqCount > 0) {
        data.push({ group: componentOwnerName(comp), value: reqCount });
      }
    }
    data.sort(function (a, b) {
      return b.value - a.value || a.group.localeCompare(b.group);
    });
    var keys = data.map(function (item) {
      return item.group;
    });
    if (!keys.length) {
      container.innerHTML =
        '<div class="card">Keine Komponenten mit implementierten Anforderungen in der aktuellen Filterung.</div>';
      return;
    }
    var margin = { top: 30, right: 20, bottom: 40, left: 76 };
    var fullWidth = container.clientWidth || 900;
    var baseHeight = container.clientHeight || 600;
    var w = fullWidth - margin.left - margin.right;
    var tempX = d3.scaleBand().domain(keys).range([0, w]).padding(0.2);
    function estimateWrappedLines(label, maxWidthPx) {
      var avgCharPx = 6.8;
      var maxChars = Math.max(8, Math.floor(maxWidthPx / avgCharPx));
      var words = String(label || '').split(/\s+/);
      var lines = [];
      var current = '';
      for (var wi = 0; wi < words.length; wi++) {
        var word = words[wi];
        if (!current) {
          current = word;
          continue;
        }
        if ((current + ' ' + word).length <= maxChars) {
          current += ' ' + word;
        } else {
          lines.push(current);
          current = word;
        }
      }
      if (current) {
        lines.push(current);
      }
      if (!lines.length) {
        lines = [''];
      }
      return lines;
    }
    var maxLabelLines = 1;
    for (var li = 0; li < keys.length; li++) {
      var lineCount = estimateWrappedLines(keys[li], Math.max(80, tempX.bandwidth())).length;
      if (lineCount > maxLabelLines) maxLabelLines = lineCount;
    }
    margin.bottom = Math.max(116, 52 + maxLabelLines * 16);
    var h = baseHeight - margin.top - margin.bottom;
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
      .call(d3.axisBottom(x).tickFormat(''));
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
      });
    g.selectAll('.bar')
      .append('title')
      .text(function (d) {
        return d.group + ': ' + d.value;
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
      .style('font-size', '11px')
      .style('font-weight', '700')
      .text(function (d) {
        return d.value;
      });
    var labelLayer = g.append('g').attr('class', 'component-bar-axis-labels');
    labelLayer
      .selectAll('text')
      .data(data)
      .enter()
      .append('text')
      .attr('x', function (d) {
        return x(d.group) + x.bandwidth() / 2;
      })
      .attr('y', h + 18)
      .attr('text-anchor', 'middle')
      .attr('fill', '#40566f')
      .style('font-size', '11px')
      .each(function (d) {
        var text = d3.select(this);
        var lines = estimateWrappedLines(d.group, Math.max(80, x.bandwidth()));
        for (var i = 0; i < lines.length; i++) {
          text
            .append('tspan')
            .attr('x', x(d.group) + x.bandwidth() / 2)
            .attr('dy', i === 0 ? 0 : 14)
            .text(lines[i]);
        }
      })
      .append('title')
      .text(function (d) {
        return d.group;
      });
    addBarAxisTitles(g, w, h, margin, 'Komponente', 'Anzahl implementierter Anforderungen');
  });
}
