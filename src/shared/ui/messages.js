/** Status messages and the JSON dialog; all raw JSON is displayed as text. */
import { isKern } from './kern.js';
import { uiStore } from '../../app/store.js';

export function showMsg(html, isError) {
  uiStore.els.msg.innerHTML = html;
  if (isKern()) {
    uiStore.els.msg.classList.add('viewer-message');
    uiStore.els.msg.setAttribute('role', isError ? 'alert' : 'status');
  }
  uiStore.els.msg.classList.remove('hidden');
  uiStore.els.msg.classList.toggle('err', Boolean(isError));
}
export function hideMsg() {
  uiStore.els.msg.classList.add('hidden');
  uiStore.els.msg.classList.remove('err');
}

let returnFocus = null;
function handleDialogKey(event) {
  const modal = uiStore.els.jsonModal;
  if (!modal || modal.classList.contains('hidden')) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeJsonModal();
  } else if (event.key === 'Tab') {
    const elements = [...modal.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')];
    const first = elements[0],
      last = elements.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
}
export function openJsonModal(obj, trigger = document.activeElement) {
  const { jsonModal, jsonModalBody, jsonModalClose } = uiStore.els;
  if (!jsonModal || !jsonModalBody) return;
  let safeObj = obj;
  if (obj && typeof obj === 'object') {
    try {
      safeObj = JSON.parse(JSON.stringify(obj));
      if (safeObj && Array.isArray(safeObj.controls)) delete safeObj.controls;
    } catch {
      safeObj = obj;
    }
  }
  if (jsonModal.classList.contains('hidden')) returnFocus = trigger;
  jsonModalBody.textContent = JSON.stringify(safeObj, null, 2);
  jsonModal.classList.remove('hidden');
  if (isKern()) {
    const body = jsonModal.querySelector('.modal-body');
    body.tabIndex = 0;
    body.setAttribute('role', 'region');
    body.setAttribute('aria-label', 'JSON-Inhalt');
    body.scrollTop = 0;
    for (const sibling of document.body.children) {
      if (sibling !== jsonModal && !sibling.inert) {
        sibling.inert = true;
        sibling.dataset.viewerModalInert = '';
      }
    }
  }
  document.addEventListener('keydown', handleDialogKey);
  jsonModalClose?.focus();
}
export function closeJsonModal() {
  if (uiStore.els.jsonModal) uiStore.els.jsonModal.classList.add('hidden');
  document.removeEventListener('keydown', handleDialogKey);
  for (const sibling of document.querySelectorAll('[data-viewer-modal-inert]')) {
    sibling.inert = false;
    delete sibling.dataset.viewerModalInert;
  }
  if (returnFocus?.isConnected) returnFocus.focus();
  returnFocus = null;
}
