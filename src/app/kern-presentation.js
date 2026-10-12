/** KERN application setup, independent of comparison scenarios. */
import { refreshChartsIfVisible } from './refresh.js';
import { setGraphSimulation } from '../features/visualizations/common.js';
import { prepareKernWorkbench } from './kern-workbench.js';

export async function prepareKernPresentation() {
  prepareKernWorkbench();
  // Observe the actual surfaces, including changes caused by responsive layout.
  // A window resize event can precede the new element dimensions (notably WebKit).
  let chartResizeFrame;
  const surfaces = ['graph', 'sunburst', 'bar'].map((id) => document.getElementById(id));
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(chartResizeFrame);
    chartResizeFrame = requestAnimationFrame(() => {
      if (!surfaces[0].clientWidth) setGraphSimulation(surfaces[0], null);
      const stale = surfaces.some((el) => {
        const svg = el.querySelector(':scope > svg');
        return (
          el.clientWidth &&
          el.clientHeight &&
          svg &&
          (Number(svg.getAttribute('width')) !== el.clientWidth ||
            Number(svg.getAttribute('height')) !== el.clientHeight)
        );
      });
      if (stale) refreshChartsIfVisible();
    });
  });
  surfaces.forEach((el) => observer.observe(el));
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
