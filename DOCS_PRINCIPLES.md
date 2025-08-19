## Documentation Principles

### Living documentation
- **Docs‑as‑code**: All docs live in the repo, change via PRs, and are reviewed like code.
- **SPEC maintenance**: Update `SPEC.md` with each scope change (features in/out, constraints, guardrails). The SPEC represents current truth, not aspirational plans.
- **Change traceability**: Reference PRs and issues in doc changes; include rationale when behavior changes.

### ADRs (Architecture Decision Records)
- **When to write an ADR**
  - Choosing or changing core architecture (session model, rules engine strategy, LLM provider, persistence model)
  - Decisions that significantly impact cost, reliability, security, or developer workflow
  - Any change that would surprise a future maintainer

- **Location & naming**
  - Store under `docs/adrs/` as `YYYY‑MM‑DD-meaningful-title.md`
  - Link relevant ADRs from `SPEC.md` and major PR descriptions

- **Required sections (template)**
```
# Title
Date: YYYY‑MM‑DD
Status: Proposed | Accepted | Superseded by <ADR#>

Context
———
What problem are we solving? What constraints and forces matter?

Decision
———
What did we decide and why? Alternatives considered.

Consequences
———
Positive and negative outcomes, follow‑ups, and monitoring plan.
```

### API documentation
- **Source of truth**: Define backend HTTP/WS APIs in OpenAPI/AsyncAPI specs under `api/` (e.g., `api/openapi.yaml`).
- **Generation**: Auto‑generate HTML docs (e.g., Redoc/Swagger UI) and client SDKs where useful.
- **Automation**: CI verifies generated artifacts are up‑to‑date; failures block merges.
- **Commit the outputs**: Generated docs (and optionally SDKs) are committed for easy browsing/versioning.

### PR documentation checklist
- SPEC updated (if scope/behavior changed)
- ADR added/updated (for notable design choices)
- API spec updated and regenerated (if endpoints/contracts changed)
- Migration notes included (if data/state is affected)

### Tooling suggestions
- Static site for docs (optional): simple generator or platform‑native preview
- Linters for docs (spelling, links) in CI
- Lightweight changelog maintained via Conventional Commits


