# BL-04 · Feature: employer contribution summary
labels: feature
---
**User story**
As an employer account manager I want `GET /api/employers/{id}/contributions?year=2025` returning the total employer and employee contributions and the number of contributing members for that year.

**Acceptance criteria**
- [ ] Sums per employer per year from the contribution history
- [ ] Unknown employer → 404; year without data → zeros
- [ ] Unit + API tests, OpenAPI updated
