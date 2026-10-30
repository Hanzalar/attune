import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeManaged, safePath, START_MARKER, END_MARKER } from '../scripts/agents-sync.mjs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

test('mergeManaged inserts block into empty file with frontmatter', () => {
  const frontmatter = '---\nalwaysApply: true\n---\n\n';
  const body = 'Test Constitution Content';
  const result = mergeManaged('', body, frontmatter);

  assert.ok(result.startsWith(frontmatter));
  assert.ok(result.includes(START_MARKER));
  assert.ok(result.includes('Test Constitution Content'));
  assert.ok(result.includes(END_MARKER));
});

test('mergeManaged preserves human notes outside markers', () => {
  const existing = `# Human Notes Header\n\n${START_MARKER}\nOld Constitution\n${END_MARKER}\n\n# Footer Scratchpad`;
  const newBody = 'Updated Constitution Body';
  const result = mergeManaged(existing, newBody);

  assert.ok(result.startsWith('# Human Notes Header\n\n'));
  assert.ok(result.endsWith('\n\n# Footer Scratchpad'));
  assert.ok(result.includes('Updated Constitution Body'));
  assert.ok(!result.includes('Old Constitution'));
});

test('safePath rejects path escaping repo root', async () => {
  const tempDir = await mkdtemp(resolve(tmpdir(), 'test-safepath-'));
  try {
    await assert.rejects(
      async () => await safePath(tempDir, '../outside-file.md'),
      /Target path escapes repository root/
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
