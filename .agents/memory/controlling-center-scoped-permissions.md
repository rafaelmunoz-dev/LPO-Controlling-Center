---
name: Controlling Center entity-scoped permissions
description: How per-company (group) scoping layers on top of the role/capability system for Geschäftsführer
---

The Controlling Center has two permission layers that must be used together:
1. Role/capability: `can(role, cap)` from `data/governance.ts` — role-level yes/no.
2. Entity scope: `userManagesEntity(user, entityCode)` and `canScoped(user, cap, entityCode)`.

**Rule:** a Geschäftsführer (GF) may add/delete employees and companies, but **only inside their own group**. The group is `AppUser.managedEntities?: EntityCode[]`. Controller is always global (returns true regardless of `managedEntities`). Other roles are false. Employee/company create/delete must call `canScoped`/`userManagesEntity` against the **target company**, not just `can(role, cap)`.

**Why:** Task #6's four-role model made GF view+approve only; a later task intentionally re-granted GF scoped create/delete for employees & companies. UI-only or role-only gating is a broken-access-control bug — the handler is the real enforcement point (see controlling-center-crud-gating.md).

**How to apply:**
- Per-row delete: gate the button AND the handler with `canScoped(user, "<domain>:delete", row.entity)`.
- Add: limit the entity picker to manageable companies (Controller → all store entities; GF → `userGroupEntities(user)`); re-check `canScoped(user, "<domain>:create", form.entity)` in the save handler.
- Company create: role-gated by `ENTITY_CREATE_ROLES` (Controller+GF); a GF's new company auto-joins their group via the store's `addManagedEntity(code)`. Company delete: `userManagesEntity`. Company content edit/logo stays Controller-only (`ENTITY_EDIT_ROLES`).
- Demo GF (Thomas Berger) has `managedEntities: ["IMP","C&A"]` (a subset) so scoping is visibly demonstrable.
