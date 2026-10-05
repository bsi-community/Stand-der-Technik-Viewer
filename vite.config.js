import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
const version = readFileSync(new URL('./VERSION', import.meta.url), 'utf8').trim();
export default defineConfig({
  base: '/Stand-der-Technik-Viewer/',
  plugins: [
    {
      name: 'viewer-version',
      transformIndexHtml: (html) => html.replaceAll('%VIEWER_VERSION%', version),
    },
  ],
  build: {
    target: ['chrome111', 'edge111', 'firefox114', 'safari16.4'],
    rolldownOptions: {
      output: { codeSplitting: { groups: [{ name: 'd3', test: /node_modules/ }] } },
    },
  },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
});
