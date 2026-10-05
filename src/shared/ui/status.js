/** shared/ui/status: see docs/architecture.md for responsibilities. */

export function syncStatusPillTooltip(pill) {
  if (!pill) return;
  var fullText = String(pill.textContent || '').trim();
  if (fullText) {
    pill.setAttribute('title', fullText);
    pill.setAttribute('aria-label', fullText);
    pill.setAttribute('tabindex', '0');
  } else {
    pill.removeAttribute('title');
    pill.removeAttribute('aria-label');
    pill.removeAttribute('tabindex');
  }
}

export function bindStatusPillTooltips() {
  var pills = document.querySelectorAll('.status .pill');
  for (var i = 0; i < pills.length; i++) {
    (function (pill) {
      syncStatusPillTooltip(pill);
      if (typeof MutationObserver !== 'undefined') {
        var observer = new MutationObserver(function () {
          syncStatusPillTooltip(pill);
        });
        observer.observe(pill, { childList: true, characterData: true, subtree: true });
      }
    })(pills[i]);
  }
}
