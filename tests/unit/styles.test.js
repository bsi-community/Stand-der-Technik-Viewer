import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from 'vitest';
import { styleSignature } from '../../scripts/style-signature.mjs';
test('all stylesheet rules retain the original values and cascade order', async () => {
  const entry = fs.readFileSync('src/styles/index.css', 'utf8');
  const css = [...entry.matchAll(/@import\s+['"]([^'"]+)['"]/g)]
    .map((m) => fs.readFileSync(path.join('src/styles', m[1]), 'utf8'))
    .join('\n');
  const expected = JSON.parse(fs.readFileSync('tests/fixtures/style-contract.json', 'utf8'));
  expect(await styleSignature(css)).toBe(expected.sha256);
});
