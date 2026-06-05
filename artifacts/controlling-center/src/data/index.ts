import type { EntityCode, ViewKey } from "./types";
import { entityCodesForView } from "./groups";

export * from "./types";
export * from "./groups";
export * from "./finance";
export * from "./operations";
export * from "./governance";
export * from "./copilot";
export * from "./glossary";
export * from "./search";
export * from "./bank";

// Scope items to the active view: a group view expands to its non-archived
// firms; a firm view matches just that firm.
export function scopeByEntity<T extends { entity: EntityCode }>(items: T[], view: ViewKey): T[] {
  const codes = new Set(entityCodesForView(view));
  return items.filter((i) => codes.has(i.entity));
}

export type AppLang = "de" | "en" | "es";
const LOCALE_MAP: Record<AppLang, string> = { de: "de-DE", en: "en-US", es: "es-ES" };

let activeLocale = "de-DE";
export function setFormatLocale(lang: AppLang) {
  activeLocale = LOCALE_MAP[lang] ?? "de-DE";
}

export const formatCurrency = (n: number, max = 0) =>
  new Intl.NumberFormat(activeLocale, { style: "currency", currency: "EUR", maximumFractionDigits: max }).format(n);

export const formatCompact = (n: number) =>
  new Intl.NumberFormat(activeLocale, { notation: "compact", style: "currency", currency: "EUR", maximumFractionDigits: 1 }).format(n);

export const formatNumber = (n: number) => new Intl.NumberFormat(activeLocale).format(n);
export const formatPercent = (n: number) => `${n >= 0 ? "+" : ""}${new Intl.NumberFormat(activeLocale, { maximumFractionDigits: 1 }).format(n)}%`;
export const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(activeLocale, { year: "numeric", month: "short", day: "2-digit" }).format(d);
};
