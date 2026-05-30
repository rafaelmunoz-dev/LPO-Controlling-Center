import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/hooks/use-app-context";
import type { NavKey } from "@/data/governance";
import {
  LayoutDashboard,
  PieChart,
  UploadCloud,
  ShoppingCart,
  Package,
  Users,
  CheckSquare,
  TrendingUp,
  ShieldAlert,
  Target,
  Building2,
  FileText,
  Blocks,
  UserCog,
  Settings,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  key: NavKey;
  label: string;
  icon: typeof LayoutDashboard;
}

const GROUPS: { group: string; items: NavItem[] }[] = [
  {
    group: "nav_overview",
    items: [{ href: "/", key: "dashboard", label: "dashboard", icon: LayoutDashboard }],
  },
  {
    group: "nav_finance",
    items: [
      { href: "/finanzen", key: "finanzen", label: "finanzen", icon: PieChart },
      { href: "/prognosen", key: "prognosen", label: "prognosen", icon: TrendingUp },
      { href: "/entitaeten", key: "entitaeten", label: "entitaeten", icon: Building2 },
      { href: "/reports", key: "reports", label: "reports", icon: FileText },
    ],
  },
  {
    group: "nav_operations",
    items: [
      { href: "/upload", key: "upload", label: "upload_center", icon: UploadCloud },
      { href: "/einkauf", key: "einkauf", label: "einkauf", icon: ShoppingCart },
      { href: "/inventar", key: "inventar", label: "inventar", icon: Package },
      { href: "/mitarbeiter", key: "mitarbeiter", label: "mitarbeiter_geraete", icon: Users },
      { href: "/microsoft", key: "microsoft", label: "microsoft_integration", icon: Blocks },
    ],
  },
  {
    group: "nav_governance",
    items: [
      { href: "/freigaben", key: "freigaben", label: "freigaben", icon: CheckSquare },
      { href: "/risiko", key: "risiko", label: "risiko_premortem", icon: ShieldAlert },
      { href: "/strategie", key: "strategie", label: "strategie", icon: Target },
    ],
  },
  {
    group: "nav_system",
    items: [
      { href: "/benutzer", key: "benutzer", label: "benutzer_rollen", icon: UserCog },
      { href: "/einstellungen", key: "einstellungen", label: "einstellungen", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { setCopilotOpen, allowedNav } = useAppStore();
  const allowed = allowedNav();

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border h-[calc(100vh-64px)] flex flex-col justify-between overflow-y-auto">
      <nav className="p-3 space-y-5">
        {GROUPS.map((group) => {
          const items = group.items.filter((i) => allowed.includes(i.key));
          if (items.length === 0) return null;
          return (
            <div key={group.group} className="space-y-1">
              <p className="px-3 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">
                {t(group.group)}
              </p>
              {items.map((item) => {
                const isActive =
                  location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-testid={`link-nav-${item.key}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {t(item.label)}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="outline"
          data-testid="button-open-copilot"
          className="w-full flex items-center justify-start gap-2 border-primary/20 hover:bg-primary/5 text-primary"
          onClick={() => setCopilotOpen(true)}
        >
          <Bot className="h-4 w-4" />
          {t("ai_copilot")}
        </Button>
      </div>
    </div>
  );
}
