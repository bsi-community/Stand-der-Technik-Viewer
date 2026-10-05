/** Single, type-checked registry for model detection and labels. No UI dependencies. */
/** @type {readonly import('./contracts').ModelDefinition[]} */
export const models = [
  {
    kind: 'catalog',
    rootKey: 'catalog',
    label: 'OSCAL Catalog',
    aliases: ['catalog', 'catalogue', 'oscal-catalog'],
  },
  {
    kind: 'component',
    rootKey: 'component-definition',
    label: 'OSCAL-Komponentendefinition',
    aliases: ['component', 'components', 'component-definition', 'componentdefinition'],
  },
  {
    kind: 'mapping',
    rootKey: 'mapping-collection',
    label: 'OSCAL Mapping Collection',
    aliases: ['mapping', 'mappings', 'mapping-collection', 'mappingcollection'],
  },
];
/** @param {unknown} value @returns {import('./contracts').OscalKind | ''} */
export function normalizeOscalKind(value) {
  const alias = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
  return models.find((model) => model.aliases.includes(alias))?.kind || '';
}
/** @param {unknown} json @returns {import('./contracts').OscalKind | ''} */
export function detectOscalKind(json) {
  if (!json || typeof json !== 'object') return '';
  return (
    models.find((model) => model.rootKey in json && Boolean(Reflect.get(json, model.rootKey)))
      ?.kind || ''
  );
}
/** @param {string} kind */
export function oscalKindLabel(kind) {
  return models.find((model) => model.kind === kind)?.label || 'OSCAL-Dokument';
}
