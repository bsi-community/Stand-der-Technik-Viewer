import './styles/legacy.css';
import { prepareKernPreview, loadPreviewScenario } from './app/kern-preview.js';
import { startViewer } from './app/bootstrap.js';
// The production HTML checks for a newer release before any document can be loaded.
// Development has no release manifest and starts immediately.
Promise.resolve(window.__viewerReady).then(async (ready) => {
  if (ready === false) return;
  const kern = new URLSearchParams(location.search).get('design') !== 'legacy';
  if (kern) {
    document.documentElement.dataset.kernTheme = 'light';
    document.documentElement.dataset.viewerDesign = 'kern';
    await import('./styles/kern/index.css');
    await prepareKernPreview();
  }
  await startViewer();
  await loadPreviewScenario();
});
