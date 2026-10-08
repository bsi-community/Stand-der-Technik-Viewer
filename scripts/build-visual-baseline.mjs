/** Build the frozen visual reference independently of the current application source. */
import { execFileSync } from 'node:child_process';
import { readFile, mkdtemp, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

// This revision is an ancestor of main and remains available after PR squash/deletion.
const revision = 'fb6b696a986c252b7a41930d19f80645d292c7e6';

export async function buildVisualBaseline() {
  const root = await mkdtemp(path.join(tmpdir(), 'viewer-visual-baseline-'));
  const cleanup = () => rm(root, { recursive: true, force: true });
  try {
    const archive = execFileSync(
      'git',
      [
        'archive',
        revision,
        'src',
        'public',
        'index.html',
        'vite.config.js',
        'VERSION',
        'package.json',
        'package-lock.json',
      ],
      { maxBuffer: 16 * 1024 * 1024 },
    );
    execFileSync('tar', ['-x', '-C', root], { input: archive });
    const referenceLock = await readFile(path.join(root, 'package-lock.json'));
    const currentLock = await readFile('package-lock.json');
    if (!referenceLock.equals(currentLock)) {
      throw new Error(
        'Visual baseline dependencies changed. Review and update the frozen reference before comparing builds.',
      );
    }
    // Frozen, reviewed UI delta for PR #11, never generated from the current checkout.
    const patch = await readFile('tests/fixtures/mapping-visual-baseline.patch');
    const {
      GIT_DIR: _gitDir,
      GIT_WORK_TREE: _gitWorkTree,
      GIT_INDEX_FILE: _gitIndex,
      ...env
    } = process.env;
    execFileSync('git', ['apply', '--unidiff-zero', '--check', '-'], {
      cwd: root,
      env,
      input: patch,
    });
    execFileSync('git', ['apply', '--unidiff-zero', '-'], { cwd: root, env, input: patch });
    await symlink(path.resolve('node_modules'), path.join(root, 'node_modules'), 'dir');
    execFileSync(
      process.execPath,
      [path.resolve('node_modules/vite/bin/vite.js'), 'build', '--configLoader', 'native'],
      { cwd: root, env, stdio: 'pipe' },
    );
    console.log(`Visual reference: ${revision} + frozen mapping header (PR #11)`);
    return { root, cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
}
