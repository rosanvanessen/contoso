---
applyTo: 'api/test/**/*.ts'
---
# API tests (ADR-0001 · ADR-0003 rule 4)

- Only `node:test` and `node:assert/strict`. No test libraries, no mocking frameworks.
- API tests: `api = await startTestServer()` from `./helpers.ts` in `before`, `await api.close()` in `after`.
- The clock is fixed at `2026-11-18`. Need another day? Pass it: `startTestServer('2026-10-16')`. Never depend on the real date.
- Pure domain functions get plain unit tests (no server), including the edge cases written in `docs/domain/*.md`.
- Assert exact values from the backlog acceptance criteria (ids, numbers, order) — not just "length > 0".
- Error cases: assert `res.status` and `(await res.json()).error.code` (e.g. `BAD_REQUEST`).
- One file per feature: `api/test/<feature>.test.ts`. Do not edit existing tests to make new code pass.
- `data/seed/` is shared, read-only test data. Never change it for a test.
- Run `npm run test:api` while iterating, then `npm test` before you finish.
