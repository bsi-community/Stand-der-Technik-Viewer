/** Model identifiers supported by the current viewer, not all OSCAL model types. */
export type OscalKind = 'catalog' | 'component' | 'mapping';
export interface ModelDefinition {
  kind: OscalKind;
  rootKey: 'catalog' | 'component-definition' | 'mapping-collection';
  label: string;
  aliases: readonly string[];
}
