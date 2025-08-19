## Fractured Truths — High‑Level Specification

### Problem statement
Fractured Truths is a short-session, multiplayer asymmetric knowledge game. Each player experiences a different “truth” about a shared world. A large language model (LLM) acts as a narrative director, selectively revealing, distorting, or omitting information to drive tension, bluffing, and deduction. The core challenge is to navigate uncertainty, collaborate or deceive, and reconcile conflicting narratives to achieve goals.

### Core features
- **Asymmetric knowledge**
  - Private briefings at session start: goals, loyalties, secret capabilities, and misleading hints.
  - Ongoing per‑player narrative overlays: selective descriptions, omissions, and personalized hints.
  - Information economy: players trade, reveal, or fabricate information through in‑game channels.

- **Shared world**
  - Canonical world state maintained on the server; all player views derive from it.
  - Deterministic rules for actions and consequences; uncertainty comes from information, not mechanics.
  - Synchronized turns or lightweight real‑time ticks suitable for low player counts in MVP.

- **LLM narrative overlays**
  - LLM acts as a “Game Master” that renders flavor text, motives, rumors, and red herrings.
  - Injects asymmetric truths within bounded rails: the LLM cannot change canonical rules or outcomes, only their presentation and player‑specific inferences.
  - Safety and consistency guardrails: content guidelines, style constraints, and memory of session facts.

### Non‑goals (initially)
- **Massive scale**: no attempt to solve full MMO sharding, region routing, or tens‑of‑thousands concurrency.
- **Advanced graphics**: no 3D/AAA visuals; MVP uses minimalist UI (text‑forward with simple tiles or cards).
- **Full content authoring suite**: handcrafted single scenario first; modding tools come later.
- **Anti‑cheat/competitive ladder**: casual/social experience first; integrity measures are basic.

### MVP scope
- **Players**: Up to 3 concurrent human players per session.
- **Setting**: Single medieval intrigue scenario (small town, castle court, and surrounding woods).
- **Loop**: 20–30 minute session, 6–8 turns; each turn players take 1–2 actions.
- **Asymmetry**: LLM delivers private role briefs, hidden agendas, and personalized rumors/clues.
- **Rules**: Simple action set (move, observe, interact, persuade); deterministic outcomes with chance only where explicitly stated.
- **UI**: Minimal browser UI with text descriptions, action buttons, and a simple map/inventory panel.
- **Comms**: In‑game text chat (global and whisper); no voice in MVP.
- **Hosting**: Single game server process per session; no cross‑session persistence.
- **Content**: One handcrafted scenario with 3 roles and at least 2 victory conditions.
- **Safety**: Content filters and style prompts to avoid disallowed content; profanity filter toggle.

### Stretch goals
- **Persistence**: Light meta‑progression and campaign arcs across sessions.
- **Faction AI**: NPC factions with memory and evolving goals driven by an LLM + rules hybrid.
- **Replayable scenarios**: Parameterized scenario templates with procedural seeds and variant roles.
- **Scenario authoring**: Lightweight DSL or editor for creating new scenarios safely.
- **Spectator/replay**: After‑action report showing each player’s truth vs. canonical truth.
- **Matchmaking**: Lobbies and basic ranking for cooperative/competitive variants.
- **Accessibility**: Screen reader‑friendly flows, color‑contrast modes, localization.

### Guardrails and constraints
- **LLM boundaries**: The LLM narrates, proposes rumors, and explains consequences but does not change server‑side canonical state arbitrarily. All state changes must pass deterministic rule validation.
- **Determinism where it matters**: Server resolves actions; LLM text is cosmetic/informational except when mapping to rule‑validated actions.
- **Cost envelope**: Prompt/token budgets per turn; caching of stable texts; streaming responses.

### High‑level architecture (MVP)
- **Client (web)**: Minimal UI; sends intents; renders server state and LLM overlays.
- **Game server**: Session orchestration, world state, rules engine, turn resolution, safety checks.
- **LLM service**: Prompt templates, persona memory, content filtering, and overlay generation.
- **Data**: In‑memory per‑session state for MVP; optional ephemeral store for logs and replay.


