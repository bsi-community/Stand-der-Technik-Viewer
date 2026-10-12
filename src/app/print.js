/** app/print: see docs/architecture.md for responsibilities. */
import { isKern } from '../shared/ui/kern.js';
import { printKernDocument } from './kern-print.js';
import { renderComponentView, renderList, switchTab } from './actions.js';
import { catalogStore, componentStore, uiStore } from './store.js';

export function exportToPdf(event) {
  if (isKern())
    return printKernDocument(
      uiStore.els.listTab,
      catalogStore.state.catalogMetadata?.title || 'Anforderungen',
      !!catalogStore.state.controls?.length,
      event?.currentTarget,
    );
  try {
    if (!catalogStore.state.controls || !catalogStore.state.controls.length) {
      uiStore.els.msg.className = 'card err';
      uiStore.els.msg.textContent = 'Bitte zuerst einen OSCAL Catalog laden, bevor du exportierst.';
      return;
    }

    var prevTabEl = document.querySelector('.tab.active');
    var prevTab = prevTabEl ? prevTabEl.getAttribute('data-tab') : 'list';

    // Switch to list tab and ensure list is current
    switchTab('list');
    // Initiales Rendering (vor Laden einer Datei leer)
    renderList();

    // Expand all details in the list (remember which were open)
    var ds = uiStore.els.listTab.querySelectorAll('details');
    var openState = [];
    for (var i = 0; i < ds.length; i++) {
      openState.push(!!ds[i].open);
      ds[i].open = true;
    }

    // Enter print mode (light theme + hide UI)
    document.body.classList.add('print-mode');

    var cleaned = false;
    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      document.body.classList.remove('print-mode');
      // Restore open state
      var ds2 = uiStore.els.listTab.querySelectorAll('details');
      for (var i = 0; i < ds2.length && i < openState.length; i++) {
        ds2[i].open = openState[i];
      }
      // Restore previous tab
      switchTab(prevTab);
    }

    window.addEventListener('afterprint', cleanup, { once: true });

    // Trigger print directly from the user gesture context.
    // Some browsers suppress the dialog if print is delayed via setTimeout.
    void document.body.offsetHeight; // force reflow before opening print dialog
    window.print();

    // Fallback cleanup for browsers that do not reliably fire afterprint.
    setTimeout(function () {
      cleanup();
    }, 15000);
  } catch (e) {
    uiStore.els.msg.className = 'card err';
    uiStore.els.msg.textContent =
      'Fehler beim PDF-Export: ' + (e && e.message ? e.message : String(e));
  }
}

export function bindExportButton() {
  var btn = uiStore.els.exportPdfBtn;
  if (btn && !btn._gsppBound) {
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      exportToPdf(ev);
    });
    btn._gsppBound = true;
  }
}

export function exportComponentToPdf(event) {
  if (isKern())
    return printKernDocument(
      uiStore.els.componentTab,
      componentStore.componentState.metadata?.title || 'Komponentendefinition',
      !!(
        componentStore.componentState.components?.length ||
        componentStore.componentState.capabilities?.length
      ),
      event?.currentTarget,
    );
  try {
    if (
      (!componentStore.componentState.components ||
        !componentStore.componentState.components.length) &&
      (!componentStore.componentState.capabilities ||
        !componentStore.componentState.capabilities.length)
    ) {
      uiStore.els.msg.className = 'card err';
      uiStore.els.msg.textContent =
        'Bitte zuerst eine OSCAL-Komponentendefinition laden, bevor du exportierst.';
      return;
    }

    var prevTabEl = document.querySelector('.tab.active');
    var prevTab = prevTabEl ? prevTabEl.getAttribute('data-tab') : 'components';
    switchTab('components');
    renderComponentView();

    var ds = uiStore.els.componentTab.querySelectorAll('details');
    var openState = [];
    for (var i = 0; i < ds.length; i++) {
      openState.push(!!ds[i].open);
      ds[i].open = true;
    }

    document.body.classList.add('print-mode');

    var cleaned = false;
    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      document.body.classList.remove('print-mode');
      var ds2 = uiStore.els.componentTab.querySelectorAll('details');
      for (var j = 0; j < ds2.length && j < openState.length; j++) {
        ds2[j].open = openState[j];
      }
      switchTab(prevTab);
    }

    window.addEventListener('afterprint', cleanup, { once: true });
    void document.body.offsetHeight;
    window.print();
    setTimeout(function () {
      cleanup();
    }, 15000);
  } catch (e) {
    uiStore.els.msg.className = 'card err';
    uiStore.els.msg.textContent =
      'Fehler beim PDF-Export der Komponenten: ' + (e && e.message ? e.message : String(e));
  }
}

export function bindComponentExportButton() {
  var btn = uiStore.compEls.exportPdfBtn;
  if (btn && !btn._gsppBound) {
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      exportComponentToPdf(ev);
    });
    btn._gsppBound = true;
  }
}
