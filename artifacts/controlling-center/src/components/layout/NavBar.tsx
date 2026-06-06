import { useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/hooks/use-app-context";
import type { NavKey } from "@/data/governance";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreHorizontal,
} from "lucide-react";

interface NavItem {
  href?: string;
  key: NavKey | "copilot";
  label: string;
  icon: typeof LayoutDashboard;
  action?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", key: "dashboard", label: "dashboard", icon: LayoutDashboard },
  { href: "/finanzen", key: "finanzen", label: "finanzen", icon: PieChart },
  { href: "/belege", key: "belege", label: "belege", icon: ReceiptText },
  { href: "/umsatz", key: "umsatz", label: "umsatz", icon: Coins },
  { href: "/gewinn-verlust", key: "gewinnverlust", label: "gewinnverlust", icon: Scale },
  { href: "/entitaeten", key: "entitaeten", label: "entitaeten", icon: Building2 },
  { href: "/prognosen", key: "prognosen", label: "prognosen", icon: TrendingUp },
  { href: "/reports", key: "reports", label: "reports", icon: FileText },
  { href: "/einkauf", key: "einkauf", label: "einkauf", icon: ShoppingCart },
  { href: "/inventar", key: "inventar", label: "inventar", icon: Package },
  { href: "/mitarbeiter", key: "mitarbeiter", label: "mitarbeiter_geraete", icon: Users },
  { href: "/freigaben", key: "freigaben", label: "freigaben", icon: CheckSquare },
  { href: "/risiko", key: "risiko", label: "risiko_premortem", icon: ShieldAlert },
  { href: "/strategie", key: "strategie", label: "strategie", icon: Target },
  { href: "/einstellungen", key: "einstellungen", label: "einstellungen", icon: Settings },
  { key: "copilot", label: "ai_copilot", icon: Sparkles, action: true },
];

const MORE_WIDTH = 116;
const GAP = 4;

export function NavBar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { setCopilotOpen, allowedNav } = useAppStore();
  const allowed = allowedNav();

  const items = NAV_ITEMS.filter((i) => i.action || allowed.includes(i.key as NavKey));

  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const widths = Array.from(measure.children).map((c) => (c as HTMLElement).offsetWidth);

    const recompute = () => {
      const available = container.offsetWidth;
      const total = widths.reduce((a, w) => a + w, 0) + GAP * Math.max(0, widths.length - 1);
      if (total <= available) {
        setVisibleCount(widths.length);
        return;
      }
      let used = 0;
      let count = 0;
      for (let i = 0; i < widths.length; i++) {
        const add = widths[i] + (count > 0 ? GAP : 0);
        if (used + add + GAP + MORE_WIDTH <= available) {
          used += add;
          count++;
        } else break;
      }
      setVisibleCount(count);
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(container);
    return () => ro.disconnect();
  }, [items.length, t]);

  const isActive = (item: NavItem) =>
    !!item.href &&
    (location === item.href || (item.href !== "/" && location.startsWith(item.href)));

  const renderPill = (item: NavItem) => {
    if (item.action) {
      return (
        <button
          key={item.key}
          type="button"
          data-testid="link-nav-copilot"
          onClick={() => setCopilotOpen(true)}
          className="app-pill whitespace-nowrap"
        >
          <item.icon className="h-4 w-4 text-brass" />
          {t(item.label)}
        </button>
      );
    }
    const active = isActive(item);
    return (
      <Link
        key={item.key}
        href={item.href!}
        data-testid={`link-nav-${item.key}`}
        data-active={active}
        className="app-pill whitespace-nowrap"
      >
        <item.icon className={`h-4 w-4 ${active ? "" : "text-muted-foreground"}`} />
        {t(item.label)}
      </Link>
    );
  };

  const visible = items.slice(0, visibleCount);
  const overflow = items.slice(visibleCount);

  return (
    <div className="relative w-full">
      {/* Hidden measurement row — always renders every pill at full width. */}
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none absolute -z-10 flex gap-1 opacity-0"
        style={{ left: 0, top: 0 }}
      >
        {items.map((item) => (
          <span key={item.key} className="app-pill whitespace-nowrap">
            <item.icon className="h-4 w-4" />
            {t(item.label)}
          </span>
        ))}
      </div>

      <div ref={containerRef} className="flex items-center gap-1 overflow-hidden">
        {visible.map(renderPill)}

        {overflow.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="app-pill whitespace-nowrap" data-testid="button-nav-more">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                {t("more")}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {overflow.map((item) =>
                item.action ? (
                  <DropdownMenuItem
                    key={item.key}
                    onClick={() => setCopilotOpen(true)}
                    data-testid="link-nav-copilot-more"
                  >
                    <item.icon className="h-4 w-4 mr-2 text-brass" />
                    {t(item.label)}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem key={item.key} asChild data-testid={`link-nav-${item.key}-more`}>
                    <Link href={item.href!}>
                      <item.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                      {t(item.label)}
                    </Link>
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
