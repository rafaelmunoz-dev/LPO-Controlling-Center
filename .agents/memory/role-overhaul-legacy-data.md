---
name: Role overhaul legacy data
description: Why renaming auth roles silently breaks existing users, and the two-part fix (migrate + normalize at read time).
---

# Legacy role strings survive a role-rename and break authz silently

When the membership role model was renamed to `Admin` / `Mitarbeiter` / `Betrachter`,
existing `memberships.role` (and `invitations.role`) rows still held the old
`"Controller"` value. Both the server authz matrix (`canWriteDomain`, `isOrgAdmin`
in `api-server/src/lib/auth.ts`) and the client governance only recognize the new
names, so `"Controller"` fell through to "deny": every group/entity write returned
403 and the client hid all admin/edit controls. Symptom seen by the user: a newly
created group/entity never appeared and could not be edited.

**Why:** `me.ts` already assigned the correct new role to *new* orgs, so the code
looked correct — the bug was purely stale data plus a fail-closed permission check
that gives no error surface (writes are swallowed by the data-sync layer's
catch/console.error).

**How to apply:**
- After any enum-like rename of a stored authorization value, do BOTH:
  1. A data migration of existing rows (the role column is plain `text`, no enum).
  2. A read-time `normalizeRole()` backstop in `requireAuth` (and invite-accept)
     mapping legacy → new, so pre-migration environments (esp. production, which
     this dev migration does NOT touch) keep working without manual SQL.
- The generic `/records/:kind` upsert stores domain JSON with no per-domain schema
  validation by design (one endpoint for 14 domains) — don't add entity-specific
  `groupId` checks there; guard orphan creation on the client instead.
