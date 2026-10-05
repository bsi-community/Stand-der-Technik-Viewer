/** domain/references: see docs/architecture.md for responsibilities. */

export function looksUuidLikeId(v) {
  return /^_?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));
}

export function normalizeControlRef(ref) {
  var key = String(ref || '').trim();
  if (key.charAt(0) === '#') key = key.slice(1);
  if (/^_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) {
    key = key.slice(1);
  }
  return key;
}
