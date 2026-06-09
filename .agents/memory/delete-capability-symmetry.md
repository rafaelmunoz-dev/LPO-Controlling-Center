---
name: client/server delete-capability symmetry
description: Delete UI gating must match the server write policy; don't reuse an :edit capability for delete
---

The server backstop (`canWriteDomain` in api-server) lets **Mitarbeiter** create/update operational (non-structural) domains but **never delete** — only Admin deletes. The client governance (`Capability` / `ROLE_CAPABILITIES`) mirrors this: Mitarbeiter gets every capability except those ending in `:delete`.

**Rule:** when adding delete UI for a domain, gate it with a dedicated `<domain>:delete` capability — never reuse `<domain>:edit`. Reusing the edit capability shows Mitarbeiter a delete button whose API call the server rejects (403), so the local optimistic delete reverts on reload and the sync layer logs repeated failures.

**How to apply:** add `<domain>:delete` to the `Capability` union and `ALL_CAPS` (the Mitarbeiter filter `!c.endsWith(":delete")` then excludes it automatically), and gate the delete button + its table action column on that capability separately from create/edit.
