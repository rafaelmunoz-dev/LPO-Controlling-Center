import type {
  EntityCode,
  IntercompanyFlow,
  IntercompanyType,
  ViewKey,
} from "./types";
import { entityCodesForView } from "./groups";

export const INTERCOMPANY_TYPES: IntercompanyType[] = [
  "lieferung",
  "leistung",
  "darlehen",
  "umlage",
];

// A flow only eliminates when BOTH ends sit inside the consolidated group for
// the active period. Flows touching a firm outside the view (external trade) or
// from a different period are left in place.
export function intercompanyForView(
  flows: IntercompanyFlow[],
  view: ViewKey,
  period: string,
): IntercompanyFlow[] {
  const codes = new Set(entityCodesForView(view));
  return flows.filter(
    (f) =>
      f.period === period &&
      f.amount > 0 &&
      f.fromEntity !== f.toEntity &&
      codes.has(f.fromEntity) &&
      codes.has(f.toEntity),
  );
}

export interface ConsolidationReport {
  // Intra-group flows eliminated for this view + period.
  internal: IntercompanyFlow[];
  // Total eliminated amount (intra-group revenue == matching cost).
  eliminationTotal: number;
  // Eliminated amount split by flow type, for the breakdown table.
  byType: { type: IntercompanyType; amount: number }[];
  // Gross member sums (single statements) and the consolidated result. Group
  // profit is unchanged by elimination — only the gross-up is removed.
  grossRevenue: number;
  consolidatedRevenue: number;
  grossCosts: number;
  consolidatedCosts: number;
}

// Build the consolidation comparison: take the summed member figures (gross)
// and remove intra-group trade so the Konzern view isn't inflated by internal
// revenue/cost. Each flow is revenue at the seller and an equal cost at the
// buyer, so revenue and costs drop by the same amount and profit is unaffected.
export function consolidationReport(
  flows: IntercompanyFlow[],
  view: ViewKey,
  period: string,
  grossRevenue: number,
  grossCosts: number,
): ConsolidationReport {
  const internal = intercompanyForView(flows, view, period);
  const eliminationTotal = internal.reduce((a, f) => a + f.amount, 0);

  const byType = INTERCOMPANY_TYPES.map((type) => ({
    type,
    amount: internal.filter((f) => f.type === type).reduce((a, f) => a + f.amount, 0),
  })).filter((b) => b.amount > 0);

  return {
    internal,
    eliminationTotal,
    byType,
    grossRevenue,
    consolidatedRevenue: grossRevenue - eliminationTotal,
    grossCosts,
    consolidatedCosts: grossCosts - eliminationTotal,
  };
}

export function emptyIntercompanyFlow(period: string, from?: EntityCode, to?: EntityCode): Omit<IntercompanyFlow, "id"> {
  return {
    period,
    fromEntity: (from ?? "") as EntityCode,
    toEntity: (to ?? "") as EntityCode,
    type: "lieferung",
    amount: 0,
    note: "",
  };
}

export function intercompanyFlowId(): string {
  return `IC-${Date.now().toString(36)}-${Math.floor(Math.random() * 9000 + 1000)}`;
}
