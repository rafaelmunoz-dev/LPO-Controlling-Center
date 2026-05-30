import type {
  EntityCode,
  PreMortem,
  ReportDef,
  Risk,
  Role,
  StrategyDecision,
} from "./types";

export const RISKS: Risk[] = [
  { id: "R-1", title: "Lieferkettenverzögerung Asien", entity: "IMP", impact: "Hoch", probability: "Mittel", owner: "Daniel Weber", status: "Offen", trend: "up" },
  { id: "R-2", title: "Projektverzug Hafencity", entity: "C&A", impact: "Hoch", probability: "Hoch", owner: "Lucas Braun", status: "Offen", trend: "up" },
  { id: "R-3", title: "Fachkräftemangel Montage", entity: "C&A", impact: "Mittel", probability: "Hoch", owner: "Lucas Braun", status: "In Beobachtung", trend: "flat" },
  { id: "R-4", title: "Wechselkursrisiko USD", entity: "IMP", impact: "Mittel", probability: "Mittel", owner: "Maria Keller", status: "In Beobachtung", trend: "down" },
  { id: "R-5", title: "Kampagnen-ROI unter Plan", entity: "MKT", impact: "Niedrig", probability: "Mittel", owner: "Maria Keller", status: "Offen", trend: "flat" },
  { id: "R-6", title: "Maschinenausfall Linie 2", entity: "CPE", impact: "Hoch", probability: "Niedrig", owner: "Sofia Martín", status: "In Beobachtung", trend: "down" },
  { id: "R-7", title: "Rohstoffpreissteigerung", entity: "COSM", impact: "Mittel", probability: "Mittel", owner: "Sofia Martín", status: "Offen", trend: "up" },
  { id: "R-8", title: "Abhängigkeit Einzellieferant", entity: "COSM", impact: "Mittel", probability: "Niedrig", owner: "Sofia Martín", status: "Geschlossen", trend: "down" },
];

export const PREMORTEMS: PreMortem[] = [
  {
    id: "PM-1",
    project: "Markteintritt Österreich",
    entity: "COSM",
    goal: "Umsatzwachstum 1,2 Mio € im ersten Jahr",
    expectedBenefit: "Neue Region, Diversifikation des Absatzes",
    assumptions: "Vergleichbares Konsumverhalten, vorhandene Logistik nutzbar",
    whatCouldGoWrong: "Regulatorische Hürden, langsamer Markenaufbau, höhere Marketingkosten",
    mostLikelyRisk: "Markenbekanntheit baut sich langsamer auf als geplant",
    mostDangerousRisk: "Regulatorische Zulassung verzögert sich um >6 Monate",
    earlyWarnings: "Niedrige Conversion in Testkampagnen, ausbleibende Handelslistung",
    countermeasures: "Lokaler Vertriebspartner, gestaffeltes Marketingbudget, Pilot-Region",
    owner: "Clara Hoffmann",
    reviewDate: "2026-09-30",
  },
  {
    id: "PM-2",
    project: "Automatisierung Produktionslinie 2",
    entity: "CPE",
    goal: "Stückkosten um 14% senken",
    expectedBenefit: "Höhere Marge, geringere Fehlerquote",
    assumptions: "Stabile Auslastung, Personal umschulbar",
    whatCouldGoWrong: "Integrationsprobleme, längere Stillstandzeiten, Mehrkosten",
    mostLikelyRisk: "Einführungsphase dauert länger und senkt kurzfristig Output",
    mostDangerousRisk: "Anlage erreicht geplante Taktung nicht",
    earlyWarnings: "Häufige Stopps in Testbetrieb, steigende Ausschussrate",
    countermeasures: "Stufenweise Inbetriebnahme, Lieferantengarantie, Pufferlager",
    owner: "Sofia Martín",
    reviewDate: "2026-08-15",
  },
];

export const STRATEGY_DECISIONS: StrategyDecision[] = [
  { id: "SD-1", title: "Direktvertrieb Online IMP", entity: "IMP", goal: "Margenstärkung durch Direktkanal", expectedEffect: "+2,5 Pp Marge", budget: 180000, risk: "Mittel", owner: "Daniel Weber", startDate: "2025-10-01", reviewDate: "2026-06-30", expectedKpi: "Online-Anteil 15%", actualKpi: "Online-Anteil 11%", evaluation: "Offen", learnings: "Logistik-Setup unterschätzt." },
  { id: "SD-2", title: "Premium-Linie COSM", entity: "COSM", goal: "Höherwertige Positionierung", expectedEffect: "+4 Pp Marge", budget: 240000, risk: "Mittel", owner: "Clara Hoffmann", startDate: "2025-04-01", reviewDate: "2026-04-30", expectedKpi: "Premium-Umsatz 3 Mio €", actualKpi: "Premium-Umsatz 3,4 Mio €", evaluation: "Übertroffen", learnings: "Starke Nachfrage, Kapazität ausbauen." },
  { id: "SD-3", title: "Flottenmodernisierung CPE", entity: "CPE", goal: "Wartungskosten senken", expectedEffect: "-12% Wartung", budget: 134000, risk: "Niedrig", owner: "Sofia Martín", startDate: "2025-07-01", reviewDate: "2026-07-31", expectedKpi: "Ausfallzeit -20%", actualKpi: "Ausfallzeit -8%", evaluation: "Verfehlt", learnings: "Leasing statt Kauf prüfen." },
  { id: "SD-4", title: "Brand Relaunch MKT", entity: "MKT", goal: "Markenwahrnehmung steigern", expectedEffect: "+18% Reichweite", budget: 95000, risk: "Niedrig", owner: "Maria Keller", startDate: "2025-11-01", reviewDate: "2026-05-31", expectedKpi: "Reichweite +18%", actualKpi: "Reichweite +17%", evaluation: "Erfüllt", learnings: "Kanalmix funktioniert." },
];

export const REPORTS: ReportDef[] = [
  { id: "RP-1", title: "Monatsbericht", description: "Vollständige Finanzübersicht des Monats inkl. GuV und Cashflow.", period: "Monatlich", type: "Finanzen" },
  { id: "RP-2", title: "Quartalsbericht", description: "Quartalsentwicklung mit Budgetabgleich und Forecast.", period: "Quartalsweise", type: "Finanzen" },
  { id: "RP-3", title: "Jahresbericht", description: "Geschäftsjahr im Überblick mit Konsolidierung.", period: "Jährlich", type: "Finanzen" },
  { id: "RP-4", title: "Entitätsbericht", description: "Detailauswertung je MiGu-Entität.", period: "Auf Abruf", type: "Entitäten" },
  { id: "RP-5", title: "Einkaufsbericht", description: "Beschaffungsvolumen, Lieferanten und offene Anträge.", period: "Monatlich", type: "Einkauf" },
  { id: "RP-6", title: "Inventarbericht", description: "Bestand, Wertentwicklung und Zuweisungen.", period: "Quartalsweise", type: "Inventar" },
  { id: "RP-7", title: "Risikobericht", description: "Risikoregister, Bewertung und Maßnahmen.", period: "Monatlich", type: "Risiko" },
  { id: "RP-8", title: "Strategiebericht", description: "Strategieentscheidungen und deren Wirkung.", period: "Quartalsweise", type: "Strategie" },
  { id: "RP-9", title: "Freigabebericht", description: "Übersicht aller Freigabeprozesse und Status.", period: "Monatlich", type: "Freigaben" },
];

export interface RoleDef {
  role: Role;
  description: string;
  permissions: string[];
}

export const NAV_KEYS = [
  "dashboard",
  "finanzen",
  "upload",
  "einkauf",
  "inventar",
  "mitarbeiter",
  "freigaben",
  "prognosen",
  "risiko",
  "strategie",
  "entitaeten",
  "reports",
  "microsoft",
  "benutzer",
  "einstellungen",
] as const;
export type NavKey = (typeof NAV_KEYS)[number];

export const ROLE_PERMISSIONS: Record<Role, NavKey[]> = {
  Admin: [...NAV_KEYS],
  Controller: ["dashboard", "finanzen", "upload", "einkauf", "freigaben", "prognosen", "risiko", "strategie", "entitaeten", "reports", "microsoft"],
  "Finance Analyst": ["dashboard", "finanzen", "upload", "prognosen", "reports", "entitaeten"],
  "Procurement Manager": ["dashboard", "einkauf", "freigaben", "microsoft", "reports", "upload"],
  "Inventory Manager": ["dashboard", "inventar", "mitarbeiter", "freigaben", "reports", "upload"],
  "Management Viewer": ["dashboard", "finanzen", "prognosen", "risiko", "strategie", "entitaeten", "reports"],
  "Entity Manager": ["dashboard", "finanzen", "einkauf", "inventar", "mitarbeiter", "freigaben", "risiko", "reports"],
};

export const ROLE_DEFS: RoleDef[] = [
  { role: "Admin", description: "Voller Zugriff auf alle Module und Einstellungen.", permissions: ["Alle Module", "Benutzerverwaltung", "Systemeinstellungen"] },
  { role: "Controller", description: "Steuert Finanzen, Freigaben und Strategie über alle Entitäten.", permissions: ["Finanzen", "Freigaben", "Risiko", "Strategie", "Reports"] },
  { role: "Finance Analyst", description: "Analysiert Finanzdaten und Prognosen.", permissions: ["Finanzen", "Prognosen", "Reports"] },
  { role: "Procurement Manager", description: "Verwaltet Einkauf und Beschaffungsfreigaben.", permissions: ["Einkauf", "Freigaben", "Microsoft Integration"] },
  { role: "Inventory Manager", description: "Verwaltet Inventar und Geräteausgaben.", permissions: ["Inventar", "Mitarbeiter & Geräte", "Reports"] },
  { role: "Management Viewer", description: "Liest Berichte, Risiken und Strategie ohne Bearbeitung.", permissions: ["Dashboard", "Reports", "Risiko", "Strategie"] },
  { role: "Entity Manager", description: "Verantwortet eine Entität operativ und finanziell.", permissions: ["Finanzen", "Einkauf", "Inventar", "Freigaben"] },
];
