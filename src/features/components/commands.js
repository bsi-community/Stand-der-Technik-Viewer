/** features/components/commands: see docs/architecture.md for responsibilities. */
import { renderHighlightedInline, renderMarkupWithParams } from '../../shared/markup.js';
import { containsAnySearchTerm, parseSearchQuery } from '../../shared/search.js';

export function copyConfigCommandFallback(text) {
  return new Promise(function (resolve, reject) {
    var textarea = document.createElement('textarea');
    textarea.value = String(text || '');
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      var copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (copied) resolve();
      else reject(new Error('Kopieren wurde vom Browser abgelehnt.'));
    } catch (err) {
      document.body.removeChild(textarea);
      reject(err);
    }
  });
}

export function copyConfigCommandText(text) {
  var value = String(text || '');
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    return navigator.clipboard.writeText(value).catch(function () {
      return copyConfigCommandFallback(value);
    });
  }
  return copyConfigCommandFallback(value);
}

export function appendConfigCommands(parent, req, searchTerm) {
  var commands = req && Array.isArray(req.configCommands) ? req.configCommands : [];
  if (!commands.length) return false;

  var searchQuery = parseSearchQuery(searchTerm);
  var searchMatch = false;
  for (var sm = 0; sm < commands.length && searchQuery.terms.length; sm++) {
    var searchableCommand =
      String(commands[sm].value || '') + ' ' + String(commands[sm].remarks || '');
    if (containsAnySearchTerm(searchableCommand, searchQuery)) {
      searchMatch = true;
      break;
    }
  }

  var details = document.createElement('details');
  details.className = 'config-command-section';
  details.open = searchMatch;

  var summary = document.createElement('summary');
  var icon = document.createElement('span');
  icon.className = 'config-command-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '>_';
  summary.appendChild(icon);

  var summaryCopy = document.createElement('span');
  summaryCopy.className = 'config-command-summary-copy';
  var summaryTitle = document.createElement('strong');
  summaryTitle.textContent = 'Konfiguration / CLI';
  var summarySubtitle = document.createElement('small');
  summarySubtitle.textContent =
    commands.length === 1 ? 'Befehl für dieses Requirement' : 'Befehle für dieses Requirement';
  summaryCopy.appendChild(summaryTitle);
  summaryCopy.appendChild(summarySubtitle);
  summary.appendChild(summaryCopy);

  var count = document.createElement('span');
  count.className = 'config-command-count';
  count.textContent = String(commands.length);
  count.setAttribute(
    'aria-label',
    commands.length + (commands.length === 1 ? ' Konfigurationsbefehl' : ' Konfigurationsbefehle'),
  );
  summary.appendChild(count);
  details.appendChild(summary);

  var body = document.createElement('div');
  body.className = 'config-command-body';
  for (var i = 0; i < commands.length; i++) {
    var command = commands[i];
    var item = document.createElement('section');
    item.className = 'config-command-item';

    var toolbar = document.createElement('div');
    toolbar.className = 'config-command-toolbar';
    var label = document.createElement('span');
    label.className = 'config-command-label';
    label.textContent = commands.length === 1 ? 'CLI / Code' : 'Befehl ' + (i + 1);
    toolbar.appendChild(label);

    if (String(command.value || '').trim()) {
      var copyButton = document.createElement('button');
      copyButton.className = 'btn small config-command-copy';
      copyButton.type = 'button';
      copyButton.textContent = 'Kopieren';
      copyButton.title = 'Befehl in die Zwischenablage kopieren';
      (function (button, rawValue) {
        button.addEventListener('click', function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          button.disabled = true;
          copyConfigCommandText(rawValue)
            .then(function () {
              button.textContent = 'Kopiert';
              button.classList.add('is-copied');
              setTimeout(function () {
                button.textContent = 'Kopieren';
                button.classList.remove('is-copied');
                button.disabled = false;
              }, 1400);
            })
            .catch(function () {
              button.textContent = 'Nicht kopiert';
              button.title = 'Der Browser hat den Zugriff auf die Zwischenablage blockiert.';
              setTimeout(function () {
                button.textContent = 'Kopieren';
                button.disabled = false;
              }, 1800);
            });
        });
      })(copyButton, command.value);
      toolbar.appendChild(copyButton);
    }
    item.appendChild(toolbar);

    if (String(command.value || '').trim()) {
      var pre = document.createElement('pre');
      pre.className = 'config-command-code';
      var code = document.createElement('code');
      code.innerHTML = renderHighlightedInline(command.value, searchTerm);
      pre.appendChild(code);
      item.appendChild(pre);
    }

    if (String(command.remarks || '').trim()) {
      var remarks = document.createElement('div');
      remarks.className = 'config-command-remarks';
      var remarksLabel = document.createElement('strong');
      remarksLabel.textContent = 'Hinweis';
      remarks.appendChild(remarksLabel);
      var remarksText = document.createElement('div');
      remarksText.className = 'catalog-md';
      remarksText.innerHTML = renderMarkupWithParams(command.remarks, req.paramMap, searchTerm);
      remarks.appendChild(remarksText);
      item.appendChild(remarks);
    }

    body.appendChild(item);
  }
  details.appendChild(body);
  parent.appendChild(details);
  return true;
}
