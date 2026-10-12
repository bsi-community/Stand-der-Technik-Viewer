import { isKern } from './kern.js';

const panelIds = {
  list: 'listTab',
  components: 'componentTab',
  mappings: 'mappingTab',
  graph: 'graphTab',
  sunburst: 'sunburstTab',
  bar: 'barTab',
  'target-hierarchy': 'targetHierarchyTab',
};

export function syncKernNavigation(mode, view) {
  if (!isKern()) return;
  const primary = mode === 'component' ? 'components' : mode === 'mapping' ? 'mappings' : 'list';
  for (const button of document.querySelectorAll('.workspace-tab-group .tab')) {
    button.removeAttribute('aria-selected');
    button.toggleAttribute('data-current', view !== 'home' && button.dataset.tab === primary);
    if (view !== 'home' && button.dataset.tab === primary)
      button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  }
  const records = document.getElementById('tab-records');
  if (!records) return;
  records.textContent =
    mode === 'component' ? 'Komponenten' : mode === 'mapping' ? 'Zuordnungen' : 'Anforderungen';
  records.dataset.tab = primary;
  records.setAttribute('aria-controls', panelIds[primary]);
  records.disabled = view === 'home';
  const tabs = [...document.querySelectorAll('#visualizationTabGroup [role="tab"]')];
  const available = tabs.filter((tab) => !tab.disabled && !tab.hidden);
  const active = available.find((tab) => tab.dataset.tab === view);
  for (const tab of tabs) {
    const selected = tab === active;
    tab.setAttribute('aria-selected', String(selected));
    tab.classList.toggle('active', selected);
    tab.tabIndex = tab === (active || available[0]) ? 0 : -1;
  }
  for (const name of ['list', 'components', 'mappings'])
    document.getElementById(panelIds[name]).setAttribute('aria-labelledby', 'tab-records');
}

export function bindKernTabKeys(group) {
  group.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = [...group.querySelectorAll('[role="tab"]')].filter(
      (tab) => !tab.disabled && !tab.hidden,
    );
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs.forEach((tab, i) => {
      tab.tabIndex = i === next ? 0 : -1;
    });
    tabs[next].focus();
  });
}
