/** features/visualizations/mappings: see docs/architecture.md for responsibilities. */
import * as d3 from 'd3';
import {
  addBarAxisTitles,
  addSunburstCenterLabel,
  addSunburstSegmentLabels,
  renderChartLegend,
  renderSunburstLegend,
  sunburstChartCenterX,
  sunburstInnerRadius,
  visibleMappingEntries,
} from './common.js';

export function drawMappingGraph() {
  var el = document.getElementById('graph');
  if (!el) return;
  el.classList.remove('chart-unavailable');
  el.innerHTML =
    '<div class="graph-toolbar"><button id="fitBtn" class="btn" title="Alles anzeigen">Alles anzeigen</button></div>';
  if (typeof d3 === 'undefined') {
    el.innerHTML = '<div class="card">D3 wurde nicht geladen.</div>';
    return;
  }
  var entries = visibleMappingEntries();
  var nodeMap = {};
  var nodes = [];
  var links = [];
  function addNode(id, label, catalog, side) {
    if (nodeMap[id]) return nodeMap[id];
    var node = { id: id, label: label, catalog: catalog, side: side };
    nodeMap[id] = node;
    nodes.push(node);
    return node;
  }
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    for (var s = 0; s < entry.sourceRefs.length; s++) {
      var sourceId = 'source|' + entry.sourceCatalog + '|' + entry.sourceRefs[s];
      addNode(
        sourceId,
        entry.sourceRefs[s],
        entry.sourceCatalogDisplay || entry.sourceCatalog || 'Source',
        'source',
      );
      for (var t = 0; t < entry.targetRefs.length; t++) {
        var targetId = 'target|' + entry.targetCatalog + '|' + entry.targetRefs[t];
        addNode(
          targetId,
          entry.targetRefs[t],
          entry.targetCatalogDisplay || entry.targetCatalog || 'Target',
          'target',
        );
        links.push({
          source: sourceId,
          target: targetId,
          relationship: entry.relationship || 'unspecified',
        });
      }
    }
  }
  if (!nodes.length) {
    el.classList.add('chart-unavailable');
    el.innerHTML =
      '<div class="card">Keine Mapping-Daten für den Graphen vorhanden. Lade ein Mapping oder passe die aktiven Filter an.</div>';
    return;
  }
  renderChartLegend(
    el,
    'Legende – Mappings',
    [
      { type: 'node', color: '#175cd3', label: 'Source-Control' },
      { type: 'node', color: '#94611d', label: 'Target-Control' },
      { type: 'line', color: '#5d7898', label: 'Mapping-Richtung: Source → Target', arrow: true },
    ],
    'graph-legend',
    'Der genaue Relationship-Typ einer Verbindung wird beim Überfahren der Linie angezeigt.',
  );
  var width = el.clientWidth || 900;
  var height = el.clientHeight || 600;
  var svg = d3.select(el).append('svg').attr('width', width).attr('height', height);
  var g = svg.append('g');
  svg
    .append('defs')
    .append('marker')
    .attr('id', 'mappingArrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 22)
    .attr('refY', 0)
    .attr('markerWidth', 7)
    .attr('markerHeight', 7)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#5d7898');
  var sim = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3
        .forceLink(links)
        .id(function (d) {
          return d.id;
        })
        .distance(150)
        .strength(0.35),
    )
    .force('charge', d3.forceManyBody().strength(-310))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide(42));
  var link = g
    .selectAll('.mapping-graph-link')
    .data(links)
    .enter()
    .append('line')
    .attr('class', 'mapping-graph-link')
    .attr('stroke', '#5d7898')
    .attr('stroke-width', 1.6)
    .attr('marker-end', 'url(#mappingArrow)')
    .attr('opacity', 0.78);
  link.append('title').text(function (d) {
    return d.relationship;
  });
  var node = g
    .selectAll('.mapping-graph-node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'mapping-graph-node')
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
    .attr('r', 11)
    .attr('fill', function (d) {
      return d.side === 'source' ? '#175cd3' : '#94611d';
    })
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5);
  node
    .append('text')
    .attr('x', 16)
    .attr('y', 4)
    .attr('fill', '#162434')
    .attr('font-size', '12px')
    .attr('font-weight', '700')
    .text(function (d) {
      return d.label;
    });
  node.append('title').text(function (d) {
    return (d.side === 'source' ? 'Source: ' : 'Target: ') + d.catalog + ' · ' + d.label;
  });
  var zoom = d3
    .zoom()
    .scaleExtent([0.05, 8])
    .on('zoom', function (ev) {
      g.attr('transform', ev.transform);
    });
  svg.call(zoom);
  function fit() {
    var bounds = g.node().getBBox();
    if (!bounds.width || !bounds.height) return;
    var scale = Math.min(
      0.95,
      Math.min(width / (bounds.width + 80), height / (bounds.height + 80)),
    );
    var tx = width / 2 - scale * (bounds.x + bounds.width / 2);
    var ty = height / 2 - scale * (bounds.y + bounds.height / 2);
    svg
      .transition()
      .duration(350)
      .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }
  var fitBtn = document.getElementById('fitBtn');
  if (fitBtn) fitBtn.addEventListener('click', fit);
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
  sim.on('end', fit);
}

export function drawMappingSunburst() {
  var container = document.getElementById('sunburst');
  container.classList.remove('chart-unavailable');
  container.innerHTML = '';
  if (typeof d3 === 'undefined') {
    container.innerHTML = '<div class="card">D3 wurde nicht geladen.</div>';
    return;
  }
  var entries = visibleMappingEntries();
  var grouped = {};
  for (var i = 0; i < entries.length; i++) {
    var catalog = entries[i].sourceCatalog || 'Source-Katalog';
    var relationship = entries[i].relationship || 'unspecified';
    if (!grouped[catalog]) grouped[catalog] = {};
    grouped[catalog][relationship] = (grouped[catalog][relationship] || 0) + 1;
  }
  var catalogs = Object.keys(grouped);
  if (!catalogs.length) {
    container.innerHTML =
      '<div class="card">Keine Mapping-Daten für das Sunburst-Diagramm vorhanden.</div>';
    return;
  }
  var data = {
    name: 'Mappings',
    children: catalogs.map(function (catalog) {
      return {
        name: catalog,
        children: Object.keys(grouped[catalog]).map(function (rel) {
          return { name: rel, value: grouped[catalog][rel] };
        }),
      };
    }),
  };
  var w = container.clientWidth || 900,
    h = container.clientHeight || 600,
    r = Math.min(w, h) / 2 - 24;
  var root = d3.hierarchy(data).sum(function (d) {
    return d.value || 0;
  });
  d3.partition().size([2 * Math.PI, r])(root);
  var color = d3.scaleOrdinal(d3.schemeTableau10).domain(catalogs);
  renderSunburstLegend(
    container,
    'Source-Kataloge',
    catalogs.map(function (catalog) {
      var total = Object.keys(grouped[catalog]).reduce(function (sum, rel) {
        return sum + grouped[catalog][rel];
      }, 0);
      return { type: 'swatch', color: color(catalog), label: catalog, value: total };
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
      return sunburstInnerRadius(d, r, 0.28);
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
      var top = d;
      while (top.depth > 1) top = top.parent;
      var base = d3.color(color(top.data.name));
      return d.depth > 1 ? base.brighter(0.35) : base;
    })
    .attr('stroke', '#fff')
    .append('title')
    .text(function (d) {
      return (
        d
          .ancestors()
          .reverse()
          .slice(1)
          .map(function (item) {
            return item.data.name;
          })
          .join(' › ') +
        ': ' +
        d.value
      );
    });
  addSunburstSegmentLabels(g, nodes, r, 0.28, function (d) {
    return d.data.name;
  });
  addSunburstCenterLabel(g, 'Mappings', root.value, 'Beziehungen');
}

export function drawMappingBar() {
  var container = document.getElementById('bar');
  container.classList.remove('chart-unavailable');
  container.innerHTML = '';
  if (typeof d3 === 'undefined') {
    container.innerHTML = '<div class="card">D3 wurde nicht geladen.</div>';
    return;
  }
  var counts = {};
  var entries = visibleMappingEntries();
  for (var i = 0; i < entries.length; i++) {
    var rel = entries[i].relationship || 'unspecified';
    counts[rel] = (counts[rel] || 0) + 1;
  }
  var keys = Object.keys(counts).sort(function (a, b) {
    return counts[b] - counts[a] || a.localeCompare(b);
  });
  if (!keys.length) {
    container.innerHTML =
      '<div class="card">Keine Mapping-Daten für das Balkendiagramm vorhanden.</div>';
    return;
  }
  var margin = { top: 36, right: 24, bottom: 108, left: 76 };
  var w = (container.clientWidth || 900) - margin.left - margin.right;
  var h = (container.clientHeight || 600) - margin.top - margin.bottom;
  var x = d3.scaleBand().domain(keys).range([0, w]).padding(0.28);
  var y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(keys, function (k) {
        return counts[k];
      }),
    ])
    .nice()
    .range([h, 0]);
  var svg = d3
    .select(container)
    .append('svg')
    .attr('width', w + margin.left + margin.right)
    .attr('height', h + margin.top + margin.bottom);
  var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  g.append('g')
    .attr('transform', 'translate(0,' + h + ')')
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('transform', 'rotate(-24)')
    .style('text-anchor', 'end')
    .attr('fill', '#40566f');
  g.append('g')
    .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format('d')))
    .selectAll('text')
    .attr('fill', '#40566f');
  g.selectAll('.mapping-bar')
    .data(keys)
    .enter()
    .append('rect')
    .attr('class', 'mapping-bar')
    .attr('x', function (k) {
      return x(k);
    })
    .attr('y', function (k) {
      return y(counts[k]);
    })
    .attr('width', x.bandwidth())
    .attr('height', function (k) {
      return h - y(counts[k]);
    })
    .attr('fill', '#175cd3')
    .append('title')
    .text(function (k) {
      return k + ': ' + counts[k];
    });
  g.selectAll('.mapping-bar-label')
    .data(keys)
    .enter()
    .append('text')
    .attr('x', function (k) {
      return x(k) + x.bandwidth() / 2;
    })
    .attr('y', function (k) {
      return y(counts[k]) - 7;
    })
    .attr('text-anchor', 'middle')
    .attr('fill', '#1b3148')
    .attr('font-size', '12px')
    .attr('font-weight', '700')
    .text(function (k) {
      return counts[k];
    });
  addBarAxisTitles(g, w, h, margin, 'Relationship-Typ', 'Anzahl Mapping-Beziehungen');
}
