/** features/catalog/target-filter: see docs/architecture.md for responsibilities. */
import { catalogStore, hierarchyStore, uiStore } from '../../app/store.js';
import { normalizeTargetCategoryName } from '../../domain/target-hierarchy.js';
import { uniqueList } from '../../shared/collections.js';
import { msUpdateSummary } from '../../shared/ui/multiselect.js';

export function targetAncestorValues(value) {
  if (
    !catalogStore.state.hasTargetObjectCategories ||
    hierarchyStore.targetHierarchyState.status !== 'ready' ||
    value === '__none__'
  )
    return [];
  var availableByName = Object.create(null);
  for (var ai = 0; ai < catalogStore.allTargets.length; ai++) {
    availableByName[normalizeTargetCategoryName(catalogStore.allTargets[ai])] =
      catalogStore.allTargets[ai];
  }
  var ancestors =
    hierarchyStore.targetHierarchyState.ancestorsByName[normalizeTargetCategoryName(value)] || [];
  var values = [];
  for (var i = 0; i < ancestors.length; i++) {
    var availableValue = availableByName[normalizeTargetCategoryName(ancestors[i])];
    if (availableValue) values.push(availableValue);
  }
  return uniqueList(values);
}

export function removeAutoSelectedTarget(value) {
  var valueKey = normalizeTargetCategoryName(value);
  catalogStore.state.autoSelectedTargets = catalogStore.state.autoSelectedTargets.filter(
    function (item) {
      return normalizeTargetCategoryName(item) !== valueKey;
    },
  );
}

export function selectTargetAncestors(value) {
  if (!uiStore.els.targetMenu) return;
  var ancestorValues = targetAncestorValues(value);
  for (var i = 0; i < ancestorValues.length; i++) {
    var ancestorKey = normalizeTargetCategoryName(ancestorValues[i]);
    var checkboxes = uiStore.els.targetMenu.querySelectorAll('input[type="checkbox"]');
    for (var ci = 0; ci < checkboxes.length; ci++) {
      var cb = checkboxes[ci];
      if (
        cb.dataset.value === '__all__' ||
        normalizeTargetCategoryName(cb.dataset.value) !== ancestorKey
      )
        continue;
      if (!cb.checked) {
        cb.checked = true;
        catalogStore.state.autoSelectedTargets.push(cb.dataset.value);
      }
      break;
    }
  }
  catalogStore.state.autoSelectedTargets = uniqueList(catalogStore.state.autoSelectedTargets);
}

export function applyTargetAncestorsForCheckedOptions() {
  if (!uiStore.els.targetMenu) return;
  var checked = Array.from(
    uiStore.els.targetMenu.querySelectorAll('input[type="checkbox"]'),
  ).filter(function (cb) {
    return cb.dataset.value !== '__all__' && cb.dataset.value !== '__none__' && cb.checked;
  });
  for (var i = 0; i < checked.length; i++) selectTargetAncestors(checked[i].dataset.value);
}

export function handleTargetCheckboxChange(checkbox) {
  if (!checkbox) return;
  removeAutoSelectedTarget(checkbox.dataset.value);
  if (checkbox.checked) selectTargetAncestors(checkbox.dataset.value);
}

export function syncTargetHelpAlignment() {
  if (
    !uiStore.els.target ||
    !uiStore.els.targetHelp ||
    !uiStore.els.target.getBoundingClientRect ||
    !uiStore.els.targetHelp.parentNode
  )
    return;
  var summary = uiStore.els.target.querySelector('summary');
  var wrapper = uiStore.els.targetHelp.parentNode;
  if (!summary || !summary.getBoundingClientRect || !wrapper.getBoundingClientRect) return;
  var summaryRect = summary.getBoundingClientRect();
  var wrapperRect = wrapper.getBoundingClientRect();
  if (summaryRect.height <= 0 || wrapperRect.width <= 0) return;
  var center = summaryRect.top - wrapperRect.top + summaryRect.height / 2;
  if (isFinite(center)) uiStore.els.targetHelp.style.top = center + 'px';
}

var targetHelpResizeObserver = null;

export function scheduleTargetHelpAlignment() {
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(syncTargetHelpAlignment);
  else setTimeout(syncTargetHelpAlignment, 0);
}

export function positionTargetHelpTooltip() {
  if (
    !uiStore.els.targetHelp ||
    !uiStore.els.targetHelpTooltip ||
    !uiStore.els.targetHelp.getBoundingClientRect
  )
    return;
  var trigger = uiStore.els.targetHelp.querySelector('.search-help-trigger');
  if (!trigger || !trigger.getBoundingClientRect) return;
  var triggerRect = trigger.getBoundingClientRect();
  if (triggerRect.height <= 0) return;
  var left = triggerRect.right + 10;
  var availableWidth = Math.max(80, window.innerWidth - left - 8);
  uiStore.els.targetHelpTooltip.style.width = Math.min(300, availableWidth) + 'px';
  uiStore.els.targetHelpTooltip.style.left = left + 'px';
  var top = triggerRect.top + (triggerRect.height - uiStore.els.targetHelpTooltip.offsetHeight) / 2;
  var maxTop = Math.max(8, window.innerHeight - uiStore.els.targetHelpTooltip.offsetHeight - 8);
  uiStore.els.targetHelpTooltip.style.top = Math.max(8, Math.min(top, maxTop)) + 'px';
}

export function showTargetHelpTooltip() {
  if (!uiStore.els.targetHelpTooltip) return;
  syncTargetHelpAlignment();
  positionTargetHelpTooltip();
  uiStore.els.targetHelpTooltip.classList.add('is-visible');
}

export function hideTargetHelpTooltip() {
  if (uiStore.els.targetHelpTooltip) uiStore.els.targetHelpTooltip.classList.remove('is-visible');
}

export function bindTargetHelpUi() {
  if (
    !uiStore.els.target ||
    !uiStore.els.targetHelp ||
    !uiStore.els.targetHelpTooltip ||
    uiStore.els.targetHelp._targetHelpBound
  )
    return;
  uiStore.els.targetHelp._targetHelpBound = true;
  var trigger = uiStore.els.targetHelp.querySelector('.search-help-trigger');
  var summary = uiStore.els.target.querySelector('summary');
  var filterSection = uiStore.els.target.closest
    ? uiStore.els.target.closest('.sidebar-section[data-section="filters"]')
    : null;
  document.body.appendChild(uiStore.els.targetHelpTooltip);
  uiStore.els.targetHelp.addEventListener('mouseenter', showTargetHelpTooltip);
  uiStore.els.targetHelp.addEventListener('mouseleave', hideTargetHelpTooltip);
  uiStore.els.targetHelp.addEventListener('focusin', showTargetHelpTooltip);
  uiStore.els.targetHelp.addEventListener('focusout', hideTargetHelpTooltip);
  if (trigger) {
    trigger.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        hideTargetHelpTooltip();
        trigger.blur();
      }
    });
  }
  if (filterSection) {
    filterSection.addEventListener('toggle', function () {
      if (!filterSection.open) hideTargetHelpTooltip();
      scheduleTargetHelpAlignment();
    });
  }
  uiStore.els.target.addEventListener('toggle', scheduleTargetHelpAlignment);
  if (typeof ResizeObserver !== 'undefined' && summary) {
    targetHelpResizeObserver = new ResizeObserver(scheduleTargetHelpAlignment);
    targetHelpResizeObserver.observe(summary);
  }
  window.addEventListener('resize', function () {
    scheduleTargetHelpAlignment();
    if (uiStore.els.targetHelpTooltip.classList.contains('is-visible')) positionTargetHelpTooltip();
  });
  window.addEventListener(
    'scroll',
    function () {
      if (uiStore.els.targetHelpTooltip.classList.contains('is-visible'))
        positionTargetHelpTooltip();
    },
    true,
  );
  scheduleTargetHelpAlignment();
}

export function syncTargetAutoSelectionUi() {
  if (!uiStore.els.targetMenu || !uiStore.els.target) return;
  var checkedNames = Object.create(null);
  var checkedCbs = uiStore.els.targetMenu.querySelectorAll('input[type="checkbox"]:checked');
  for (var chi = 0; chi < checkedCbs.length; chi++) {
    checkedNames[normalizeTargetCategoryName(checkedCbs[chi].dataset.value)] = true;
  }
  catalogStore.state.autoSelectedTargets = uniqueList(
    catalogStore.state.autoSelectedTargets,
  ).filter(function (value) {
    return !!checkedNames[normalizeTargetCategoryName(value)];
  });
  var autoSelectedNames = Object.create(null);
  for (var i = 0; i < catalogStore.state.autoSelectedTargets.length; i++)
    autoSelectedNames[normalizeTargetCategoryName(catalogStore.state.autoSelectedTargets[i])] =
      true;
  var itemCbs = Array.from(
    uiStore.els.targetMenu.querySelectorAll('input[type="checkbox"]'),
  ).filter(function (cb) {
    return cb.dataset.value !== '__all__';
  });
  for (var ci = 0; ci < itemCbs.length; ci++) {
    var cb = itemCbs[ci];
    var isAutoSelected =
      cb.checked &&
      cb.dataset.value !== '__none__' &&
      !!autoSelectedNames[normalizeTargetCategoryName(cb.dataset.value)];
    cb.indeterminate = false;
    var row = cb.closest ? cb.closest('.ms-item') : cb.parentNode;
    if (!row) continue;
    row.classList.toggle('is-auto-selected', isAutoSelected);
    var badge = row.querySelector('.target-auto-selected-badge');
    if (isAutoSelected && !badge) {
      badge = document.createElement('span');
      badge.className = 'target-auto-selected-badge';
      badge.textContent = 'automatisch';
      row.appendChild(badge);
    } else if (!isAutoSelected && badge) {
      badge.remove();
    }
    if (isAutoSelected) {
      cb.setAttribute(
        'aria-label',
        (cb.dataset.label || cb.dataset.value) + ' (automatisch ausgewählt; kann abgewählt werden)',
      );
    } else {
      cb.removeAttribute('aria-label');
    }
  }
  msUpdateSummary(uiStore.els.target, 'Alle Zielobjektkategorien', itemCbs);
  if (catalogStore.state.autoSelectedTargets.length) {
    var summary = uiStore.els.target.querySelector('summary');
    summary.textContent += ' (+' + catalogStore.state.autoSelectedTargets.length + ' automatisch)';
  }
  syncTargetHelpAlignment();
}
