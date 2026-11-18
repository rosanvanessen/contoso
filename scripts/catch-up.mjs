#!/usr/bin/env node
// Catch up to the END state of a lab: npm run catch-up -- a2
// Copies solutions/a1 … solutions/<lab> (cumulative, in order) over the repository.
// Tip: commit or stash your own work first (git stash) so you can compare.
import { cpSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const LABS = ['a1', 'a2', 'a3', 'a4', 'a5'];
const target = (process.argv[2] ?? '').toLowerCase();
if (!LABS.includes(target)) {
  console.error(`Usage: npm run catch-up -- <${LABS.join('|')}>`);
  process.exit(1);
}

const list = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? list(p) : [p];
});

for (const lab of LABS.slice(0, LABS.indexOf(target) + 1)) {
  const src = join('solutions', lab);
  if (!existsSync(src)) continue;
  const files = list(src).filter((f) => !f.endsWith('SOLUTION.md'));
  for (const file of files) {
    const dest = relative(src, file);
    cpSync(file, dest);
    console.log(`  ${lab}  →  ${dest}`);
  }
}
console.log(`\n✅ Repository is now at the end state of lab ${target.toUpperCase()}. Run: npm test`);
