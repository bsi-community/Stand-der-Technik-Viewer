import { prepareKernPresentation } from './app/kern-presentation.js';
import { startViewer } from './app/bootstrap.js';
// Wait for the release guard before loading any document or comparison data.
Promise.resolve(window.__viewerReady).then(async (ready) => {
  if (ready === false) return;
  const params = new URLSearchParams(location.search);
  const comparison = import.meta.env.VIEWER_COMPARISON;
  const kern = !comparison || params.get('design') !== 'legacy';
  let fontStatus;
  if (kern) {
    document.documentElement.dataset.kernTheme = 'light';
    document.documentElement.dataset.viewerDesign = 'kern';
    await import('./styles/kern/index.css');
    fontStatus = await prepareKernPresentation();
  } else {
    await import('./styles/legacy.css');
    // Only the explicit comparison view needs the historic image. Its stylesheet
    // must be ready before inserting it; the initial HTML always uses KERN branding.
    document.querySelector('.viewer-brand-mark').remove();
    const wordmark = document.createElement('img');
    wordmark.className = 'header-wordmark';
    wordmark.src = `${import.meta.env.BASE_URL}assets/viewer-logo.png`;
    wordmark.alt = 'Stand der Technik – Viewer';
    wordmark.onerror = () => wordmark.replaceWith(document.createTextNode(wordmark.alt));
    document.querySelector('header h1').replaceChildren(wordmark);
  }
  await startViewer();
  if (
    import.meta.env.VIEWER_COMPARISON &&
    ['home', 'catalog', 'mapping'].includes(params.get('preview'))
  ) {
    const { prepareKernPreview, loadPreviewScenario } = await import('./app/kern-preview.js');
    if (kern) prepareKernPreview(fontStatus);
    await loadPreviewScenario();
  }
});
