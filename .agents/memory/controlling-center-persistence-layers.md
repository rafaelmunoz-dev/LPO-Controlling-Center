---
name: Controlling Center persistence layers
description: The lockstep sites to touch when adding a new org-scoped persisted collection (beyond the original Core 8).
---

Persisting a Zustand store collection to the org-scoped DB requires edits across
SIX layers in lockstep — miss one and the collection silently fails to persist,
fails to reload, or the sync loop retries a 403 forever.

1. **Schema** `lib/db/src/schema/domain.ts` — add `domainTable("...")` + register
   in `DOMAIN_TABLES`. Then run `pnpm --filter @workspace/db push` to apply.
   NOTE: api-server typechecks against `lib/db/dist/*.d.ts`, not the TS source, so
   the new `DomainKind` won't propagate (TS2322/TS2353 on the new kind) until you
   rebuild declarations: `cd lib/db && npx tsc -b` (the package has no build script).
2. **Records route** `artifacts/api-server/src/routes/records.ts` — add the URL
   path segment → DomainKind in `KINDS`. `entityCodeOf` keys off a `data.entity`
   field; collections without one (e.g. audit log) resolve to null, which is fine.
3. **Server role gate** `artifacts/api-server/src/lib/auth.ts` `DOMAIN_WRITE_ROLES`
   — MUST mirror governance.ts. Append-by-anyone collections (audit log) need ALL
   roles or the sync loop hits 403 and retries indefinitely.
4. **Frontend API** `artifacts/controlling-center/src/lib/api.ts` — add to the
   `DomainKind` union, `KIND_PATH`, and `DomainMap`.
5. **Sync layer** `artifacts/controlling-center/src/lib/data-sync.ts` — add to
   `KINDS`, `ID_FIELD` (most are `id`; entities use `code`), `snapshots`, and the
   `loadOrgData` Promise.all list + hydrate call.
6. **Store** `artifacts/controlling-center/src/hooks/use-app-context.tsx` — extend
   `HydratePayload` and the `hydrate()` setter. `resetData()` already nulls these.

**Why:** the sync is a snapshot-diff loop keyed by `ID_FIELD`; an unregistered
kind never diffs (no persist) and an unauthorized write retries on every store
change. New orgs intentionally start empty — no seeding for any of these.
