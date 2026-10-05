/** shared/ui/effort-tooltip: see docs/architecture.md for responsibilities. */
import { effortDefinitions } from '../../config.js';

var effortTooltipEl = null;

export function ensureEffortTooltip() {
  if (effortTooltipEl) return effortTooltipEl;
  effortTooltipEl = document.createElement('div');
  effortTooltipEl.className = 'effort-tooltip';
  document.body.appendChild(effortTooltipEl);
  return effortTooltipEl;
}

export function getEffortDisplayValue(v) {
  var s = String(v == null ? '' : v).trim();
  return s === '0' ? 'n/a' : s;
}

export function getEffortTooltipText(v) {
  var key = String(v == null ? '' : v).trim();
  var def = effortDefinitions[key];
  if (!def) return '';
  return String(def).replace(/^Stufe\s*\d+\s*:\s*/i, '');
}

export function showEffortTooltip(evt, text) {
  if (!text) return;
  var tip = ensureEffortTooltip();
  tip.textContent = text;
  tip.style.display = 'block';
  moveEffortTooltip(evt);
}

export function moveEffortTooltip(evt) {
  if (!effortTooltipEl || effortTooltipEl.style.display === 'none') return;
  var x = (evt.clientX || 0) + 14;
  var y = (evt.clientY || 0) + 14;
  var maxX = window.innerWidth - effortTooltipEl.offsetWidth - 8;
  var maxY = window.innerHeight - effortTooltipEl.offsetHeight - 8;
  effortTooltipEl.style.left = (x > maxX ? Math.max(8, maxX) : x) + 'px';
  effortTooltipEl.style.top = (y > maxY ? Math.max(8, maxY) : y) + 'px';
}

export function hideEffortTooltip() {
  if (!effortTooltipEl) return;
  effortTooltipEl.style.display = 'none';
}

export function bindEffortTooltip(root) {
  var nodes = root.querySelectorAll('.effort-hover[data-effort]');
  for (var i = 0; i < nodes.length; i++) {
    (function (node) {
      var text = getEffortTooltipText(node.getAttribute('data-effort'));
      if (!text) return;
      node.addEventListener('mouseenter', function (ev) {
        showEffortTooltip(ev, text);
      });
      node.addEventListener('mousemove', moveEffortTooltip);
      node.addEventListener('mouseleave', hideEffortTooltip);
    })(nodes[i]);
  }
}
