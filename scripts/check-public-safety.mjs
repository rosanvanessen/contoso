#!/usr/bin/env node
// Public-safety scan: run before making this repository (or a copy of it) public.
// Fails (exit 1) when it finds secrets, internal links, real-looking e-mail addresses
// or any customer/event term from your private term list.
//
// Usage:   node scripts/check-public-safety.mjs [--root <dir>]
// Terms:   one term per line in a git-ignored file `.public-scan-terms` (in --root or the current folder),
//          and/or the env var PUBLIC_SCAN_TERMS="term1,term2". Lines starting with # are comments.
// Why a private term list? The names you must NOT publish can't live in a public repo either.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const argRoot = process.argv.indexOf('--root');
const ROOT = resolve(argRoot > -1 ? process.argv[argRoot + 1] : '.');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'logs']);
const SKIP_FILES = new Set(['.public-scan-terms']);
const TEXT = /\.(md|ts|mjs|js|json|ya?ml|html|css|svg|sql|bicep|sh|txt|env\.example)$|^(Dockerfile|\.gitignore)$/i;

// 1 · Generic rules (safe to publish — they name no customer).
const RULES = [
  ['Secret: GitHub token', /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b/],
  ['Secret: cloud key', /\bAKIA[0-9A-Z]{16}\b|AccountKey=[A-Za-z0-9+/=]{20,}/],
  ['Secret: private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['Internal link: SharePoint/OneDrive', /[a-z0-9-]+(-my)?\.sharepoint\.com/i],
  ['Internal link: internal docs', /\beng\.ms\b|\.corp\.microsoft\.com|microsoft\.visualstudio\.com/i],
  ['Internal link: Teams', /teams\.microsoft\.com\/l\//i],
];
const EMAIL = /[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}/g;
const EMAIL_OK = /@(example\.(com|org|net)|contoso\.com|users\.noreply\.github\.com)$/i;

// 2 · Private customer/event terms.
const terms = [];
for (const f of [join(ROOT, '.public-scan-terms'), resolve('.public-scan-terms')]) {
  if (existsSync(f)) terms.push(...readFileSync(f, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')));
}
if (process.env.PUBLIC_SCAN_TERMS) terms.push(...process.env.PUBLIC_SCAN_TERMS.split(',').map((t) => t.trim()).filter(Boolean));
const uniq = [...new Set(terms.map((t) => t.toLowerCase()))];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const TERM_RE = uniq.length ? new RegExp(`(?<![A-Za-z0-9])(${uniq.map(esc).join('|')})(?![A-Za-z0-9])`, 'i') : null;

const findings = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) { if (!SKIP_DIRS.has(name)) walk(p); continue; }
    const rel = relative(ROOT, p);
    if (SKIP_FILES.has(name) || /\.local\.md$/i.test(name)) continue;
    if (TERM_RE?.test(rel)) findings.push([rel, 0, 'Customer term in file name', rel]);
    if (!TEXT.test(name)) continue;
    readFileSync(p, 'utf8').split(/\r?\n/).forEach((line, i) => {
      for (const [label, re] of RULES) if (re.test(line)) findings.push([rel, i + 1, label, line]);
      for (const m of line.matchAll(EMAIL)) if (!EMAIL_OK.test(m[0])) findings.push([rel, i + 1, 'E-mail address', m[0]]);
      if (TERM_RE?.test(line)) findings.push([rel, i + 1, 'Customer/event term', line]);
    });
  }
})(ROOT);

console.log(`🔎 Public-safety scan of ${ROOT}`);
console.log(`   rules: ${RULES.length + 1} generic · private terms: ${uniq.length}${uniq.length ? '' : ' (add .public-scan-terms to check customer names!)'}`);
if (!findings.length) { console.log('✅ Nothing found. Safe to publish.'); process.exit(0); }
for (const [file, line, label, text] of findings) console.log(`❌ ${file}:${line}  ${label}  →  ${text.trim().slice(0, 120)}`);
console.log(`\n❌ ${findings.length} finding(s). Remove them before publishing.`);
process.exit(1);
