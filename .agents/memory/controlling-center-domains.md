---
name: Controlling Center persisted domains wiring
description: The exact set of files that must be edited in lockstep to add a new DB-backed domain, or the bootstrap breaks.
---

Adding a new persisted domain (e.g. budgetPlans, costCenters, intercompanyFlows, liquidityLines) to the Controlling Center requires editing ALL of these in lockstep. Miss one and either `tsc` fails or the authenticated bootstrap `loadOrgData()` `Promise.all` 404s with `unknown_kind`, failing the whole hydrate:

1. `lib/db/src/schema/domain.ts` — `export const X = domainTable("x_snake")` + add to `DOMAIN_TABLES`.
2. `artifacts/api-server/src/routes/records.ts` — `KINDS` URL→key map; and `entityCodeOf` (group-scoped `view` domains return null when value starts with `group:`).
3. `artifacts/controlling-center/src/lib/api.ts` — `DomainKind` union, `KIND_PATH`, `DomainMap`, and the type import.
4. `artifacts/controlling-center/src/lib/data-sync.ts` — `KINDS` array, `ID_FIELD`, `snapshots` init, the destructure + `Promise.all(listRecords)` + hydrate object (all three lists must stay aligned by position).
5. `artifacts/controlling-center/src/hooks/use-app-context.tsx` — type import, `HydratePayload` field, `AppState` field + add/update/remove actions, `hydrate` assignment, `resetData` reset, and the store CRUD impls.

**Why:** the frontend `KINDS` list drives a parallel fetch of every domain; the api-server must recognise each URL path or it returns 404 `unknown_kind` and the whole bootstrap rejects.

**How to apply:** mirror the most recent domain (intercompanyFlows / liquidityLines) line-for-line. After edits, validation order: `pnpm --filter @workspace/db run push`; `pnpm --filter @workspace/db exec tsc -b` (api-server reads stale dist via project refs); cc `tsc --noEmit`; api `tsc --noEmit`; restart api-server workflow; curl `/api/records/<path>` expecting 401 (recognised) not 404 (unknown). New domains start empty (no seed). `i18n:check` output lists UNUSED keys, not errors.

Note: transient `[auth] bootstrap failed {status:404, unknown_kind}` in the browser console right after adding a domain are usually from page reloads that fired before the api-server finished rebuilding — re-check after the restart, not during editing.

**RBAC clear-vs-delete symmetry:** when a UI "clears/removes" a value but the editing role has `:edit` and NOT `:delete` (e.g. Mitarbeiter), model the clear as an *edit* (persist a neutral value like `target=0`) and have the render layer filter it out, rather than calling the domain `remove*` action. A hard delete gated by `:edit` will pass locally but the sync `DELETE` 403s server-side (`canWriteDomain action:"delete"`), so the row reappears on reload. Never reuse `:edit` to authorize a delete.
