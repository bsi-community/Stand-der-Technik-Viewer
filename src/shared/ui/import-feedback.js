import { isKern } from './kern.js';

const pending = new Map();
let batchErrors = 0;
let batchSuccess = 0;
let successTimer;

/** Clear only confirmations; pending imports and errors must remain readable. */
export function clearImportSuccess() {
  clearTimeout(successTimer);
  const status = document.getElementById('viewerImportStatus');
  if (status?.dataset.state !== 'success') return;
  status.textContent = '';
  delete status.dataset.state;
}

function display(text, state) {
  clearTimeout(successTimer);
  const status = document.getElementById('viewerImportStatus');
  if (!status) return;
  status.dataset.state = state;
  status.textContent = text;
  if (state === 'success') successTimer = setTimeout(clearImportSuccess, 5000);
}

export function urlValidationError(kind, message) {
  if (!isKern()) return;
  for (const input of document.querySelectorAll(`input[data-import-kind="${kind}"]`)) {
    const error = document.getElementById(`${input.id}Error`);
    input.setAttribute('aria-invalid', 'true');
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
  }
}

/** Count overlapping file/URL imports; a later success must not hide batch failures. */
export function beginImport(kind, label) {
  if (!isKern()) return () => {};
  if (!pending.size) {
    batchErrors = 0;
    batchSuccess = 0;
  }
  const token = Symbol();
  pending.set(token, label);
  for (const input of document.querySelectorAll(`input[data-import-kind="${kind}"]`)) {
    input.removeAttribute('aria-invalid');
    const error = document.getElementById(`${input.id}Error`);
    if (error) error.hidden = true;
  }
  display(`${pending.size} Import${pending.size === 1 ? '' : 'e'} läuft: ${label}`, 'loading');
  return (error = '') => {
    if (!pending.delete(token)) return;
    if (error) batchErrors++;
    else batchSuccess++;
    if (pending.size) {
      display(
        `${pending.size} Import${pending.size === 1 ? '' : 'e'} läuft … ${batchSuccess} erfolgreich, ${batchErrors} fehlgeschlagen.`,
        'loading',
      );
    } else {
      display(
        error && !batchSuccess
          ? `Import fehlgeschlagen: ${error}`
          : `${batchSuccess} Dokument${batchSuccess === 1 ? '' : 'e'} geladen${batchErrors ? `; ${batchErrors} Import${batchErrors === 1 ? '' : 'e'} fehlgeschlagen. Bitte die Dateien oder URLs prüfen.` : '.'}`,
        batchErrors ? 'error' : 'success',
      );
    }
  };
}
