#!/usr/bin/env node
// Environment check for the workshop. Run: npm run verify
import { execSync, spawnSync } from 'node:child_process';

const results = [];
const check = (name, fn, optional = false) => {
  try { results.push({ name, ok: true, info: fn() ?? '', optional }); }
  catch (e) { results.push({ name, ok: false, info: String(e.message ?? e).split('\n')[0], optional }); }
};
const cmd = (c) => execSync(c, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim().split('\n')[0];

check('Node.js 24+', () => {
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 24) throw new Error(`found ${process.version}, need 24+`);
  return process.version;
});
check('node:sqlite available', () => { execSync(`node -e "require('node:sqlite')"`, { stdio: 'ignore' }); return 'ok'; });
check('git', () => cmd('git --version'));
check('Unit tests (npm test)', () => {
  // One command string + shell: works on Windows (npm.cmd), macOS and Linux.
  const r = spawnSync('npm test --silent', { shell: true, encoding: 'utf8' });
  if (r.error) throw r.error;
  const pass = /ℹ pass (\d+)/.exec(r.stdout)?.[1];
  const fail = /ℹ fail (\d+)/.exec(r.stdout)?.[1];
  if (r.status !== 0) throw new Error(`${fail ?? '?'} failing test(s) — run npm test`);
  return `${pass} passing`;
});
check('GitHub CLI (gh)', () => cmd('gh --version'), true);
check('Copilot CLI (copilot)', () => cmd('copilot --version'), true);
check('gh aw extension', () => cmd('gh aw version'), true);

console.log('\nContoso workshop — environment check\n');
for (const r of results) {
  const icon = r.ok ? '✅' : r.optional ? '⚠️ ' : '❌';
  console.log(`${icon} ${r.name.padEnd(26)} ${r.info}${!r.ok && r.optional ? ' (optional)' : ''}`);
}
const blocking = results.filter((r) => !r.ok && !r.optional);
console.log(blocking.length ? '\n❌ Fix the items above, or ask a coach.\n' : '\n✅ Ready for the workshop. Start the app with: npm start\n');
process.exit(blocking.length ? 1 : 0);
