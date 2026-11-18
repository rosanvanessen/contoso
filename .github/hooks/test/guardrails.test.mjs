// Run with: node --test .github/hooks/test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HOOK = fileURLToPath(new URL('../guardrails.mjs', import.meta.url));
const run = (event) => {
  const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify(event), encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
};

test('allows a normal read', () => {
  assert.deepEqual(run({ toolName: 'view', toolArgs: { path: 'api/src/domain/pension.ts' } }), {});
});

test('allows reading a protected path (read-only)', () => {
  assert.deepEqual(run({ toolName: 'view', toolArgs: { path: 'infra/main.bicep' } }), {});
});

test('denies editing a protected path', () => {
  const out = run({ toolName: 'edit', toolArgs: { path: 'infra/main.bicep', new_str: 'x' } });
  assert.equal(out.permissionDecision, 'deny');
});

test('denies the agent from disabling its own guardrails', () => {
  const out = run({ toolName: 'create', toolArgs: { path: '.github/hooks/guardrails.json' } });
  assert.equal(out.permissionDecision, 'deny');
});

test('denies a force push', () => {
  const out = run({ toolName: 'bash', toolArgs: { command: 'git push --force origin main' } });
  assert.equal(out.permissionDecision, 'deny');
});

test('denies the destructive MCP tool', () => {
  const out = run({ toolName: 'pensionRules-delete_member_data', toolArgs: '{"memberId":"M-1001","reason":"x"}' });
  assert.equal(out.permissionDecision, 'deny');
});

test('allows running the tests', () => {
  assert.deepEqual(run({ toolName: 'bash', toolArgs: { command: 'npm test' } }), {});
});