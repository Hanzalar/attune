#!/usr/bin/env node
/**
 * Agent Constitution Synchronization & Drift Guard Engine
 *
 * Synchronizes governance/constitution.md across 40+ AI agent tool definitions
 * with zero-loss preservation of local human content and cryptographic drift detection.
 *
 * Usage:
 *   node agents-sync.mjs sync
 *   node agents-sync.mjs check
 *   node agents-sync.mjs install --repo /path/to/code-repo [--check]
 */

import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, lstat, realpath } from 'node:fs/promises';
import { resolve, dirname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, '..');

export const START_MARKER = '<!-- CONSTITUTION:START -->';
export const END_MARKER = '<!-- CONSTITUTION:END -->';

/**
 * Merges managed body into existing file content while preserving all text outside markers.
 */
export function mergeManaged(existing, body, frontmatter = '') {
  const block = `${START_MARKER}\n${body.trim()}\n${END_MARKER}\n`;
  const starts = existing.split(START_MARKER).length - 1;
  const ends = existing.split(END_MARKER).length - 1;

  if (starts !== ends || starts > 1 || (starts === 1 && existing.indexOf(END_MARKER) < existing.indexOf(START_MARKER))) {
    throw new Error('Corrupted managed markers detected. Please inspect and repair the file before synchronizing.');
  }

  if (starts === 1) {
    const from = existing.indexOf(START_MARKER);
    const to = existing.indexOf(END_MARKER) + END_MARKER.length;
    return existing.slice(0, from) + block.trimEnd() + existing.slice(to);
  }

  if (!existing) {
    return frontmatter + block;
  }

  const trailingNewline = existing.endsWith('\n\n') ? '' : existing.endsWith('\n') ? '\n' : '\n\n';
  return existing + trailingNewline + block;
}

/**
 * Sanitizes destination path to prevent directory traversal and symlink vulnerabilities.
 */
export async function safePath(root, name) {
  const destination = resolve(root, name);
  const local = relative(root, destination);

  if (!local || local === '..' || local.startsWith('../') || isAbsolute(local)) {
    throw new Error(`Security Violation: Target path escapes repository root: ${name}`);
  }

  let current = root;
  for (const part of local.split(/[\\/]/)) {
    current = resolve(current, part);
    try {
      if ((await lstat(current)).isSymbolicLink()) {
        throw new Error(`Security Violation: Refusing to traverse symbolic link at: ${current}`);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  return destination;
}

/**
 * Loads constitution sources and calculates master SHA-256 integrity hash.
 */
async function loadSources(specsRoot) {
  const constitutionPath = resolve(specsRoot, 'governance/constitution.md');
  const componentsPath = resolve(specsRoot, 'governance/components.json');
  const adaptersPath = resolve(specsRoot, 'governance/adapters.json');

  const constitution = await readFile(constitutionPath, 'utf8');
  let componentText = '{}';
  let components = { components: [] };
  try {
    componentText = await readFile(componentsPath, 'utf8');
    components = JSON.parse(componentText);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  const adapters = JSON.parse(await readFile(adaptersPath, 'utf8'));
  const hash = createHash('sha256').update(constitution + componentText).digest('hex');

  return { constitution, components, adapters, hash };
}

/**
 * Synchronizes or verifies constitution instructions across all target paths.
 */
export async function synchronize(root, { check = false, external = false, specsRoot = ROOT } = {}) {
  const sources = await loadSources(specsRoot);
  const repoMeta = sources.components.repository || 'canonical-specs-repository';
  const prefix = `Generated from ${repoMeta}/tree/meta/governance.\nSource SHA-256: \`${sources.hash}\`.\nEdit canonical sources in specs repo; regenerate this managed block.\n`;

  const locationContext = external
    ? '\n[Notice: Implementation Checkout]\nOpen the separate specs checkout for all planning artifacts and OpenSpec commands.\n'
    : '\n[Notice: Specifications Checkout]\nApplication source code belongs in the implementation checkout. See README.md for details.\n';

  const mainBody = `${prefix}${locationContext}\n${sources.constitution}`;
  const files = sources.adapters.map(adapter => ({ ...adapter, body: mainBody }));

  // In external implementation checkouts, inject component-specific AGENTS.md
  if (external && Array.isArray(sources.components.components)) {
    for (const component of sources.components.components) {
      const componentRoot = await safePath(root, component.path);
      try {
        const info = await lstat(componentRoot);
        if (!info.isDirectory()) continue;
      } catch (error) {
        if (error.code === 'ENOENT') continue;
        throw error;
      }

      files.push({
        path: `${component.path}/AGENTS.md`,
        body: `${prefix}\n# Component: ${component.id} (${component.description})\n\nRead the root AGENTS.md and relevant specifications first.\n\n${(component.instructions || []).map(line => `- ${line}`).join('\n')}\n`
      });
    }
  }

  const plans = [];
  for (const file of files) {
    const destPath = await safePath(root, file.path);
    let existing = '';
    try {
      existing = await readFile(destPath, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    plans.push({
      ...file,
      destination: destPath,
      existing,
      expected: mergeManaged(existing, file.body, file.frontmatter)
    });
  }

  const drift = plans.filter(plan => plan.existing !== plan.expected);

  if (check) {
    if (drift.length > 0) {
      const driftedList = drift.map(f => `  - ${f.path}`).join('\n');
      throw new Error(`Instruction Drift Detected! The following files are out of sync with the Constitution:\n${driftedList}\n\nRun 'npm run agents:sync' or 'agents:install' to synchronize.`);
    }
    return { checked: plans.length, changed: 0 };
  }

  for (const plan of drift) {
    await mkdir(dirname(plan.destination), { recursive: true });
    await writeFile(plan.destination, plan.expected);
  }

  return { checked: plans.length, changed: drift.length };
}

async function main() {
  const [action, ...args] = process.argv.slice(2);
  if (!['sync', 'check', 'install'].includes(action)) {
    console.error('Usage: agents-sync.mjs sync|check|install [--repo PATH] [--check]');
    process.exit(1);
  }

  let targetRepo;
  let checkOnly = action === 'check';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--repo' && args[i + 1]) targetRepo = args[++i];
    else if (args[i] === '--check') checkOnly = true;
  }

  try {
    if (action === 'install') {
      if (!targetRepo) throw new Error('--repo <path> is required for install action.');
      const destRoot = await realpath(resolve(targetRepo));

      // Validate git repository
      const gitCheck = spawnSync('git', ['-C', destRoot, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' });
      if (gitCheck.status !== 0 || (await realpath(gitCheck.stdout.trim())) !== destRoot) {
        throw new Error(`Target path must be the root of a Git repository: ${destRoot}`);
      }

      // Assert branch policy (no direct install to stage/main)
      const branchCheck = spawnSync('git', ['-C', destRoot, 'branch', '--show-current'], { encoding: 'utf8' });
      const currentBranch = branchCheck.stdout.trim();
      if (!checkOnly && (currentBranch === 'main' || currentBranch === 'stage')) {
        throw new Error(`Direct installation blocked on protected branch '${currentBranch}'. Install on develop or feature branch, then promote through stage.`);
      }

      const res = await synchronize(destRoot, { check: checkOnly, external: true, specsRoot: ROOT });
      console.log(`[agents:install] Verified ${res.checked} targets. Updated ${res.changed} file(s).`);
    } else {
      const res = await synchronize(ROOT, { check: checkOnly, external: false, specsRoot: ROOT });
      console.log(`[agents:sync] Verified ${res.checked} targets. Updated ${res.changed} file(s).`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('agents-sync.mjs')) {
  main();
}
