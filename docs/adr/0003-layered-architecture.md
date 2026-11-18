# ADR-0003 — Layered architecture

**Status:** accepted

```
routes/        HTTP only: parse + validate input, call services/repositories, map errors (ADR-0002)
services/      Use-cases: combine repositories with domain rules
repositories/  SQL only, map snake_case rows → camelCase records. No business rules.
domain/        Pure functions + scheme parameters. No I/O. Throws RangeError for rule violations.
```

Rules
1. Business rules live **only** in `domain/` and are documented in `docs/domain/*.md`.
2. Every new endpoint: route + test in `api/test/` + entry in `api/openapi.yaml`.
3. Routes are matched **in registration order** — register static paths (e.g. `/overdue`) before parameter paths (`/:id`).
4. Tests use `startTestServer()` from `api/test/helpers.ts` (fixed clock `2026-11-18`).
