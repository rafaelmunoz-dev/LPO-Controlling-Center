import type { EntityCode, LiquidityCategory, LiquidityLine } from "./types";

// Rolling horizon in weeks for the direct liquidity plan.
export const LIQUIDITY_HORIZON = 13;

export const LIQUIDITY_INFLOWS: LiquidityCategory[] = ["receipts", "other_in"];
export const LIQUIDITY_OUTFLOWS: LiquidityCategory[] = [
  "suppliers",
  "payroll",
  "tax",
  "rent",
  "financing",
  "capex",
  "other_out",
];
export const LIQUIDITY_CATEGORIES: LiquidityCategory[] = [
  ...LIQUIDITY_INFLOWS,
  ...LIQUIDITY_OUTFLOWS,
];

export function liquidityDirection(cat: LiquidityCategory): "in" | "out" {
  return LIQUIDITY_INFLOWS.includes(cat) ? "in" : "out";
}

export interface LiquidityWeek {
  week: number;
  opening: number;
  inflows: number;
  outflows: number;
  net: number;
  closing: number;
}

export interface LiquidityPlan {
  weeks: LiquidityWeek[];
  openingCash: number;
  endingCash: number;
  lowPoint: number; // lowest closing balance across the horizon
  lowWeek: number; // 0 = opening already the low point
  totalIn: number;
  totalOut: number;
}

// Direct method: starting from current cash, roll each week's expected
// receipts minus payments forward so each week opens on the prior week's close.
export function liquidityPlanFor(
  lines: LiquidityLine[],
  view: EntityCode,
  openingCash: number,
): LiquidityPlan {
  const scoped = lines.filter((l) => l.view === view);
  const weeks: LiquidityWeek[] = [];
  let opening = openingCash;
  let lowPoint = openingCash;
  let lowWeek = 0;
  let totalIn = 0;
  let totalOut = 0;

  for (let w = 1; w <= LIQUIDITY_HORIZON; w++) {
    const wl = scoped.filter((l) => l.week === w && l.amount > 0);
    const inflows = wl
      .filter((l) => liquidityDirection(l.category) === "in")
      .reduce((a, l) => a + l.amount, 0);
    const outflows = wl
      .filter((l) => liquidityDirection(l.category) === "out")
      .reduce((a, l) => a + l.amount, 0);
    const net = inflows - outflows;
    const closing = opening + net;
    weeks.push({ week: w, opening, inflows, outflows, net, closing });
    totalIn += inflows;
    totalOut += outflows;
    if (closing < lowPoint) {
      lowPoint = closing;
      lowWeek = w;
    }
    opening = closing;
  }

  return { weeks, openingCash, endingCash: opening, lowPoint, lowWeek, totalIn, totalOut };
}

export function emptyLiquidityLine(view: EntityCode, week = 1): Omit<LiquidityLine, "id"> {
  return { view, week, category: "receipts", amount: 0, note: "" };
}

export function liquidityLineId(): string {
  return `LIQ-${Date.now().toString(36)}-${Math.floor(Math.random() * 9000 + 1000)}`;
}
