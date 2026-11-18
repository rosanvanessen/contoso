#!/usr/bin/env node
// preToolUse guardrail hook for the Copilot harness (VS Code, Copilot CLI, Copilot app).
// Input  (stdin):  {"toolName": "...", "toolArgs": {...} | "<json string>", "cwd": "...", "timestamp": ...}
// Output (stdout): {} (no decision → normal approval flow) OR {"permissionDecision":"deny","permissionDecisionReason":"..."}
// Fail closed: if this script crashes, the Copilot harness treats a preToolUse command error as DENY.
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const policy = JSON.parse(readFileSync(join(here, 'guardrails.policy.json'), 'utf8'));

const event = JSON.parse(readFileSync(0, 'utf8'));
if (typeof event.toolName !== 'string') throw new Error('Expected a preToolUse event with toolName');

const toolName = event.toolName;
let args = event.toolArgs ?? {};
if (typeof args === 'string') { try { args = JSON.parse(args); } catch { args = { raw: args }; } }

/** Collect every string value inside the tool arguments (paths, commands, patches…). */
function strings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
}
const values = strings(args);
const isWriteTool = new RegExp(policy.writeToolPattern, 'i').test(toolName);
const isShellTool = /(bash|shell|terminal|execute|run_in_terminal|powershell)/i.test(toolName);

function decide() {
  // MCP tool names are often prefixed with the server name (e.g. "pensionRules-delete_member_data").
  if (policy.blockedTools.some((t) => toolName === t || toolName.includes(t))) {
    return `Tool '${toolName}' is blocked by repository policy (destructive operation).`;
  }
  for (const rule of policy.blockedCommands) {
    if (isShellTool && values.some((v) => new RegExp(rule.pattern, 'i').test(v))) return rule.reason;
  }
  if (isWriteTool || isShellTool) {
    const hit = policy.protectedPaths.find((p) => values.some((v) => v.replaceAll('\\', '/').includes(p)));
    if (hit && (isWriteTool || /(\brm\b|\bmv\b|>|\bsed\s+-i|\btee\b|\bcp\b)/.test(values.join(' ')))) {
      return `Path '${hit}' is protected. Changes must go through a human-reviewed pull request.`;
    }
  }
  return null;
}

const reason = decide();
const decision = reason ? 'deny' : 'none';

// Audit trail (observability). Log the tool name and argument KEYS only — never values (may contain sensitive data).
try {
  const logDir = join(here, 'logs');
  mkdirSync(logDir, { recursive: true });
  appendFileSync(join(logDir, 'audit.jsonl'), JSON.stringify({
    ts: new Date().toISOString(), toolName, decision, reason: reason ?? undefined,
    argKeys: args && typeof args === 'object' ? Object.keys(args) : [],
  }) + '\n');
} catch { /* logging must never break the agent */ }

process.stdout.write(JSON.stringify(reason ? { permissionDecision: 'deny', permissionDecisionReason: reason } : {}));
