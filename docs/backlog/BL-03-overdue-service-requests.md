# BL-03 · Feature: list overdue service requests
labels: feature
---
**User story**
As a team lead I want `GET /api/service-requests/overdue` so that my team works on requests that broke their service level first.

**Business rules** — `docs/domain/service-levels.md`.

**Acceptance criteria**
- [ ] Optional `asOf` query parameter (ISO date, default today); invalid → 400 envelope
- [ ] Only `open` / `in-progress` requests past their due date
- [ ] Each item adds `dueDate` and `daysOverdue`; sorted most overdue first
- [ ] On 2026-11-18 the order is SR-5004 (34), SR-5001 (19), SR-5003 (11), SR-5006 (3), SR-5005 (2)
- [ ] Unit + API tests, OpenAPI updated
