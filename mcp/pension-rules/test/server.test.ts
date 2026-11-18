import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync, rmdirSync, rmSync } from 'node:fs';

const SERVER = fileURLToPath(new URL('../server.ts', import.meta.url));

describe('pension-rules MCP server (stdio JSON-RPC)', () => {
  let proc: ChildProcessWithoutNullStreams;
  const pending = new Map<number, (msg: any) => void>();
  let nextId = 1;

  const request = (method: string, params: Record<string, unknown> = {}) =>
    new Promise<any>((resolve) => {
      const id = nextId++;
      pending.set(id, resolve);
      proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });

  before(() => {
    proc = spawn(process.execPath, [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] });
    createInterface({ input: proc.stdout }).on('line', (line) => {
      const msg = JSON.parse(line);
      pending.get(msg.id)?.(msg);
    });
  });
  after(() => { proc.kill(); });

  test('initialize negotiates a protocol version', async () => {
    const res = await request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
    assert.equal(res.result.protocolVersion, '2025-06-18');
    assert.equal(res.result.serverInfo.name, 'pension-rules');
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  });

  test('tools/list exposes 5 tools with annotations', async () => {
    const res = await request('tools/list');
    const names = res.result.tools.map((t: { name: string }) => t.name);
    assert.deepEqual(names, ['get_scheme_parameters', 'explain_rule', 'calculate_projection', 'search_service_requests', 'delete_member_data']);
    const destructive = res.result.tools.find((t: any) => t.name === 'delete_member_data');
    assert.equal(destructive.annotations.destructiveHint, true);
  });

  test('calculate_projection uses the shared domain rules', async () => {
    const res = await request('tools/call', { name: 'calculate_projection', arguments: { fullTimeSalary: 46000, partTimeFactor: 0.6, years: 10 } });
    assert.equal(res.result.isError, false);
    assert.equal(res.result.structuredContent.pensionableSalary, 17073);
    assert.equal(res.result.structuredContent.yearlyAccrual, 298.78);
  });

  test('invalid input is returned as a tool error (isError: true)', async () => {
    const res = await request('tools/call', { name: 'calculate_projection', arguments: { fullTimeSalary: 46000, partTimeFactor: 2, years: 10 } });
    assert.equal(res.result.isError, true);
  });

  test('search_service_requests returns untrusted free text', async () => {
    const res = await request('tools/call', { name: 'search_service_requests', arguments: { text: 'part-time' } });
    assert.match(res.result.content[0].text, /ignore all previous instructions/);
  });

  test('unknown tool returns a JSON-RPC error', async () => {
    const res = await request('tools/call', { name: 'nope', arguments: {} });
    assert.equal(res.error.code, -32602);
  });
});

describe('pension-rules audit log (PENSION_RULES_AUDIT_LOG)', () => {
  // Relative path → resolved against the repo root; the server creates missing directories itself.
  const RELATIVE = 'mcp/pension-rules/logs/test-run/nested/audit.jsonl';
  const TEST_DIR = fileURLToPath(new URL('../logs/test-run/', import.meta.url));
  const LOG_FILE = fileURLToPath(new URL('../logs/test-run/nested/audit.jsonl', import.meta.url));

  before(() => rmSync(TEST_DIR, { recursive: true, force: true }));
  after(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    try { rmdirSync(fileURLToPath(new URL('../logs/', import.meta.url))); } catch { /* keep a non-empty logs/ folder */ }
  });

  test('writes tool name and argument keys — never argument values', async () => {
    const proc = spawn(process.execPath, [SERVER], {
      cwd: fileURLToPath(new URL('.', import.meta.url)), // NOT the repo root: proves the path is resolved against the repo
      env: { ...process.env, PENSION_RULES_AUDIT_LOG: RELATIVE },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const response = new Promise<void>((resolve) => {
      createInterface({ input: proc.stdout }).on('line', (line) => { if (JSON.parse(line).id === 1) resolve(); });
    });
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'calculate_projection', arguments: { fullTimeSalary: 46000, partTimeFactor: 0.6, years: 10 } } }) + '\n');
    await response;
    proc.kill();

    assert.ok(existsSync(LOG_FILE), 'audit log file was created (including parent directories)');
    const entries = readFileSync(LOG_FILE, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    const call = entries.find((e) => e.event === 'tools/call');
    assert.equal(call.tool, 'calculate_projection');
    assert.equal(call.ok, true);
    assert.deepEqual(call.argKeys, ['fullTimeSalary', 'partTimeFactor', 'years']);
    assert.doesNotMatch(JSON.stringify(entries), /46000/);
  });
});
