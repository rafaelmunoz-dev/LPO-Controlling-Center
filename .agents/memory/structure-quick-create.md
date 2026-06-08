---
name: Structure quick-create surfaces
description: Where company-group/company creation lives and why two surfaces exist
---

Creating company groups and companies (structural domains, Admin-only — see
api-server canWriteDomain STRUCTURAL_DOMAINS) is offered in two places:
1. Einstellungen ▸ Entitäten (its own dialogs, with edit/archive/rename too).
2. The Topbar entity Select dropdown — admin-only action rows ("Gruppe erstellen" /
   "Entität anlegen") that open a shared component `components/shared/StructureCreateDialogs`.

**Why two implementations:** EntitySettings already had working, test-covered dialogs.
The Topbar quick-create was built as a separate shared component instead of refactoring
EntitySettings to consume it, to avoid regressing the settings page. They intentionally
diverge slightly (quick-create includes logo upload on create; settings sets logos
separately). A reviewer may flag this as duplication — it is a deliberate scope decision,
not an oversight.

**How to apply:** if you change creation validation/defaults, update BOTH surfaces, or
finish the consolidation (make EntitySettings consume StructureCreateDialogs) intentionally.
New groups appear in the dropdown immediately via Zustand reactivity; addGroup heals
selectedEntity to the new group when the prior selection is orphaned.
