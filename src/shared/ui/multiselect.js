/** shared/ui/multiselect: see docs/architecture.md for responsibilities. */
import { RefreshViews, handleTargetCheckboxChange } from '../../app/actions.js';
import { isKern, kernDetails } from './kern.js';
import { catalogStore } from '../../app/store.js';

export function msSetItems(detailsEl, menuEl, allLabel, items, onChange) {
  onChange = onChange || RefreshViews;
  menuEl.innerHTML = '';
  // "All" item
  const allId = detailsEl.id + '_all';
  const allRow = document.createElement('label');
  allRow.className = 'ms-item';
  const allCb = document.createElement('input');
  allCb.type = 'checkbox';
  allCb.dataset.value = '__all__';
  allCb.id = allId;
  const allText = document.createElement('span');
  allText.className = 'ms-label';
  allText.textContent = allLabel;
  allRow.appendChild(allCb);
  allRow.appendChild(allText);
  menuEl.appendChild(allRow);

  const divider = document.createElement('div');
  divider.className = 'ms-divider';
  menuEl.appendChild(divider);

  // Special option: controls without any target object
  if (detailsEl && detailsEl.id === 'targetMS') {
    const rowN = document.createElement('label');
    rowN.className = 'ms-item';
    const cbN = document.createElement('input');
    cbN.type = 'checkbox';
    cbN.dataset.value = '__none__';
    cbN.dataset.label = 'Ohne Zielobjektkategorie';
    cbN.id = detailsEl.id + '_none';
    const textN = document.createElement('span');
    textN.className = 'ms-label';
    textN.textContent = 'Ohne Zielobjektkategorie';
    rowN.appendChild(cbN);
    rowN.appendChild(textN);
    menuEl.appendChild(rowN);
  }

  // Special option: controls without any tags
  if (detailsEl && detailsEl.id === 'tagMS') {
    const rowT = document.createElement('label');
    rowT.className = 'ms-item';
    const cbT = document.createElement('input');
    cbT.type = 'checkbox';
    cbT.dataset.value = '__notags__';
    cbT.dataset.label = 'Ohne Tags';
    cbT.id = detailsEl.id + '_notags';
    const textT = document.createElement('span');
    textT.className = 'ms-label';
    textT.textContent = 'Ohne Tags';
    rowT.appendChild(cbT);
    rowT.appendChild(textT);
    menuEl.appendChild(rowT);
  }

  // normal items
  items.forEach((v, idx) => {
    const option = v && typeof v === 'object' ? v : { value: v, label: v };
    const optionValue = String(
      option.value === undefined || option.value === null ? '' : option.value,
    );
    const optionLabel = String(
      option.label === undefined || option.label === null || option.label === ''
        ? optionValue
        : option.label,
    );
    const row = document.createElement('label');
    row.className = 'ms-item';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.dataset.value = optionValue;
    cb.dataset.label = optionLabel;
    cb.id = detailsEl.id + '_opt_' + idx;
    const text = document.createElement('span');
    text.className = 'ms-label';
    text.textContent = optionLabel;
    row.appendChild(cb);
    row.appendChild(text);
    menuEl.appendChild(row);
  });

  function updateAllState() {
    const cbs = [...menuEl.querySelectorAll('input[type="checkbox"]')].filter(
      (x) => x.dataset.value !== '__all__',
    );
    const checked = cbs.filter((x) => x.checked);
    allCb.indeterminate = checked.length > 0 && checked.length < cbs.length;
    allCb.checked = cbs.length > 0 && checked.length === cbs.length;
    msUpdateSummary(detailsEl, allLabel, cbs);
  }

  allCb.onchange = () => {
    const cbs = [...menuEl.querySelectorAll('input[type="checkbox"]')].filter(
      (x) => x.dataset.value !== '__all__',
    );
    if (detailsEl && detailsEl.id === 'targetMS') catalogStore.state.autoSelectedTargets = [];
    if (allCb.checked) {
      cbs.forEach((x) => (x.checked = true));
    } else {
      cbs.forEach((x) => (x.checked = false));
    }
    updateAllState();
    onChange();
  };

  menuEl.onchange = (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLInputElement)) return;
    if (t.dataset.value === '__all__') return;
    if (detailsEl && detailsEl.id === 'targetMS') handleTargetCheckboxChange(t);
    updateAllState();
    onChange();
  };

  if (isKern()) prepareKernFilter(detailsEl, menuEl, allLabel);

  // default: all selected
  const cbs = [...menuEl.querySelectorAll('input[type="checkbox"]')].filter(
    (x) => x.dataset.value !== '__all__',
  );
  cbs.forEach((x) => (x.checked = true));
  updateAllState();
}

export function msUpdateSummary(detailsEl, allLabel, itemCbs) {
  const checked = itemCbs.filter((x) => x.checked).map((x) => x.dataset.label || x.dataset.value);
  const sum = detailsEl.querySelector('summary');
  if (isKern()) {
    const label = document.createElement('span');
    label.className = 'viewer-filter-label';
    label.textContent = allLabel.replace(/^Alle[nrs]? /, '');
    const count = document.createElement('span');
    count.className = 'viewer-filter-count';
    count.textContent = itemCbs.length ? `${checked.length} / ${itemCbs.length}` : 'Keine Werte';
    sum.replaceChildren(label, count);
    sum.setAttribute(
      'aria-label',
      `${label.textContent}: ${itemCbs.length ? `${checked.length} von ${itemCbs.length} ausgewählt` : 'keine Werte vorhanden'}`,
    );
    const all = detailsEl.querySelector('[data-value="__all__"]');
    if (all) all.disabled = !itemCbs.length;
    return;
  }
  if (itemCbs.length === 0) {
    sum.textContent = allLabel;
    return;
  }
  if (checked.length === 0) {
    sum.textContent = allLabel + ' (keine Auswahl)';
  } else if (checked.length === itemCbs.length) {
    sum.textContent = allLabel;
  } else if (checked.length <= 3) {
    sum.textContent = checked.join(', ');
  } else {
    sum.textContent = checked.slice(0, 3).join(', ') + ` (+${checked.length - 3})`;
  }
}

export function msGetSelected(detailsEl, menuEl) {
  const cbs = [...menuEl.querySelectorAll('input[type="checkbox"]')].filter(
    (x) => x.dataset.value !== '__all__',
  );
  return cbs.filter((x) => x.checked).map((x) => x.dataset.value);
}

function prepareKernFilter(details, menu, allLabel) {
  kernDetails(details);
  const fieldset = document.createElement('fieldset');
  fieldset.className = 'kern-fieldset viewer-filter-options';
  const legend = document.createElement('legend');
  legend.className = 'kern-sr-only';
  legend.textContent = allLabel.replace(/^Alle[nrs]? /, '');
  const rows = [...menu.querySelectorAll('.ms-item')];
  const all = rows[0];
  all.querySelector('.ms-label').textContent = 'Alle auswählen';
  rows.forEach((row) => {
    row.classList.add('kern-form-check');
    row.querySelector('input').classList.add('kern-form-check__checkbox');
    row.querySelector('.ms-label').classList.add('kern-label');
  });
  fieldset.append(legend, ...menu.childNodes);
  menu.append(fieldset);
  if (rows.length > 11) {
    const label = document.createElement('label');
    label.className = 'viewer-option-search';
    const caption = document.createElement('span');
    caption.className = 'kern-label';
    caption.textContent = 'Filterwerte suchen';
    const input = document.createElement('input');
    input.type = 'search';
    input.className = 'kern-form-input__input';
    input.autocomplete = 'off';
    const hint = document.createElement('p');
    hint.className = 'viewer-field-hint';
    hint.textContent =
      'Die Suche verändert die Auswahl nicht. „Alle auswählen“ gilt für alle Werte.';
    const empty = document.createElement('p');
    empty.textContent = 'Keine passenden Filterwerte.';
    empty.hidden = true;
    input.addEventListener('input', () => {
      const query = input.value.toLocaleLowerCase('de').trim();
      rows.slice(1).forEach((row) => {
        row.hidden = !row.textContent.toLocaleLowerCase('de').includes(query);
      });
      empty.hidden = rows.slice(1).some((row) => !row.hidden);
    });
    label.append(caption, input);
    menu.prepend(label, hint, empty);
  }
  details.onkeydown = (event) => {
    if (event.key === 'Escape' && details.open) {
      event.preventDefault();
      details.open = false;
      details.querySelector('summary').focus();
    }
  };
}
