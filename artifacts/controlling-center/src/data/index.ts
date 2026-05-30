import type { EntityCode, ViewKey } from "./types";

export * from "./types";
export * from "./finance";
export * from "./operations";
export * from "./governance";
export * from "./copilot";

export function scopeByEntity<T extends { entity: EntityCode }>(items: T[], view: ViewKey): T[] {
  if (view === "MiGu Group Gesamt") return items;
  return items.filter((i) => i.entity === view);
}

export const formatCurrency = (n: number, max = 0) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: max }).format(n);

export const formatCompact = (n: number) =>
  new Intl.NumberFormat("de-DE", { notation: "compact", style: "currency", currency: "EUR", maximumFractionDigits: 1 }).format(n);

export const formatNumber = (n: number) => new Intl.NumberFormat("de-DE").format(n);
export const formatPercent = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
