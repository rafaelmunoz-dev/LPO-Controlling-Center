import { useState, useRef, useEffect, Fragment } from "react";
import { useAppStore, PERIODS } from "@/hooks/use-app-context";
import { useTranslation } from "react-i18next";
import { Bell, Search, Download, FilePlus2, ChevronDown, CalendarDays, X, LogOut, Settings, Plus, Building2, User, ShieldCheck, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EntityAvatar } from "@/components/shared/EntityAvatar";
import { StructureCreateDialogs } from "@/components/shared/StructureCreateDialogs";
import { AdminBadge } from "@/components/shared/AdminBadge";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { basePath } from "@/auth/clerk";
import { toast } from "sonner";
import { searchAll, groupViewKey, type SearchResult, type ViewKey, type Role } from "@/data";
import { can, isAdmin } from "@/data/governance";

const LANGS: { code: "de" | "en" | "es"; label: string; flag: string }[] = [
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

const ROLES: { role: Role; labelKey: string; descKey: string; icon: typeof User }[] = [
  { role: "Mitarbeiter", labelKey: "role_mitarbeiter", descKey: "role_mitarbeiter_desc", icon: User },
  { role: "Admin", labelKey: "role_admin", descKey: "role_admin_desc", icon: ShieldCheck },
  { role: "Betrachter", labelKey: "role_betrachter", descKey: "role_betrachter_desc", icon: Eye },
];

const PERIOD_KEY: Record<string, string> = {
  "Mai 2026": "per_may26",
  "April 2026": "per_apr26",
  "Q1 2026": "per_q1_26",
  "Q2 2026": "per_q2_26",
  "GJ 2026": "per_fy26",
};

export function Topbar() {
  const { selectedEntity, setEntity, period, setPeriod, language, setLanguage, currentUser, setCurrentUser, tasks, entities, groups, allowedNav } = useAppStore();
  const activeGroups = groups.filter((g) => !g.archived);
  const firmsOfGroup = (groupId: string) => entities.filter((e) => e.groupId === groupId && !e.archived);
  const canReports = allowedNav().includes("reports") && can(currentUser.role, "reports:create");
  const { t, i18n } = useTranslation();
  const [, navigate] = useLocation();
  const { signOut } = useClerk();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [entitySelectOpen, setEntitySelectOpen] = useState(false);
  const [groupCreateOpen, setGroupCreateOpen] = useState(false);
  const [entityCreateOpen, setEntityCreateOpen] = useState(false);
  const canManageStructure = isAdmin(currentUser.role);

  const results: SearchResult[] = query.trim() ? searchAll(query, (k) => t(k), entities) : [];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const changeLanguage = (lang: "de" | "en" | "es") => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    setCurrentUser({ ...currentUser, language: lang });
  };

  const changeRole = (role: Role) => {
    if (role === currentUser.role) return;
    setCurrentUser({ ...currentUser, role });
  };

  const activeRoleDef = ROLES.find((r) => r.role === currentUser.role) ?? ROLES[1];

  const goTo = (r: SearchResult) => {
    navigate(r.href);
    setQuery("");
    setSearchOpen(false);
  };

  const openTasks = tasks.filter((task) => !task.done);

  return (
    <header className="app-header">
      <div className="h-16 flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-5">
        <Select value={selectedEntity} onValueChange={(val) => setEntity(val as ViewKey)} open={entitySelectOpen} onOpenChange={setEntitySelectOpen}>
          <SelectTrigger className="w-[210px] bg-muted/50 border-slate-200/80 text-primary font-medium" data-testid="select-entity">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {activeGroups.map((g, gi) => (
              <Fragment key={g.id}>
                {gi > 0 && <SelectSeparator />}
                <SelectItem
                  value={groupViewKey(g.id)}
                  textValue={`${g.name} ${t("group_total")}`}
                  data-testid={`entity-option-group-${g.id}`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <EntityAvatar isGroup logo={g.logo} size={22} />
                    <span>{g.name}</span>
                    <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">{t("group_total")}</span>
                  </div>
                </SelectItem>
                {firmsOfGroup(g.id).map((e) => (
                  <SelectItem key={e.code} value={e.code} textValue={e.code} className="pl-8" data-testid={`entity-option-${e.code}`}>
                    <div className="flex items-center gap-2">
                      <EntityAvatar entity={e} size={20} />
                      {e.code}
                    </div>
                  </SelectItem>
                ))}
              </Fragment>
            ))}
            {canManageStructure && (
              <>
                {activeGroups.length > 0 && <SelectSeparator />}
                <div className="px-1 py-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => { setEntitySelectOpen(false); setGroupCreateOpen(true); }}
                    className="flex w-full items-center gap-2 rounded-full px-3 py-2 text-sm text-primary hover:bg-accent hover:text-accent-foreground"
                    data-testid="button-topbar-create-group"
                  >
                    <Building2 className="h-4 w-4" />
                    {t("grp_create")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEntitySelectOpen(false); setEntityCreateOpen(true); }}
                    className="flex w-full items-center gap-2 rounded-full px-3 py-2 text-sm text-primary hover:bg-accent hover:text-accent-foreground"
                    data-testid="button-topbar-create-entity"
                  >
                    <Plus className="h-4 w-4" />
                    {t("ent_create")}
                  </button>
                </div>
              </>
            )}
          </SelectContent>
        </Select>
        {canManageStructure && (
          <StructureCreateDialogs
            groupOpen={groupCreateOpen}
            onGroupOpenChange={setGroupCreateOpen}
            entityOpen={entityCreateOpen}
            onEntityOpenChange={setEntityCreateOpen}
          />
        )}

        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-[140px] bg-muted/50 border-slate-200/80 text-sm hidden md:flex" data-testid="select-period">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => <SelectItem key={p} value={p}>{t(PERIOD_KEY[p] ?? "")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-72 hidden md:block" ref={searchRef}>
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search_placeholder")}
            className="pl-9 pr-8 bg-muted/50 border-slate-200/80 focus-visible:ring-brass/30 rounded-full h-9"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            data-testid="input-search"
          />
          {query && (
            <button onClick={() => { setQuery(""); setSearchOpen(false); }} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
          {searchOpen && query.trim() && (
            <div className="absolute top-11 left-0 right-0 glass-panel rounded-2xl border border-slate-200/80 p-1.5 shadow-xl max-h-96 overflow-y-auto thin-scroll z-50">
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 text-center">{t("no_results")}</p>
              ) : (
                results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(r)}
                    className="w-full flex items-center gap-3 rounded-full px-3 py-2 text-left hover:bg-muted"
                    data-testid={`search-result-${i}`}
                  >
                    <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-brass shrink-0 w-16">{r.type}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.sub}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full relative" data-testid="button-notifications">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {openTasks.length > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>{t("notifications")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {openTasks.length === 0 && <DropdownMenuItem disabled>{t("no_tasks")}</DropdownMenuItem>}
            {openTasks.map((task) => (
              <DropdownMenuItem key={task.id} onClick={() => navigate("/freigaben")} className="flex-col items-start gap-0.5 py-2 rounded-xl">
                <span className="text-sm">{task.title}</span>
                <span className="text-[0.65rem] text-muted-foreground">{task.context}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-border mx-1" />

        {canReports && (
          <>
            <Button variant="outline" size="sm" className="hidden lg:flex gap-2 bg-muted/50" onClick={() => { navigate("/finanzen"); window.location.hash = "berichte"; toast.success(t("export_started")); }} data-testid="button-export">
              <Download className="h-4 w-4" />
              {t("export")}
            </Button>

            <Button size="sm" className="hidden lg:flex gap-2 shadow-sm" onClick={() => { navigate("/finanzen"); window.location.hash = "berichte"; }} data-testid="button-create-report">
              <FilePlus2 className="h-4 w-4" />
              {t("bericht_erstellen")}
            </Button>
          </>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-1 ml-1 rounded-full hover:bg-muted" data-testid="button-user-menu">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={currentUser?.avatar} alt={currentUser?.name} />
                <AvatarFallback>{currentUser?.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-col items-start hidden sm:flex">
                <span className="text-sm font-medium leading-none">{currentUser?.name}</span>
                <span className="text-xs text-muted-foreground leading-none mt-1">{currentUser?.jobTitle || t(`role_${currentUser.role.toLowerCase()}`)}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={8} className="w-80 p-0 overflow-hidden rounded-2xl border-card-border shadow-xl">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4">
              <Avatar className="h-12 w-12 border border-border">
                <AvatarImage src={currentUser?.avatar || undefined} alt={currentUser?.name} />
                <AvatarFallback>{currentUser?.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-foreground">{currentUser.name}</div>
                <div className="truncate text-sm text-muted-foreground">{currentUser.email}</div>
              </div>
            </div>

            {/* Language + Role */}
            <div className="border-t border-border px-4 py-4 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("menu_language")}</p>
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => changeLanguage(e.target.value as "de" | "en" | "es")}
                    className="w-full appearance-none rounded-full border border-input bg-background pl-4 pr-10 h-11 text-sm font-medium text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    data-testid="select-language"
                  >
                    {LANGS.map((l) => (
                      <option key={l.code} value={l.code}>{l.flag}&nbsp;&nbsp;{l.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <p id="menu-role-label" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("menu_role")}</p>
                <div role="group" aria-labelledby="menu-role-label" className="grid grid-cols-3 gap-1.5">
                  {ROLES.map((r) => {
                    const active = currentUser.role === r.role;
                    return (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => changeRole(r.role)}
                        aria-pressed={active}
                        className={`flex items-center justify-center gap-1.5 rounded-full border px-2 py-2 text-xs font-medium transition-colors ${
                          active
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-transparent text-muted-foreground hover:bg-muted"
                        }`}
                        data-testid={`menu-role-${r.role}`}
                      >
                        <r.icon className="h-3.5 w-3.5 shrink-0" />
                        {t(r.labelKey)}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{t(activeRoleDef.descKey)}</p>
              </div>
            </div>

            {/* Settings + active role */}
            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={() => navigate(isAdmin(currentUser.role) ? "/einstellungen" : "/profil")}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-foreground hover:bg-muted"
                data-testid="button-settings"
              >
                <Settings className="h-4 w-4 text-muted-foreground" /> {t("menu_settings")}
              </button>
              <div className="flex items-center justify-between px-2.5 py-2">
                <span className="text-sm text-muted-foreground">{t("active_role")}</span>
                {isAdmin(currentUser.role) ? (
                  <AdminBadge />
                ) : (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                    {t(`role_${currentUser.role.toLowerCase()}`)}
                  </span>
                )}
              </div>
            </div>

            {/* Sign out */}
            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={() => signOut({ redirectUrl: basePath || "/" })}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-destructive hover:bg-destructive/5"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" /> {t("logout")}
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      </div>
    </header>
  );
}
