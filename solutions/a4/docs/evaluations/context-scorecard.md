# Context scorecard — BL-03 overdue service requests

> **Filled EXAMPLE** from a dry run (Copilot harness, Agent, model **Auto**). Your scores will differ — AI output is not deterministic.
> Score 1 = convention met, 0 = not met. Check with the command, not by eye.

| # | Convention (source) | How to check | Baseline | With context |
|---|---|---|:---:|:---:|
| 1 | Errors via `badRequest` / `notFound` / `unprocessable` ([ADR-0002](../adr/0002-error-envelope.md)) | `grep -nE "res\.end\|statusCode\|error:" api/src/routes/serviceRequests.ts` → no output | 1 | 1 |
| 2 | Static `/overdue` registered **before** `/:id` ([ADR-0003](../adr/0003-layered-architecture.md) rule 3) | `grep -n "router.get('/api/service-requests" api/src/routes/serviceRequests.ts` → `/overdue` line number is lower | 0 | 1 |
| 3 | SLA days 5 / 10 / 14 / 30 from [service-levels.md](../domain/service-levels.md) | `grep -rnE "address-change\|value-transfer\|retirement-quote\|complaint" api/src/domain` → the four values | 1 | 1 |
| 4 | Business rule in `api/src/domain/`, not in the route (ADR-0003 rule 1) | `git status --short api/src/domain` → a new file; the route only imports it | 0 | 1 |
| 5 | Tests use `startTestServer()` + fixed clock (ADR-0003 rule 4) | `grep -c "startTestServer" api/test/<new-file>.test.ts` ≥ 1 and `grep -c "new Date()" …` = 0 | 1 | 1 |
| 6 | `api/openapi.yaml` updated (ADR-0003 rule 2) | `grep -n "overdue" api/openapi.yaml` → a path entry | 0 | 1 |
| 7 | Erasable TS only: `.ts` imports, `import type`, no `enum` ([ADR-0001](../adr/0001-zero-dependency-runtime.md)) | `grep -rnwE "enum\|namespace" api/src api/test` → no output | 1 | 1 |
| 8 | `npm test` green | `npm test` → `fail 0` | 1 | 1 |
| | **Total** | | **5 / 8** | **8 / 8** |

## Observations (example)

| Run | Time to "done" | What happened |
|---|---|---|
| Baseline | 5 min (time-boxed, stopped) | Put the SLA table in the route, registered `/overdue` after `/:id` (curl returned `404 Service request overdue not found`), forgot OpenAPI. |
| With context | ≈ 6 min | Read `service-levels.md` first, created `api/src/domain/serviceLevels.ts`, ran `check-openapi.mjs` and `npm test`, reported criterion → test table. |

## Deterministic proof (with context)

```text
$ node .github/skills/add-api-endpoint/scripts/check-openapi.mjs
✅ 12 routes checked: all documented in api/openapi.yaml, no shadowed static routes.

$ curl -s "localhost:3000/api/service-requests/overdue?asOf=2026-11-18"  → ids in order
SR-5004(34) SR-5001(19) SR-5003(11) SR-5006(3) SR-5005(2)
```
