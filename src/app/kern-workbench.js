/** One-time KERN shell setup before bootstrap binds the existing application actions. */
import { switchTab } from './actions.js';
import { uiStore } from './store.js';
import { kernButton, kernField, kernDetails, prepareUrlField } from '../shared/ui/kern.js';
import { bindKernTabKeys } from '../shared/ui/kern-navigation.js';

export function prepareKernWorkbench() {
  kernButton(document.getElementById('jsonModalClose'));
  const workspace = document.querySelector('.workspace-tab-group');
  workspace.setAttribute('role', 'navigation');
  workspace.querySelectorAll('.tab').forEach((button) => {
    button.removeAttribute('role');
    button.removeAttribute('aria-selected');
    button.removeAttribute('aria-controls');
  });
  const views = document.getElementById('visualizationTabGroup');
  const records = document.createElement('button');
  records.id = 'tab-records';
  records.className = 'viewer-view-tab';
  records.type = 'button';
  records.setAttribute('role', 'tab');
  records.addEventListener('click', () => switchTab(records.dataset.tab));
  views.querySelector('#visualContextLabel').after(records);
  bindKernTabKeys(views);
  // Focus can move here after an import removes its trigger; Tab visits the controls inside.
  for (const panel of document.querySelectorAll('main [role="tabpanel"]')) panel.tabIndex = -1;
  const aside = document.querySelector('.wrap > aside');
  aside.setAttribute('aria-label', 'Datenquellen und Filter');
  for (const button of aside.querySelectorAll('.btn')) kernButton(button);
  for (const input of aside.querySelectorAll('input:not([type="file"]), select')) kernField(input);
  for (const details of aside.querySelectorAll('.sidebar-section')) {
    kernDetails(details);
    // Import and filters can stay open together. No content disappears while working.
    details.removeAttribute('name');
  }
  for (const [id, label, kind] of [
    ['urlInput', 'Katalog-URL', 'catalog'],
    ['compUrlInput', 'Komponentendefinition-URL', 'component'],
    ['mappingUrlInput', 'Mapping-URL', 'mapping'],
  ]) {
    const input = document.getElementById(id);
    kernField(input, label);
    input.setAttribute('aria-describedby', `${id}Hint`);
    const hint = document.createElement('p');
    hint.id = `${id}Hint`;
    hint.className = 'viewer-field-hint';
    hint.textContent =
      'HTTP-/HTTPS-Adresse einer OSCAL-JSON-Datei; auch GitHub-Dateilinks sind möglich.';
    input.after(hint);
    prepareUrlField(input, kind);
  }
  const message = document.getElementById('msg');
  document.querySelector('main').prepend(message);
  message.setAttribute('role', 'alert');
  message.setAttribute('aria-atomic', 'true');
  const status = document.createElement('div');
  status.id = 'viewerImportStatus';
  status.className = 'viewer-import-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-atomic', 'true');
  message.after(status);
  const results = document.createElement('div');
  results.id = 'viewerResultStatus';
  results.className = 'kern-sr-only';
  results.setAttribute('role', 'status');
  results.setAttribute('aria-atomic', 'true');
  document.querySelector('main').append(results);
  // A persistent live region survives re-rendering of the actual result content.
  const countIds = ['catalogSelectionState', 'componentSelectionState', 'mappingSelectionState'];
  let timer;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      // A delayed workspace update must not overwrite the library's own announcement.
      if (uiStore.uiState?.view === 'home') return;
      const mode = uiStore.uiState?.dataMode;
      const id =
        mode === 'component' ? countIds[1] : mode === 'mapping' ? countIds[2] : countIds[0];
      const text =
        document.getElementById(id)?.querySelector('.selection-subtitle')?.textContent || '';
      if (results.textContent !== text) results.textContent = text;
    }, 180);
  });
  countIds.forEach((id) =>
    observer.observe(document.getElementById(id), {
      childList: true,
      characterData: true,
      subtree: true,
    }),
  );
}
