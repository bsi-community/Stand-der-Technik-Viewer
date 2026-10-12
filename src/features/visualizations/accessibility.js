/** KERN alternatives use the exact rows supplied by each chart, not a second filter pipeline. */
import * as d3 from 'd3';
import { createButton, isKern, kernDetails, kernField, kernTable } from '../../shared/ui/kern.js';

const states = new WeakMap();
const PAGE_SIZE = 50;

export function beginChartAccess(container, key) {
  if (!isKern() || !container) return;
  const previous = states.get(container);
  const active = document.activeElement;
  const ownsFocus = previous?.elements.some((element) => element.contains(active));
  const state = previous?.key === key ? previous : { key, open: false, tables: {} };
  state.focus = ownsFocus && previous?.key === key ? active.id : null;
  state.selection =
    ownsFocus && active.type === 'search' ? [active.selectionStart, active.selectionEnd] : null;
  previous?.elements.forEach((element) => element.remove());
  state.elements = [];
  states.set(container, state);
}

function restoreAccessFocus(container) {
  const state = states.get(container);
  if (!state?.focus) return;
  const target = state.elements
    .flatMap((el) => [...el.querySelectorAll('[id]')])
    .find((el) => el.id === state.focus);
  if (target) {
    target.focus({ preventScroll: true });
    if (state.selection && target.type === 'search') target.setSelectionRange(...state.selection);
  }
  state.focus = null;
}

/** Lazy, paginated tables keep large graphs cheap to render and fully inspectable. */
export function renderChartData(container, description, sections, { interactiveSvg = false } = {}) {
  if (!isKern()) return;
  const state = states.get(container);
  const details = document.createElement('details');
  details.id = container.id + '-data';
  details.className = 'viewer-chart-data';
  const summary = document.createElement('summary');
  summary.id = details.id + '-summary';
  summary.textContent = 'Diagrammdaten als Tabelle';
  const note = document.createElement('p');
  note.id = details.id + '-description';
  note.textContent = description;
  details.append(summary, note);
  kernDetails(details);
  let built = false;
  function build() {
    if (built) return;
    built = true;
    sections.forEach((section, index) => {
      const tableState = (state.tables[index] ||= { query: '', page: 0 });
      details.append(dataSection(section, tableState, details.id + '-' + index));
    });
  }
  details.open = state.open;
  if (details.open) build();
  details.addEventListener('toggle', () => {
    state.open = details.open;
    if (details.open) build();
  });
  container.after(details);
  state.elements.push(details);
  const svg = container.querySelector(':scope > svg');
  if (svg) {
    svg.setAttribute('role', interactiveSvg ? 'group' : 'img');
    svg.setAttribute(
      'aria-label',
      description + ' Die Daten stehen zusätzlich in der Tabelle nach dem Diagramm.',
    );
  }
  restoreAccessFocus(container);
}

function dataSection({ title, headers, rows, columnWidths }, state, id) {
  const section = document.createElement('section');
  section.className = 'viewer-chart-data-section';
  const heading = document.createElement('h3');
  heading.textContent = title;
  section.append(heading);
  const field = document.createElement('input');
  field.type = 'search';
  field.id = id + '-search';
  field.value = state.query;
  const fieldWrap = document.createElement('div');
  fieldWrap.className = 'viewer-chart-data-search';
  fieldWrap.append(field);
  section.append(fieldWrap);
  kernField(field, title + ' durchsuchen');
  const status = document.createElement('p');
  status.id = id + '-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-atomic', 'true');
  field.setAttribute('aria-describedby', status.id);
  const wrap = document.createElement('div');
  wrap.className = 'catalog-table-scroll';
  const table = document.createElement('table');
  if (columnWidths) {
    const columns = document.createElement('colgroup');
    [...columnWidths, ...(rows.some((row) => row.open) ? ['7rem'] : [])].forEach((width) => {
      const col = document.createElement('col');
      col.style.width = width;
      columns.append(col);
    });
    table.append(columns);
    table.classList.add('viewer-chart-data-sized');
  }
  const thead = table.createTHead();
  const headerRow = thead.insertRow();
  const hasActions = rows.some((row) => row.open);
  for (const label of [...headers, ...(hasActions ? ['Eintrag'] : [])]) {
    const th = document.createElement('th');
    th.textContent = label;
    headerRow.append(th);
  }
  const tbody = table.createTBody();
  wrap.append(table);
  section.append(status, wrap);
  kernTable(table, title);
  const pages = document.createElement('div');
  pages.className = 'viewer-chart-data-pages';
  const previous = createButton('Vorherige Seite', () => {
    state.page--;
    update();
  });
  const next = createButton('Nächste Seite', () => {
    state.page++;
    update();
  });
  previous.id = id + '-previous';
  next.id = id + '-next';
  pages.append(previous, next);
  section.append(pages);
  const searchable = rows.map((row) => row.cells.join(' ').toLocaleLowerCase('de'));
  function update() {
    const query = state.query.trim().toLocaleLowerCase('de');
    const filtered = rows.filter((row, index) => searchable[index].includes(query));
    const count = filtered.length;
    state.page = Math.max(0, Math.min(state.page, Math.ceil(count / PAGE_SIZE) - 1));
    const start = state.page * PAGE_SIZE;
    tbody.replaceChildren();
    for (const [index, row] of filtered.slice(start, start + PAGE_SIZE).entries()) {
      const tr = tbody.insertRow();
      row.cells.forEach((value, column) => {
        const cell = document.createElement(column === 0 ? 'th' : 'td');
        if (column === 0) cell.scope = 'row';
        cell.textContent = String(value ?? '–');
        tr.append(cell);
      });
      if (hasActions) {
        const cell = tr.insertCell();
        if (row.open) {
          const button = createButton('Öffnen', row.open);
          button.id = id + '-open-' + (start + index);
          button.setAttribute('aria-label', row.actionLabel || row.cells[0] + ' öffnen');
          cell.append(button);
        } else cell.textContent = '–';
      }
    }
    if (!count) {
      const cell = tbody.insertRow().insertCell();
      cell.colSpan = headers.length + (hasActions ? 1 : 0);
      cell.textContent = rows.length
        ? 'Keine passenden Diagrammdaten. Ändere den Suchbegriff.'
        : 'Keine Einträge in dieser Darstellung.';
    }
    kernTable(table, title);
    status.textContent = count
      ? `${start + 1}–${Math.min(start + PAGE_SIZE, count)} von ${count} Einträgen`
      : '0 Einträge';
    const active = document.activeElement;
    previous.disabled = state.page === 0;
    next.disabled = start + PAGE_SIZE >= count;
    pages.hidden = count <= PAGE_SIZE;
    if (active === next && next.disabled) previous.focus();
    if (active === previous && previous.disabled) next.focus();
  }
  field.addEventListener('input', () => {
    state.query = field.value;
    state.page = 0;
    update();
  });
  update();
  return section;
}

export function graphDataSections(nodes, links, onOpen, nodeDescription, labels = {}) {
  const idOf = (node) => (typeof node === 'object' ? node.id : node);
  const names = new Map(nodes.map((node) => [node.id, node.label || node.title || node.id]));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const idLabel = labels.id || ((node) => node.id);
  const endpoint = (node) => {
    const item = nodeById.get(idOf(node));
    if (labels.endpoint && item) return labels.endpoint(item);
    const name = names.get(idOf(node)) || idOf(node);
    return name === idOf(node) ? name : `${name} (${idOf(node)})`;
  };
  return [
    {
      title: 'Knoten',
      headers: ['Kennung', 'Bezeichnung', 'Kontext'],
      rows: nodes.map((node) => ({
        cells: [idLabel(node), node.label || node.title || node.id, nodeDescription(node)],
        open: onOpen ? () => onOpen(node) : undefined,
        actionLabel: (node.label || node.title || node.id) + ' öffnen',
      })),
    },
    {
      title: 'Beziehungen',
      headers: ['Ausgangspunkt', 'Beziehung', 'Ziel'],
      rows: links.map((link) => ({
        cells: [
          endpoint(link.source),
          link.rel || link.relationship || 'Ohne Angabe',
          endpoint(link.target),
        ],
      })),
    },
  ];
}

/** Native buttons offer pan/zoom without dragging; the chart keeps its full drawing area. */
export function addGraphControls(container, svg, zoom, fit, interacted = () => {}) {
  if (!isKern()) return;
  container.querySelector('.graph-toolbar')?.remove();
  const bar = document.createElement('div');
  bar.className = 'viewer-chart-controls';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Diagrammausschnitt');
  const zoomBy = (factor) => {
    svg.interrupt();
    svg.call(zoom.scaleBy, factor);
  };
  const pan = (x, y) => {
    svg.interrupt();
    svg.call(
      zoom.translateBy,
      x / d3.zoomTransform(svg.node()).k,
      y / d3.zoomTransform(svg.node()).k,
    );
  };
  for (const [key, label, action] of [
    ['fit', 'Alles anzeigen', fit],
    ['in', 'Vergrößern', () => zoomBy(1.5)],
    ['out', 'Verkleinern', () => zoomBy(1 / 1.5)],
    ['left', 'Nach links', () => pan(-80, 0)],
    ['right', 'Nach rechts', () => pan(80, 0)],
    ['up', 'Nach oben', () => pan(0, -80)],
    ['down', 'Nach unten', () => pan(0, 80)],
  ]) {
    const button = createButton(label, () => {
      interacted();
      action();
    });
    button.id = container.id + '-control-' + key;
    button.setAttribute('aria-controls', container.id);
    bar.append(button);
  }
  container.before(bar);
  states.get(container).elements.push(bar);
}

export function chartMotionDuration(milliseconds) {
  return isKern() && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 0
    : milliseconds;
}
