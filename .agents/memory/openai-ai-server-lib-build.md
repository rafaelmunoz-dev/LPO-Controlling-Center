---
name: integrations-openai-ai-server lib usage
description: Two durable gotchas when an api-server consumes the OpenAI AI server lib — it throws at import time, and it must be tsc -b built before it can be referenced.
---

## It throws at module load — never import it at top level for optional AI
`lib/integrations-openai-ai-server/src/client.ts` throws at module evaluation
if `AI_INTEGRATIONS_OPENAI_BASE_URL` or `AI_INTEGRATIONS_OPENAI_API_KEY` is
missing. A top-level `import { openai } from "@workspace/integrations-openai-ai-server"`
in an unconditionally-mounted route therefore crashes server **startup** when
the integration isn't provisioned.

**Why it matters:** AI assist is usually meant to be optional/degrade
gracefully. A top-level import makes it mandatory and fatal.

**How to apply:** when AI is optional, env-check first, then lazily
`await import(...)` the lib inside the handler (cache the resolved client),
wrapped in try/catch; return `503 ai_unavailable` on missing env or import
failure. esbuild defers evaluation of dynamically-imported modules, so the
throw only fires when the endpoint is actually hit — never at boot.

## TS6305 when first referencing it
Adding a TS project reference to this `composite` lib fails `tsc --noEmit`
with TS6305 until its `dist/*.d.ts` exists (a freshly-copied lib has no
`dist/`). Build once: `pnpm exec tsc -b lib/integrations-openai-ai-server/tsconfig.json`.
The copied lib also ships pre-existing strict-null errors in `image/client.ts`
(`response.data[0]` → `response.data?.[0]`) that block that build even if you
only use the chat-completions export. (Moot if you avoid referencing it and
import lazily instead.)
