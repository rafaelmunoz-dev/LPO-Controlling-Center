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
  "Was bedeutet EBITDA?",
];

const contextSuggestions: Partial<Record<CopilotContext, string[]>> = {
  finanzen: ["Wie hat sich die Marge entwickelt?", "Wo weichen Ist-Werte vom Budget ab?", "Was bedeutet EBITDA?", "Wie steht die Liquidität?"],
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
        { title: "Ergebnislage", text: `EBITDA-Marge bei ${f.ebitdaMargin.toFixed(1)}% (${f.marginChange >= 0 ? "+" : ""}${f.marginChange.toFixed(1)} Pp). Nettoergebnis ${fmt(net)}.`, tone: f.marginChange >= 0 ? "positive" : "warning" },
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
        { title: "Gesamtbild", text: `Umsatz ${fmt(f.revenue)} (${f.revenueChange >= 0 ? "+" : ""}${f.revenueChange.toFixed(1)}%), EBITDA-Marge ${f.ebitdaMargin.toFixed(1)}%, Liquidität ${fmt(f.cash)}.`, tone: f.revenueChange >= 0 ? "positive" : "warning" },
        { title: "Aufmerksamkeit", text: `Cash Runway ${f.cashRunway.toFixed(1)} Monate. Offene Rechnungen ${fmt(f.openInvoices)} (${f.openInvoicesCount} Stück).`, tone: f.cashRunway < 10 ? "warning" : "neutral" },
      ];
  }
}

export function answerCopilot(question: string, view: ViewKey): string {
  const q = question.toLowerCase();
  const f = getFinance(view);

  if (q.includes("kosten") && (q.includes("steig") || q.includes("warum"))) {
    return `Für ${view} liegen die Kosten bei ${fmt(f.revenue - f.ebitda)}. Haupttreiber sind Warenkosten (~60% vom Umsatz) und gestiegene Rohstoffpreise. Die EBITDA-Marge beträgt aktuell ${f.ebitdaMargin.toFixed(1)}% (${f.marginChange >= 0 ? "+" : ""}${f.marginChange.toFixed(1)} Pp ggü. Vormonat).`;
  }
  if (q.includes("marge") || q.includes("margin")) {
    return `Die EBITDA-Marge für ${view} liegt bei ${f.ebitdaMargin.toFixed(1)}% (${f.marginChange >= 0 ? "+" : ""}${f.marginChange.toFixed(1)} Pp ggü. Vormonat). Sie zeigt, wie viel operativer Gewinn aus jedem Euro Umsatz übrig bleibt.`;
  }
  if (q.includes("risiko") || q.includes("risk")) {
    if (q.includes("nächst") || q.includes("monat")) {
      const rising = RISKS.filter((r) => r.trend === "up");
      return `Im nächsten Monat steigende Risiken: ${rising.map((r) => `${r.title} (${r.entity})`).join(", ")}. Empfehlung: Lieferketten und Projektpuffer priorisieren.`;
    }
    const high = RISKS.filter((r) => r.impact === "Hoch" && r.status === "Offen");
    return `Höchstes Risiko trägt aktuell C&A (Projektverzug Hafencity, hohe Wahrscheinlichkeit und Wirkung). Offene Hochrisiken insgesamt: ${high.length}.`;
  }
  if (q.includes("kaufanfrage") || q.includes("einkauf") || q.includes("purchase") || q.includes("lieferant")) {
    const open = PURCHASE_REQUESTS.filter((p) => ["Entwurf", "Eingereicht", "In Prüfung"].includes(p.status));
    return `Offene Kaufanfragen: ${open.length}. Beispiele: ${open.slice(0, 3).map((p) => `${p.id} ${p.title} (${fmt(p.amount)})`).join("; ")}.`;
  }
  if (q.includes("budget") || q.includes("abweich")) {
    const b = getBudget(view);
    const over = b.filter((r) => r.actual > r.budget);
    return `Budgetabweichungen für ${view}: ${over.map((r) => `${r.category} ${fmt(r.actual - r.budget)} über Plan`).join("; ") || "keine wesentlichen Überschreitungen"}.`;
  }
  if (q.includes("upload") || q.includes("datei")) {
    const issues = UPLOADS.filter((u) => u.status === "Fehler" || u.status === "Neu");
    return `Zu prüfende Uploads: ${issues.map((u) => `${u.fileName} (${u.status})`).join(", ")}. Fehlerhafte Dateien blockieren die Verarbeitung des Monatsabschlusses.`;
  }
  if (q.includes("strategie") || q.includes("strategy")) {
    const due = STRATEGY_DECISIONS.filter((s) => s.evaluation === "Offen" || s.evaluation === "Verfehlt");
    return `Überprüfung nötig: ${due.map((s) => `${s.title} (${s.evaluation}, Review ${s.reviewDate})`).join("; ")}.`;
  }
  if (q.includes("inventar") || q.includes("gerät") || q.includes("device") || q.includes("zugewiesen")) {
    const value = INVENTORY.reduce((a, i) => a + i.currentValue, 0);
    const free = INVENTORY.filter((i) => i.status === "verfügbar").length;
    return `Inventarwert aktuell ${fmt(value)}. Verfügbar zur Zuweisung: ${free} Geräte. Offene Rückgaben: 1 (Sofia Martín – iPad Pro).`;
  }
  if (q.includes("ebitda")) {
    return `EBITDA steht für „Earnings Before Interest, Taxes, Depreciation and Amortization" – also das Ergebnis vor Zinsen, Steuern und Abschreibungen. Es zeigt die operative Ertragskraft. Für ${view}: ${fmt(f.ebitda)} (${f.ebitdaMargin.toFixed(1)}% Marge).`;
  }
  if (q.includes("umsatz") || q.includes("revenue")) {
    return `Umsatz für ${view}: ${fmt(f.revenue)} (${f.revenueChange >= 0 ? "+" : ""}${f.revenueChange.toFixed(1)}% ggü. Vormonat). Nettoergebnis: ${fmt(f.netProfit)}.`;
  }
  if (q.includes("liquid") || q.includes("cash")) {
    return `Liquidität für ${view}: ${fmt(f.cash)}, Cash Runway ${f.cashRunway.toFixed(1)} Monate. 13-Wochen-Forecast verfügbar in den Finanzen.`;
  }
  return `Ich habe das auf Basis der aktuellen Daten für ${view} geprüft. Stelle mir gern eine Frage zu Umsatz, Kosten, Marge, Liquidität, Risiken, Einkauf, Budgetabweichungen, Inventar oder Strategie.`;
}
