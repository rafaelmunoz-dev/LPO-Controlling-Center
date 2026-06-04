import { useAppStore } from "@/hooks/use-app-context";
import { formatCompact, formatCurrency, formatDate, formatNumber, formatPercent } from "@/data";

/**
 * Returns locale-aware formatters that re-render when the active language changes.
 * The underlying formatters read a module-level locale set via store.setLanguage,
 * so subscribing to `language` here guarantees components update on language switch.
 */
export function useFormat() {
  const language = useAppStore((s) => s.language);
  // language is referenced to create the subscription / re-render dependency
  void language;
  return {
    currency: formatCurrency,
    compact: formatCompact,
    number: formatNumber,
    percent: formatPercent,
    date: formatDate,
  };
}
