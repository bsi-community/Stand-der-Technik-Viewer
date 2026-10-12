/** Mapping metadata uses full-width prose and explicit property lists, at every depth. */
import { mappingStore } from '../../app/store.js';
import { createDescriptionList, kernContent } from '../../shared/ui/kern.js';
import {
  buildGenericTable,
  getObjectDisplayRows,
  hasDisplayValue,
} from '../../shared/ui/metadata.js';
import { RELATIONSHIP_SOURCE } from './relationship-help.js';

function fields(object, state, resources) {
  const list = createDescriptionList([]);
  list.classList.add('mapping-document-fields');
  for (const row of getObjectDisplayRows(object)) {
    // Reuse the established labels, safe markup and resource-link resolution.
    const scalar = row.value === null || typeof row.value !== 'object';
    const rendered = buildGenericTable(
      [{ ...row, value: scalar ? row.value : '–' }],
      state.qRaw,
      resources,
      state.baseUrl,
    );
    if (!scalar) {
      const value = rendered.querySelector('dd');
      value.replaceChildren();
      const items = Array.isArray(row.value) ? row.value : [row.value];
      for (const item of items.filter(hasDisplayValue)) {
        if (item && typeof item === 'object') value.append(fields(item, state, resources));
        else
          value.append(
            buildGenericTable(
              [{ name: 'value', value: item }],
              state.qRaw,
              resources,
              state.baseUrl,
            ),
          );
      }
    }
    const field = rendered.firstElementChild;
    if (!field) continue;
    if (
      !scalar ||
      ['title', 'remarks', 'description', 'mapping-description', 'value'].includes(row.name) ||
      String(row.value).length > 100
    ) {
      field.classList.add('mapping-document-wide');
    }
    list.append(field);
  }
  return list;
}

export function renderKernMappingDocumentInfo(container) {
  const state = mappingStore.mappingState;
  const resources = new Map();
  for (const resource of state.backMatter?.resources || []) {
    if (resource.uuid) {
      resources.set(resource.uuid, resource);
      resources.set(resource.uuid.toLowerCase(), resource);
    }
  }
  const info = document.createElement('details');
  info.className = 'mapping-document-details';
  const summary = document.createElement('summary');
  summary.textContent =
    'Mapping-Informationen · ' + (state.metadata?.title || 'Mapping Collection');
  const body = document.createElement('div');
  body.className = 'catalog-info-content';
  for (const [title, value] of [
    ['Metadaten', { title: state.metadata?.title, uuid: state.documentUuid, ...state.metadata }],
    ['Herkunft und Methodik', state.provenance],
    ['Ressourcen und Verweise', state.backMatter],
  ]) {
    if (!hasDisplayValue(value)) continue;
    const section = document.createElement('section');
    section.className = 'catalog-section';
    const heading = document.createElement('h3');
    heading.className = 'catalog-section-title';
    heading.textContent = title;
    section.append(heading, fields(value, state, resources));
    body.append(section);
  }
  info.append(summary, body);
  kernContent(info);
  const note = document.createElement('p');
  note.className = 'mapping-relationship-note';
  note.append(
    'Relationship beschreibt die Beziehung von Source zu Target. Die Werte bieten eine deutsche Begriffshilfe per Maus, Tastatur oder Antippen. Grundlage: ',
  );
  const link = document.createElement('a');
  link.href = RELATIONSHIP_SOURCE;
  link.textContent = 'OSCAL 1.2.3 (NIST, englisch)';
  note.append(link);
  container.append(info, note);
}
