---
name: api-server typecheck uses db dist
description: Why api-server tsc reports stale @workspace/db types and how to fix it after a db schema/type change
---

The api-server typechecks via TypeScript **project references** (`references: [{ path: "../../lib/db" }]` in its tsconfig). Project references resolve a referenced package's types from its **build output** (`lib/db/dist/*.d.ts`), NOT from `lib/db/src`, even though the package `exports` point at source.

**Symptom:** after adding a new domain table / changing `DomainKind` in `lib/db`, `pnpm --filter @workspace/api-server exec tsc --noEmit` errors that the new kind "is not assignable" to a union that stops at an older table — the union reflects the stale `dist`. Runtime is unaffected because the dev workflow uses `tsx`, which reads source directly (the endpoint works even while tsc fails).

**Fix:** rebuild the db declarations after any db schema/type change: `pnpm --filter @workspace/db exec tsc -b`. Then the api-server typecheck is accurate.

**Why:** Vite-based artifacts (e.g. controlling-center) resolve `@workspace/db` from source, so they typecheck fine without the rebuild — which is why a db change can pass one artifact's tsc but break the api-server's. Always rebuild db dist as part of verifying a cross-package schema change.
