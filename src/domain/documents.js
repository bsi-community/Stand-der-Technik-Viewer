/** Document metadata utilities. Model registration is kept independent of UI/state. */
export { detectOscalKind, normalizeOscalKind, oscalKindLabel } from './model-registry.js';

export function getOscalDocumentRoot(root) {
  if (!root || typeof root !== 'object') return null;
  return (
    root.catalog ||
    root['component-definition'] ||
    root['mapping-collection'] ||
    root.profile ||
    root
  );
}
export function getOscalDocumentTitle(root, fallbackLabel) {
  const doc = getOscalDocumentRoot(root);
  if (!doc) return String(fallbackLabel || '');
  return String(doc.metadata?.title || doc.title || fallbackLabel || '').trim();
}
export function normalizeOscalDocumentIdentifier(value) {
  const identifier = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^urn:uuid:/, '');
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(identifier)
    ? identifier
    : '';
}
export function getOscalDocumentIdentifier(root) {
  const doc = getOscalDocumentRoot(root);
  const ids = doc?.metadata?.['document-ids'];
  for (const entry of Array.isArray(ids) ? ids : []) {
    const identifier = normalizeOscalDocumentIdentifier(entry?.identifier);
    if (identifier) return identifier;
  }
  return '';
}
