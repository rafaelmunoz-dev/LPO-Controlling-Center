---
name: Controlling Center role model (3-tier, org-wide)
description: The permission model is 3 org-wide levels (Admin/Mitarbeiter/Betrachter) — NO per-company scoping. Supersedes the old Controller/Geschäftsführer/managedEntities scheme.
---

The Controlling Center role model was overhauled away from 4 functional roles
(Controller/Geschäftsführer/Finanzbuchhalter/Mitarbeiter + per-group
`managedEntities` scoping) to **3 org-wide permission levels** plus a free-text
`jobTitle` (cosmetic only, never used for authorization).

- **Admin** — full rights incl. structural (groups/companies), system settings, audit, delete, approvals.
- **Mitarbeiter** — operational create/edit on non-structural domains; **never delete**, no structural changes, no system settings.
- **Betrachter** — read-only.

**There is no per-company scoping anymore.** Gating is purely role→capability:
`can(role, cap)` and `isAdmin(role)` from `data/governance.ts`. The old
`canScoped`, `userManagesEntity`, `userGroupEntities`, `addManagedEntity` and any
`role === "Controller"`/`"Geschäftsführer"` branches were **removed** — do not
reintroduce them. Manageable companies = all non-archived entities for anyone
holding the capability.

**Why:** Product decision (Org/Identity overhaul) replaced functional roles with
simple permission levels; scoping added complexity users didn't want. The DB
`managedEntities` columns were kept (unused) to avoid a destructive migration.

**How to apply:**
- Gate both the rendered button AND the save/delete handler with `can(role, cap)` (UI-only gating is a client bypass — see controlling-center-crud-gating.md).
- First user in a new org becomes Admin; role changes go through `PATCH /members/:id/role` with a server-side **last-admin guard** (409, message contains `last_admin`).
- Server `canWriteDomain` in api-server `lib/auth.ts` must mirror this matrix; `isOrgAdmin` = `Admin` only.
- Render role labels via `t(\`role_${role.toLowerCase()}\`)` → `role_admin`/`role_mitarbeiter`/`role_betrachter`.
