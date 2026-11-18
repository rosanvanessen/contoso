---
applyTo: 'api/src/routes/**/*.ts'
---
# API routes (ADR-0002 · ADR-0003)

- A route does HTTP only: read `params` / `query` / `body`, validate, call a repository, service or domain function, return `{ body }` or `{ status, body }`.
- No business rules or rule values in a route. Put calculations in a pure function in `api/src/domain/` and import it.
- Validate first. Collect problems in a `string[]` and `throw badRequest('<summary>', problems)`.
- ISO date parameters: check `/^\d{4}-\d{2}-\d{2}$/` and throw `badRequest('<name> must be an ISO date (YYYY-MM-DD)')`.
- Unknown id → `throw notFound(\`Member ${id}\`)`. A domain `RangeError` → catch it and `throw unprocessable(err.message)`.
- "Today" comes from the injected `deps.today()` clock — never `new Date()` inside a route (tests use a fixed clock).
- Register static paths such as `/api/service-requests/overdue` **before** `/api/service-requests/:id`.
- Imports: `import type` for types, `.ts` extension on every relative import.
- In the same change: add the path to `api/openapi.yaml` and a test in `api/test/`.
- Pattern to copy: `GET /api/members/:id/statement` in `api/src/routes/members.ts` (optional `asOf` with default `deps.today()`).
