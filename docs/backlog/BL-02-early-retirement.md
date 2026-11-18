# BL-02 · Feature: early-retirement scenario in projections
labels: feature
---
**User story**
As a member-services employee I want to project a member's pension at an age between 60 and 68, so that I can answer "can I retire at 63?" (see SR-5003).

**Business rules** — rule **R5** in `docs/domain/scheme-rules.md`.

**Acceptance criteria**
- [ ] `POST /api/projections` accepts `retirementAge` 60–68 (integer)
- [ ] Accrual stops at the early retirement date
- [ ] Response adds `earlyRetirementReduction` and `unreducedAnnualPension`; `projectedAnnualPension` is reduced
- [ ] Ages < 60, > 68 or below the current age → 422 with the error envelope
- [ ] M-1004 at 63 on 2026-11-18 → reduction `0.325`
- [ ] Unit + API tests, OpenAPI updated
