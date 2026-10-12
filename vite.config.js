import { readFileSync, existsSync } from 'node:fs';
import { defineConfig } from 'vite';
import { viewerReleasePlugin } from './scripts/viewer-release-plugin.mjs';
const version = readFileSync(new URL('./VERSION', import.meta.url), 'utf8').trim();
const base = '/Stand-der-Technik-Viewer/';
export default defineConfig(({ mode }) => ({
  base,
  define: {
    'import.meta.env.VIEWER_COMPARISON': mode !== 'release',
    'import.meta.env.VIEWER_BUNDESSANS': existsSync('public/assets/bundessans/manifest.json')
      ? readFileSync('public/assets/bundessans/manifest.json', 'utf8')
      : 'null',
  },
  plugins: [
    {
      name: 'viewer-version',
      transformIndexHtml: (html) => html.replaceAll('%VIEWER_VERSION%', version),
    },
    viewerReleasePlugin(base, version),
  ],
  build: {
    target: ['chrome111', 'edge111', 'firefox114', 'safari16.4'],
    rolldownOptions: {
      output: { codeSplitting: { groups: [{ name: 'd3', test: /node_modules/ }] } },
    },
  },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
}));
