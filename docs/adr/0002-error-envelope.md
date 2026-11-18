# ADR-0002 — One error envelope

**Status:** accepted

Every error response has this shape, produced by `ApiError` in `api/src/http/errors.ts`:

```json
{ "error": { "code": "BAD_REQUEST", "message": "Invalid projection request", "details": ["memberId is required"] } }
```

| Situation | Helper | HTTP |
|---|---|---|
| Malformed input (types, missing fields, bad dates) | `badRequest(message, details?)` | 400 |
| Unknown id | `notFound('Member M-9999')` | 404 |
| Valid input that breaks a **business rule** (domain `RangeError`) | `unprocessable(message)` | 422 |

Never return `res.end('...')` or ad-hoc JSON for errors.
