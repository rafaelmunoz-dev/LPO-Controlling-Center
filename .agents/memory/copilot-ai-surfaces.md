---
name: Controlling Center AI surfaces
description: The two AI-server endpoints and their intentionally different failure semantics.
---

There are two AI surfaces in the Controlling Center, both backed by the same env-gated
OpenAI client in `artifacts/api-server/src/routes/ai.ts`:

- `/api/ai/classify-expense` — silent fallback: client returns `null` on any failure so
  the UI quietly falls back to the learned/heuristic suggestion.
- `/api/ai/chat` (the Copilot) — explicit failure: `chatCopilot` returns
  `{ok:false, error}` and the panel shows a visible error bubble. It must NEVER fabricate
  an answer when the model is unavailable.

**Why:** classification is a convenience overlay (a wrong-but-quiet guess is fine), but the
Copilot is advisory and must not invent financial figures — a fake grounded-looking answer
is worse than an explicit "unavailable".

**How to apply:** keep the chat path fail-loud. Grounding context is built client-side via
`buildCopilotContext(view, context)` in `data/copilot.ts` and sent as a string; the server
prompt is generic and language-driven (de/en/es).
