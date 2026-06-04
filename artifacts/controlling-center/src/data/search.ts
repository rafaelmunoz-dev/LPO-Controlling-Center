import { INVENTORY, PURCHASE_REQUESTS, SUPPLIERS, EMPLOYEES } from "./operations";
import { RISKS, STRATEGY_DECISIONS, REPORTS } from "./governance";
import { ENTITIES } from "./finance";
import type { EntityMeta } from "./types";

export type SearchResultType = "Modul" | "Inventar" | "Einkauf" | "Lieferant" | "Mitarbeiter" | "Risiko" | "Strategie" | "Entität" | "Report";

export interface SearchResult {
  type: SearchResultType;
  label: string;
  sub: string;
  href: string;
}

export interface ModuleEntry {
  labelKey: string;
  href: string;
  keywords: string;
}

export const SEARCH_MODULES: ModuleEntry[] = [
  { labelKey: "dashboard", href: "/", keywords: "dashboard übersicht overview start home kpi" },
  { labelKey: "finanzen", href: "/finanzen", keywords: "finanzen finance gewinn verlust guv bilanz cashflow budget ergebnis konsolidierung intercompany p&l" },
  { labelKey: "entitaeten", href: "/entitaeten", keywords: "entitäten entities konzern gruppe group struktur" },
  { labelKey: "einkauf", href: "/einkauf", keywords: "einkauf purchasing beschaffung lieferant kaufanfrage compras" },
  { labelKey: "inventar", href: "/inventar", keywords: "inventar inventory bestand geräte inventur stocktaking etiketten" },
  { labelKey: "mitarbeiter_geraete", href: "/mitarbeiter", keywords: "mitarbeiter geräte employees devices zuweisung personal" },
  { labelKey: "freigaben", href: "/freigaben", keywords: "freigaben approvals genehmigung review" },
  { labelKey: "prognosen", href: "/prognosen", keywords: "prognosen forecast szenario planung" },
  { labelKey: "risiko_premortem", href: "/risiko", keywords: "risiko risk pre-mortem premortem gefahr matrix" },
  { labelKey: "strategie", href: "/strategie", keywords: "strategie strategy entscheidung bewertung" },
  { labelKey: "reports", href: "/reports", keywords: "reports berichte export pdf excel csv" },
  { labelKey: "einstellungen", href: "/einstellungen", keywords: "einstellungen settings benutzer rollen microsoft sprache design sicherheit" },
];

export function searchAll(query: string, tModule: (k: string) => string, entities: EntityMeta[] = ENTITIES): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: SearchResult[] = [];

  for (const m of SEARCH_MODULES) {
    const label = tModule(m.labelKey);
    if (label.toLowerCase().includes(q) || m.keywords.includes(q)) {
      out.push({ type: "Modul", label, sub: m.href, href: m.href });
    }
  }
  for (const i of INVENTORY) {
    if (`${i.name} ${i.inventoryNumber} ${i.assignedTo} ${i.category}`.toLowerCase().includes(q))
      out.push({ type: "Inventar", label: i.name, sub: `${i.inventoryNumber} · ${i.entity}`, href: "/inventar" });
  }
  for (const p of PURCHASE_REQUESTS) {
    if (`${p.id} ${p.title} ${p.supplier}`.toLowerCase().includes(q))
      out.push({ type: "Einkauf", label: p.title, sub: `${p.id} · ${p.entity}`, href: "/einkauf" });
  }
  for (const s of SUPPLIERS) {
    if (`${s.name} ${s.category} ${s.country}`.toLowerCase().includes(q))
      out.push({ type: "Lieferant", label: s.name, sub: s.category, href: "/einkauf" });
  }
  for (const e of EMPLOYEES) {
    if (`${e.name} ${e.department} ${e.position}`.toLowerCase().includes(q))
      out.push({ type: "Mitarbeiter", label: e.name, sub: `${e.position} · ${e.entity}`, href: "/mitarbeiter" });
  }
  for (const r of RISKS) {
    if (`${r.title} ${r.owner}`.toLowerCase().includes(q))
      out.push({ type: "Risiko", label: r.title, sub: `${r.entity} · ${r.owner}`, href: "/risiko" });
  }
  for (const s of STRATEGY_DECISIONS) {
    if (`${s.title} ${s.goal}`.toLowerCase().includes(q))
      out.push({ type: "Strategie", label: s.title, sub: s.entity, href: "/strategie" });
  }
  for (const e of entities) {
    if (`${e.code} ${e.name} ${e.location}`.toLowerCase().includes(q))
      out.push({ type: "Entität", label: `${e.code} – ${e.name}`, sub: e.location, href: "/entitaeten" });
  }
  for (const r of REPORTS) {
    if (`${r.title} ${r.type}`.toLowerCase().includes(q))
      out.push({ type: "Report", label: r.title, sub: r.type, href: "/reports" });
  }
  return out.slice(0, 12);
}
