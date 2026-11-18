# BL-01 · Bug: annual statement ignores the part-time factor
labels: bug
---
**What happens**
`GET /api/members/M-1003/statement` (60 % part-time) returns `currentPensionableSalary: 28455` and `currentYearAccrual: 497.96`.

**Expected** (rule R7 → R1 in `docs/domain/scheme-rules.md`)
`currentPensionableSalary: 17073` and `currentYearAccrual: 298.78`.

**Acceptance criteria**
- [ ] Statement uses the member's part-time factor
- [ ] Regression test for M-1003 in `api/test/`
- [ ] Full-time members (M-1001) unchanged
- [ ] `npm test` passes
