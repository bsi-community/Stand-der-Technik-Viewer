/** shared/html: see docs/architecture.md for responsibilities. */

export function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

export function highlightParamsInEscaped(htmlEscaped) {
  if (!htmlEscaped) return htmlEscaped;
  return htmlEscaped.replace(/\{\{\s*(value:|label:)?\s*([^}]+)\s*\}\}/g, function (_, kind, body) {
    var cls = kind && kind.toLowerCase().indexOf('value:') === 0 ? 'param-value' : 'param';
    return '<span class="' + cls + '">{{ ' + body.trim() + ' }}</span>';
  });
}
