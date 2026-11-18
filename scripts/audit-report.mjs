#!/usr/bin/env node
// Tool-call audit report — run: npm run audit
// Reads the two JSONL audit trails (if present) and prints one row per tool:
//   .github/hooks/logs/audit.jsonl        written by the preToolUse guardrail hook (lab A1) — every tool call the agent ATTEMPTS
//   mcp/pension-rules/logs/audit.jsonl    written by the pension-rules MCP server (lab A3) — every call that REACHED the server
// Options: --hook-log <file>  --mcp-log <file>  (relative paths resolve against the current directory)
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const { values: opts } = parseArgs({
  options: { 'hook-log': { type: 'string' }, 'mcp-log': { type: 'string' } },
});
const sources = [
  { name: 'hook', file: opts['hook-log'] ? resolve(opts['hook-log']) : resolve(ROOT, '.github/hooks/logs/audit.jsonl') },
  { name: 'mcp-server', file: opts['mcp-log'] ? resolve(opts['mcp-log']) : resolve(ROOT, 'mcp/pension-rules/logs/audit.jsonl') },
];

/** @type {Map<string, {source: string, tool: string, calls: number, denied: number, failed: number, destructive: boolean, last: string}>} */
const rows = new Map();
const alerts = [];
let skipped = 0;

for (const { name, file } of sources) {
  if (!existsSync(file)) {
    console.log(`ℹ️  ${name.padEnd(10)} no log yet (${file.replace(ROOT, '')})`);
    continue;
  }
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let e;
    try { e = JSON.parse(line); } catch { skipped++; continue; }

    // Hook entries: { ts, toolName, decision: 'deny' | 'none', reason?, argKeys }
    // Server entries: { ts, server, event: 'tools/call', tool, ok, destructive, argKeys } (other events are skipped)
    const tool = name === 'hook' ? e.toolName : e.event === 'tools/call' ? e.tool : undefined;
    if (typeof tool !== 'string') continue;

    const key = `${name}|${tool}`;
    const row = rows.get(key) ?? { source: name, tool, calls: 0, denied: 0, failed: 0, destructive: false, last: '' };
    row.calls++;
    if (e.decision === 'deny') row.denied++;
    if (e.ok === false) row.failed++;
    if (e.destructive === true) row.destructive = true;
    if (typeof e.ts === 'string' && e.ts > row.last) row.last = e.ts;
    rows.set(key, row);
  }
}

for (const r of rows.values()) {
  if (r.source === 'mcp-server' && r.destructive && r.calls > r.failed) {
    alerts.push(`🚨 Destructive tool '${r.tool}' was EXECUTED by the MCP server ${r.calls - r.failed}× — a gate before the server failed.`);
  }
}

const table = [...rows.values()]
  .sort((a, b) => a.source.localeCompare(b.source) || b.calls - a.calls || a.tool.localeCompare(b.tool))
  .map((r) => ({
    Source: r.source,
    Tool: r.tool,
    Calls: String(r.calls),
    Denied: String(r.denied),
    Failed: String(r.failed),
    'Last seen (UTC)': r.last.replace('T', ' ').slice(0, 19),
  }));

console.log('\n📊 Tool-call audit report\n');
if (!table.length) {
  console.log('No tool calls logged yet. Use the agent first, then run: npm run audit\n');
} else {
  const headers = Object.keys(table[0]);
  const width = (h) => Math.max(h.length, ...table.map((row) => row[h].length));
  const fmt = (cells) => cells.map((c, i) => c.padEnd(width(headers[i]))).join(' │ ');
  console.log(fmt(headers));
  console.log(headers.map((h) => '─'.repeat(width(h))).join('─┼─'));
  for (const row of table) console.log(fmt(headers.map((h) => row[h])));
  console.log('');
}
for (const a of alerts) console.log(a);
if (skipped) console.log(`⚠️  Skipped ${skipped} malformed line(s).`);
console.log('ℹ️  Logs contain tool names and argument KEYS only — never argument values.\n');
