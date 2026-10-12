/** Native KERN primitives. No application state or domain dependencies. */
export const isKern = () =>
  typeof document !== 'undefined' && document.documentElement.dataset.viewerDesign === 'kern';

export function kernButton(button, variant = 'secondary') {
  if (!isKern()) return button;
  button.classList.remove('btn', 'small');
  button.classList.add('kern-btn', `kern-btn--${variant}`, 'viewer-button');
  if (!button.querySelector(':scope > .kern-label')) {
    const label = document.createElement('span');
    label.className = 'kern-label';
    label.append(...button.childNodes);
    button.append(label);
  }
  return button;
}

export function setButtonLabel(button, text) {
  (button.querySelector(':scope > .kern-label') || button).textContent = text;
}

export function createButton(label, onClick, variant = 'secondary') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn small';
  button.textContent = label;
  if (onClick)
    button.addEventListener('click', (event) => {
      const hadFocus = document.activeElement === button;
      onClick(event);
      if (isKern() && hadFocus && !button.isConnected && button.id)
        document.getElementById(button.id)?.focus({ preventScroll: true });
    });
  return kernButton(button, variant);
}

export function kernField(input, labelText, { hideLabel = false } = {}) {
  if (!isKern() || input.hidden || input.type === 'hidden') return;
  input.classList.remove('kern-form-input', 'kern-form-select');
  input.classList.add(
    input.tagName === 'SELECT' ? 'kern-form-input__select' : 'kern-form-input__input',
  );
  if (labelText) input.removeAttribute('aria-label');
  if (labelText && !document.querySelector(`label[for="${input.id}"]`)) {
    const label = document.createElement('label');
    label.className = hideLabel ? 'kern-label kern-sr-only' : 'kern-label viewer-field-label';
    label.htmlFor = input.id;
    label.textContent = labelText;
    input.before(label);
  }
  if (
    input.tagName === 'SELECT' &&
    !input.parentElement.classList.contains('kern-form-input__select-wrapper')
  ) {
    const wrap = document.createElement('div');
    wrap.className = 'kern-form-input__select-wrapper';
    input.before(wrap);
    wrap.append(input);
  }
}

export function kernDetails(details) {
  if (!isKern()) return;
  details.classList.add('kern-details', 'viewer-details');
  details.querySelector(':scope > summary')?.classList.add('kern-details__header');
}

/** Values are nodes or plain text, never untrusted HTML. */
export function createDescriptionList(entries) {
  const list = document.createElement('dl');
  list.className = 'kern-description-list viewer-description-list';
  for (const { label, value } of entries) {
    const row = document.createElement('div');
    row.className = 'kern-description-list-item';
    const term = document.createElement('dt');
    term.className = 'kern-description-list-item__key';
    term.append(label);
    const definition = document.createElement('dd');
    definition.className = 'kern-description-list-item__value';
    definition.append(value);
    row.append(term, definition);
    list.append(row);
  }
  return list;
}

/** Preserve rich value nodes, parameter markup and tooltip listeners. */
export function descriptionListFromMeta(meta) {
  const entries = [];
  for (const entry of [...meta.children]) {
    const label = entry.querySelector(':scope > strong');
    if (!label) continue;
    const text = document.createElement('span');
    text.append(...label.childNodes);
    if (text.lastChild?.nodeType === Node.TEXT_NODE)
      text.lastChild.textContent = text.lastChild.textContent.replace(/:\s*$/, '');
    label.remove();
    entries.push({ label: text, value: entry });
  }
  return createDescriptionList(entries);
}

/** Call on an authored content subtree before display, never on arbitrary document HTML. */
export function kernContent(root) {
  if (!isKern()) return;
  if (root.matches('details')) kernDetails(root);
  root.querySelectorAll('details').forEach(kernDetails);
  root.querySelectorAll('button.btn').forEach((button) => kernButton(button));
  root.querySelectorAll('.component-link-meta').forEach((meta) => {
    meta.replaceWith(descriptionListFromMeta(meta));
  });
  root.querySelectorAll('table').forEach((table) => {
    const label = table.matches('.implementation-table')
      ? 'Anforderungen und Implementierungsbeschreibungen'
      : table.matches('.component-property-table')
        ? 'Eigenschaften'
        : 'Zugeordnete Komponenten';
    kernTable(table, label);
  });
}

export function kernTable(table, label) {
  if (!isKern()) return;
  table.querySelectorAll('th').forEach((cell) => cell.classList.add('kern-table__header'));
  table.querySelectorAll('td').forEach((cell) => cell.classList.add('kern-table__cell'));
  if (table.classList.contains('viewer-data-table')) return;
  table.classList.add('kern-table', 'viewer-data-table');
  if (!table.caption) {
    const caption = table.createCaption();
    caption.className = 'kern-sr-only';
    caption.textContent = label;
  }
  table.querySelectorAll('thead th').forEach((th) => {
    if (!th.hasAttribute('scope')) th.scope = th.colSpan > 1 ? 'colgroup' : 'col';
  });
  table.querySelectorAll('tbody th').forEach((th) => {
    th.scope = 'row';
  });
  let wrap = table.parentElement;
  if (!wrap.matches('.catalog-table-scroll, .implementation-table-wrap, .mapping-table-wrap')) {
    wrap = document.createElement('div');
    table.before(wrap);
    wrap.append(table);
  }
  wrap.classList.add('viewer-table-scroll');
  wrap.tabIndex = 0;
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', label + ' – bei Bedarf horizontal scrollen');
}

/** Shared URL field errors live next to both sidebar and workspace inputs. */
export function prepareUrlField(input, kind) {
  if (!isKern()) return;
  input.dataset.importKind = kind;
  const error = document.createElement('p');
  error.id = `${input.id}Error`;
  error.className = 'viewer-field-error';
  error.hidden = true;
  input.after(error);
  input.setAttribute(
    'aria-describedby',
    [input.getAttribute('aria-describedby'), error.id].filter(Boolean).join(' '),
  );
  input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    error.hidden = true;
  });
}

export async function runImportAction(button, load) {
  if (!isKern()) return load();
  if (button.disabled) return;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  const active = document.activeElement;
  const hadFocus = active === button || button.parentElement?.contains(active);
  try {
    const result = await load();
    if (result && hadFocus && !active.isConnected) {
      const panel = document.querySelector('main [role="tabpanel"]:not(.hidden)');
      panel?.focus();
    }
    return result;
  } finally {
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
}
