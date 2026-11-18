---
name: add-api-endpoint
description: Add or change a REST endpoint in the Contoso API end-to-end (domain rule, route, tests, OpenAPI) following ADR-0001..0003, and prove it with a deterministic check. Use when implementing a backlog item from docs/backlog/BL-*.md or any request that adds or changes an /api/... path.
argument-hint: '[backlog file or endpoint description]'
---
# Add an API endpoint

Work through the steps **in order**. Show this checklist in your reply and tick each item.

## 1. Understand — read, don't guess
- [ ] Read the backlog item or request. Quote its acceptance criteria.
- [ ] Read every business-rule doc it links (`docs/domain/*.md`). Copy rule values from there, never from memory.
- [ ] Read [the endpoint conventions](./references/conventions.md) (one page).
- [ ] Open one similar existing route as a pattern: `GET /api/members/:id/statement` in `api/src/routes/members.ts`.

## 2. Plan — stop if unclear
- [ ] List the files you will create or change, per layer (domain → route → OpenAPI → tests).
- [ ] If the acceptance criteria conflict with a doc, STOP and ask the user.

## 3. Implement — layer by layer
- [ ] **Domain**: pure functions and rule values in `api/src/domain/<topic>.ts`. Add a comment linking the doc.
- [ ] **Route**: in the existing `api/src/routes/<resource>.ts`. Validate → call domain/repository → return `{ body }`. Errors only via `badRequest` / `notFound` / `unprocessable`. Static paths **before** `/:id`.
- [ ] **OpenAPI**: add the path, its query parameters, the 200 schema and error responses (`$ref: '#/components/responses/BadRequest'`) to `api/openapi.yaml`.
- [ ] **Tests**: `api/test/<feature>.test.ts` — unit tests for the domain function (edge cases from the doc) and API tests with `startTestServer()` that assert the exact acceptance-criteria values and the 400 envelope.

## 4. Verify — deterministic, never skip
Run both from the repository root:

```bash
node .github/skills/add-api-endpoint/scripts/check-openapi.mjs
npm test
```

- [ ] [check-openapi.mjs](./scripts/check-openapi.mjs) exits 0: every registered route is in `api/openapi.yaml` and no static route is shadowed by `/:id`.
- [ ] `npm test` shows `fail 0`.
- [ ] If a check fails: fix the reported problem and run **both** checks again.

## 5. Report
- A table: acceptance criterion → test name that proves it.
- Files changed, grouped per layer.
- The docs and ADRs you followed (links).

## Do not
- Add npm dependencies, change `data/seed/`, or edit existing tests to make them pass.
- Put rule logic or rule values in a route.
- Claim success without the output of both checks.
