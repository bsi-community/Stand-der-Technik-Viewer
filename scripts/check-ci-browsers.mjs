/** Fail early on missing browsers or container permissions before running the full suite. */
import { chromium, firefox, webkit } from '@playwright/test';

for (const engine of [chromium, firefox, webkit]) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage();
    await page.goto('about:blank');
    console.log(`${engine.name()}: browser startup OK`);
  } finally {
    await browser.close();
  }
}
