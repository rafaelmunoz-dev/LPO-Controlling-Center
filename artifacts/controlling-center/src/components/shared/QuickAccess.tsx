import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/hooks/use-app-context";
import type { NavKey } from "@/data/governance";
import {
  PieChart,
  ShoppingCart,
  Package,
  ShieldAlert,
  CheckSquare,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { CHART } from "@/lib/chart";

interface QuickItem {
  key: NavKey | "copilot";
  labelKey: string;
  descKey: string;
  icon: typeof PieChart;
  color: string;
  href?: string;
}

const ITEMS: QuickItem[] = [
  { key: "finanzen", labelKey: "finanzen", descKey: "quick_finanzen_desc", icon: PieChart, color: CHART.navy, href: "/finanzen" },
  { key: "einkauf", labelKey: "einkauf", descKey: "quick_einkauf_desc", icon: ShoppingCart, color: CHART.blue, href: "/einkauf" },
  { key: "inventar", labelKey: "inventar", descKey: "quick_inventar_desc", icon: Package, color: CHART.gold, href: "/inventar" },
  { key: "risiko", labelKey: "risiko_premortem", descKey: "quick_risiko_desc", icon: ShieldAlert, color: CHART.red, href: "/risiko" },
  { key: "freigaben", labelKey: "freigaben", descKey: "quick_freigaben_desc", icon: CheckSquare, color: CHART.emerald, href: "/freigaben" },
  { key: "copilot", labelKey: "ai_copilot", descKey: "quick_copilot_desc", icon: Sparkles, color: CHART.purple },
];

export function QuickAccess() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { allowedNav, setCopilotOpen } = useAppStore();
  const allowed = allowedNav();
  const items = ITEMS.filter((i) => i.key === "copilot" || allowed.includes(i.key as NavKey));

  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 px-1 text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {t("quick_access")}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const open = () => (item.href ? navigate(item.href) : setCopilotOpen(true));
          return (
            <button
              type="button"
              key={item.key}
              onClick={open}
              data-testid={`quick-${item.key}`}
              className="glass-card card-link group flex items-center gap-3 px-5 py-4 text-left"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{ color: item.color, backgroundColor: `color-mix(in srgb, ${item.color} 12%, white)` }}
              >
                <item.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-primary truncate">{t(item.labelKey)}</span>
                <span className="block text-xs text-muted-foreground truncate">{t(item.descKey)}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
