# Endpoint conventions (one page)

Loaded only when the `add-api-endpoint` skill needs it. The source of truth stays in the ADRs — this page is the checklist view.

| # | Rule | Source | Good example |
|---|---|---|---|
| 1 | Errors use the envelope helpers `badRequest` (400) · `notFound` (404) · `unprocessable` (422) | [ADR-0002](../../../../docs/adr/0002-error-envelope.md) | `throw badRequest('asOf must be an ISO date (YYYY-MM-DD)')` |
| 2 | Static paths are registered before `/:id` paths | [ADR-0003](../../../../docs/adr/0003-layered-architecture.md) rule 3 | `/api/service-requests/overdue` above `/api/service-requests/:id` |
| 3 | Rule values come from the domain docs, not memory | [docs/domain](../../../../docs/domain/) | SLA days from [service-levels.md](../../../../docs/domain/service-levels.md) |
| 4 | Business rules live in `api/src/domain/` (pure, no I/O) | ADR-0003 rule 1 | `dueDate(request)` in `api/src/domain/<topic>.ts`, called by the route |
| 5 | Tests use `startTestServer()` with the fixed clock `2026-11-18` | ADR-0003 rule 4 | `startTestServer('2026-10-16')` for another day |
| 6 | Every endpoint is in `api/openapi.yaml` | ADR-0003 rule 2 | checked by `scripts/check-openapi.mjs` |
| 7 | Erasable TypeScript: `.ts` imports, `import type`, no `enum` / `namespace` | [ADR-0001](../../../../docs/adr/0001-zero-dependency-runtime.md) | `import type { Router } from '../http/router.ts';` |
| 8 | `npm test` is green | — | `fail 0` |

## Shape of a "list with a computed field" endpoint

```ts
// api/src/routes/<resource>.ts  — HTTP only
router.get('/api/<resource>/<static-path>', ({ query }) => {
  const asOf = query.get('asOf') ?? deps.today();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw badRequest('asOf must be an ISO date (YYYY-MM-DD)');
  const items = deps.<repository>.list().map((item) => ({ ...item, <computed>: <domainFunction>(item, asOf) }));
  return { body: items };
});
```

## Common mistakes the agent makes without this skill
- Puts the SLA table inside the route file → rule 4 broken.
- Registers `/overdue` after `/:id` → the endpoint returns `404 Service request overdue not found`.
- Uses `new Date()` → tests depend on the real date.
- Forgets `api/openapi.yaml` → `check-openapi.mjs` exits 1.
