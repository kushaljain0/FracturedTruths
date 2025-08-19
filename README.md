## Fractured Truths

Multiplayer asymmetric knowledge game MVP. See `docs/` for specification and architecture.

### Getting started
- Backend: `cd backend && npm i && npm run dev`
- Frontend: `cd frontend && npm i && npm run dev`

### Environment (.env)
Create a `.env` file at the project root with variables consumed by the backend (loaded via dotenv):

```
# Backend LLM selection
LLM_PROVIDER=mock               # mock | gemini
NARRATIVES_ENABLED=true         # enable/disable per-player narratives

# Gemini (set when using LLM_PROVIDER=gemini)
GEMINI_API_KEY=                 # your API key
GEMINI_MODEL=gemini-1.5-flash   # optional

# Server
PORT=3000
```

When `LLM_PROVIDER=mock` (default), the system runs fully offline with deterministic overlays.


