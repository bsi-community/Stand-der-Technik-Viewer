/** features/visualizations/common: see docs/architecture.md for responsibilities. */
import { mappingStore } from '../../app/store.js';
import { mappingEntryMatches } from '../mappings/selectors.js';
import { escapeHtml } from '../../shared/html.js';

export function renderChartLegend(container, title, items, extraClass, note) {
  if (!container || !items || !items.length) return null;
  var legend = document.createElement('aside');
  legend.className = 'chart-legend' + (extraClass ? ' ' + extraClass : '');
  legend.setAttribute('aria-label', title || 'Legende');
  var heading = document.createElement('h4');
  heading.textContent = title || 'Legende';
  legend.appendChild(heading);
  if (note) {
    var description = document.createElement('p');
    description.className = 'chart-legend-note';
    description.textContent = note;
    legend.appendChild(description);
  }
  var list = document.createElement('ul');
  list.className = 'chart-legend-list';
  for (var i = 0; i < items.length; i++) {
    var item = items[i] || {};
    var row = document.createElement('li');
    row.className = 'chart-legend-item';
    var symbol = document.createElement('span');
    symbol.className =
      'chart-legend-symbol ' +
      (item.type || 'swatch') +
      (item.arrow ? ' arrow' : '') +
      (item.dashed ? ' dashed' : '');
    symbol.setAttribute('aria-hidden', 'true');
    symbol.style.setProperty('--legend-color', item.color || '#51677f');
    var label = document.createElement('span');
    label.textContent = String(item.label || '');
    row.appendChild(symbol);
    row.appendChild(label);
    if (item.value !== undefined && item.value !== null && item.value !== '') {
      var value = document.createElement('span');
      value.className = 'chart-legend-value';
      value.textContent = String(item.value);
      row.appendChild(value);
    }
    list.appendChild(row);
  }
  legend.appendChild(list);
  container.appendChild(legend);
  return legend;
}

export function renderSunburstLegend(container, title, items) {
  return renderChartLegend(
    container,
    title,
    items,
    'sunburst-legend',
    'Farben kennzeichnen die Hauptsegmente. Vollständige Bezeichnungen und Werte werden beim Überfahren eines Segments angezeigt.',
  );
}

export function addBarAxisTitles(g, width, height, margin, xLabel, yLabel) {
  if (xLabel) {
    g.append('text')
      .attr('class', 'chart-axis-title')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 8)
      .attr('text-anchor', 'middle')
      .text(xLabel);
  }
  if (yLabel) {
    g.append('text')
      .attr('class', 'chart-axis-title')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -margin.left + 16)
      .attr('text-anchor', 'middle')
      .text(yLabel);
  }
}

export function sunburstInnerRadius(d, radius, innerRatio) {
  return Math.max(d.y0, radius * (innerRatio || 0));
}

export function sunburstChartCenterX(width, radius) {
  var legendWidth = Math.min(300, width * 0.32);
  var availableWidth = width - legendWidth - 42;
  return Math.max(radius + 18, availableWidth / 2);
}

export function addSunburstSegmentLabels(group, nodes, radius, innerRatio, labelFn) {
  var visible = (nodes || []).filter(function (d) {
    var inner = sunburstInnerRadius(d, radius, innerRatio);
    var middle = (inner + d.y1) / 2;
    var arcLength = (d.x1 - d.x0) * middle;
    return arcLength >= 46 && d.y1 - inner >= 24;
  });
  group
    .append('g')
    .attr('class', 'sunburst-label-layer')
    .selectAll('text')
    .data(visible)
    .enter()
    .append('text')
    .attr('class', 'sunburst-segment-label')
    .attr('transform', function (d) {
      var angle = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
      var inner = sunburstInnerRadius(d, radius, innerRatio);
      var middle = (inner + d.y1) / 2;
      return (
        'rotate(' +
        (angle - 90) +
        ') translate(' +
        middle +
        ',0) rotate(' +
        (angle > 180 ? 180 : 0) +
        ')'
      );
    })
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .attr('fill', '#ffffff')
    .style('font-size', '11px')
    .style('font-weight', '800')
    .text(function (d) {
      var full = String(labelFn ? labelFn(d) : (d.data && d.data.name) || '');
      var inner = sunburstInnerRadius(d, radius, innerRatio);
      var maxChars = Math.max(5, Math.floor(((d.x1 - d.x0) * ((inner + d.y1) / 2)) / 6.5));
      return full.length > maxChars ? full.slice(0, Math.max(4, maxChars - 1)) + '…' : full;
    })
    .append('title')
    .text(function (d) {
      return String(labelFn ? labelFn(d) : (d.data && d.data.name) || '');
    });
}

export function addSunburstCenterLabel(group, title, value, unit) {
  group
    .append('text')
    .attr('class', 'sunburst-center-title')
    .attr('y', -4)
    .text(title || '');
  group
    .append('text')
    .attr('class', 'sunburst-center-value')
    .attr('y', 14)
    .text(String(value || 0) + (unit ? ' ' + unit : ''));
}

export function drawUnavailableChartNotice(containerId, message) {
  var container = document.getElementById(containerId);
  if (!container) return;
  container.classList.add('chart-unavailable');
  container.innerHTML = '<div class="card">' + escapeHtml(message) + '</div>';
}

export function visibleMappingEntries() {
  return mappingStore.mappingState.entries.filter(mappingEntryMatches);
}
