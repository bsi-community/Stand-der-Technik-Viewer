import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from 'vitest';
import { styleSignature } from '../../scripts/style-signature.mjs';
test('legacy stylesheet rules retain the original values and cascade order', async () => {
  const entry = fs.readFileSync('src/styles/index.css', 'utf8');
  const css = [...entry.matchAll(/@import\s+['"]([^'"]+)['"]/g)]
    // The new mapping resource header is covered by the mapping browser tests.
    // Keep the original contract intact for every pre-existing stylesheet.
    .filter((m) => m[1] !== './mapping-resource.css')
    .map((m) => fs.readFileSync(path.join('src/styles', m[1]), 'utf8'))
    .join('\n');
  const expected = JSON.parse(fs.readFileSync('tests/fixtures/style-contract.json', 'utf8'));
  expect(await styleSignature(css)).toBe(expected.sha256);
});
