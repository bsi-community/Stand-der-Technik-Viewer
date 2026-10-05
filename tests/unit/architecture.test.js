import { test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'acorn';
const root = path.resolve('src');
const walk = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const files = walk(root).filter((f) => f.endsWith('.js'));
const graph = new Map(
  files.map((file) => [
    file,
    parse(fs.readFileSync(file, 'utf8'), { ecmaVersion: 'latest', sourceType: 'module' })
      .body.filter((n) => n.source?.value?.startsWith('.'))
      .map((n) => path.resolve(path.dirname(file), n.source.value)),
  ]),
);
test('all relative imports exist and the module graph is acyclic', () => {
  const done = new Set();
  function visit(file, stack = []) {
    expect(fs.existsSync(file), path.relative(root, file)).toBe(true);
    expect(
      stack.includes(file),
      stack
        .concat(file)
        .map((f) => path.relative(root, f))
        .join(' -> '),
    ).toBe(false);
    if (done.has(file)) return;
    for (const dependency of graph.get(file) || []) visit(dependency, stack.concat(file));
    done.add(file);
  }
  for (const file of files) visit(file);
});
test('domain modules do not depend on application, views or infrastructure', () => {
  for (const [file, imports] of graph)
    if (file.startsWith(path.join(root, 'domain') + path.sep)) {
      for (const dependency of imports)
        expect(path.relative(root, dependency)).not.toMatch(/^(app|features|infrastructure)\//);
      expect(fs.readFileSync(file, 'utf8')).not.toMatch(
        /\b(document|window)\.(querySelector|createElement|location|addEventListener)/,
      );
    }
});

test('bootstrap provides every callback exposed to views', () => {
  const actions = parse(fs.readFileSync('src/app/actions.js', 'utf8'), {
    ecmaVersion: 'latest',
    sourceType: 'module',
  }).body;
  const required = actions
    .filter(
      (n) => n.type === 'ExportNamedDeclaration' && n.declaration?.type === 'FunctionDeclaration',
    )
    .map((n) => n.declaration.id.name)
    .filter((name) => name !== 'configureActions');
  const bootstrap = parse(fs.readFileSync('src/app/bootstrap.js', 'utf8'), {
    ecmaVersion: 'latest',
    sourceType: 'module',
  }).body;
  const start = bootstrap.find(
    (n) => n.type === 'ExportNamedDeclaration' && n.declaration?.id?.name === 'startViewer',
  ).declaration;
  const wiring = start.body.body.find(
    (n) => n.type === 'ExpressionStatement' && n.expression?.callee?.name === 'configureActions',
  ).expression.arguments[0];
  expect(wiring.properties.map((p) => p.key.name).sort()).toEqual(required.sort());
});
