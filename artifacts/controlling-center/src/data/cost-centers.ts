import type {
  BankTransaction,
  CostCenter,
  EntityCode,
  PurchaseRequest,
  ViewKey,
} from "./types";
import { entityCodesForView } from "./groups";

// Period is the union of picker labels declared in the store; we accept the
// loose string form here so this module stays free of a hook dependency.
type Period = string;

// Month tokens that may appear in a Period string. The app's PERIODS use the
// German month name as written in the picker ("Mai 2026", "April 2026"); we
// also accept the short forms used elsewhere so date parsing stays robust.
const MONTH_INDEX: Record<string, number> = {
  Januar: 0, Jan: 0,
  Februar: 1, Feb: 1,
  "März": 2, "Mär": 2, Maerz: 2,
  April: 3, Apr: 3,
  Mai: 4,
  Juni: 5, Jun: 5,
  Juli: 6, Jul: 6,
  August: 7, Aug: 7,
  September: 8, Sep: 8,
  Oktober: 9, Okt: 9,
  November: 10, Nov: 10,
  Dezember: 11, Dez: 11,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export interface PeriodRange {
  startStr: string; // inclusive yyyy-mm-dd
  endStr: string; // inclusive yyyy-mm-dd
  months: number; // number of months the period spans (1, 3 or 12)
}

// Resolve a Period label ("Mai 2026", "Q2 2026", "GJ 2026") into an inclusive
// ISO date range plus its length in months. Falls back to the full year if a
// label cannot be parsed so aggregation never silently drops data.
export function periodDateRange(period: Period | string): PeriodRange {
  const parts = String(period).trim().split(/\s+/);
  const year = Number(parts[parts.length - 1]);
  const head = parts[0] ?? "";

  if (!Number.isFinite(year)) {
    const y = new Date().getFullYear();
    return { startStr: `${y}-01-01`, endStr: `${y}-12-31`, months: 12 };
  }

  let m0 = 0;
  let m1 = 11;
  let months = 12;

  if (head.toUpperCase().startsWith("Q")) {
    const q = Number(head.slice(1));
    if (q >= 1 && q <= 4) {
      m0 = (q - 1) * 3;
      m1 = m0 + 2;
      months = 3;
    }
  } else if (head === "GJ" || head === "FY") {
    m0 = 0;
    m1 = 11;
    months = 12;
  } else if (head in MONTH_INDEX) {
    m0 = MONTH_INDEX[head];
    m1 = m0;
    months = 1;
  }

  const lastDay = new Date(year, m1 + 1, 0).getDate();
  return {
    startStr: `${year}-${pad(m0 + 1)}-01`,
    endStr: `${year}-${pad(m1 + 1)}-${pad(lastDay)}`,
    months,
  };
}

function inRange(dateStr: string, range: PeriodRange): boolean {
  const d = (dateStr || "").slice(0, 10);
  return d >= range.startStr && d <= range.endStr;
}

// Purchase requests that represent committed (not yet paid, not rejected) spend.
const COMMITTED_PR_STATUS = new Set<PurchaseRequest["status"]>([
  "Entwurf",
  "Eingereicht",
  "In Prüfung",
  "Freigegeben",
  "Bestellt",
  "Erhalten",
]);

export function costCenterId(): string {
  return `CC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function emptyCostCenter(entity: EntityCode): CostCenter {
  return { id: costCenterId(), entity, code: "", name: "", responsible: "", monthlyBudget: 0 };
}

// Cost centers visible for a view (group expands to its firms), excluding
// archived ones.
export function costCentersForView(costCenters: CostCenter[], view: ViewKey): CostCenter[] {
  const codes = new Set(entityCodesForView(view));
  return costCenters.filter((c) => !c.archived && codes.has(c.entity));
}

export interface CostCenterRow {
  cc: CostCenter;
  actual: number; // booked bank transactions in period tagged to this CC
  txCount: number;
  committed: number; // open purchase requests tagged to this CC
  budget: number; // monthlyBudget scaled to the period length
  variance: number; // budget - actual (positive = under budget)
  variancePct: number; // variance as % of budget (0 when no budget)
}

export interface CostCenterReport {
  rows: CostCenterRow[];
  unassignedActual: number;
  unassignedCount: number;
  unassignedCommitted: number;
  unassignedCommittedCount: number;
  totals: { budget: number; actual: number; committed: number; variance: number };
}

// A cost center is uniquely identified by (entity, code) — the same code may be
// reused across firms, so attribution must always match both.
function ccKey(entity: string, code: string): string {
  return `${entity}|${code}`;
}

// Build the per-cost-center actual/committed/budget comparison for a view and
// period. Actuals come from booked bank transactions (real cash spend) tagged
// with the cost center's code; committed comes from open purchase requests.
// Spend with no (or an unknown) cost center is reported in a separate bucket.
export function costCenterReport(
  costCenters: CostCenter[],
  bankTransactions: BankTransaction[],
  purchaseRequests: PurchaseRequest[],
  view: ViewKey,
  period: Period | string,
): CostCenterReport {
  const range = periodDateRange(period);
  const codes = new Set(entityCodesForView(view));
  const centers = costCentersForView(costCenters, view);
  // Codes are only unique within a firm, so attribution keys on (entity, code).
  const knownKeys = new Set(centers.map((c) => ccKey(c.entity, c.code)));

  const booked = bankTransactions.filter(
    (t) => t.status === "booked" && t.entity && codes.has(t.entity) && inRange(t.date, range),
  );
  const openPRs = purchaseRequests.filter(
    (p) => codes.has(p.entity) && COMMITTED_PR_STATUS.has(p.status),
  );

  const rows: CostCenterRow[] = centers.map((cc) => {
    const txs = booked.filter((t) => t.entity === cc.entity && t.costCenter === cc.code);
    const actual = txs.reduce((a, t) => a + t.amount, 0);
    const committed = openPRs
      .filter((p) => p.entity === cc.entity && p.costCenter === cc.code)
      .reduce((a, p) => a + p.amount, 0);
    const budget = (cc.monthlyBudget || 0) * range.months;
    const variance = budget - actual;
    const variancePct = budget > 0 ? (variance / budget) * 100 : 0;
    return { cc, actual, txCount: txs.length, committed, budget, variance, variancePct };
  });

  rows.sort((a, b) => b.actual - a.actual);

  // Spend / commitments tagged with no cost center, or a code that doesn't
  // resolve to a center in this view's firms, fall into the unassigned bucket.
  const unassigned = booked.filter(
    (t) => !t.costCenter || !knownKeys.has(ccKey(t.entity!, t.costCenter)),
  );
  const unassignedActual = unassigned.reduce((a, t) => a + t.amount, 0);
  const unassignedPRs = openPRs.filter(
    (p) => !p.costCenter || !knownKeys.has(ccKey(p.entity, p.costCenter)),
  );
  const unassignedCommitted = unassignedPRs.reduce((a, p) => a + p.amount, 0);

  const totals = rows.reduce(
    (acc, r) => ({
      budget: acc.budget + r.budget,
      actual: acc.actual + r.actual,
      committed: acc.committed + r.committed,
      variance: acc.variance + r.variance,
    }),
    { budget: 0, actual: 0, committed: 0, variance: 0 },
  );
  // Open commitments without a valid center still count toward total obligo.
  totals.committed += unassignedCommitted;

  return {
    rows,
    unassignedActual,
    unassignedCount: unassigned.length,
    unassignedCommitted,
    unassignedCommittedCount: unassignedPRs.length,
    totals,
  };
}
