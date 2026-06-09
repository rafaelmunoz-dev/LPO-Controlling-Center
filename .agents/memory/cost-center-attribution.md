---
name: Cost-center / per-entity code attribution
description: How spend/commitment must be attributed to dimensions whose codes are only unique per firm (entity), and how group views must bucket unassigned items.
---

Cost centers (and similar tagged dimensions like categories) use a `code` that is
**only unique within an entity** — duplicate-code validation is entity-scoped, so
the same code can exist in two firms.

**Rule:** any aggregation that joins a transaction/PR to a dimension row must match
on **(entity, code)**, never code alone. Build a key like `${entity}|${code}`.

**Why:** group/consolidated views span multiple firms. Matching by code alone
double-counts and misattributes amounts across entities.

**How to apply:**
- Booked actuals AND open-PR commitments both need the (entity, code) join.
- Provide an "unassigned" bucket for BOTH actuals and commitments (items with no
  code, or a code that doesn't resolve to a center in the current view's firms).
  Add unassigned committed to total obligo — dropping it understates commitments.
- When a record's entity changes (e.g. reassigning a bank transaction's firm),
  clear its `costCenter`/code so stale cross-entity tags can't re-enter the data.
