## Fractured Truths — Architecture (MVP)

This document translates SPEC.md into a concrete architecture for the MVP.

### Core services overview
- **Web Client (React + Tailwind)**
  - Minimal UI: text‑first narrative, action panel, compact map/inventory.
  - Connects to HTTP APIs for setup/fetch; subscribes to WebSocket for realtime updates.
  - Supports up to 3 players per session.

- **API Gateway (Node.js/TypeScript, Express/Fastify)**
  - HTTP endpoints: create/join session, fetch player view, submit action, health.
  - WebSocket endpoint for realtime sync and events.
  - Stateless; delegates game logic to the Orchestrator.

- **Game Orchestrator & Rules Engine (Node.js/TypeScript)**
  - Canonical world state, turn management, action validation, and deterministic resolution.
  - Enforces rails: LLM outputs cannot directly mutate canonical state.
  - Emits domain events and persists snapshots.

- **LLM Adapter (OpenAI or local wrapper)**
  - Prompt templating and persona; per‑player overlays (private briefs, rumors, narration).
  - Safety guardrails: content policy, timeouts, retries, cost budgets, and output schema checks.
  - Caching of stable prompts to control cost/latency.

- **Persistence (Postgres)**
  - Stores canonical world state, per‑player overlays/views, actions, and events.
  - Uses JSONB for flexible scenario data with typed columns for keys/indices.

- **Observability (shared)**
  - Structured logging with correlation IDs: `sessionId`, `playerId`, `turnIndex`.
  - Basic metrics (action latency, LLM tokens, WS connections). Health endpoints.

### Data model sketch (Postgres)
Note: MVP favors clarity and JSONB for scenario flexibility. Add indices on hot fields.

- **sessions**
  - `id UUID PK`
  - `scenario_key TEXT`
  - `phase TEXT` (lobby | in_progress | completed)
  - `turn_index INT`
  - `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`

- **players**
  - `id UUID PK`
  - `display_name TEXT`
  - `created_at TIMESTAMPTZ`

- **session_players** (membership)
  - `session_id UUID FK -> sessions`
  - `player_id UUID FK -> players`
  - `role_key TEXT NULL` (assigned at start)
  - `token TEXT` (session‑scoped auth)
  - PK: `(session_id, player_id)`

- **world_states** (canonical snapshots)
  - `session_id UUID FK`
  - `turn_index INT`
  - `state JSONB` (entities, locations, inventories, flags)
  - PK: `(session_id, turn_index)`

- **player_views** (derived overlays per player/turn)
  - `session_id UUID`
  - `player_id UUID`
  - `turn_index INT`
  - `overlay JSONB` (private brief, rumors, redactions, narrative)
  - `llm_output_id UUID NULL` (link to cached generations)
  - PK: `(session_id, player_id, turn_index)`

- **actions** (submitted intents)
  - `id UUID PK`
  - `session_id UUID`
  - `player_id UUID`
  - `turn_index INT`
  - `type TEXT` (move | observe | interact | persuade | ...)
  - `payload JSONB`
  - `submitted_at TIMESTAMPTZ`

- **events** (domain events and outcomes)
  - `id UUID PK`
  - `session_id UUID`
  - `turn_index INT`
  - `type TEXT` (action_resolved | state_changed | narrative_emitted | chat | ...)
  - `payload JSONB`
  - `created_at TIMESTAMPTZ`

- **llm_outputs** (cache/history)
  - `id UUID PK`
  - `session_id UUID`
  - `player_id UUID NULL`
  - `turn_index INT NULL`
  - `prompt_hash TEXT`, `model TEXT`, `tokens_in INT`, `tokens_out INT`
  - `output JSONB`
  - `created_at TIMESTAMPTZ`

### API surface sketch
Base URL: `/api`

- **POST `/sessions`** — create a session
  - Body: `{ scenarioKey: string }`
  - Returns: `{ sessionId: string }`

- **POST `/sessions/{sessionId}/join`** — join as a player
  - Body: `{ displayName: string }`
  - Returns: `{ playerId: string, token: string }`

- **GET `/sessions/{sessionId}/players/{playerId}/view`** — fetch player view for current turn
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ turnIndex: number, overlay: object, ui: { actions: ActionSpec[] } }`

- **POST `/sessions/{sessionId}/actions`** — submit action intent
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ playerId: string, type: string, payload: object }`
  - Returns: `{ accepted: boolean }`

- **POST `/sessions/{sessionId}/turns/resolve`** — resolve turn (server‑initiated in MVP, endpoint for admin/testing)
  - Returns: `{ turnIndex: number, events: object[] }`

- **GET `/sessions/{sessionId}`** — session status
  - Returns: `{ phase: string, turnIndex: number, players: number }`

- **GET `/health`** — liveness/readiness

WebSocket: `wss://…/ws?sessionId=…&playerId=…&token=…`
- Server → Client events
  - `turn_started { turnIndex }`
  - `player_view_update { turnIndex, overlay }`
  - `world_update { turnIndex, delta }`
  - `action_result { actionId, outcome }`
  - `chat { from, message }`
  - `error { code, message }`

- Client → Server messages
  - `submit_action { type, payload }`
  - `chat_send { to?: playerId, message }`
  - `ack { eventId }`

### Flow of a turn (MVP)
1. Session created; players join and receive tokens.
2. Server assigns roles and seeds `world_states[turn=0]`.
3. LLM Adapter generates per‑player overlays; `player_views` persisted.
4. Clients fetch view and/or subscribe via WS; UI renders available actions.
5. Players submit actions; Orchestrator validates and queues them.
6. On resolve: server applies rules deterministically → updates canonical `world_states` and emits `events`.
7. LLM Adapter produces narrative overlays for the next turn; `player_views` updated.
8. Server broadcasts `turn_started` with the new `turnIndex`.

### MVP architecture diagram (textual)
```
[React/Tailwind Client]
   |  HTTP: create/join/fetch
   |  WS: subscribe, submit_action
   v
[API Gateway (Node/TS)] --calls--> [Game Orchestrator & Rules Engine]
   |                                  |\
   |                                  | \ generate overlays
   |                                  v  \
   |                            [LLM Adapter] 
   |                                  |
   v                                  v
[Postgres] <---- persist ---- [world_states, player_views, actions, events, llm_outputs]
```

### Technology choices and constraints
- **Backend**: Node.js + TypeScript (Fastify/Express, ws or socket.io for WS).
- **Database**: Postgres with JSONB; use transactions per turn resolution; indices on `(session_id, turn_index)`.
- **Realtime**: WebSockets for events and action intents; heartbeats and reconnect logic.
- **LLM**: OpenAI or local wrapper accessible via HTTP; schema‑validated outputs.
- **Frontend**: React + Tailwind; small, deterministic state derived from server.
- **Testing**: Jest for unit/integration (rules, reducers, adapters); Playwright for UI/e2e; supertest for HTTP and ws test client.

### Testing approach (MVP)
- **Unit tests (Jest)**: rules engine (pure functions), reducers, validators.
- **Integration tests (Jest)**: action submission → resolution → DB assertions; LLM adapter with stub.
- **E2E (Playwright)**: 3 simulated players join, take actions, see updates via WS.

### Security & safety (MVP)
- Session‑scoped tokens; minimal auth.
- Input validation server‑side; sanitize rendered text.
- Content filters for LLM outputs; rate limits per player.

### Operations
- Configuration via env (DB URL, LLM keys, model choices, budgets).
- Migrations via Prisma/Knex/Flyway.
- Basic dashboards: logs and token usage.


