---
name: Freigaben unified review list
description: How purchase requests and governance approvals are merged into one approver list without double-counting.
---

Freigaben shows ONE list combining seeded `approvals` and submitted `purchaseRequests` (status != Entwurf), both entity-scoped.

**Dedup rule:** a seeded approval can already represent a PR — it references the PR id inside its `subject` text (e.g. "Baukran Anmietung Q3 (PR-2042)"). There is no structured FK field. Parse the PR id from the subject with `/PR-\d+/`; any PR whose id is referenced by an approval is dropped from the PR-derived rows so the same business request is not listed twice.

**Decision sync:** when deciding on an approval that has a `linkedPR`, call BOTH `updateApprovalStatus` and `updatePRStatus` so the underlying PR never drifts from the approval. PR-sourced rows (genuinely new Einkauf submissions, no approval) route only to `updatePRStatus`.

**Why:** without this, AP-501/PR-2042 (and AP-504/PR-2045) both appear and decisions update only one side, leaving contradictory statuses and inflated open counts.
