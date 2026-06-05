---
name: Controlling Center company groups
description: "group" is first-class — multiple company groups each with an aggregated total view; firms belong to a group; soft-archive only.
---

The LPO Controlling Center models multiple **company groups**, each with its own aggregated total view. A firm (entity) belongs to exactly one group via `groupId`. The default group id is `DEFAULT_GROUP_ID = "migu"`.

**View keys:** `ViewKey = "group:<id>" | EntityCode`. Never compare against the old literal `"MiGu Group Gesamt"`. Use the helpers in `data/groups.ts`:
- `groupViewKey(id)` → `"group:<id>"`; `isGroupView(v)`; `groupIdFromView(v)`.
- `labelForView(v)` → human label for a group total ("<name> Gesamt") or a firm code.
- `defaultFirmForView(v)` → a sensible firm code when a form needs a concrete firm (returns `undefined` for groups with no firms; callers do `?? "IMP"`).

**Registry:** `data/groups.ts` holds a module-level registry of entities+groups set via `setRegistry`. The store keeps it in sync (subscribe + onRehydrate in `use-app-context`). Finance aggregation and `scopeByEntity` read the registry so group totals sum only that group's **non-archived** firms; an empty group is safe.

**Soft-archive only:** firms and groups archive/restore (`archived?` flag) — there is NO hard delete. Archived items are excluded from every picker, list, aggregation, comparison, and search, and surface only in an archive section in EntitySettings.

**Why:** groups went from an implicit single "MiGu Group" total to a real multi-group feature. Any consumer that filtered by `=== "MiGu Group Gesamt"`, iterated `ENTITY_CODES`, or built a static `ENTITY_VIEWS` list will silently break for non-default groups, archived firms, or newly created groups/firms.

**How to apply:**
- Entity dropdowns: `entities.filter(e => !e.archived).map(...)` from the store, never `ENTITY_CODES`.
- View pickers (Topbar/Reports/Einstellungen): build from store `groups`+`entities` (non-archived) using `groupViewKey` + `labelForView`, never a static `ENTITY_VIEWS`.
- Group-vs-firm branching: `isGroupView(selectedEntity)`, not string equality.
- Persisted store is at version 5 with a migration that adds `groups`/`groupId`/`archived` to old shapes — bump in lockstep if the shape changes again.
