---
name: Consolidation / intercompany scoping
description: Scoping rules for the Konzern consolidation (intercompany elimination) view in controlling-center.
---

- The consolidation/konsol tab in `Finanzen.tsx` must scope member rows to the **active group**, not all entities. `getEntityComparison(entities)` returns ALL non-archived firms across every group; rendering it raw next to group-scoped "member sum / elimination / Konzern" rows mixes firms from other groups and makes reconciliation wrong. Filter comparison by `entityCodesForView(groupView)` before mapping.
  **Why:** architect review flagged this as a correctness bug — gross member sum and elimination are group-scoped but the per-firm rows were not.
  **How to apply:** any per-firm table in a group/consolidation context must filter to `entityCodesForView(groupView)`.

- Intercompany eliminations only fire when a flow is in the current period, has `amount > 0`, `fromEntity !== toEntity`, AND **both** ends are inside `entityCodesForView(view)`. Flows touching a firm outside the view (external trade), zero/negative amounts, or self-loops must NOT eliminate. Guard this at the compute layer (`consolidation.ts` intercompanyForView), not just in the editor — the editor writes live to the store so invalid rows can persist.
  **Why:** negative amounts invert elimination (inflate consolidated revenue); the live-update editor has no save gate to validate against.

- Elimination subtracts the same total from revenue AND operating costs, so group EBITDA/profit is unchanged by construction. Operating costs are derived as `revenue - EBITDA` (no separate cost field on the group finance object).
