/** features/catalog/security-targets: see docs/architecture.md for responsibilities. */
import { catalogStore } from '../../app/store.js';
import { SECURITY_TARGET_DEFINITIONS } from '../../config.js';
import { escapeHtml } from '../../shared/html.js';
import { renderHighlightedInline } from '../../shared/markup.js';

export function renderSecurityTargetMeta(control) {
  var html = '';
  var values = (control && control.securityTargetValues) || {};
  for (var i = 0; i < SECURITY_TARGET_DEFINITIONS.length; i++) {
    var definition = SECURITY_TARGET_DEFINITIONS[i];
    var displayValues = values[definition.key] || [];
    if (!displayValues.length) continue;
    html +=
      '<span class="kv"><strong>Schutzziel ' +
      escapeHtml(definition.label) +
      ':</strong> <code>' +
      renderHighlightedInline(displayValues.join(', '), catalogStore.state.qRaw) +
      '</code></span>';
  }
  return html;
}
