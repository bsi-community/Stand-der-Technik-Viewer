import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';
const port = process.env.VIEWER_RELEASE_TEST_PORT || '4189';
const baseURL = `http://127.0.0.1:${port}/Stand-der-Technik-Viewer/`;
export default defineConfig({
  ...base,
  reporter: [['list']],
  outputDir: './test-results/kern-release',
  testDir: './tests/release',
  use: { ...base.use, baseURL },
  webServer: {
    command: `node node_modules/vite/bin/vite.js preview --outDir dist-release --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
  },
});
