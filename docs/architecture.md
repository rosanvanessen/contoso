# Contoso Pension Platform — Architecture

> Fictional pension fund. **Synthetic data only. Simplified, NOT real pension rules.**

## 1. Big picture

```mermaid
flowchart LR
    U[👩‍💼 Member-services employee] -->|browser| WEB[web/<br/>static UI]
    WEB -->|JSON over HTTP| API[api/<br/>Node 24 · TypeScript]
    API --> DB[(SQLite<br/>in-memory<br/>seeded from data/seed)]
    AG[🤖 Copilot agent] -.MCP stdio.-> MCP[mcp/pension-rules<br/>MCP server]
    MCP -->|imports| DOM[api/src/domain<br/>scheme rules]
    API --> DOM
```

| Folder | What lives there | Why it matters in the workshop |
|---|---|---|
| `api/src/domain` | Pure business rules (pensionable salary, accrual, projection) | The "brain" agents must understand (A2, A4) |
| `api/src/repositories` | SQL only — no business rules | Convention agents must respect (A4) |
| `api/src/services` | Combine repositories + domain | Where the statement bug lives (A5) |
| `api/src/routes` | HTTP endpoints, validation, error envelope | Where new endpoints go (A2, A4) |
| `mcp/pension-rules` | Hand-written MCP server (stdio) | Tool governance (A3) |
| `docs/domain`, `docs/adr` | Enterprise knowledge | Context engineering (A4) |
| `.github/` | Workflows, templates, (later) agents, skills, hooks, instructions | Engineering controls & agentic CI/CD (A1, A5) |

## 2. Request flow (layered architecture — ADR-0003)

```mermaid
sequenceDiagram
    participant C as Client
    participant R as routes/members.ts
    participant S as services/statementService.ts
    participant Repo as repositories/*
    participant D as domain/pension.ts
    C->>R: GET /api/members/M-1003/statement
    R->>Repo: findById("M-1003")
    R->>S: build(member, asOf)
    S->>Repo: contribution history
    S->>D: pensionableSalary(), annualAccrual(), projectPension()
    S-->>R: AnnualStatement
    R-->>C: 200 JSON (errors: { error: { code, message } })
```

## 3. Design decisions

| ADR | Decision |
|---|---|
| [0001](adr/0001-zero-dependency-runtime.md) | Zero runtime dependencies — Node 24 runs TypeScript natively, `node:sqlite`, `node:test` |
| [0002](adr/0002-error-envelope.md) | One error envelope for every API error |
| [0003](adr/0003-layered-architecture.md) | routes → services → repositories / domain; business rules only in `domain` |

## 4. Run it

```bash
npm start            # http://localhost:3000  (UI)  ·  /api/health  ·  /openapi.yaml
npm test             # all unit + API + MCP tests (node:test)
npm run verify       # environment check
```
