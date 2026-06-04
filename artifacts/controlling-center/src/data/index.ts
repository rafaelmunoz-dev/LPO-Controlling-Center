import type { EntityCode, ViewKey } from "./types";

export * from "./types";
export * from "./finance";
export * from "./operations";
export * from "./governance";
export * from "./copilot";
export * from "./glossary";
export * from "./search";

export function scopeByEntity<T extends { entity: EntityCode }>(items: T[], view: ViewKey): T[] {
  if (view === "MiGu Group Gesamt") return items;
  return items.filter((i) => i.entity === view);
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
