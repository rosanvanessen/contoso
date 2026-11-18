# Contoso Pension Platform — instructions for Copilot

Fictional pension member-services app (workshop). **Synthetic data only**: never add real names, BSNs, secrets or tokens to code, tests, prompts or logs.

## Stack — [ADR-0001](../docs/adr/0001-zero-dependency-runtime.md)
- Node.js 24 runs TypeScript natively: no build step, **no npm dependencies** (a new dependency needs a new ADR).
- Use `node:http`, `node:sqlite` (in-memory, seeded from `data/seed/`) and `node:test`.
- Erasable TypeScript only: no `enum`, no `namespace`, no constructor parameter properties.
- Relative imports end in `.ts`; type-only imports use `import type`.

## Architecture — [ADR-0003](../docs/adr/0003-layered-architecture.md)
- `api/src/routes/` HTTP only → `api/src/services/` use-cases → `api/src/repositories/` SQL only + `api/src/domain/` pure rules (no I/O).
- Business rules live **only** in `api/src/domain/`. Take rule values (ages, rates, SLA days) from `docs/domain/*.md`; never invent them.
- Every new endpoint = route + test in `api/test/` + path in `api/openapi.yaml`.
- Static paths (e.g. `/overdue`) are registered **before** `/:id` paths — the router matches in registration order.

## Errors — [ADR-0002](../docs/adr/0002-error-envelope.md)
- Throw `badRequest()` (400), `notFound()` (404) or `unprocessable()` (422) from `api/src/http/errors.ts`.
- Never `res.end('…')` or ad-hoc error JSON.

## Read before you change
| If the task touches… | Read first |
|---|---|
| a business rule or calculation | [scheme rules](../docs/domain/scheme-rules.md), [service levels](../docs/domain/service-levels.md), [glossary](../docs/domain/glossary.md) |
| a backlog item | the `docs/backlog/BL-*.md` file — acceptance criteria are the definition of done |
| the overall design | [architecture](../docs/architecture.md) |

## Commands
- `npm test` — all tests, must stay green · `npm run test:api` — API tests only · `npm start` — app on port 3000.
- Tests use the fixed clock `2026-11-18` (`startTestServer()` in `api/test/helpers.ts`).

## Definition of done
- `npm test` passes, and your summary lists the docs and ADRs you followed.
- Do not change `data/seed/` or existing tests to make new code pass.
