---
name: Group view aggregation with fallbacks
description: How group-view derived figures must aggregate member firms when only some have data entered
---

# Group aggregation must sum each member's *effective* value, not just entered records

When a controlling figure is derived per firm+period and a group view aggregates its
member firms, the group total must sum each member's **effective** value
(`raw entered value` if present, otherwise that member's fallback/benchmark) — never
just the sum of entered records.

**Why:** Summing only entered records understates a partially-entered group. e.g. the
Plan/Budget feature first summed only firms that had a plan, so a group where 1 of 3
firms had a plan showed a budget far below reality and produced distorted € and %
variance. The architect flagged this as a critical correctness bug.

**How to apply:** For any new per-firm/period metric with a group rollup (aging,
working capital, liquidity, KPI targets, etc.): resolve each member to plan-or-fallback
first, then aggregate. Also expose a 3-state indicator (`full` / `partial` / `none`) so
the UI can tell the user when a group total mixes entered data with fallbacks.
Helpers live in `data/finance.ts` (`effectiveFirmPlan`, `resolvePlan`, `budgetPlanState`);
firm scope comes from `firmCodesInGroup(groupIdFromView(view))`.
