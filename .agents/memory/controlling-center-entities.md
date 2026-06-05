---
name: Controlling Center entity store
description: Entities are runtime store state, not just static seed data — every consumer must read from the store or new/deleted entities drift.
---

Entities in the LPO Controlling Center are mutable runtime state in the app store (`use-app-context`), seeded from the static `ENTITIES` list in `data/finance.ts`. The store exposes the entity list plus add/update/remove/setLogo actions (in-memory, matching the app's pattern).

**Rule:** any UI that lists, compares, searches, or selects entities must read the store's `entities`, never the static `ENTITIES`/`ENTITY_CODES` exports directly. Otherwise newly created entities are missing and deleted ones linger as stale options.

**Why:** create/delete is a real feature here. Several consumers were originally wired to the static seed (default-entity selector in Einstellungen, `getEntityComparison()` in Finanzen, entity loop in `data/search.ts`). They silently ignored runtime changes until switched to store-driven data.

**How to apply:**
- `getEntityComparison(entities)` accepts a list — pass the store's entities.
- `searchAll(query, t, entities)` takes an optional entities arg (defaults to static for back-compat) — Topbar passes the store list.
- Unknown/new entity codes are safe in finance via a deterministic `fallbackProfile`/`profileFor`, so getters won't crash on codes not in the seed.
- Entities are now soft-archive only (no hard delete); every list/compare/search/select consumer must also exclude `archived` firms, and the active selection resets to a group view (`group:<id>`, no longer the literal `"MiGu Group Gesamt"`).
