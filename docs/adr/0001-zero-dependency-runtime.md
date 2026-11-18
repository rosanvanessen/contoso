# ADR-0001 — Zero runtime dependencies

**Status:** accepted · **Date:** 2026-11-01

## Context
100+ participants start a Codespace at the same moment. `npm install` of a typical React/Express stack takes minutes, can be blocked by corporate proxies and brings supply-chain risk.

## Decision
- Node.js **24** runs TypeScript natively (type stripping). No build step, no `node_modules`.
- Persistence: `node:sqlite` (in-memory, seeded on start). Tests: `node:test`. HTTP: `node:http`.
- TypeScript must use **erasable syntax only**: no `enum`, no `namespace`, no constructor parameter properties. Use `import type` for types and include the `.ts` extension in relative imports.

## Consequences
- ✅ Starts in seconds, nothing to install, tiny attack surface.
- ⚠️ No type checking at runtime → reviewers and agents must keep types honest.
- ⚠️ Adding a dependency requires a new ADR.
