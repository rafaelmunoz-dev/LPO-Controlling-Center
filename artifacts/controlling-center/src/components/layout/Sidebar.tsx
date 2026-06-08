import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/hooks/use-app-context";
import type { NavKey } from "@/data/governance";
import {
  LayoutDashboard,
  PieChart,
  ShoppingCart,
  Package,
  Users,
  CheckSquare,
  TrendingUp,
  ShieldAlert,
  Target,
  Coins,
  Scale,
  FileText,
  Settings,
  Sparkles,
  Building2,
  ReceiptText,
} from "lucide-react";
import lpoLogo from "@assets/image_1780570561463.png";

interface NavItem {
  href: string;
  key: NavKey;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

// Navigation grouped into thematic rubrics. Items keep their NavKey so RBAC
// filtering (allowedNav) still applies per entry; a section whose items are all
// filtered out is hidden entirely (header included).
const NAV_SECTIONS: NavSection[] = [
  {
    label: "nav_sec_overview",
    items: [{ href: "/", key: "dashboard", label: "dashboard", icon: LayoutDashboard }],
  },
  {
    label: "nav_sec_finance",
    items: [
      { href: "/finanzen", key: "finanzen", label: "finanzen", icon: PieChart },
      { href: "/belege", key: "belege", label: "belege", icon: ReceiptText },
      { href: "/umsatz", key: "umsatz", label: "umsatz", icon: Coins },
      { href: "/gewinn-verlust", key: "gewinnverlust", label: "gewinnverlust", icon: Scale },
      { href: "/prognosen", key: "prognosen", label: "prognosen", icon: TrendingUp },
      { href: "/reports", key: "reports", label: "reports", icon: FileText },
    ],
  },
  {
    label: "nav_sec_structure",
    items: [{ href: "/entitaeten", key: "entitaeten", label: "entitaeten", icon: Building2 }],
  },
  {
    label: "nav_sec_operations",
    items: [
      { href: "/einkauf", key: "einkauf", label: "einkauf", icon: ShoppingCart },
      { href: "/inventar", key: "inventar", label: "inventar", icon: Package },
      { href: "/mitarbeiter", key: "mitarbeiter", label: "mitarbeiter_geraete", icon: Users },
      { href: "/freigaben", key: "freigaben", label: "freigaben", icon: CheckSquare },
    ],
  },
  {
    label: "nav_sec_strategy",
    items: [
      { href: "/risiko", key: "risiko", label: "risiko_premortem", icon: ShieldAlert },
      { href: "/strategie", key: "strategie", label: "strategie", icon: Target },
    ],
  },
  {
    label: "nav_sec_admin",
    items: [{ href: "/einstellungen", key: "einstellungen", label: "einstellungen", icon: Settings }],
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { setCopilotOpen, allowedNav } = useAppStore();
  const allowed = allowedNav();

  const isActive = (item: NavItem) =>
    location === item.href || (item.href !== "/" && location.startsWith(item.href));

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((i) => allowed.includes(i.key)),
  })).filter((section) => section.items.length > 0);

  return (
    <aside className="app-sidebar sticky top-0 h-screen w-60 shrink-0 flex flex-col">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-sidebar-border shrink-0">
        <img src={lpoLogo} alt="LPO International" className="h-7 w-auto" data-testid="img-logo" />
        <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold leading-tight">
          {t("app_title")}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto thin-scroll px-3 py-4 flex flex-col gap-5">
        {sections.map((section) => (
          <div key={section.label} className="flex flex-col gap-1">
            <p
              className="px-3 mb-1 text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground/70"
              data-testid={`nav-section-${section.label}`}
            >
              {t(section.label)}
            </p>
            {section.items.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  data-testid={`link-nav-${item.key}`}
                  data-active={active}
                  className="app-nav-item"
                >
                  <item.icon className={`h-4 w-4 shrink-0 ${active ? "" : "text-muted-foreground"}`} />
                  <span className="truncate">{t(item.label)}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border shrink-0">
        <button
          type="button"
          data-testid="link-nav-copilot"
          onClick={() => setCopilotOpen(true)}
          className="app-nav-item w-full"
        >
          <Sparkles className="h-4 w-4 shrink-0 text-brass" />
          <span className="truncate">{t("ai_copilot")}</span>
        </button>
      </div>
    </aside>
  );
}
