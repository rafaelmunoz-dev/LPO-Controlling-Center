import { useEffect, useState } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { getMicrosoftStatus } from "@/lib/api";
import { TeamSettings } from "@/components/settings/TeamSettings";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, statusLabel } from "@/components/shared/page";
import { UploadPanel } from "@/components/shared/UploadPanel";
import { SimulatedNotice, SimulatedBadge } from "@/components/shared/SimNotice";
import { MS_ADAPTERS, groupViewKey, labelForView } from "@/data";
import { EntitySettings } from "@/components/settings/EntitySettings";
import { tContent } from "@/i18n/content";
import { ROLE_DEFS, ROLE_PERMISSIONS, NAV_KEYS, SETTINGS_ADMIN_ROLES } from "@/data/governance";
import type { ViewKey, MsAdapter } from "@/data/types";
import {
  Settings, Bell, Palette, CheckCircle2, XCircle, UserCheck,
  Plug, RefreshCw, Building2, AppWindow, UploadCloud, Lock, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const NAV_LABELS: Record<string, string> = {
  dashboard: "dashboard", finanzen: "finanzen", entitaeten: "entitaeten", einkauf: "einkauf", inventar: "inventar",
  mitarbeiter: "mit_employees", freigaben: "freigaben", prognosen: "prognosen", risiko: "risk_risk", strategie: "strategie",
  reports: "reports", einstellungen: "einstellungen",
};

const MS_STATUS_TONE: Record<string, string> = {
  "Bereit": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "Mock-Daten": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Nicht verbunden": "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

type AdapterState = MsAdapter & { connected: boolean; lastSyncTime: string };

const TONE_KEY: Record<string, string> = { factual: "tone_factual", concise: "tone_concise", detailed: "tone_detailed" };

const MS_DESC_KEY: Record<string, string> = {
  "Microsoft Forms": "ms_forms_desc",
  SharePoint: "ms_sharepoint_desc",
  Teams: "ms_teams_desc",
  Outlook: "ms_outlook_desc",
  Planner: "ms_planner_desc",
  "Excel Online": "ms_excel_desc",
};

const EXTERNAL_APPS = [
  { name: "Buchhaltung", nameKey: "app_buchhaltung", descKey: "app_buchhaltung_desc", connected: true },
  { name: "Bankdaten", nameKey: "app_bankdaten", descKey: "app_bankdaten_desc", connected: true },
  { name: "Lieferantenportal", nameKey: "app_lieferantenportal", descKey: "app_lieferantenportal_desc", connected: false },
  { name: "Inventarsystem", nameKey: "app_inventarsystem", descKey: "app_inventarsystem_desc", connected: true },
  { name: "HR-System", nameKey: "app_hr", descKey: "app_hr_desc", connected: false },
  { name: "Reporting-System", nameKey: "app_reporting", descKey: "app_reporting_desc", connected: false },
];

export default function Einstellungen() {
  const { currentUser, selectedEntity, setEntity, entities, groups } = useAppStore();
  const canAdminSettings = SETTINGS_ADMIN_ROLES.includes(currentUser.role);
  const entityViews: ViewKey[] = groups
    .filter((g) => !g.archived)
    .flatMap((g) => [
      groupViewKey(g.id) as ViewKey,
      ...entities.filter((e) => e.groupId === g.id && !e.archived).map((e) => e.code as ViewKey),
    ]);
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState({ approvals: true, risks: true, reports: false, sync: true });
  const [adapters, setAdapters] = useState<AdapterState[]>(
    MS_ADAPTERS.map((a) => ({ ...a, connected: a.status !== "Nicht verbunden", lastSyncTime: a.lastSync }))
  );
  const [apps, setApps] = useState(EXTERNAL_APPS);
  const [msConnected, setMsConnected] = useState<boolean | null>(null);
  const [msChecking, setMsChecking] = useState(false);

  const checkMicrosoft = () => {
    setMsChecking(true);
    getMicrosoftStatus()
      .then((s) => setMsConnected(s.connected))
      .catch(() => setMsConnected(false))
      .finally(() => setMsChecking(false));
  };

  useEffect(() => {
    let active = true;
    getMicrosoftStatus()
      .then((s) => active && setMsConnected(s.connected))
      .catch(() => active && setMsConnected(false));
    return () => { active = false; };
  }, []);
  const [security, setSecurity] = useState({ twoFactor: true, sso: false, auditLog: true, sessionTimeout: [30] });
  const [copilot, setCopilot] = useState({ proactive: true, autoSummary: true, suggestActions: true, tone: "factual" });

  const toggleAdapter = (service: string) => {
    if (!canAdminSettings) { toast.error(t("no_permission")); return; }
    setAdapters((prev) => prev.map((a) => {
      if (a.service !== service) return a;
      const connected = !a.connected;
      toast[connected ? "success" : "message"](t(connected ? "toast_connected" : "toast_disconnected", { name: a.service }));
      return { ...a, connected, status: connected ? "Bereit" : "Nicht verbunden" };
    }));
  };

  const syncAdapter = (service: string) => {
    if (!canAdminSettings) { toast.error(t("no_permission")); return; }
    const a = adapters.find((x) => x.service === service);
    if (!a?.connected) { toast.error(t("toast_adapter_disconnected")); return; }
    setAdapters((prev) => prev.map((x) => x.service === service ? { ...x, lastSyncTime: new Date().toLocaleString("de-DE") } : x));
    toast.success(t("toast_synced", { service: a.service }));
  };

  const toggleApp = (name: string) => {
    if (!canAdminSettings) { toast.error(t("no_permission")); return; }
    setApps((prev) => prev.map((a) => {
      if (a.name !== name) return a;
      const connected = !a.connected;
      toast[connected ? "success" : "message"](t(connected ? "toast_connected" : "toast_disconnected", { name: t(a.nameKey) }));
      return { ...a, connected };
    }));
  };


  return (
    <div className="space-y-6">
      <PageHeader title={t("einstellungen")} subtitle={t("set_subtitle")} icon={<Settings className="h-5 w-5" />} />

      <Tabs defaultValue="allgemein">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="allgemein" data-testid="tab-allgemein">{t("settings_general")}</TabsTrigger>
          <TabsTrigger value="benutzer" data-testid="tab-benutzer">{t("settings_users")}</TabsTrigger>
          <TabsTrigger value="entitaeten" data-testid="tab-entitaeten">{t("entitaeten")}</TabsTrigger>
          <TabsTrigger value="microsoft" data-testid="tab-microsoft">{t("microsoft_integration")}</TabsTrigger>
          <TabsTrigger value="apps" data-testid="tab-apps">{t("settings_apps")}</TabsTrigger>
          <TabsTrigger value="import" data-testid="tab-import">{t("settings_import")}</TabsTrigger>
          <TabsTrigger value="sicherheit" data-testid="tab-sicherheit">{t("settings_security")}</TabsTrigger>
          <TabsTrigger value="design" data-testid="tab-design">{t("set_tab_design")}</TabsTrigger>
          <TabsTrigger value="copilot" data-testid="tab-copilot">{t("ai_copilot")}</TabsTrigger>
        </TabsList>

        {/* ALLGEMEIN */}
        <TabsContent value="allgemein">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="glass-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> {t("default_entity")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t("default_entity")}</Label>
                  <Select value={selectedEntity} onValueChange={(v) => { setEntity(v as typeof selectedEntity); toast.success(t("toast_default_entity", { entity: labelForView(v as ViewKey) })); }}>
                    <SelectTrigger data-testid="select-default-entity"><SelectValue /></SelectTrigger>
                    <SelectContent>{entityViews.map((v) => <SelectItem key={v} value={v}>{labelForView(v)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  {t("set_currency_timezone")}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> {t("notifications")}</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {([
                  ["approvals", t("freigaben"), t("set_notif_approvals_desc")],
                  ["risks", t("freig_risks"), t("set_notif_risks_desc")],
                  ["reports", t("set_notif_reports"), t("set_notif_reports_desc")],
                  ["sync", t("set_sync"), t("set_notif_sync_desc")],
                ] as const).map(([key, title, desc]) => (
                  <div key={key} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div><div className="font-medium text-sm">{title}</div><div className="text-xs text-muted-foreground">{desc}</div></div>
                    <Switch checked={notifications[key as keyof typeof notifications]} disabled={!canAdminSettings} onCheckedChange={(v) => { setNotifications((n) => ({ ...n, [key]: v })); toast.message(`${title}: ${v ? t("set_enabled") : t("set_disabled")}`); }} data-testid={`switch-notif-${key}`} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* BENUTZER & ROLLEN */}
        <TabsContent value="benutzer">
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users" data-testid="subtab-users">{t("set_users")}</TabsTrigger>
              <TabsTrigger value="roles" data-testid="subtab-roles">{t("set_roles")}</TabsTrigger>
              <TabsTrigger value="matrix" data-testid="subtab-matrix">{t("permissions_matrix")}</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <TeamSettings />
            </TabsContent>

            <TabsContent value="roles">
              <div className="grid gap-4 md:grid-cols-2">
                {ROLE_DEFS.map((r) => (
                  <Card key={r.role} className="glass-card" data-testid={`card-role-${r.role}`}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        {t(`role_${r.role.toLowerCase()}`)}
                        <Badge variant="outline">{ROLE_PERMISSIONS[r.role].length} {t("set_modules")}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{t(r.descriptionKey)}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {r.permissionKeys.map((p) => <Badge key={p} variant="outline" className="gap-1 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> {t(p)}</Badge>)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="matrix">
              <Card className="glass-card">
                <CardHeader><CardTitle>{t("permissions_matrix")}</CardTitle><p className="text-sm text-muted-foreground">{t("set_matrix_desc")}</p></CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-card">{t("set_module")}</TableHead>
                        {ROLE_DEFS.map((r) => <TableHead key={r.role} className="text-center whitespace-nowrap text-xs">{t(`role_${r.role.toLowerCase()}`)}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {NAV_KEYS.map((nav) => (
                        <TableRow key={nav} data-testid={`matrix-row-${nav}`}>
                          <TableCell className="font-medium sticky left-0 bg-card">{t(NAV_LABELS[nav])}</TableCell>
                          {ROLE_DEFS.map((r) => (
                            <TableCell key={r.role} className="text-center">
                              {ROLE_PERMISSIONS[r.role].includes(nav)
                                ? <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
                                : <span className="text-muted-foreground/40">—</span>}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ENTITÄTEN */}
        <TabsContent value="entitaeten">
          <EntitySettings />
        </TabsContent>

        {/* MICROSOFT 365 */}
        <TabsContent value="microsoft">
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground" data-testid="notice-ms-integration">
              {t("ms_integration_note")}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{adapters.length}</div><div className="text-sm text-muted-foreground mt-1">{t("set_adapters")}</div></CardContent></Card>
              <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-emerald-600">{msConnected ? 1 : 0}</div><div className="text-sm text-muted-foreground mt-1">{t("set_connected")}</div></CardContent></Card>
              <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{adapters.length - (msConnected ? 1 : 0)}</div><div className="text-sm text-muted-foreground mt-1">{t("set_disconnected")}</div></CardContent></Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {adapters.map((a) => {
                const isForms = a.service === "Microsoft Forms";
                if (isForms) {
                  const connected = msConnected === true;
                  return (
                    <Card key={a.service} className="glass-card ring-1 ring-primary/20" data-testid={`card-adapter-${a.service}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold">{a.service.slice(0, 2)}</div>
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">{a.service}<Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">{t("ms_live")}</Badge></CardTitle>
                              <p className="text-xs text-muted-foreground mt-0.5">{t(MS_DESC_KEY[a.service])}</p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">{t("status")}</span>
                          {msConnected === null
                            ? <Badge variant="outline" className="gap-1 bg-slate-500/10 text-slate-600 border-slate-500/20"><RefreshCw className="h-3.5 w-3.5 animate-spin" /> {t("ms_checking")}</Badge>
                            : connected
                              ? <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle2 className="h-3.5 w-3.5" /> {t("set_connected")}</Badge>
                              : <Badge variant="outline" className="gap-1 bg-slate-500/10 text-slate-600 border-slate-500/20"><XCircle className="h-3.5 w-3.5" /> {t("set_disconnected")}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{connected ? t("ms_forms_settings_connected_hint") : t("ms_forms_settings_disconnected_hint")}</p>
                        <Button variant="outline" size="sm" className="w-full" disabled={msChecking} onClick={checkMicrosoft} data-testid={`button-sync-${a.service}`}>
                          <RefreshCw className={`h-4 w-4 mr-1.5 ${msChecking ? "animate-spin" : ""}`} /> {t("ms_check_connection")}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                }
                return (
                <Card key={a.service} className="glass-card" data-testid={`card-adapter-${a.service}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold">{a.service.slice(0, 2)}</div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">{a.service}<SimulatedBadge label={t("sim_simulated")} /></CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">{MS_DESC_KEY[a.service] ? t(MS_DESC_KEY[a.service]) : tContent(a.description)}</p>
                        </div>
                      </div>
                      <Switch checked={a.connected} disabled={!canAdminSettings} onCheckedChange={() => toggleAdapter(a.service)} data-testid={`switch-adapter-${a.service}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("status")}</span>
                      {a.connected
                        ? <Badge variant="outline" className={`gap-1 ${MS_STATUS_TONE[a.status] ?? MS_STATUS_TONE["Bereit"]}`}><CheckCircle2 className="h-3.5 w-3.5" /> {statusLabel(t, a.status)}</Badge>
                        : <Badge variant="outline" className="gap-1 bg-slate-500/10 text-slate-600 border-slate-500/20"><XCircle className="h-3.5 w-3.5" /> {t("set_disconnected")}</Badge>}
                    </div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">{t("set_last_sync")}</span><span className="font-medium">{a.lastSyncTime}</span></div>
                    <Button variant="outline" size="sm" className="w-full" disabled={!a.connected || !canAdminSettings} onClick={() => syncAdapter(a.service)} data-testid={`button-sync-${a.service}`}>
                      <RefreshCw className="h-4 w-4 mr-1.5" /> {t("set_sync_now")}
                    </Button>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* EXTERNE APPS */}
        <TabsContent value="apps" className="space-y-4">
          <SimulatedNotice text={t("sim_apps_note")} />
          <Card className="glass-card">
            <CardHeader><CardTitle className="flex items-center gap-2"><AppWindow className="h-4 w-4 text-primary" /> {t("set_external_apps")}</CardTitle><p className="text-sm text-muted-foreground">{t("set_external_apps_desc")}</p></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {apps.map((a) => (
                  <div key={a.name} className="flex items-center justify-between rounded-xl border border-border p-4" data-testid={`card-app-${a.name}`}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Plug className="h-4 w-4" /></div>
                      <div>
                        <div className="font-medium">{t(a.nameKey)}</div>
                        <div className="text-xs text-muted-foreground">{t(a.descKey)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.connected && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle2 className="h-3 w-3" /> {t("set_connected")}</Badge>}
                      <Switch checked={a.connected} disabled={!canAdminSettings} onCheckedChange={() => toggleApp(a.name)} data-testid={`switch-app-${a.name}`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DATENIMPORT */}
        <TabsContent value="import">
          <div className="space-y-4">
            <Card className="glass-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><UploadCloud className="h-4 w-4 text-primary" /> {t("settings_import")}</CardTitle><p className="text-sm text-muted-foreground">{t("set_import_desc")}</p></CardHeader>
              <CardContent>
                <UploadPanel
                  title={t("set_import_panel_title")}
                  docTypes={["Monatsbericht", "Einkaufsliste", "Inventurliste", "Rechnungsliste", "Bankübersicht", "Budgetdatei", "Lieferantenliste", "Mitarbeiterliste"]}
                  defaultDocType="Monatsbericht"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SICHERHEIT */}
        <TabsContent value="sicherheit" className="space-y-4">
          <SimulatedNotice text={t("sim_security_note")} />
          <Card className="glass-card max-w-2xl">
            <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> {t("settings_security")}</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {([
                ["twoFactor", t("set_2fa"), t("set_2fa_desc")],
                ["sso", t("set_sso"), t("set_sso_desc")],
                ["auditLog", t("set_audit"), t("set_audit_desc")],
              ] as const).map(([key, title, desc]) => (
                <div key={key} className="flex items-center justify-between py-2.5 border-b border-border">
                  <div><div className="font-medium text-sm">{title}</div><div className="text-xs text-muted-foreground">{desc}</div></div>
                  <Switch checked={security[key as keyof typeof security] as boolean} disabled={!canAdminSettings} onCheckedChange={(v) => { setSecurity((s) => ({ ...s, [key]: v })); toast.message(`${title}: ${v ? t("set_enabled") : t("set_disabled")}`); }} data-testid={`switch-security-${key}`} />
                </div>
              ))}
              <div className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div><div className="font-medium text-sm">{t("set_session_timeout")}</div><div className="text-xs text-muted-foreground">{t("set_session_timeout_desc")}</div></div>
                  <span className="text-sm font-medium text-primary">{security.sessionTimeout[0]} {t("set_min")}</span>
                </div>
                <Slider value={security.sessionTimeout} disabled={!canAdminSettings} onValueChange={(v) => setSecurity((s) => ({ ...s, sessionTimeout: v }))} min={5} max={120} step={5} data-testid="slider-session-timeout" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DESIGN */}
        <TabsContent value="design">
          <Card className="glass-card max-w-2xl">
            <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-4 w-4 text-primary" /> {t("settings_appearance")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div><div className="font-medium text-sm">{t("set_glass")}</div><div className="text-xs text-muted-foreground">{t("set_glass_desc")}</div></div>
                <Switch defaultChecked disabled={!canAdminSettings} data-testid="switch-glass" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div><div className="font-medium text-sm">{t("set_compact_tables")}</div><div className="text-xs text-muted-foreground">{t("set_compact_desc")}</div></div>
                <Switch disabled={!canAdminSettings} data-testid="switch-compact" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>{t("set_accent_color")}</Label>
                <div className="flex gap-2">
                  <div className="h-9 w-9 rounded-lg ring-2 ring-offset-2 ring-primary" style={{ background: "hsl(214 52% 24%)" }} title={t("color_navy")} />
                  <div className="h-9 w-9 rounded-lg" style={{ background: "hsl(160 60% 45%)" }} title={t("color_teal")} />
                  <div className="h-9 w-9 rounded-lg" style={{ background: "hsl(217 80% 58%)" }} title={t("color_blue")} />
                  <div className="h-9 w-9 rounded-lg" style={{ background: "hsl(38 92% 52%)" }} title={t("color_orange")} />
                  <div className="h-9 w-9 rounded-lg" style={{ background: "hsl(160 70% 42%)" }} title={t("color_green")} />
                </div>
                <p className="text-xs text-muted-foreground">{t("set_accent_desc")}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI COPILOT */}
        <TabsContent value="copilot">
          <Card className="glass-card max-w-2xl">
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> {t("ai_copilot")}</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {([
                ["proactive", t("set_proactive"), t("set_proactive_desc")],
                ["autoSummary", t("set_auto_summary"), t("set_auto_summary_desc")],
                ["suggestActions", t("set_suggest_actions"), t("set_suggest_actions_desc")],
              ] as const).map(([key, title, desc]) => (
                <div key={key} className="flex items-center justify-between py-2.5 border-b border-border">
                  <div><div className="font-medium text-sm">{title}</div><div className="text-xs text-muted-foreground">{desc}</div></div>
                  <Switch checked={copilot[key as keyof typeof copilot] as boolean} disabled={!canAdminSettings} onCheckedChange={(v) => { setCopilot((c) => ({ ...c, [key]: v })); toast.message(`${title}: ${v ? t("set_enabled") : t("set_disabled")}`); }} data-testid={`switch-copilot-${key}`} />
                </div>
              ))}
              <div className="pt-4 space-y-1.5">
                <Label>{t("set_tone")}</Label>
                <Select value={copilot.tone} disabled={!canAdminSettings} onValueChange={(v) => { setCopilot((c) => ({ ...c, tone: v })); toast.success(t("toast_tone", { tone: t(TONE_KEY[v]) })); }}>
                  <SelectTrigger data-testid="select-copilot-tone"><SelectValue /></SelectTrigger>
                  <SelectContent>{["factual", "concise", "detailed"].map((tone) => <SelectItem key={tone} value={tone}>{t(TONE_KEY[tone])}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
