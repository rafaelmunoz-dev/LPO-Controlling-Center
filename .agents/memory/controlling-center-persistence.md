---
name: Controlling Center persistence model
description: How store mutations reach the DB — store is local-only, a separate diff-sync layer persists.
---

Store mutations (addGroup/addEntity/updateEntity/etc. in `use-app-context.tsx`) only do local `set()`. They do NOT call the API directly. Persistence is a separate concern: `src/lib/data-sync.ts` subscribes to the store, diffs JSON snapshots per record, and PUTs/DELETEs via `src/lib/api.ts` → `/api/records/:kind/:id`. `loadOrgData()` hydrates the store from the DB on login and primes snapshots; `startSync()`/`stopSync()` run in `AuthedApp` (stopSync disables sync BEFORE resetData on cleanup, so logout never emits spurious deletes).

**Why:** An empty `entities` DB table looks like "create is broken" but is usually just "none were created yet" — onboarding's sub-company is optional, and the older stale-selection bug (no active group ⇒ `openCreate` blocks with `ent_need_group`) prevented creation. The sync path itself treats groups and entities identically, so if groups persist, entities will too.

**How to apply:** When a domain "doesn't save," don't assume the sync layer is broken — check (1) DB ground truth via psql, (2) `canWriteDomain` role gate (Admin writes everything; Mitarbeiter can't touch structural groups/entities), (3) whether the create UI was even reachable (active-group requirement). Look for `[sync] failed` in the browser console for actual write errors.
