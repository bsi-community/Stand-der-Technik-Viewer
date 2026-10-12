/** KERN application setup, independent of comparison scenarios. */
import { refreshChartsIfVisible } from './refresh.js';
import { prepareKernWorkbench } from './kern-workbench.js';

export async function prepareKernPresentation() {
  prepareKernWorkbench();
  // SVG coordinates must be recomputed when the available workspace changes.
  let chartResizeTimer;
  window.addEventListener(
    'resize',
    () => {
      clearTimeout(chartResizeTimer);
      chartResizeTimer = setTimeout(refreshChartsIfVisible, 140);
    },
    { passive: true },
  );
  const skip = document.createElement('a');
  skip.className = 'kern-skip';
  skip.href = '#viewerMain';
  skip.textContent = 'Zum Inhalt springen';
  document.body.prepend(skip);
  const main = document.querySelector('main');
  main.id = 'viewerMain';
  main.tabIndex = -1;
  const title = document.querySelector('header h1');
  title.textContent = 'Stand der Technik-Viewer';
  const version = document.getElementById('viewerVersion');
  title.appendChild(version);
  document.getElementById('viewSubtitle').textContent =
    'Viewer für Anforderungen, Umsetzungen und Mappings';
  let fontStatus = 'Fira Sans · BundesSans noch nicht hinterlegt';
  const fonts = import.meta.env.VIEWER_BUNDESSANS;
  if (fonts) {
    try {
      await Promise.all(
        fonts.map(async ({ file, weight, style }) => {
          const url = new URL(
            `${import.meta.env.BASE_URL}assets/bundessans/${file}`,
            location.origin,
          );
          const face = new FontFace('BundesSans Web', `url("${url.href}")`, {
            weight: String(weight),
            style,
            display: 'swap',
          });
          document.fonts.add(await face.load());
        }),
      );
      document.documentElement.style.setProperty(
        '--viewer-font',
        '"BundesSans Web", "Fira Sans", sans-serif',
      );
      fontStatus = 'BundesSans Web';
      document.documentElement.dataset.viewerFont = 'bundessans';
    } catch {
      fontStatus = 'Fira Sans · BundesSans konnte nicht geladen werden';
    }
  }
  return fontStatus;
}
