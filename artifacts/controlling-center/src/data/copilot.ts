import { getBudget, getFinance } from "./finance";
import { PURCHASE_REQUESTS, UPLOADS } from "./operations";
import { RISKS, STRATEGY_DECISIONS } from "./governance";
import type { ViewKey } from "./types";

const fmt = (n: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export interface CopilotAnswer {
  question: string;
  answer: string;
}

export function getCopilotSuggestions(): string[] {
  return [
    "Warum steigen die Kosten?",
    "Welche Entität hat das höchste Risiko?",
    "Welche Kaufanfragen sind offen?",
    "Wo weichen Ist-Werte vom Budget ab?",
    "Welche Uploads fehlen oder sind fehlerhaft?",
    "Welche Strategieentscheidung braucht eine Überprüfung?",
    "Welche Risiken entstehen im nächsten Monat?",
    "Was bedeutet EBITDA?",
  ];
}

export function answerCopilot(question: string, view: ViewKey): string {
  const q = question.toLowerCase();
  const f = getFinance(view);

  if (q.includes("kosten") && (q.includes("steig") || q.includes("warum"))) {
    return `Für ${view} liegen die Kosten bei ${fmt(f.revenue - f.ebitda)}. Haupttreiber sind Warenkosten (~60% vom Umsatz) und gestiegene Rohstoffpreise. Die EBITDA-Marge beträgt aktuell ${f.ebitdaMargin.toFixed(1)}% (${f.marginChange >= 0 ? "+" : ""}${f.marginChange.toFixed(1)} Pp ggü. Vormonat).`;
  }
  if (q.includes("risiko") || q.includes("risk")) {
    if (q.includes("nächst") || q.includes("monat")) {
      const rising = RISKS.filter((r) => r.trend === "up");
      return `Im nächsten Monat steigende Risiken: ${rising.map((r) => `${r.title} (${r.entity})`).join(", ")}. Empfehlung: Lieferketten und Projektpuffer priorisieren.`;
    }
    const high = RISKS.filter((r) => r.impact === "Hoch" && r.status === "Offen");
    return `Höchstes Risiko trägt aktuell C&A (Projektverzug Hafencity, hohe Wahrscheinlichkeit und Wirkung). Offene Hochrisiken insgesamt: ${high.length}.`;
  }
  if (q.includes("kaufanfrage") || q.includes("einkauf") || q.includes("purchase")) {
    const open = PURCHASE_REQUESTS.filter((p) => ["Entwurf", "Eingereicht", "In Prüfung"].includes(p.status));
    return `Offene Kaufanfragen: ${open.length}. Beispiele: ${open.slice(0, 3).map((p) => `${p.id} ${p.title} (${fmt(p.amount)})`).join("; ")}.`;
  }
  if (q.includes("budget") || q.includes("abweich")) {
    const b = getBudget(view);
    const over = b.filter((r) => r.actual > r.budget);
    return `Budgetabweichungen für ${view}: ${over.map((r) => `${r.category} ${fmt(r.actual - r.budget)} über Plan`).join("; ") || "keine wesentlichen Überschreitungen"}.`;
  }
  if (q.includes("upload") || q.includes("fehl")) {
    const issues = UPLOADS.filter((u) => u.status === "Fehler" || u.status === "Neu");
    return `Zu prüfende Uploads: ${issues.map((u) => `${u.fileName} (${u.status})`).join(", ")}. Fehlerhafte Dateien blockieren die Verarbeitung des Monatsabschlusses.`;
  }
  if (q.includes("strategie") || q.includes("strategy")) {
    const due = STRATEGY_DECISIONS.filter((s) => s.evaluation === "Offen" || s.evaluation === "Verfehlt");
    return `Überprüfung nötig: ${due.map((s) => `${s.title} (${s.evaluation}, Review ${s.reviewDate})`).join("; ")}.`;
  }
  if (q.includes("gerät") || q.includes("device") || q.includes("zugewiesen")) {
    return `Geräte sind überwiegend Mitarbeitern in IMP und MKT zugewiesen. Offene Rückgaben: 1 (Sofia Martín – iPad Pro). Details im Modul Mitarbeiter & Geräte.`;
  }
  if (q.includes("ebitda")) {
    return `EBITDA steht für "Earnings Before Interest, Taxes, Depreciation and Amortization" – also das Ergebnis vor Zinsen, Steuern und Abschreibungen. Es zeigt die operative Ertragskraft. Für ${view}: ${fmt(f.ebitda)} (${f.ebitdaMargin.toFixed(1)}% Marge).`;
  }
  if (q.includes("umsatz") || q.includes("revenue")) {
    return `Umsatz für ${view}: ${fmt(f.revenue)} (${f.revenueChange >= 0 ? "+" : ""}${f.revenueChange.toFixed(1)}% ggü. Vormonat). Nettoergebnis: ${fmt(f.netProfit)}.`;
  }
  if (q.includes("liquid") || q.includes("cash")) {
    return `Liquidität für ${view}: ${fmt(f.cash)}, Cash Runway ${f.cashRunway.toFixed(1)} Monate. 13-Wochen-Forecast verfügbar im Dashboard.`;
  }
  return `Ich habe das auf Basis der Mock-Daten für ${view} geprüft. Stelle mir gern eine Frage zu Umsatz, Kosten, Liquidität, Risiken, Einkauf, Budgetabweichungen, Uploads oder Strategie.`;
}
