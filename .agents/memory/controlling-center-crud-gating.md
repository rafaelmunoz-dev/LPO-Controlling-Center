---
name: Controlling Center CRUD gating
description: How role-based create/edit/delete is enforced across the domain pages
---

Role-based CRUD on the domain pages (Risiko, Einkauf suppliers, Mitarbeiter, Inventar, Strategie, Finanzen Bilanz) is gated by `can(role, capability)` from `@/data/governance` where capability is `<domain>:create|edit|delete` (domains: risiko, lieferant, mitarbeiter, inventar, strategie, bilanz). New capabilities must be added to BOTH the `Capability` union AND the `ALL_CAPS` array, or Controller (which spreads ALL_CAPS) won't get them.

**Rule:** enforce capability in two places, not one:
1. UI: conditionally render the Add button and the per-row edit/delete buttons.
2. Handler sink: at the top of every `save`/`confirmDelete` handler, re-check (`editId ? !canEdit : !canCreate` for save; `!canDelete` for delete) and `toast.error(t("no_permission"))` + return.

**Why:** an architect review flagged UI-only gating as a broken-access-control weakness — handlers could still be invoked via persisted state/devtools. The store CRUD actions themselves do not enforce policy, so the handler guard is the real enforcement point.

**How to apply:** when adding a new CRUD page or action, wire `canCreate/canEdit/canDelete` consts from `can(currentUser.role, ...)`, gate the buttons, AND guard the handler body. `no_permission` i18n key exists in all 3 langs.
