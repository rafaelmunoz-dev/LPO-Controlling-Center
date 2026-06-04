import type {
  BalanceRow,
  BudgetRow,
  CashflowBlock,
  EntityCode,
  EntityFinance,
  EntityMeta,
  ForecastSeries,
  IntercompanyRow,
  LiquidityPoint,
  MonthPoint,
  PLRow,
  RiskLevel,
  ViewKey,
} from "./types";

export const ENTITY_CODES: EntityCode[] = ["IMP", "C&A", "MKT", "CPE", "COSM"];

export const ENTITIES: EntityMeta[] = [
  { code: "IMP", name: "MiGu Import GmbH", description: "Import & Handel von Industriegütern", location: "Hamburg", employees: 84 },
  { code: "C&A", name: "MiGu Construction & Assembly", description: "Bau, Montage & technische Dienstleistungen", location: "Dortmund", employees: 142 },
  { code: "MKT", name: "MiGu Marketing AG", description: "Marketing, Werbung & Kreativdienste", location: "Berlin", employees: 46 },
  { code: "CPE", name: "MiGu Capital Equipment", description: "Maschinen, Anlagen & Vermietung", location: "München", employees: 67 },
  { code: "COSM", name: "MiGu Cosmetics GmbH", description: "Kosmetik & Konsumgüter", location: "Düsseldorf", employees: 53 },
];

interface EntityProfile {
  revenue: number;
  ebitdaMargin: number;
  netMargin: number;
  cash: number;
  cashRunway: number;
  openInvoices: number;
  openInvoicesCount: number;
  riskLevel: RiskLevel;
  revenueChange: number;
  ebitdaChange: number;
  marginChange: number;
  netChange: number;
  cashChange: number;
}

const PROFILES: Record<EntityCode, EntityProfile> = {
  IMP: { revenue: 42_000_000, ebitdaMargin: 0.12, netMargin: 0.055, cash: 6_200_000, cashRunway: 9.4, openInvoices: 3_120_000, openInvoicesCount: 64, riskLevel: "Mittel", revenueChange: 5.2, ebitdaChange: 3.1, marginChange: -0.4, netChange: 2.8, cashChange: -2.1 },
  "C&A": { revenue: 31_500_000, ebitdaMargin: 0.135, netMargin: 0.07, cash: 5_100_000, cashRunway: 11.2, openInvoices: 2_480_000, openInvoicesCount: 51, riskLevel: "Hoch", revenueChange: 8.4, ebitdaChange: 6.7, marginChange: 0.6, netChange: 5.9, cashChange: 3.4 },
  MKT: { revenue: 14_200_000, ebitdaMargin: 0.16, netMargin: 0.09, cash: 3_400_000, cashRunway: 14.8, openInvoices: 940_000, openInvoicesCount: 28, riskLevel: "Niedrig", revenueChange: 11.3, ebitdaChange: 9.8, marginChange: 1.1, netChange: 8.2, cashChange: 6.1 },
  CPE: { revenue: 22_750_000, ebitdaMargin: 0.15, netMargin: 0.065, cash: 5_300_000, cashRunway: 10.6, openInvoices: 1_870_000, openInvoicesCount: 39, riskLevel: "Mittel", revenueChange: 2.1, ebitdaChange: -1.4, marginChange: -0.9, netChange: -2.2, cashChange: 1.2 },
  COSM: { revenue: 18_000_000, ebitdaMargin: 0.21, netMargin: 0.12, cash: 4_300_000, cashRunway: 16.1, openInvoices: 760_000, openInvoicesCount: 22, riskLevel: "Niedrig", revenueChange: 14.7, ebitdaChange: 13.2, marginChange: 1.4, netChange: 12.5, cashChange: 8.9 },
};

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const SEASON = [0.82, 0.86, 0.95, 0.98, 1.02, 1.05, 0.99, 0.93, 1.04, 1.12, 1.15, 1.09];
const SEASON_SUM = SEASON.reduce((a, b) => a + b, 0);

function buildSeries(profile: EntityProfile): MonthPoint[] {
  return MONTHS.map((month, i) => {
    const revenue = Math.round((profile.revenue * SEASON[i]) / SEASON_SUM);
    const ebitda = Math.round(revenue * profile.ebitdaMargin);
    const profit = Math.round(revenue * profile.netMargin);
    const costs = revenue - ebitda;
    return { month, revenue, costs, ebitda, profit };
  });
}

function profileToFinance(view: ViewKey, p: EntityProfile): EntityFinance {
  return {
    view,
    revenue: p.revenue,
    ebitda: Math.round(p.revenue * p.ebitdaMargin),
    ebitdaMargin: p.ebitdaMargin * 100,
    netProfit: Math.round(p.revenue * p.netMargin),
    cash: p.cash,
    cashRunway: p.cashRunway,
    openInvoices: p.openInvoices,
    openInvoicesCount: p.openInvoicesCount,
    riskLevel: p.riskLevel,
    series: buildSeries(p),
    revenueChange: p.revenueChange,
    ebitdaChange: p.ebitdaChange,
    marginChange: p.marginChange,
    netChange: p.netChange,
    cashChange: p.cashChange,
  };
}

function groupProfile(): EntityProfile {
  const sum = (sel: (p: EntityProfile) => number) => ENTITY_CODES.reduce((a, c) => a + sel(PROFILES[c]), 0);
  const revenue = sum((p) => p.revenue);
  const ebitda = sum((p) => p.revenue * p.ebitdaMargin);
  const net = sum((p) => p.revenue * p.netMargin);
  const cash = sum((p) => p.cash);
  const wAvg = (sel: (p: EntityProfile) => number) => sum((p) => sel(p) * p.revenue) / revenue;
  return {
    revenue,
    ebitdaMargin: ebitda / revenue,
    netMargin: net / revenue,
    cash,
    cashRunway: 12.4,
    openInvoices: sum((p) => p.openInvoices),
    openInvoicesCount: sum((p) => p.openInvoicesCount),
    riskLevel: "Mittel",
    revenueChange: wAvg((p) => p.revenueChange),
    ebitdaChange: wAvg((p) => p.ebitdaChange),
    marginChange: wAvg((p) => p.marginChange),
    netChange: wAvg((p) => p.netChange),
    cashChange: wAvg((p) => p.cashChange),
  };
}

export function getFinance(view: ViewKey): EntityFinance {
  if (view === "MiGu Group Gesamt") return profileToFinance(view, groupProfile());
  return profileToFinance(view, PROFILES[view]);
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

export function getEntityComparison(): EntityComparisonRow[] {
  return ENTITIES.map((e) => {
    const p = PROFILES[e.code];
    const f = profileToFinance(e.code, p);
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

export function getBudget(view: ViewKey): BudgetRow[] {
  const f = getFinance(view);
  const r = f.revenue;
  return [
    { category: "Umsatzerlöse", budget: Math.round(r * 1.03), actual: r },
    { category: "Warenkosten", budget: Math.round(r * 0.58), actual: Math.round(r * 0.6) },
    { category: "Personalkosten", budget: Math.round(r * 0.19), actual: Math.round(r * 0.185) },
    { category: "Marketing", budget: Math.round(r * 0.05), actual: Math.round(r * 0.054) },
    { category: "IT & Software", budget: Math.round(r * 0.03), actual: Math.round(r * 0.029) },
    { category: "Sonstige Op. Kosten", budget: Math.round(r * 0.04), actual: Math.round(r * 0.043) },
  ];
}

export function getCashflow(view: ViewKey): CashflowBlock {
  const f = getFinance(view);
  const operating = Math.round(f.ebitda * 0.82);
  const investing = -Math.round(f.revenue * 0.06);
  const financing = -Math.round(f.revenue * 0.025);
  return {
    operating,
    investing,
    financing,
    netChange: operating + investing + financing,
    series: f.series.map((m) => ({
      month: m.month,
      operating: Math.round(m.ebitda * 0.82),
      investing: -Math.round(m.revenue * 0.06),
      financing: -Math.round(m.revenue * 0.025),
    })),
  };
}

export function getLiquidity(view: ViewKey): LiquidityPoint[] {
  const f = getFinance(view);
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

export function getProfitLoss(view: ViewKey): PLRow[] {
  const f = getFinance(view);
  const r = f.revenue;
  const cogs = Math.round(r * 0.6);
  const gross = r - cogs;
  const personnel = Math.round(r * 0.185);
  const other = Math.round(r * 0.115);
  const ebitda = gross - personnel - other;
  const depreciation = Math.round(r * 0.035);
  const ebit = ebitda - depreciation;
  const interest = Math.round(r * 0.012);
  const ebt = ebit - interest;
  const tax = Math.round(ebt * 0.28);
  const net = ebt - tax;
  return [
    { label: "Umsatzerlöse", value: r, explain: "Gesamte Einnahmen aus Verkäufen und Leistungen.", bold: true },
    { label: "Warenkosten (COGS)", value: -cogs, explain: "Direkte Kosten der verkauften Produkte und Leistungen." },
    { label: "Bruttogewinn", value: gross, explain: "Umsatz minus direkte Warenkosten.", bold: true },
    { label: "Personalkosten", value: -personnel, explain: "Löhne, Gehälter und Sozialabgaben." },
    { label: "Sonstige betriebliche Kosten", value: -other, explain: "Miete, Marketing, IT und weitere laufende Kosten." },
    { label: "EBITDA", value: ebitda, explain: "Ergebnis vor Zinsen, Steuern und Abschreibungen.", bold: true },
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

export function getPLOverview(view: ViewKey): PLOverview {
  const f = getFinance(view);
  const r = f.revenue;
  const cogs = Math.round(r * 0.6);
  const gross = r - cogs;
  const personnel = Math.round(r * 0.185);
  const other = Math.round(r * 0.115);
  const ebitda = gross - personnel - other;
  const depreciation = Math.round(r * 0.035);
  const ebit = ebitda - depreciation;
  const interest = Math.round(r * 0.012);
  const ebt = ebit - interest;
  const tax = Math.round(ebt * 0.28);
  const net = ebt - tax;
  return {
    revenue: r,
    grossProfit: gross,
    grossMargin: (gross / r) * 100,
    ebitda,
    ebitdaMargin: (ebitda / r) * 100,
    ebit,
    netProfit: net,
    netMargin: (net / r) * 100,
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

export const INTERCOMPANY: IntercompanyRow[] = [
  { from: "IMP", to: "C&A", description: "Materiallieferung Montageprojekte", amount: 1_240_000 },
  { from: "CPE", to: "C&A", description: "Maschinenvermietung Baustellen", amount: 880_000 },
  { from: "MKT", to: "COSM", description: "Kampagnen & Kreativleistungen", amount: 420_000 },
  { from: "MKT", to: "IMP", description: "Markenauftritt & Messen", amount: 310_000 },
  { from: "IMP", to: "COSM", description: "Rohstoffimport Verpackung", amount: 560_000 },
];

export function getForecasts(view: ViewKey): ForecastSeries[] {
  const f = getFinance(view);
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
  return [
    mk("Umsatz", "€", f.revenue / 4, 0.08),
    mk("Kosten", "€", (f.revenue - f.ebitda) / 4, 0.05),
    mk("Liquidität", "€", f.cash, 0.04),
    mk("Personalbedarf", "FTE", view === "MiGu Group Gesamt" ? 392 : 60, 0.06),
    mk("Einkauf", "€", (f.revenue * 0.6) / 4, 0.07),
    mk("Inventarbedarf", "Stück", view === "MiGu Group Gesamt" ? 240 : 48, 0.05),
    mk("Investitionen", "€", (f.revenue * 0.06) / 4, 0.03),
  ];
}
