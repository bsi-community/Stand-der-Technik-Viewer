/** features/components/view: see docs/architecture.md for responsibilities. */
import { setComponentExpansion } from '../../app/actions.js';
import { exportComponentToPdf } from '../../app/print.js';
import { resetComponentFilters } from '../../app/reset.js';
import { componentStore, uiStore } from '../../app/store.js';
import { buildComponentGraphData } from './graph-data.js';
import { appendImportedComponentDefinitions } from './imports-view.js';
import { renderComponentOwner } from './owner-view.js';
import {
  getMatchedCapabilityComponents,
  getVisibleComponentCapabilityKeys,
  matchesComponentOwner,
} from './selectors.js';
import { collectComponentActiveFilterChips, renderSelectionState } from '../selection.js';
import { renderWorkspaceEmptyState } from '../sources/empty-state.js';
import { enhanceCollapsibleDescriptions } from '../../shared/ui/collapsible.js';
import {
  appendGenericObjectList,
  appendGenericSection,
  appendRemainingObjectFields,
  getObjectDisplayRows,
  hasDisplayValue,
} from '../../shared/ui/metadata.js';
import { renderOverviewCard, withDataMode } from '../../shared/ui/overview.js';

export function renderComponentDocumentInfo(container, searchTerm) {
  var hasMeta =
    hasDisplayValue(componentStore.componentState.documentUuid) ||
    hasDisplayValue(componentStore.componentState.metadata);
  var hasImports = hasDisplayValue(componentStore.componentState.imports);
  var hasBackMatter = hasDisplayValue(componentStore.componentState.backMatter);
  if (!hasMeta && !hasImports && !hasBackMatter) return;

  var heading = document.createElement('div');
  heading.className = 'component-info-heading';
  heading.textContent = 'Komponenteninformationen';
  container.appendChild(heading);

  if (hasMeta) {
    var metaDetails = document.createElement('details');
    metaDetails.className = 'catalog-info-box';
    metaDetails.innerHTML = '<summary><strong>Metadaten</strong></summary>';
    var body = document.createElement('div');
    body.className = 'catalog-info-content';
    var meta = componentStore.componentState.metadata || {};
    var metaRows = getObjectDisplayRows(meta, [
      { name: 'uuid', value: componentStore.componentState.documentUuid },
    ]);
    appendGenericSection(
      body,
      '',
      metaRows,
      searchTerm,
      componentStore.componentState.resourceByUuid,
      componentStore.componentState.baseUrl,
    );
    metaDetails.appendChild(body);
    container.appendChild(metaDetails);
  }

  if (hasImports) {
    var importDetails = document.createElement('details');
    importDetails.className = 'catalog-info-box';
    importDetails.innerHTML =
      '<summary><strong>Importierte Komponentendefinitionen</strong></summary>';
    var importBody = document.createElement('div');
    importBody.className = 'catalog-info-content';
    appendImportedComponentDefinitions(
      importBody,
      componentStore.componentState.imports,
      searchTerm,
      componentStore.componentState.resourceByUuid,
      componentStore.componentState.baseUrl,
      componentStore.componentState.importStatuses,
    );
    importDetails.appendChild(importBody);
    container.appendChild(importDetails);
  }

  if (hasBackMatter) {
    var backDetails = document.createElement('details');
    backDetails.className = 'catalog-info-box';
    backDetails.innerHTML = '<summary><strong>Back Matter</strong></summary>';
    var backBody = document.createElement('div');
    backBody.className = 'catalog-info-content';
    appendGenericObjectList(
      backBody,
      'Ressourcen',
      componentStore.componentState.backMatter.resources,
      searchTerm,
      componentStore.componentState.resourceByUuid,
      componentStore.componentState.baseUrl,
    );
    appendRemainingObjectFields(
      backBody,
      'Weitere Back-Matter-Felder',
      componentStore.componentState.backMatter,
      ['resources'],
      searchTerm,
      componentStore.componentState.resourceByUuid,
      componentStore.componentState.baseUrl,
    );
    backDetails.appendChild(backBody);
    container.appendChild(backDetails);
  }

  var sep = document.createElement('hr');
  sep.className = 'catalog-separator';
  container.appendChild(sep);
}

export function renderComponentView() {
  return withDataMode('component', function () {
    uiStore.els.componentTab.innerHTML = '';
    if (
      !componentStore.componentState.components.length &&
      !componentStore.componentState.capabilities.length &&
      !componentStore.componentState.metadata &&
      !componentStore.componentState.backMatter
    ) {
      renderSelectionState(
        uiStore.compEls.selectionState,
        'Status Komponentendefinitionen',
        'Kein Datensatz geladen',
        [],
      );
      renderOverviewCard({
        title: 'Komponentendefinitionen-Workspace',
        description:
          'Lade eine OSCAL-Komponentendefinition, um Implementierungen, Capabilities und Referenzen in derselben Oberfläche zu verfolgen.',
        stats: [
          { label: 'Komponenten', value: '0', note: 'Geladene Einträge' },
          { label: 'Capabilities', value: '0', note: 'Geladene Einträge' },
          { label: 'Treffer', value: '0', note: 'Sichtbare Einträge' },
          { label: 'Quellen', value: '0', note: 'Erkannte Herkunft' },
        ],
        chips: [],
        actions: [],
      });
      renderWorkspaceEmptyState(uiStore.els.componentTab, 'component');
      uiStore.compEls.graphInfo.textContent = 'Graph: 0 Knoten';
      return;
    }
    renderComponentDocumentInfo(uiStore.els.componentTab, componentStore.componentState.qRaw);

    var matchedCapabilities = [],
      matchedComponents = [];
    for (var i = 0; i < componentStore.componentState.capabilities.length; i++) {
      if (matchesComponentOwner(componentStore.componentState.capabilities[i]))
        matchedCapabilities.push(componentStore.componentState.capabilities[i]);
    }
    for (var c = 0; c < componentStore.componentState.components.length; c++) {
      if (matchesComponentOwner(componentStore.componentState.components[c]))
        matchedComponents.push(componentStore.componentState.components[c]);
    }
    var activeComponentChips = collectComponentActiveFilterChips();
    renderSelectionState(
      uiStore.compEls.selectionState,
      'Fokus Komponentendefinitionen',
      matchedCapabilities.length + matchedComponents.length + ' sichtbare Einträge',
      activeComponentChips,
    );
    renderOverviewCard({
      title:
        matchedCapabilities.length || matchedComponents.length
          ? 'Analyse der Komponentendefinition'
          : 'Keine Treffer in Komponenten',
      description:
        matchedCapabilities.length || matchedComponents.length
          ? 'Die Ansicht fokussiert Eigentümer, Implementierungen und referenzierte Anforderungen mit klaren Sprungpunkten zurück in den Katalog.'
          : 'Die aktuelle Suche oder Filterung blendet alle Komponenten und Capabilities aus. Passe die Einschränkungen an oder setze sie gesammelt zurück.',
      stats: [
        {
          label: 'Komponenten',
          value: String(componentStore.componentState.components.length),
          note: 'Geladene Komponenten',
        },
        {
          label: 'Capabilities',
          value: String(componentStore.componentState.capabilities.length),
          note: 'Geladene Capabilities',
        },
        {
          label: 'Sichtbar',
          value: String(matchedCapabilities.length + matchedComponents.length),
          note: 'Aktuelle Treffer',
        },
        {
          label: 'Quellen',
          value: String(componentStore.allComponentSources.length),
          note: 'Erkannte Herkunft',
        },
      ],
      chips: activeComponentChips,
      actions: [
        { label: 'Filter zurücksetzen', onClick: resetComponentFilters },
        {
          label: 'Alles aufklappen',
          onClick: function () {
            setComponentExpansion(true);
          },
        },
        {
          label: 'Alles zuklappen',
          onClick: function () {
            setComponentExpansion(false);
          },
        },
        { label: 'Als PDF exportieren', onClick: exportComponentToPdf },
      ],
    });

    var capabilitySections = [];
    var renderedComponentKeys = {};
    for (var mc = 0; mc < componentStore.componentState.capabilities.length; mc++) {
      var capability = componentStore.componentState.capabilities[mc];
      var capabilityMatches = matchesComponentOwner(capability);
      var childComponents = getMatchedCapabilityComponents(capability);
      if (!capabilityMatches && !childComponents.length) continue;
      capabilitySections.push({ capability: capability, components: childComponents });
      for (var g = 0; g < childComponents.length; g++) {
        renderedComponentKeys[childComponents[g].uuid || childComponents[g].name] = true;
      }
    }

    var standaloneComponents = [];
    for (var mp = 0; mp < matchedComponents.length; mp++) {
      var component = matchedComponents[mp];
      var componentKey = component.uuid || component.name;
      if (getVisibleComponentCapabilityKeys(component).length) {
        renderedComponentKeys[componentKey] = true;
        continue;
      }
      if (!renderedComponentKeys[componentKey]) standaloneComponents.push(component);
    }

    if (!capabilitySections.length && !standaloneComponents.length) {
      var empty = document.createElement('div');
      empty.className = 'card';
      empty.textContent = 'Keine Ergebnisse für die aktuelle Filterung.';
      uiStore.els.componentTab.appendChild(empty);
      uiStore.compEls.graphInfo.textContent = 'Graph: 0 Knoten';
      return;
    }

    var compHeading = document.createElement('h2');
    compHeading.className = 'component-doc-heading';
    compHeading.textContent = 'Komponenten';
    uiStore.els.componentTab.appendChild(compHeading);
    for (var cs = 0; cs < capabilitySections.length; cs++) {
      uiStore.els.componentTab.appendChild(
        renderComponentOwner(
          capabilitySections[cs].capability,
          componentStore.componentState.qRaw,
          { childComponents: capabilitySections[cs].components },
        ),
      );
    }
    for (var sc = 0; sc < standaloneComponents.length; sc++) {
      uiStore.els.componentTab.appendChild(
        renderComponentOwner(standaloneComponents[sc], componentStore.componentState.qRaw),
      );
    }
    enhanceCollapsibleDescriptions(uiStore.els.componentTab);
    var graphData = buildComponentGraphData();
    uiStore.compEls.graphInfo.textContent =
      'Graph: ' + graphData.nodes.length + ' Knoten / ' + graphData.links.length + ' Kanten';
  });
}
