---
name: Controlling Center SaaS auth & tenancy
description: Phase-1 SaaS rules — server-side role gating must mirror frontend governance, empty new orgs, Controller-only invites.
---

# Controlling Center: multi-tenancy auth model

The app went SaaS in Phase 1: real Clerk auth + per-organization PostgreSQL (Drizzle), org-scoped CRUD via api-server `/api`.

## Server-side role gating must mirror frontend governance
The frontend `src/data/governance.ts` matrix (ROLE_PERMISSIONS, ROLE_CAPABILITIES, *_ROLES) is **only a UX gate** — a user can hit the API directly. The api-server must enforce its own per-domain write policy (`canWriteDomain` in `lib/auth.ts`) that mirrors governance, or roles are trivially bypassable.
**Why:** A code review caught `Mitarbeiter` being able to write `entities`/`employees`/`inventory` via direct API calls because the server gate was too coarse.
**How to apply:** Whenever you change a role→capability rule in `governance.ts`, update the corresponding server matrix in lockstep, and vice versa. Tenant isolation (organizationId scoping) is a *separate* always-on check on every query — never conflate it with the role gate.

## New organizations start COMPLETELY EMPTY
Product decision: a freshly created org seeds **no** data (no default group/company/etc.). The owner creates their first group/company from Einstellungen → Entitäten (`EntitySettings.tsx`, `button-create-group`).
**Why:** User explicitly required empty accounts; an earlier auto-seeded "default group" (named after the org) violated this.
**How to apply:** Don't reintroduce onboarding seed data. The empty state is safe — `firstActiveView` returns a sentinel when groups/entities are empty.

## Invitations are Admin-only ("owner invites")
`isOrgAdmin` = `Admin` only. The org owner (first user) is created as an `Admin` on org creation, so this matches the "owner invites by email+role" model and prevents in-tenant privilege escalation. Frontend `TeamSettings`/`SETTINGS_ADMIN_ROLES` mirror this. Team management lives in Einstellungen, which is Admin-only (non-admins get AccessDenied via `allowedNav`).

NOTE: the role model is now 3-tier org-wide (Admin/Mitarbeiter/Betrachter) — see controlling-center-scoped-permissions.md. Older notes here mentioning Controller/Geschäftsführer predate that overhaul; "Admin" is the current owner/admin level.

## Invite acceptance flows
Two paths, both redeemed in `AuthedApp` bootstrap: (1) auto-detect — `/api/me` returns `status:"invited"` when a pending invitation matches the signed-in email → InvitePrompt; (2) shareable link `?invite=<token>` captured to sessionStorage (`INVITE_TOKEN_KEY`) before Clerk navigation, redeemed even on email mismatch. No invite emails are sent yet (Phase 4).
