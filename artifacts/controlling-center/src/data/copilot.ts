import type { TFunction } from "i18next";
import { getBudget, getFinance, getProfitLoss } from "./finance";
import { PURCHASE_REQUESTS, UPLOADS, INVENTORY } from "./operations";
import { RISKS, STRATEGY_DECISIONS } from "./governance";
import type { ViewKey } from "./types";

const fmt = (n: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export interface CopilotAnswer {
  question: string;
  answer: string;
}

export type CopilotContext =
  | "dashboard"
  | "finanzen"
  | "einkauf"
  | "inventar"
  | "mitarbeiter"
  | "freigaben"
  | "prognosen"
  | "risiko"
  | "strategie"
  | "entitaeten"
  | "reports"
  | "global";

export type InsightTone = "positive" | "warning" | "neutral";
export interface Insight {
  title: string;
  text: string;
  tone: InsightTone;
}

const baseSuggestions = [
  "Warum steigen die Kosten?",
  "Welche Entität hat das höchste Risiko?",
  "Welche Kaufanfragen sind offen?",
  "Wo weichen Ist-Werte vom Budget ab?",
  "Welche Uploads fehlen oder sind fehlerhaft?",
  "Was bedeutet Operativer Gewinn (EBITDA)?",
];

const contextSuggestions: Partial<Record<CopilotContext, string[]>> = {
  finanzen: ["Wie hat sich die Marge entwickelt?", "Wo weichen Ist-Werte vom Budget ab?", "Was bedeutet Operativer Gewinn (EBITDA)?", "Wie steht die Liquidität?"],
  einkauf: ["Welche Kaufanfragen sind offen?", "Welcher Lieferant ist am teuersten?", "Welche Anfragen brauchen Freigabe?"],
  inventar: ["Welche Geräte sind nicht zugewiesen?", "Wie hoch ist der Inventarwert?", "Welche Geräte sind in Reparatur?"],
  risiko: ["Welche Risiken entstehen im nächsten Monat?", "Welche Entität hat das höchste Risiko?", "Welche Risiken sind offen?"],
  prognosen: ["Wie entwickelt sich der Umsatz?", "Wie sieht der Worst Case aus?"],
  strategie: ["Welche Strategieentscheidung braucht eine Überprüfung?", "Welche Initiative übertrifft den Plan?"],
  freigaben: ["Welche Freigaben sind offen?", "Welche Beträge warten auf Genehmigung?"],
};

export function getCopilotSuggestions(context: CopilotContext = "global"): string[] {
  return contextSuggestions[context] ?? baseSuggestions;
}

export function getInsights(context: CopilotContext, view: ViewKey, t: TFunction): Insight[] {
  const f = getFinance(view);
  const signed = (n: number, suffix = "") => `${n >= 0 ? "+" : ""}${n.toFixed(1)}${suffix}`;
  switch (context) {
    case "finanzen": {
      const pl = getProfitLoss(view);
      const net = pl.find((r) => r.label === "Nettoergebnis")?.value ?? f.netProfit;
      const budget = getBudget(view);
      const over = budget.filter((b) => b.actual > b.budget);
      return [
        { title: t("insight_finance_result_title"), text: t("insight_finance_result_text", { margin: f.ebitdaMargin.toFixed(1), marginChange: signed(f.marginChange), net: fmt(net) }), tone: f.marginChange >= 0 ? "positive" : "warning" },
        { title: t("insight_budget_title"), text: over.length ? t("insight_budget_over", { n: over.length, category: over[0].category, amount: fmt(over[0].actual - over[0].budget) }) : t("insight_budget_ok"), tone: over.length ? "warning" : "positive" },
      ];
    }
    case "einkauf": {
      const open = PURCHASE_REQUESTS.filter((p) => ["Entwurf", "Eingereicht", "In Prüfung"].includes(p.status));
      const volume = PURCHASE_REQUESTS.reduce((a, p) => a + p.amount, 0);
      return [
        { title: t("insight_open_requests_title"), text: t("insight_open_requests_text", { n: open.length, amount: fmt(open.reduce((a, p) => a + p.amount, 0)) }), tone: open.length > 2 ? "warning" : "neutral" },
        { title: t("insight_procurement_volume_title"), text: t("insight_procurement_volume_text", { amount: fmt(volume) }), tone: "neutral" },
      ];
    }
    case "inventar": {
      const value = INVENTORY.reduce((a, i) => a + i.currentValue, 0);
      const repair = INVENTORY.filter((i) => i.status === "in Reparatur" || i.status === "verloren");
      const free = INVENTORY.filter((i) => i.status === "verfügbar");
      return [
        { title: t("insight_inventory_value_title"), text: t("insight_inventory_value_text", { amount: fmt(value) }), tone: "neutral" },
        { title: t("insight_inventory_action_title"), text: t("insight_inventory_action_text", { repair: repair.length, free: free.length }), tone: repair.length ? "warning" : "positive" },
      ];
    }
    case "risiko": {
      const high = RISKS.filter((r) => r.impact === "Hoch" && r.status !== "Geschlossen");
      const rising = RISKS.filter((r) => r.trend === "up");
      return [
        { title: t("insight_high_risk_title"), text: high.length ? t("insight_high_risk_some", { n: high.length, title: high[0].title, entity: high[0].entity }) : t("insight_high_risk_none"), tone: high.length ? "warning" : "positive" },
        { title: t("insight_trend_title"), text: t("insight_trend_text", { n: rising.length }), tone: rising.length ? "warning" : "neutral" },
      ];
    }
    case "strategie": {
      const due = STRATEGY_DECISIONS.filter((s) => s.evaluation === "Offen" || s.evaluation === "Verfehlt");
      const top = STRATEGY_DECISIONS.find((s) => s.evaluation === "Übertroffen");
      return [
        { title: t("insight_review_title"), text: due.length ? t("insight_review_some", { n: due.length, title: due[0].title }) : t("insight_review_none"), tone: due.length ? "warning" : "positive" },
        { title: t("insight_success_title"), text: top ? t("insight_success_some", { title: top.title, kpi: top.actualKpi }) : t("insight_success_none"), tone: "positive" },
      ];
    }
    case "prognosen":
      return [
        { title: t("insight_growth_title"), text: t("insight_growth_text", { amount: fmt(f.revenue) }), tone: "neutral" },
        { title: t("insight_risk_range_title"), text: t("insight_risk_range_text"), tone: "warning" },
      ];
    case "freigaben":
      return [
        { title: t("insight_bottleneck_title"), text: t("insight_bottleneck_text"), tone: "warning" },
      ];
    case "dashboard":
    default:
      return [
        { title: t("insight_overview_title"), text: t("insight_overview_text", { revenue: fmt(f.revenue), revenueChange: signed(f.revenueChange, "%"), margin: f.ebitdaMargin.toFixed(1), cash: fmt(f.cash) }), tone: f.revenueChange >= 0 ? "positive" : "warning" },
        { title: t("insight_attention_title"), text: t("insight_attention_text", { runway: f.cashRunway.toFixed(1), invoices: fmt(f.openInvoices), n: f.openInvoicesCount }), tone: f.cashRunway < 10 ? "warning" : "neutral" },
      ];
  }
}

// Build a compact, structured snapshot of the data the user is currently
// looking at. This is sent to the LLM as grounding context so the assistant
// reasons over the real figures for the selected view/page instead of guessing.
export function buildCopilotContext(view: ViewKey, context: CopilotContext): string {
  const f = getFinance(view);
  const lines: string[] = [];

  lines.push(`Selected view: ${view}`);
  lines.push(`Active page: ${context}`);
  lines.push("");
  lines.push("Financial KPIs (current view):");
  lines.push(`- Revenue: ${fmt(f.revenue)} (${f.revenueChange >= 0 ? "+" : ""}${f.revenueChange.toFixed(1)}% vs. prior month)`);
  lines.push(`- EBITDA: ${fmt(f.ebitda)} (margin ${f.ebitdaMargin.toFixed(1)}%, ${f.marginChange >= 0 ? "+" : ""}${f.marginChange.toFixed(1)} pp)`);
  lines.push(`- Net profit: ${fmt(f.netProfit)} (${f.netChange >= 0 ? "+" : ""}${f.netChange.toFixed(1)}%)`);
  lines.push(`- Cash: ${fmt(f.cash)} (runway ${f.cashRunway.toFixed(1)} months)`);
  lines.push(`- Open invoices: ${fmt(f.openInvoices)} across ${f.openInvoicesCount} items`);
  lines.push(`- Overall risk level: ${f.riskLevel}`);

  const addBudget = () => {
    const b = getBudget(view);
    const over = b.filter((r) => r.actual > r.budget && r.category !== "Umsatzerlöse");
    lines.push("");
    lines.push("Budget vs. actual (over-plan categories):");
    if (over.length === 0) lines.push("- All cost categories are within budget.");
    else over.forEach((r) => lines.push(`- ${r.category}: actual ${fmt(r.actual)} vs. budget ${fmt(r.budget)} (+${fmt(r.actual - r.budget)})`));
  };

  const addPL = () => {
    const pl = getProfitLoss(view);
    lines.push("");
    lines.push("Profit & loss statement:");
    pl.forEach((r) => lines.push(`- ${r.label}: ${fmt(r.value)}`));
  };

  const addPurchases = () => {
    const open = PURCHASE_REQUESTS.filter((p) => ["Entwurf", "Eingereicht", "In Prüfung"].includes(p.status));
    lines.push("");
    lines.push(`Purchase requests (${PURCHASE_REQUESTS.length} total, ${open.length} open):`);
    PURCHASE_REQUESTS.forEach((p) => lines.push(`- ${p.id} ${p.title} · ${p.supplier} · ${fmt(p.amount)} · ${p.entity} · status ${p.status}`));
  };

  const addInventory = () => {
    const value = INVENTORY.reduce((a, i) => a + i.currentValue, 0);
    const free = INVENTORY.filter((i) => i.status === "verfügbar").length;
    const repair = INVENTORY.filter((i) => i.status === "in Reparatur" || i.status === "verloren").length;
    lines.push("");
    lines.push(`Inventory: ${INVENTORY.length} devices, book value ${fmt(value)}, ${free} available, ${repair} in repair/lost.`);
  };

  const addRisks = () => {
    lines.push("");
    lines.push(`Risks (${RISKS.length} total):`);
    RISKS.forEach((r) => lines.push(`- ${r.title} · ${r.entity} · impact ${r.impact} · probability ${r.probability} · trend ${r.trend} · status ${r.status}`));
  };

  const addStrategy = () => {
    lines.push("");
    lines.push("Strategy decisions:");
    STRATEGY_DECISIONS.forEach((s) => lines.push(`- ${s.title} · evaluation ${s.evaluation} · review ${s.reviewDate} · KPI ${s.actualKpi}`));
  };

  const addUploads = () => {
    const issues = UPLOADS.filter((u) => u.status === "Fehler" || u.status === "Neu" || u.status === "In Prüfung");
    lines.push("");
    lines.push(`Uploads needing attention (${issues.length}):`);
    issues.forEach((u) => lines.push(`- ${u.fileName} · ${u.entity} · ${u.period} · status ${u.status}${u.note ? ` · ${u.note}` : ""}`));
  };

  switch (context) {
    case "finanzen":
      addPL();
      addBudget();
      break;
    case "einkauf":
    case "freigaben":
      addPurchases();
      break;
    case "inventar":
      addInventory();
      break;
    case "risiko":
      addRisks();
      break;
    case "strategie":
      addStrategy();
      break;
    case "reports":
      addPL();
      addBudget();
      addRisks();
      break;
    case "dashboard":
      addBudget();
      addRisks();
      break;
    default:
      addBudget();
      break;
  }
  addUploads();

  return lines.join("\n");
}
