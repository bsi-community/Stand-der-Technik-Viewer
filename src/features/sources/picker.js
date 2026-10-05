/** features/sources/picker: see docs/architecture.md for responsibilities. */
import {
  activateCatalogSource,
  activateComponentSource,
  activateMappingSource,
  removeCatalogSource,
  removeComponentSource,
  removeMappingSource,
} from '../../app/actions.js';
import { sourceStore, uiStore } from '../../app/store.js';
import { escapeHtml } from '../../shared/html.js';

export function shortenSourceLabel(label) {
  var text = String(label || '').trim();
  if (text.length <= 96) return text;
  return text.slice(0, 93) + '...';
}

export function rebuildSourceSelect(selectEl, items, activeIndex, emptyLabel) {
  if (!selectEl) return;
  selectEl.innerHTML = '';
  if (!items.length) {
    var emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = emptyLabel;
    selectEl.appendChild(emptyOption);
    selectEl.disabled = true;
    return;
  }
  for (var i = 0; i < items.length; i++) {
    var option = document.createElement('option');
    option.value = String(i);
    option.textContent = i + 1 + '. ' + shortenSourceLabel(items[i].label);
    option.selected = i === activeIndex;
    selectEl.appendChild(option);
  }
  selectEl.disabled = false;
  selectEl.value = String(activeIndex);
}

export function setSourcePickerOpen(pickerEl, buttonEl, menuEl, isOpen) {
  if (!pickerEl || !buttonEl || !menuEl) return;
  pickerEl.classList.toggle('open', !!isOpen);
  menuEl.classList.toggle('hidden', !isOpen);
  buttonEl.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

export function renderSourcePicker(
  pickerEl,
  buttonEl,
  menuEl,
  items,
  activeIndex,
  emptyLabel,
  onActivate,
  onRemove,
) {
  if (!pickerEl || !buttonEl || !menuEl) return;
  menuEl.innerHTML = '';
  var activeItem = activeIndex >= 0 && items[activeIndex] ? items[activeIndex] : null;
  var activeLabel = activeItem ? String(activeItem.label || '').trim() : '';
  buttonEl.textContent = activeItem
    ? activeIndex + 1 + '. ' + shortenSourceLabel(activeLabel)
    : emptyLabel;
  if (activeLabel) buttonEl.title = activeLabel;
  else buttonEl.removeAttribute('title');
  buttonEl.disabled = !items.length;
  if (!items.length) {
    setSourcePickerOpen(pickerEl, buttonEl, menuEl, false);
    return;
  }
  for (var i = 0; i < items.length; i++) {
    (function (index, item) {
      var row = document.createElement('div');
      row.className = 'source-item' + (index === activeIndex ? ' is-active' : '');

      var activateBtn = document.createElement('button');
      activateBtn.className = 'source-item-button';
      activateBtn.type = 'button';
      var fullLabel = String(item.label || '').trim();
      activateBtn.title = fullLabel;
      activateBtn.innerHTML =
        '<span class="source-item-label">' +
        escapeHtml(shortenSourceLabel(fullLabel)) +
        '</span><span class="source-item-meta">Eintrag ' +
        (index + 1) +
        (index === activeIndex ? ' • aktiv' : '') +
        '</span>';
      activateBtn.addEventListener('click', function () {
        onActivate(index);
      });
      row.appendChild(activateBtn);

      var removeBtn = document.createElement('button');
      removeBtn.className = 'source-item-remove';
      removeBtn.type = 'button';
      removeBtn.setAttribute('aria-label', item.label + ' entfernen');
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        onRemove(index);
      });
      row.appendChild(removeBtn);

      menuEl.appendChild(row);
    })(i, items[i]);
  }
}

export function refreshCatalogSourceSelect() {
  rebuildSourceSelect(
    uiStore.els.sourceSelect,
    sourceStore.loadedCatalogSources,
    sourceStore.activeCatalogSourceIndex,
    'Noch kein Katalog geladen',
  );
  renderSourcePicker(
    uiStore.els.sourcePicker,
    uiStore.els.sourceButton,
    uiStore.els.sourcePickerMenu,
    sourceStore.loadedCatalogSources,
    sourceStore.activeCatalogSourceIndex,
    'Noch kein Katalog geladen',
    function (index) {
      activateCatalogSource(index);
      setSourcePickerOpen(
        uiStore.els.sourcePicker,
        uiStore.els.sourceButton,
        uiStore.els.sourcePickerMenu,
        false,
      );
    },
    removeCatalogSource,
  );
}

export function refreshComponentSourceSelect() {
  rebuildSourceSelect(
    uiStore.compEls.sourceSelect,
    sourceStore.loadedComponentSources,
    sourceStore.activeComponentSourceIndex,
    'Noch keine Komponentendefinition geladen',
  );
  renderSourcePicker(
    uiStore.compEls.sourcePicker,
    uiStore.compEls.sourceButton,
    uiStore.compEls.sourcePickerMenu,
    sourceStore.loadedComponentSources,
    sourceStore.activeComponentSourceIndex,
    'Noch keine Komponentendefinition geladen',
    function (index) {
      activateComponentSource(index);
      setSourcePickerOpen(
        uiStore.compEls.sourcePicker,
        uiStore.compEls.sourceButton,
        uiStore.compEls.sourcePickerMenu,
        false,
      );
    },
    removeComponentSource,
  );
}

export function refreshMappingSourceSelect() {
  rebuildSourceSelect(
    uiStore.mappingEls.sourceSelect,
    sourceStore.loadedMappingSources,
    sourceStore.activeMappingSourceIndex,
    'Noch kein Mapping geladen',
  );
  renderSourcePicker(
    uiStore.mappingEls.sourcePicker,
    uiStore.mappingEls.sourceButton,
    uiStore.mappingEls.sourcePickerMenu,
    sourceStore.loadedMappingSources,
    sourceStore.activeMappingSourceIndex,
    'Noch kein Mapping geladen',
    function (index) {
      activateMappingSource(index);
      setSourcePickerOpen(
        uiStore.mappingEls.sourcePicker,
        uiStore.mappingEls.sourceButton,
        uiStore.mappingEls.sourcePickerMenu,
        false,
      );
    },
    removeMappingSource,
  );
}
