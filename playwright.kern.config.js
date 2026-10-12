import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';
export default defineConfig({
  ...base,
  reporter: [['list']],
  outputDir: './test-results/kern-visual',
  testDir: './tests/visual',
  projects: [base.projects[0]],
  workers: 1,
  snapshotPathTemplate: '{testDir}/references/{platform}/{arg}{ext}',
  expect: { toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixels: 0 } },
});
