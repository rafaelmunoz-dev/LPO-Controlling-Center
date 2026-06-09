import type { EntityCode, EntityFinance, KpiMetric, KpiStatus, KpiTarget } from "./types";
import type { GlossaryKey } from "./glossary";

export interface KpiMetricMeta {
  metric: KpiMetric;
  unit: "€" | "%" | "months" | "count";
  direction: "higher" | "lower"; // which way is "good"
  glossary: GlossaryKey;
  labelKey: string; // i18n key for the metric's display name
  nav: string; // drill-down route
}

// Ordered list of targetable KPIs and how each maps onto the computed finance.
export const KPI_METRICS: KpiMetricMeta[] = [
  { metric: "revenue", unit: "€", direction: "higher", glossary: "umsatz", labelKey: "kpi_revenue", nav: "/finanzen" },
  { metric: "ebitda", unit: "€", direction: "higher", glossary: "ebitda", labelKey: "kpi_ebitda", nav: "/finanzen" },
  { metric: "ebitdaMargin", unit: "%", direction: "higher", glossary: "ebitda_marge", labelKey: "kpi_margin", nav: "/finanzen" },
  { metric: "netProfit", unit: "€", direction: "higher", glossary: "nettoergebnis", labelKey: "kpi_net", nav: "/finanzen" },
  { metric: "cash", unit: "€", direction: "higher", glossary: "liquiditaet", labelKey: "kpi_cash", nav: "/finanzen#prognosen" },
  { metric: "cashRunway", unit: "months", direction: "higher", glossary: "cash_runway", labelKey: "kpi_runway", nav: "/finanzen#prognosen" },
  { metric: "openInvoices", unit: "€", direction: "lower", glossary: "offene_rechnungen", labelKey: "kpi_open_invoices", nav: "/finanzen" },
];

export function kpiMeta(metric: KpiMetric): KpiMetricMeta {
  return KPI_METRICS.find((m) => m.metric === metric)!;
}

// Reads the current actual value of a metric from a computed finance snapshot.
export function kpiActual(f: EntityFinance, metric: KpiMetric): number {
  switch (metric) {
    case "revenue":
      return f.revenue;
    case "ebitda":
      return f.ebitda;
    case "ebitdaMargin":
      return f.ebitdaMargin;
    case "netProfit":
      return f.netProfit;
    case "cash":
      return f.cash;
    case "cashRunway":
      return f.cashRunway;
    case "openInvoices":
      return f.openInvoices;
  }
}

// Traffic-light status: green = target met, amber = within tolerance band,
// red = outside the band. Direction flips the comparison.
export function kpiStatus(
  actual: number,
  target: number,
  direction: "higher" | "lower",
  tolerance: number,
): KpiStatus {
  const tol = Math.max(0, tolerance) / 100;
  if (direction === "higher") {
    if (actual >= target) return "green";
    if (actual >= target * (1 - tol)) return "amber";
    return "red";
  }
  if (actual <= target) return "green";
  if (actual <= target * (1 + tol)) return "amber";
  return "red";
}

// Attainment as a percentage of target (capped for the progress bar at 150%).
export function kpiAttainment(actual: number, target: number, direction: "higher" | "lower"): number {
  if (target === 0) return actual === 0 ? 100 : direction === "higher" ? 150 : 0;
  const raw = direction === "higher" ? (actual / target) * 100 : (target / actual) * 100;
  if (!Number.isFinite(raw) || raw < 0) return 0;
  return Math.min(150, raw);
}

export function kpiTargetId(view: EntityCode, metric: KpiMetric): string {
  return `KPI-${view}-${metric}`;
}

export function emptyKpiTarget(view: EntityCode, metric: KpiMetric): Omit<KpiTarget, "id"> {
  return { view, metric, target: 0, tolerance: 10, note: "" };
}
