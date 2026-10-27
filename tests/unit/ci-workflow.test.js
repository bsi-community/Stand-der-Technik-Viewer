import { readFileSync } from 'node:fs';
import { test, expect } from 'vitest';

test('CI browser image is pinned and matches the locked Playwright packages', () => {
  const workflow = readFileSync('.github/workflows/verify-and-deploy.yml', 'utf8');
  expect(workflow).toMatch(/^\s+options:.*--user 1001(?:\s|$)/m);
  expect(workflow).toContain('run: node scripts/check-ci-browsers.mjs');
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  const image = workflow.match(
    /^\s+image: mcr\.microsoft\.com\/playwright:v(\d+\.\d+\.\d+)-noble@sha256:[a-f0-9]{64}$/m,
  );
  expect(image, 'Pin the CI image version and digest when updating Playwright.').not.toBeNull();
  for (const name of ['@playwright/test', 'playwright', 'playwright-core']) {
    expect(lock.packages[`node_modules/${name}`].version, name).toBe(image[1]);
  }
});
