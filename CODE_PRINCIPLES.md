## Code Principles

### Code style guide
- **Naming**
  - Classes/Types: PascalCase
  - Functions/variables: camelCase
  - Constants: UPPER_SNAKE_CASE
  - Filenames: kebab‑case for web assets and scripts; align with language norms otherwise
  - Be descriptive and specific; avoid abbreviations and 1–2 character names

- **Modularity & boundaries**
  - Separate concerns: `domain` (rules/state), `application` (use cases), `infrastructure` (IO/LLM/DB), `ui`.
  - Keep the rules engine pure and deterministic; isolate side effects at boundaries.
  - Depend on abstractions (ports/interfaces), not concrete implementations.

- **Error handling & logging**
  - Fail fast on programmer errors; return typed/structured errors for expected failures.
  - Never swallow errors; log with actionable context and correlation IDs (sessionId, turnId, playerId).
  - Surface user‑safe messages to clients; avoid leaking internals.
  - Guardrails for LLM calls: timeouts, retries with jitter, circuit breakers, and explicit budgets.

- **Testing**
  - Test pyramid: unit > integration > e2e. Prioritize deterministic unit tests for rules and reducers.
  - Mock external boundaries (LLM, network) by default; add a few smoke tests against real services in CI nightly.
  - Include property‑based tests for core rules where feasible.
  - Aim for meaningful coverage thresholds; avoid chasing 100% for its own sake.

- **Performance & security**
  - Enforce prompt/token budgets and cache repeatable generations.
  - Validate all client inputs at the server boundary; sanitize/escape all rendered text.
  - Prefer least‑privilege configuration and secrets via environment or managed vaults.

- **Formatting**
  - Adopt language‑specific formatters/linters; make CI authoritative. No manual style debates.

### Commit message format (Conventional Commits)
- **Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`, `revert`
- **Format**: `type(scope): short summary`
  - Subject ≤ 72 chars; imperative mood
  - Optional body: motivation and contrast with previous behavior
  - Optional footer: breaking changes and issue links

Examples:
```
feat(rules): add persuade action with contested check
fix(server): guard against null session in turn reducer
docs(spec): clarify LLM cannot alter canonical state
refactor(ui): extract action panel into reusable component
```

### Working principles
- **Atomic commits**: one logical change per commit; include tests and docs updates.
- **Small PRs**: target ≤ 300 lines changed; prefer incremental delivery.
- **Tests with features**: no feature merge without tests and, where relevant, updated prompts.
- **Maintain the contract**: update types/interfaces and API docs together with code.
- **Reviewability**: readable diffs, clear descriptions, and rationale for notable decisions.
- **Feature flags**: ship dark; enable via config after validation.


