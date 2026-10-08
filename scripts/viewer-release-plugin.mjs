import { createHash } from 'node:crypto';
import { prepareViewer } from '../src/infrastructure/viewer-update.js';

export function viewerReleasePlugin(base, version) {
  const marker = '__VIEWER_RELEASE_BUILD_ID__';
  return {
    name: 'viewer-release',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler: (html) =>
        html.replace(
          /<meta charset="UTF-8"\s*\/?>/i,
          (charset) =>
            `${charset}\n<script data-viewer-update>window.__viewerReady = (${prepareViewer.toString()})(${JSON.stringify(marker)}, ${JSON.stringify(base)});</script>`,
        ),
    },
    generateBundle(_options, bundle) {
      const html = bundle['index.html'];
      if (!html || !html.source.includes(marker)) {
        throw new Error('Viewer release guard missing from built HTML');
      }
      // Content identity changes even when VERSION has not been incremented.
      const hash = createHash('sha256');
      for (const name of Object.keys(bundle).sort()) {
        const item = bundle[name];
        hash
          .update(name)
          .update('\0')
          .update(item.type === 'chunk' ? item.code : item.source);
      }
      const buildId = hash.digest('hex');
      html.source = html.source.replaceAll(marker, buildId);
      this.emitFile({
        type: 'asset',
        fileName: 'release.json',
        source: JSON.stringify({ buildId, version }) + '\n',
      });
    },
  };
}
