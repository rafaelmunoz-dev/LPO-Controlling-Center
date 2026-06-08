---
name: Controlling Center finance derivation registry
description: Why finance KPIs are derived from a module-level registry and what every consuming page must subscribe to.
---

Finance KPIs (revenue, EBITDA, net profit, cash, P&L, budget, cashflow,
forecasts) are NOT stored. They are derived in `src/data/finance.ts` from
user-entered `FinanceInput` records (one per firm + reporting period; group
views aggregate their member firms). The getters (`getFinance`, `getPLOverview`,
`getEntityComparison`, `getBudget`, `getCashflow`, `getForecasts`, …) read a
**module-level** registry (`financeInputs` + `activePeriod`) rather than taking
state as args, so call sites stay terse.

That registry is kept in sync by a store subscription at the bottom of
`use-app-context.tsx` (`setFinanceData(s.financeInputs, s.period)` alongside
`setRegistry`). Editing happens via the `upsertFinanceInput` store action (keyed
by deterministic id `FIN-<period>-<view>`), which persists through the normal
snapshot-diff sync.

**The reactivity trap:** because the getters read module globals (not React
state), a page that calls them will NOT re-render when finance data or the active
period changes unless it *subscribes* to those store slices. Every page that
shows finance KPIs must destructure `period` and `financeInputs` from
`useAppStore()` even if it never references them directly (tsconfig has
`noUnusedLocals: false`, so this compiles). Miss it and the page shows stale
zeros after an edit or period switch.

**Why:** keeping derivation in one module avoids threading state through dozens of
call sites, but trades away automatic React reactivity at the read sites — the
subscribe-to-force-rerender is the deliberate compensating pattern.

Server write gate: `financeInputs` is non-structural, so `canWriteDomain`
auto-allows Admin + Mitarbeiter (create/update) and blocks Betrachter — matching
the client `finanzdaten:edit` capability. No `auth.ts` change was needed.
