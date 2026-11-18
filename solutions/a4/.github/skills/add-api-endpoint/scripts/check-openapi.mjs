#!/usr/bin/env node
// Deterministic check for the add-api-endpoint skill (ADR-0003 rules 2 + 3).
//   1. Every route registered in api/src/routes/*.ts has a matching path + method in api/openapi.yaml.
//   2. No static route is registered AFTER a parameter route that would swallow it (e.g. /overdue after /:id).
// Zero dependencies (ADR-0001): reads the YAML as plain text. Exit 0 = OK, exit 1 = problems found.
// Usage (from the repo root): node .github/skills/add-api-endpoint/scripts/check-openapi.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] ?? process.cwd();
const routesDir = join(root, 'api/src/routes');
const openapiFile = join(root, 'api/openapi.yaml');

// --- 1. Documented operations: "GET /api/members/{id}" -------------------------------
const documented = new Set();
let inPaths = false;
let currentPath = null;
for (const line of readFileSync(openapiFile, 'utf8').split('\n')) {
  if (/^paths:\s*$/.test(line)) { inPaths = true; continue; }
  if (inPaths && /^\S/.test(line)) break; // next top-level key (components:) ends the paths block
  const pathMatch = inPaths && line.match(/^ {2}(\/\S*):\s*$/);
  if (pathMatch) { currentPath = pathMatch[1]; continue; }
  const methodMatch = inPaths && currentPath && line.match(/^ {4}(get|post|put|patch|delete):/);
  if (methodMatch) documented.add(`${methodMatch[1].toUpperCase()} ${currentPath}`);
}

// --- 2. Registered routes, in registration order per file ---------------------------
const ROUTE = /router\.(get|post|put|patch|delete)\(\s*(['"`])([^'"`]+)\2/g;
const toOpenApi = (path) => path.replace(/:([A-Za-z]+)/g, '{$1}');
const toRegex = (path) => new RegExp('^' + path.replace(/:([A-Za-z]+)/g, '[^/]+') + '/?$');

const problems = [];
let routeCount = 0;
for (const file of readdirSync(routesDir).filter((f) => f.endsWith('.ts')).sort()) {
  const source = readFileSync(join(routesDir, file), 'utf8');
  const seen = [];
  for (const [, method, , path] of source.matchAll(ROUTE)) {
    routeCount++;
    const op = `${method.toUpperCase()} ${toOpenApi(path)}`;
    if (!documented.has(op)) problems.push(`❌ ${file}: ${op} is missing in api/openapi.yaml`);
    const shadow = seen.find((earlier) => earlier.method === method && earlier.path.includes(':') && toRegex(earlier.path).test(path));
    if (shadow) problems.push(`❌ ${file}: ${method.toUpperCase()} ${path} is registered after ${shadow.path} and will never match (ADR-0003 rule 3)`);
    seen.push({ method, path });
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problem(s) in ${routeCount} routes. Fix them, then run this check again.`);
  process.exit(1);
}
console.log(`✅ ${routeCount} routes checked: all documented in api/openapi.yaml, no shadowed static routes.`);
