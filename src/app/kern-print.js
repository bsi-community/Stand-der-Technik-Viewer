/** Print a detached copy so expanding it cannot change workspace selection or disclosures. */
import { showMsg } from '../shared/ui/messages.js';
import { escapeHtml } from '../shared/html.js';

let cleanupPreviousPrint;
export function printKernDocument(source, title, hasData, trigger = document.activeElement) {
  if (!hasData) {
    showMsg('Bitte zuerst ein passendes OSCAL-Dokument laden, bevor du exportierst.', true);
    return;
  }
  cleanupPreviousPrint?.();
  const copy = source.cloneNode(true);
  copy.id = 'viewerPrintDocument';
  copy.classList.remove('hidden');
  copy.removeAttribute('role');
  copy.removeAttribute('aria-labelledby');
  copy.removeAttribute('tabindex');
  for (const element of copy.querySelectorAll('[id]')) element.removeAttribute('id');
  for (const details of copy.querySelectorAll('details')) details.open = true;
  for (const element of copy.querySelectorAll(
    'button, .overview, .component-card-actions, .implementation-row-actions, .description-collapse-toggle',
  ))
    element.remove();
  const heading = document.createElement('h1');
  heading.textContent = title;
  const note = document.createElement('p');
  note.textContent = 'Aktuelle Auswahl · Stand der Technik Viewer';
  copy.prepend(heading, note);
  document.body.append(copy);
  const cleanup = () => {
    document.body.classList.remove('print-mode');
    copy.remove();
    window.removeEventListener('afterprint', cleanup);
    cleanupPreviousPrint = undefined;
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    requestAnimationFrame(() => {
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    });
  };
  cleanupPreviousPrint = cleanup;
  window.addEventListener('afterprint', cleanup, { once: true });
  document.body.classList.add('print-mode');
  try {
    void copy.offsetHeight;
    window.print();
  } catch (error) {
    cleanup();
    showMsg(
      'Druckansicht konnte nicht geöffnet werden: ' + escapeHtml(error.message || String(error)),
      true,
    );
  }
}
