# Service levels for member service requests (FICTIONAL)

Every service request must be closed within its **service level (SLA)**, counted in **calendar days** from `createdAt`.

| Category | SLA (days) | Why |
|---|---:|---|
| `address-change` | 5 | Correspondence must reach the member |
| `retirement-quote` | 10 | Members plan life decisions on it |
| `complaint` | 14 | Internal complaints procedure |
| `value-transfer` | 30 | Requires the other fund's answer |

Rules
- **Due date** = `createdAt` + SLA days.
- A request is **overdue** when it is `open` or `in-progress` and the check date is **after** the due date. On the due date itself it is not overdue.
- `closed` requests are never overdue.
- Overdue lists are sorted **most overdue first** (team leads work top-down).
