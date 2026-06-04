import { useState, useRef, useEffect } from "react";
import { useAppStore, USERS, PERIODS } from "@/hooks/use-app-context";
import { useTranslation } from "react-i18next";
import { Bell, Search, Download, FilePlus2, Globe, ChevronDown, CalendarDays, X } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { searchAll, type SearchResult, type ViewKey } from "@/data";
import lpoLogo from "@assets/image_1780570561463.png";

const ENTITY_DOT: Record<string, string> = {
  "MiGu Group Gesamt": "bg-primary",
  IMP: "bg-blue-500",
  "C&A": "bg-amber-500",
  MKT: "bg-violet-500",
  CPE: "bg-emerald-500",
  COSM: "bg-rose-500",
};

const ENTITIES: ViewKey[] = ["MiGu Group Gesamt", "IMP", "C&A", "MKT", "CPE", "COSM"];

export function Topbar() {
  const { selectedEntity, setEntity, period, setPeriod, setLanguage, currentUser, setCurrentUser, tasks } = useAppStore();
  const { t, i18n } = useTranslation();
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const results: SearchResult[] = query.trim() ? searchAll(query, (k) => t(k)) : [];

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
  };

  const goTo = (r: SearchResult) => {
    navigate(r.href);
    setQuery("");
    setSearchOpen(false);
  };

  const openTasks = tasks.filter((task) => !task.done);

  return (
    <header className="h-16 glass-panel border-b border-white/40 flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          <img src={lpoLogo} alt="LPO International" className="h-7 w-auto" data-testid="img-logo" />
          <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold hidden xl:block border-l border-border pl-3">{t("app_title")}</span>
        </div>

        <div className="w-px h-8 bg-border mx-1" />

        <Select value={selectedEntity} onValueChange={(val) => setEntity(val as ViewKey)}>
          <SelectTrigger className="w-[210px] bg-white/60 border-slate-200/80 text-primary font-medium" data-testid="select-entity">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${ENTITY_DOT[selectedEntity]}`} />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {ENTITIES.map((e) => (
              <SelectItem key={e} value={e} data-testid={`entity-option-${e}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${ENTITY_DOT[e]}`} />
                  {e === "MiGu Group Gesamt" ? t("all_entities") : e}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-[140px] bg-white/60 border-slate-200/80 text-sm hidden md:flex" data-testid="select-period">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-72 hidden md:block" ref={searchRef}>
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search_placeholder")}
            className="pl-9 pr-8 bg-white/60 border-slate-200/80 focus-visible:ring-brass/30 rounded-full h-9"
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
            <div className="absolute top-11 left-0 right-0 glass-panel rounded-xl border border-slate-200/80 p-1.5 shadow-xl max-h-96 overflow-y-auto thin-scroll z-50">
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 text-center">{t("no_results")}</p>
              ) : (
                results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(r)}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/70"
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
              <DropdownMenuItem key={task.id} onClick={() => navigate("/freigaben")} className="flex-col items-start gap-0.5 py-2">
                <span className="text-sm">{task.title}</span>
                <span className="text-[0.65rem] text-muted-foreground">{task.context}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-language">
              <Globe className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => changeLanguage("de")}>Deutsch</DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage("en")}>English</DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage("es")}>Español</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-border mx-1" />

        <Button variant="outline" size="sm" className="hidden lg:flex gap-2 bg-white/60" onClick={() => { navigate("/reports"); toast.success(t("export_started")); }} data-testid="button-export">
          <Download className="h-4 w-4" />
          {t("export")}
        </Button>

        <Button size="sm" className="hidden lg:flex gap-2 shadow-sm" onClick={() => navigate("/reports")} data-testid="button-create-report">
          <FilePlus2 className="h-4 w-4" />
          {t("bericht_erstellen")}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-1 ml-1 rounded-full hover:bg-white/60" data-testid="button-user-menu">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={currentUser?.avatar} alt={currentUser?.name} />
                <AvatarFallback>{currentUser?.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-col items-start hidden sm:flex">
                <span className="text-sm font-medium leading-none">{currentUser?.name}</span>
                <span className="text-xs text-muted-foreground leading-none mt-1">{currentUser?.role}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t("switch_user")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {USERS.map((user) => (
              <DropdownMenuItem
                key={user.id}
                onClick={() => setCurrentUser(user)}
                className={currentUser?.id === user.id ? "bg-brass/10" : ""}
                data-testid={`switch-user-${user.id}`}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm">{user.name}</span>
                    <span className="text-[0.65rem] text-muted-foreground">{user.role}</span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
