/** shared/ui/collapsible: see docs/architecture.md for responsibilities. */
import { uiStore } from '../../app/store.js';

export function syncCollapsibleDescription(wrapper) {
  if (!wrapper) return;
  var content = wrapper.querySelector('.description-collapse-content');
  var toggle = wrapper.querySelector('.description-collapse-toggle');
  if (!content || !toggle) return;

  var lineProbe = content.querySelector('p, li, blockquote, pre') || content;
  var style = window.getComputedStyle(lineProbe);
  var lineHeight = parseFloat(style.lineHeight);
  if (!isFinite(lineHeight)) {
    lineHeight = parseFloat(style.fontSize || '16') * 1.55;
  }
  var clampHeight = Math.ceil(lineHeight * 4);
  wrapper.style.setProperty('--description-clamp-height', clampHeight + 'px');
  wrapper.style.setProperty('--description-line-height', lineHeight + 'px');
  wrapper.style.setProperty('--description-font-size', style.fontSize || '1em');
  wrapper.style.setProperty(
    '--description-fade-height',
    Math.max(10, Math.ceil(lineHeight * 0.7)) + 'px',
  );
  wrapper.style.setProperty(
    '--description-fade-soft-height',
    Math.max(4, Math.ceil(lineHeight * 0.28)) + 'px',
  );

  var hasCollapsedRemarks = !!content.querySelector('.implemented-requirement-remarks');
  var hasOverflow = hasCollapsedRemarks || content.scrollHeight > clampHeight + 1;
  wrapper.classList.toggle('has-overflow', hasOverflow);
  toggle.hidden = !hasOverflow;
  if (!hasOverflow) {
    wrapper.classList.remove('is-expanded');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Gesamten Text anzeigen');
    toggle.title = 'Gesamten Text anzeigen';
  }
}

export function enhanceCollapsibleDescriptions(root) {
  if (!root) return;
  if (!root._descriptionClampBound) {
    root.addEventListener(
      'toggle',
      function () {
        window.requestAnimationFrame(syncComponentDescriptions);
      },
      true,
    );
    window.addEventListener('resize', function () {
      window.requestAnimationFrame(syncComponentDescriptions);
    });
    root._descriptionClampBound = true;
  }
  var descriptions = root.querySelectorAll('.js-collapsible-description');
  for (var i = 0; i < descriptions.length; i++) {
    var content = descriptions[i];
    if (content.parentElement && content.parentElement.classList.contains('description-collapse')) {
      syncCollapsibleDescription(content.parentElement);
      continue;
    }

    var wrapper = document.createElement('div');
    wrapper.className = 'description-collapse';
    content.parentNode.insertBefore(wrapper, content);
    wrapper.appendChild(content);
    content.classList.add('description-collapse-content');

    var toggle = document.createElement('button');
    toggle.className = 'description-collapse-toggle';
    toggle.type = 'button';
    toggle.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Gesamten Text anzeigen');
    toggle.title = 'Gesamten Text anzeigen';
    toggle.addEventListener(
      'click',
      (function (collapse, button) {
        return function () {
          var expanded = collapse.classList.toggle('is-expanded');
          button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
          button.setAttribute(
            'aria-label',
            expanded ? 'Text einklappen' : 'Gesamten Text anzeigen',
          );
          button.title = expanded ? 'Text einklappen' : 'Gesamten Text anzeigen';
        };
      })(wrapper, toggle),
    );
    wrapper.appendChild(toggle);
    syncCollapsibleDescription(wrapper);
  }
}

export function syncComponentDescriptions() {
  var wrappers = uiStore.els.componentTab.querySelectorAll('.description-collapse');
  for (var i = 0; i < wrappers.length; i++) syncCollapsibleDescription(wrappers[i]);
}
