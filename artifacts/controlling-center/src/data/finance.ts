import type {
  BalanceLineItem,
  BalanceRow,
  BudgetRow,
  CashflowBlock,
  EntityCode,
  EntityFinance,
  EntityMeta,
  FinanceInput,
  ForecastSeries,
  LiquidityPoint,
  MonthPoint,
  PLRow,
  RiskLevel,
  ViewKey,
} from "./types";
import {
  DEFAULT_GROUP_ID,
  entityCodesForView,
  firmCodesInGroup,
  groupIdFromView,
  groupViewKey,
  registryEntities,
} from "./groups";

export const ENTITY_CODES: EntityCode[] = ["IMP", "C&A", "MKT", "CPE", "COSM"];

export const ENTITIES: EntityMeta[] = [
  { code: "IMP", name: "Import & Handel GmbH", description: "Import & Handel von Industriegütern", location: "Hamburg", employees: 84, color: "#3b82f6", groupId: DEFAULT_GROUP_ID },
  { code: "C&A", name: "Construction & Assembly", description: "Bau, Montage & technische Dienstleistungen", location: "Dortmund", employees: 142, color: "#f59e0b", groupId: DEFAULT_GROUP_ID },
  { code: "MKT", name: "Marketing AG", description: "Marketing, Werbung & Kreativdienste", location: "Berlin", employees: 46, color: "#8b5cf6", groupId: DEFAULT_GROUP_ID },
  { code: "CPE", name: "Capital Equipment", description: "Maschinen, Anlagen & Vermietung", location: "München", employees: 67, color: "#10b981", groupId: DEFAULT_GROUP_ID },
  { code: "COSM", name: "Cosmetics GmbH", description: "Kosmetik & Konsumgüter", location: "Düsseldorf", employees: 53, color: "#f43f5e", groupId: DEFAULT_GROUP_ID },
];

// NOTE: the live registry is owned by the store (see use-app-context). It is
// seeded empty and populated from the org's DB-backed data after sign-in.

// ---------------------------------------------------------------------------
// Real financial data. Figures are entered and maintained by the user per firm
// and reporting period (FinanceInput records, persisted org-scoped in the DB).
// Every KPI below is DERIVED from these inputs — there are no sample profiles.
// The store keeps this registry in sync (see use-app-context); getFinance and
// the derived helpers read it without threading state through every call site.
// Group views are never stored: they aggregate from their member firms.
// ---------------------------------------------------------------------------
let financeInputs: FinanceInput[] = [];
let activePeriod = "Mai 2026";

export function setFinanceData(inputs: FinanceInput[], period: string): void {
  financeInputs = inputs;
  activePeriod = period;
}

export function financeRegistry(): FinanceInput[] {
  return financeInputs;
}

// Deterministic id so a firm/period record upserts in place.
export function financeInputId(view: ViewKey, period: string): string {
  return `FIN-${period}-${view}`;
}

// Editable numeric fields of a FinanceInput, in entry-form order.
export const FINANCE_INPUT_FIELDS = [
  "revenue",
  "cogs",
  "personnel",
  "marketing",
  "itSoftware",
  "otherOpex",
  "depreciation",
  "interest",
  "tax",
  "cash",
  "openInvoices",
  "openInvoicesCount",
  "cfInvesting",
  "cfFinancing",
] as const;
export type FinanceInputField = (typeof FINANCE_INPUT_FIELDS)[number];

// A blank record (all zeros) for a firm/period with no data entered yet.
export function emptyFinanceInput(view: EntityCode, period: string): FinanceInput {
  return {
    id: financeInputId(view, period),
    view,
    period,
    revenue: 0,
    cogs: 0,
    personnel: 0,
    marketing: 0,
    itSoftware: 0,
    otherOpex: 0,
    depreciation: 0,
    interest: 0,
    tax: 0,
    cash: 0,
    openInvoices: 0,
    openInvoicesCount: 0,
    cfInvesting: 0,
    cfFinancing: 0,
    riskLevel: "Niedrig",
  };
}

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const SEASON = [0.82, 0.86, 0.95, 0.98, 1.02, 1.05, 0.99, 0.93, 1.04, 1.12, 1.15, 1.09];
const SEASON_SUM = SEASON.reduce((a, b) => a + b, 0);

// Reporting periods that have a comparable predecessor, used to derive the
// period-over-period change KPIs from real data (no comparator → 0 % change).
const PREVIOUS_PERIOD: Record<string, string> = {
  "Mai 2026": "April 2026",
  "Q2 2026": "Q1 2026",
};

// Months covered by a period, used to annualise the monthly burn / cash runway.
function periodMonths(period: string): number {
  if (period.startsWith("Q")) return 3;
  if (period.startsWith("GJ") || period.startsWith("Geschäftsjahr")) return 12;
  return 1;
}

const RISK_RANK: Record<RiskLevel, number> = { Niedrig: 0, Mittel: 1, Hoch: 2 };
const RANK_RISK: RiskLevel[] = ["Niedrig", "Mittel", "Hoch"];

function rawInputFor(code: EntityCode, period: string): FinanceInput | undefined {
  return financeInputs.find((i) => i.view === code && i.period === period);
}

// Roll several firms' inputs up into one aggregate (group total). Numeric fields
// sum; the risk level takes the highest among contributing firms.
function aggregateInputs(codes: EntityCode[], period: string): FinanceInput {
  const sum = emptyFinanceInput("__group__" as EntityCode, period);
  let rank = 0;
  for (const code of codes) {
    const i = rawInputFor(code, period);
    if (!i) continue;
    sum.revenue += i.revenue;
    sum.cogs += i.cogs;
    sum.personnel += i.personnel;
    sum.marketing += i.marketing;
    sum.itSoftware += i.itSoftware;
    sum.otherOpex += i.otherOpex;
    sum.depreciation += i.depreciation;
    sum.interest += i.interest;
    sum.tax += i.tax;
    sum.cash += i.cash;
    sum.openInvoices += i.openInvoices;
    sum.openInvoicesCount += i.openInvoicesCount;
    sum.cfInvesting += i.cfInvesting;
    sum.cfFinancing += i.cfFinancing;
    rank = Math.max(rank, RISK_RANK[i.riskLevel]);
  }
  sum.riskLevel = RANK_RISK[rank];
  return sum;
}

// The effective input for any view+period: a firm reads its own record (or an
// empty one); a group view aggregates its non-archived member firms.
function resolveInput(view: ViewKey, period: string): FinanceInput {
  const gid = groupIdFromView(view);
  if (gid) return aggregateInputs(firmCodesInGroup(gid), period);
  return rawInputFor(view as EntityCode, period) ?? emptyFinanceInput(view as EntityCode, period);
}

function operatingCosts(i: FinanceInput): number {
  return i.cogs + i.personnel + i.marketing + i.itSoftware + i.otherOpex;
}

function ebitdaOf(i: FinanceInput): number {
  return i.revenue - operatingCosts(i);
}

function netProfitOf(i: FinanceInput): number {
  return ebitdaOf(i) - i.depreciation - i.interest - i.tax;
}

function pctChange(curr: number, prev: number): number {
  if (!prev) return 0;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

function buildSeries(revenue: number, ebitdaMargin: number, netMargin: number): MonthPoint[] {
  return MONTHS.map((month, i) => {
    const r = Math.round((revenue * SEASON[i]) / SEASON_SUM);
    const ebitda = Math.round(r * ebitdaMargin);
    const profit = Math.round(r * netMargin);
    return { month, revenue: r, costs: r - ebitda, ebitda, profit };
  });
}

export function computeFinance(view: ViewKey, input: FinanceInput, prev?: FinanceInput): EntityFinance {
  const ebitda = ebitdaOf(input);
  const netProfit = netProfitOf(input);
  const ebitdaMargin = input.revenue ? (ebitda / input.revenue) * 100 : 0;
  const netMargin = input.revenue ? (netProfit / input.revenue) * 100 : 0;
  const totalCosts = operatingCosts(input) + input.depreciation + input.interest + input.tax;
  const monthlyBurn = totalCosts / periodMonths(input.period);
  const cashRunway = monthlyBurn > 0 ? input.cash / monthlyBurn : 0;

  const prevEbitda = prev ? ebitdaOf(prev) : 0;
  const prevNet = prev ? netProfitOf(prev) : 0;
  const prevMargin = prev && prev.revenue ? (prevEbitda / prev.revenue) * 100 : 0;

  return {
    view,
    revenue: input.revenue,
    ebitda,
    ebitdaMargin,
    netProfit,
    cash: input.cash,
    cashRunway: Math.round(cashRunway * 10) / 10,
    openInvoices: input.openInvoices,
    openInvoicesCount: input.openInvoicesCount,
    riskLevel: input.riskLevel,
    series: buildSeries(input.revenue, ebitdaMargin / 100, netMargin / 100),
    revenueChange: prev ? pctChange(input.revenue, prev.revenue) : 0,
    ebitdaChange: prev ? pctChange(ebitda, prevEbitda) : 0,
    marginChange: prev ? ebitdaMargin - prevMargin : 0,
    netChange: prev ? pctChange(netProfit, prevNet) : 0,
    cashChange: prev ? pctChange(input.cash, prev.cash) : 0,
  };
}

export function getFinance(view: ViewKey, period: string = activePeriod): EntityFinance {
  const input = resolveInput(view, period);
  const prevKey = PREVIOUS_PERIOD[period];
  const prev = prevKey ? resolveInput(view, prevKey) : undefined;
  return computeFinance(view, input, prev);
}

export interface EntityComparisonRow {
  code: EntityCode;
  name: string;
  revenue: number;
  costs: number;
  profit: number;
  ebitda: number;
  liquidity: number;
  riskLevel: RiskLevel;
  trend: number;
}

export function getEntityComparison(
  entities: EntityMeta[] = registryEntities(),
  period: string = activePeriod,
): EntityComparisonRow[] {
  return entities.filter((e) => !e.archived).map((e) => {
    const f = getFinance(e.code, period);
    return {
      code: e.code,
      name: e.name,
      revenue: f.revenue,
      costs: f.revenue - f.ebitda,
      profit: f.netProfit,
      ebitda: f.ebitda,
      liquidity: f.cash,
      riskLevel: f.riskLevel,
      trend: f.revenueChange,
    };
  });
}

// Budget categories an imported bank expense can be booked against. The strings
// must match the BudgetRow.category labels produced by getBudget so booked
// amounts overlay onto the right "actual".
export const EXPENSE_BUDGET_CATEGORIES = [
  "Warenkosten",
  "Personalkosten",
  "Marketing",
  "IT & Software",
  "Sonstige Op. Kosten",
] as const;
export type ExpenseBudgetCategory = (typeof EXPENSE_BUDGET_CATEGORIES)[number];

export function getBudget(view: ViewKey, period: string = activePeriod): BudgetRow[] {
  const i = resolveInput(view, period);
  const r = i.revenue;
  // Actuals are the real entered figures (bank bookings overlay later via
  // applyBookingsToBudget). The plan/target is a revenue-proportional benchmark
  // — deviations between plan and actual surface over/under-spend per category.
  return [
    { category: "Umsatzerlöse", budget: Math.round(r * 1.03), actual: r },
    { category: "Warenkosten", budget: Math.round(r * 0.58), actual: i.cogs },
    { category: "Personalkosten", budget: Math.round(r * 0.19), actual: i.personnel },
    { category: "Marketing", budget: Math.round(r * 0.05), actual: i.marketing },
    { category: "IT & Software", budget: Math.round(r * 0.03), actual: i.itSoftware },
    { category: "Sonstige Op. Kosten", budget: Math.round(r * 0.04), actual: i.otherOpex },
  ];
}

// Overlay booked bank-expense amounts (keyed by category) onto the budget rows'
// "actual" so confirmed bookings become visible in the finance budget view.
export function applyBookingsToBudget(
  rows: BudgetRow[],
  bookedByCategory: Record<string, number>,
): BudgetRow[] {
  return rows.map((row) => {
    const extra = bookedByCategory[row.category];
    return extra ? { ...row, actual: row.actual + extra } : row;
  });
}

export function getCashflow(view: ViewKey, period: string = activePeriod): CashflowBlock {
  const i = resolveInput(view, period);
  // Operating cashflow via the indirect method: net result + depreciation
  // (a non-cash expense). Investing/financing are entered directly.
  const operating = netProfitOf(i) + i.depreciation;
  const investing = i.cfInvesting;
  const financing = i.cfFinancing;
  const w = (v: number, idx: number) => Math.round((v * SEASON[idx]) / SEASON_SUM);
  return {
    operating,
    investing,
    financing,
    netChange: operating + investing + financing,
    series: MONTHS.map((month, idx) => ({
      month,
      operating: w(operating, idx),
      investing: w(investing, idx),
      financing: w(financing, idx),
    })),
  };
}

export function getLiquidity(view: ViewKey, period: string = activePeriod): LiquidityPoint[] {
  const f = getFinance(view, period);
  const base = f.cash;
  const weekly = (f.revenue / 52) * 0.05;
  return Array.from({ length: 13 }, (_, i) => {
    const w = i + 1;
    return {
      week: `KW ${w}`,
      best: Math.round(base + weekly * w * 1.4),
      realistic: Math.round(base + weekly * w * 0.6),
      worst: Math.round(base - weekly * w * 0.8),
    };
  });
}

export function getProfitLoss(view: ViewKey, period: string = activePeriod): PLRow[] {
  const i = resolveInput(view, period);
  const r = i.revenue;
  const cogs = i.cogs;
  const gross = r - cogs;
  const personnel = i.personnel;
  const other = i.marketing + i.itSoftware + i.otherOpex;
  const ebitda = gross - personnel - other;
  const depreciation = i.depreciation;
  const ebit = ebitda - depreciation;
  const interest = i.interest;
  const ebt = ebit - interest;
  const tax = i.tax;
  const net = ebt - tax;
  return [
    { label: "Umsatzerlöse", value: r, explain: "Gesamte Einnahmen aus Verkäufen und Leistungen.", bold: true },
    { label: "Warenkosten (COGS)", value: -cogs, explain: "Direkte Kosten der verkauften Produkte und Leistungen." },
    { label: "Bruttogewinn", value: gross, explain: "Umsatz minus direkte Warenkosten.", bold: true },
    { label: "Personalkosten", value: -personnel, explain: "Löhne, Gehälter und Sozialabgaben." },
    { label: "Sonstige betriebliche Kosten", value: -other, explain: "Miete, Marketing, IT und weitere laufende Kosten." },
    { label: "Operativer Gewinn (EBITDA)", value: ebitda, explain: "Ergebnis vor Zinsen, Steuern und Abschreibungen.", bold: true },
    { label: "Abschreibungen", value: -depreciation, explain: "Wertverlust von Anlagen und Maschinen über die Zeit." },
    { label: "EBIT", value: ebit, explain: "Operatives Ergebnis vor Zinsen und Steuern.", bold: true },
    { label: "Zinsaufwand", value: -interest, explain: "Kosten für Kredite und Finanzierungen." },
    { label: "Steuern", value: -tax, explain: "Ertragssteuern auf den Gewinn." },
    { label: "Nettoergebnis", value: net, explain: "Verbleibender Gewinn nach allen Kosten und Steuern.", bold: true },
  ];
}

export interface PLOverview {
  revenue: number;
  grossProfit: number;
  grossMargin: number;
  ebitda: number;
  ebitdaMargin: number;
  ebit: number;
  netProfit: number;
  netMargin: number;
  cogs: number;
  personnel: number;
  otherCosts: number;
  depreciation: number;
  interest: number;
  tax: number;
  series: { month: string; revenue: number; profit: number; costs: number; ebitda: number }[];
  costBreakdown: { name: string; value: number }[];
}

export function getPLOverview(view: ViewKey, period: string = activePeriod): PLOverview {
  const f = getFinance(view, period);
  const i = resolveInput(view, period);
  const r = i.revenue;
  const cogs = i.cogs;
  const gross = r - cogs;
  const personnel = i.personnel;
  const other = i.marketing + i.itSoftware + i.otherOpex;
  const ebitda = gross - personnel - other;
  const depreciation = i.depreciation;
  const ebit = ebitda - depreciation;
  const interest = i.interest;
  const ebt = ebit - interest;
  const tax = i.tax;
  const net = ebt - tax;
  const margin = (num: number) => (r ? (num / r) * 100 : 0);
  return {
    revenue: r,
    grossProfit: gross,
    grossMargin: margin(gross),
    ebitda,
    ebitdaMargin: margin(ebitda),
    ebit,
    netProfit: net,
    netMargin: margin(net),
    cogs,
    personnel,
    otherCosts: other,
    depreciation,
    interest,
    tax,
    series: f.series.map((m) => ({ month: m.month, revenue: m.revenue, profit: m.profit, costs: m.costs, ebitda: m.ebitda })),
    costBreakdown: [
      { name: "Warenkosten", value: cogs },
      { name: "Personal", value: personnel },
      { name: "Betriebskosten", value: other },
      { name: "Abschreibungen", value: depreciation },
      { name: "Zinsen & Steuern", value: interest + tax },
    ],
  };
}

export function getBalanceSheet(view: ViewKey): { assets: BalanceRow[]; liabilities: BalanceRow[] } {
  const f = getFinance(view);
  const r = f.revenue;
  return {
    assets: [
      { label: "Anlagevermögen", value: Math.round(r * 0.42), explain: "Langfristige Vermögenswerte wie Maschinen und Gebäude." },
      { label: "Vorräte", value: Math.round(r * 0.14), explain: "Lagerbestände an Waren und Materialien." },
      { label: "Forderungen", value: f.openInvoices, explain: "Offene Rechnungen von Kunden." },
      { label: "Liquide Mittel", value: f.cash, explain: "Verfügbares Bargeld und Bankguthaben." },
    ],
    liabilities: [
      { label: "Eigenkapital", value: Math.round(r * 0.38), explain: "Vermögen der Eigentümer im Unternehmen." },
      { label: "Langfristige Schulden", value: Math.round(r * 0.22), explain: "Kredite mit Laufzeit über einem Jahr." },
      { label: "Kurzfristige Schulden", value: Math.round(r * 0.18), explain: "Verbindlichkeiten innerhalb eines Jahres." },
      { label: "Verbindlichkeiten L&L", value: Math.round(r * 0.14), explain: "Offene Rechnungen an Lieferanten." },
    ],
  };
}

// Views that receive seeded, user-editable balance-sheet line items: the group
// view plus every curated entity. Entities created at runtime start with an
// empty balance sheet that the user fills in via the UI.
export const BALANCE_SEED_VIEWS: ViewKey[] = [groupViewKey(DEFAULT_GROUP_ID), ...ENTITY_CODES];

// Materialise the computed balance sheet for every seeded view into flat,
// mutable line items that live in the persisted store. Once seeded, totals are
// derived from these items, not recalculated from revenue.
export function buildBalanceSeed(): BalanceLineItem[] {
  const items: BalanceLineItem[] = [];
  let n = 0;
  for (const view of BALANCE_SEED_VIEWS) {
    const bs = getBalanceSheet(view);
    bs.assets.forEach((r) => items.push({ id: `BS-${++n}`, view, side: "asset", label: r.label, value: r.value, explain: r.explain }));
    bs.liabilities.forEach((r) => items.push({ id: `BS-${++n}`, view, side: "liability", label: r.label, value: r.value, explain: r.explain }));
  }
  return items;
}

export function getForecasts(view: ViewKey, period: string = activePeriod): ForecastSeries[] {
  const f = getFinance(view, period);
  // Headcount-based forecasts use the real employee counts of the covered firms.
  const headcount = entityCodesForView(view).reduce((sum, code) => {
    const e = registryEntities().find((x) => x.code === code);
    return sum + (e?.employees ?? 0);
  }, 0);
  const periods = ["Q1", "Q2", "Q3", "Q4"];
  const mk = (
    kind: ForecastSeries["kind"],
    unit: string,
    base: number,
    growth: number
  ): ForecastSeries => ({
    kind,
    unit,
    points: periods.map((period, i) => {
      const r = base * (1 + (growth * (i + 1)) / 4);
      return {
        period,
        best: Math.round(r * 1.12),
        realistic: Math.round(r),
        worst: Math.round(r * 0.86),
      };
    }),
  });
  const input = resolveInput(view, period);
  return [
    mk("Umsatz", "€", f.revenue / 4, 0.08),
    mk("Kosten", "€", (f.revenue - f.ebitda) / 4, 0.05),
    mk("Liquidität", "€", f.cash, 0.04),
    mk("Personalbedarf", "FTE", headcount, 0.06),
    mk("Einkauf", "€", input.cogs / 4, 0.07),
    mk("Inventarbedarf", "Stück", headcount, 0.05),
    mk("Investitionen", "€", Math.abs(input.cfInvesting) / 4, 0.03),
  ];
}
