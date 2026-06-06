---
name: Clerk managed production switch
description: How "switch Clerk to production" works for this Replit-managed Clerk app — it's automatic, not a manual key swap.
---

# Switching Clerk to a production instance (Replit-managed)

This project uses **Replit-managed Clerk** (`checkClerkManagementStatus` → `managed`).
There is nothing to manually configure to "go to production."

**The rule:** Do NOT manually provision live keys, edit secrets, or touch the
Clerk dashboard. Replit provisions two isolated Clerk environments (Development +
Production) automatically. The workspace runs with test keys (`pk_test`/`sk_test`);
the published deployment automatically runs with live keys (`pk_live`/`sk_live`).

**Why:** Manually swapping keys or configuring the Clerk dashboard is explicitly
unsupported for Replit-managed Clerk and will break auth. Confirmed via
searchReplitDocs and the clerk-auth skill.

**How to apply:**
- The "Clerk has been loaded with development keys" console warning is EXPECTED
  in dev/preview and is not a bug — it disappears only in the published app.
- To actually run on the production instance, the user just **publishes** the app.
- Verify live keys after publishing under Publishing settings → Overview →
  Adjust settings (`CLERK_PUBLISHABLE_KEY`/`CLERK_SECRET_KEY` show `*_live`).
- Wiring is already correct: frontend `VITE_CLERK_PUBLISHABLE_KEY` +
  `publishableKeyFromHost`; backend `CLERK_PUBLISHABLE_KEY`/`CLERK_SECRET_KEY`.
- Dev and Production have **separate user stores** — accounts made in dev won't
  exist in the published app.
