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

export function getInsights(context: CopilotContext, view: ViewKey): Insight[] {
  const f = getFinance(view);
  switch (context) {
    case "finanzen": {
      const pl = getProfitLoss(view);
      const net = pl.find((r) => r.label === "Nettoergebnis")?.value ?? f.netProfit;
      const budget = getBudget(view);
      const over = budget.filter((b) => b.actual > b.budget);
      return [
        { title: "Ergebnislage", text: `Operative Marge (EBITDA) bei ${f.ebitdaMargin.toFixed(1)}% (${f.marginChange >= 0 ? "+" : ""}${f.marginChange.toFixed(1)} Pp). Nettoergebnis ${fmt(net)}.`, tone: f.marginChange >= 0 ? "positive" : "warning" },
        { title: "Budgetabweichung", text: over.length ? `${over.length} Kategorie(n) über Plan, v. a. ${over[0].category} (+${fmt(over[0].actual - over[0].budget)}).` : "Alle Kostenarten liegen im Budgetrahmen.", tone: over.length ? "warning" : "positive" },
      ];
    }
    case "einkauf": {
      const open = PURCHASE_REQUESTS.filter((p) => ["Entwurf", "Eingereicht", "In Prüfung"].includes(p.status));
      const volume = PURCHASE_REQUESTS.reduce((a, p) => a + p.amount, 0);
      return [
        { title: "Offene Anfragen", text: `${open.length} Kaufanfragen warten auf Bearbeitung (${fmt(open.reduce((a, p) => a + p.amount, 0))}).`, tone: open.length > 2 ? "warning" : "neutral" },
        { title: "Beschaffungsvolumen", text: `Gesamtvolumen aller Anfragen: ${fmt(volume)}.`, tone: "neutral" },
      ];
    }
    case "inventar": {
      const value = INVENTORY.reduce((a, i) => a + i.currentValue, 0);
      const repair = INVENTORY.filter((i) => i.status === "in Reparatur" || i.status === "verloren");
      const free = INVENTORY.filter((i) => i.status === "verfügbar");
      return [
        { title: "Inventarwert", text: `Aktueller Buchwert aller Geräte: ${fmt(value)}.`, tone: "neutral" },
        { title: "Handlungsbedarf", text: `${repair.length} Gerät(e) in Reparatur/verloren, ${free.length} verfügbar zur Zuweisung.`, tone: repair.length ? "warning" : "positive" },
      ];
    }
    case "risiko": {
      const high = RISKS.filter((r) => r.impact === "Hoch" && r.status !== "Geschlossen");
      const rising = RISKS.filter((r) => r.trend === "up");
      return [
        { title: "Hochrisiken", text: high.length ? `${high.length} offene Hochrisiken, u. a. „${high[0].title}" (${high[0].entity}).` : "Aktuell keine offenen Hochrisiken.", tone: high.length ? "warning" : "positive" },
        { title: "Trend", text: `${rising.length} Risiken mit steigender Tendenz im Blick behalten.`, tone: rising.length ? "warning" : "neutral" },
      ];
    }
    case "strategie": {
      const due = STRATEGY_DECISIONS.filter((s) => s.evaluation === "Offen" || s.evaluation === "Verfehlt");
      const top = STRATEGY_DECISIONS.find((s) => s.evaluation === "Übertroffen");
      return [
        { title: "Überprüfung fällig", text: due.length ? `${due.length} Entscheidung(en) brauchen ein Review, z. B. „${due[0].title}".` : "Alle Strategieentscheidungen sind aktuell bewertet.", tone: due.length ? "warning" : "positive" },
        { title: "Erfolg", text: top ? `„${top.title}" übertrifft den Plan (${top.actualKpi}).` : "Noch keine übertroffenen Ziele.", tone: "positive" },
      ];
    }
    case "prognosen":
      return [
        { title: "Wachstumspfad", text: `Realistisches Szenario unterstellt moderates Wachstum auf Basis von ${fmt(f.revenue)} Jahresumsatz.`, tone: "neutral" },
        { title: "Risikospanne", text: "Best- und Worst-Case zeigen die Bandbreite — Liquiditätsplanung am Worst-Case ausrichten.", tone: "warning" },
      ];
    case "freigaben":
      return [
        { title: "Engpass", text: "Freigaben über 50.000 € erfordern eine zweite Prüfinstanz — auf offene Posten achten.", tone: "warning" },
      ];
    case "dashboard":
    default:
      return [
        { title: "Gesamtbild", text: `Umsatz ${fmt(f.revenue)} (${f.revenueChange >= 0 ? "+" : ""}${f.revenueChange.toFixed(1)}%), Operative Marge (EBITDA) ${f.ebitdaMargin.toFixed(1)}%, Liquidität ${fmt(f.cash)}.`, tone: f.revenueChange >= 0 ? "positive" : "warning" },
        { title: "Aufmerksamkeit", text: `Cash Runway ${f.cashRunway.toFixed(1)} Monate. Offene Rechnungen ${fmt(f.openInvoices)} (${f.openInvoicesCount} Stück).`, tone: f.cashRunway < 10 ? "warning" : "neutral" },
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
