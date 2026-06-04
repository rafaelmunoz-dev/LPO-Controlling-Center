import { useState } from "react";
import { useAppStore, USERS } from "@/hooks/use-app-context";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page";
import { UploadPanel } from "@/components/shared/UploadPanel";
import { ENTITY_CODES, ENTITIES, getEntityComparison, MS_ADAPTERS } from "@/data";
import { ROLE_DEFS, ROLE_PERMISSIONS, NAV_KEYS } from "@/data/governance";
import type { ViewKey, MsAdapter } from "@/data/types";
import {
  Settings, Globe, Bell, Palette, User, Shield, CheckCircle2, XCircle, UserCheck,
  Plug, RefreshCw, Building2, AppWindow, UploadCloud, Lock, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const LANGS: { code: "de" | "en" | "es"; label: string }[] = [
  { code: "de", label: "Deutsch" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

const ENTITY_VIEWS: ViewKey[] = ["MiGu Group Gesamt", ...ENTITY_CODES];

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

const EXTERNAL_APPS = [
  { name: "Buchhaltung", description: "DATEV-Anbindung für Finanzbuchhaltung & Lohn", connected: true },
  { name: "Bankdaten", description: "Kontoumsätze & Liquidität via Banking-Schnittstelle", connected: true },
  { name: "Lieferantenportal", description: "Bestellungen & Lieferscheine der Lieferanten", connected: false },
  { name: "Inventarsystem", description: "Bestände, Geräte & Inventur-Synchronisation", connected: true },
  { name: "HR-System", description: "Mitarbeiterstammdaten & Personalkosten", connected: false },
  { name: "Reporting-System", description: "Export an externe BI- & Reporting-Tools", connected: false },
];

export default function Einstellungen() {
  const { language, setLanguage, currentUser, setCurrentUser, selectedEntity, setEntity } = useAppStore();
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState({ approvals: true, risks: true, reports: false, sync: true });
  const [adapters, setAdapters] = useState<AdapterState[]>(
    MS_ADAPTERS.map((a) => ({ ...a, connected: a.status !== "Nicht verbunden", lastSyncTime: a.lastSync }))
  );
  const [apps, setApps] = useState(EXTERNAL_APPS);
  const [security, setSecurity] = useState({ twoFactor: true, sso: false, auditLog: true, sessionTimeout: [30] });
  const [copilot, setCopilot] = useState({ proactive: true, autoSummary: true, suggestActions: true, tone: "Sachlich" });
  const comparison = getEntityComparison();

  const changeLang = (code: "de" | "en" | "es") => {
    setLanguage(code);
    i18n.changeLanguage(code);
    toast.success(`Sprache: ${LANGS.find((l) => l.code === code)?.label}`);
  };

  const toggleAdapter = (service: string) => {
    setAdapters((prev) => prev.map((a) => {
      if (a.service !== service) return a;
      const connected = !a.connected;
      toast[connected ? "success" : "message"](`${a.service} ${connected ? "verbunden" : "getrennt"}.`);
      return { ...a, connected, status: connected ? "Bereit" : "Nicht verbunden" };
    }));
  };

  const syncAdapter = (service: string) => {
    const a = adapters.find((x) => x.service === service);
    if (!a?.connected) { toast.error("Adapter ist nicht verbunden."); return; }
    setAdapters((prev) => prev.map((x) => x.service === service ? { ...x, lastSyncTime: new Date().toLocaleString("de-DE") } : x));
    toast.success(`${a.service} synchronisiert.`);
  };

  const toggleApp = (name: string) => {
    setApps((prev) => prev.map((a) => {
      if (a.name !== name) return a;
      const connected = !a.connected;
      toast[connected ? "success" : "message"](`${a.name} ${connected ? "verbunden" : "getrennt"}.`);
      return { ...a, connected };
    }));
  };

  const connectedAdapters = adapters.filter((a) => a.connected).length;

  return (
    <div className="space-y-6">
      <PageHeader title={t("einstellungen")} subtitle={t("set_subtitle")} icon={<Settings className="h-5 w-5" />} />

      <Tabs defaultValue="allgemein">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="allgemein" data-testid="tab-allgemein">{t("settings_general")}</TabsTrigger>
          <TabsTrigger value="benutzer" data-testid="tab-benutzer">{t("settings_users")}</TabsTrigger>
          <TabsTrigger value="sprache" data-testid="tab-sprache">{t("language")}</TabsTrigger>
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
              <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-4 w-4 text-primary" /> {t("set_profile")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14"><AvatarImage src={currentUser.avatar} /><AvatarFallback>{currentUser.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                  <div>
                    <div className="font-semibold">{currentUser.name}</div>
                    <div className="text-sm text-muted-foreground">{currentUser.email}</div>
                    <Badge variant="outline" className="mt-1 bg-primary/10 text-primary border-primary/20">{currentUser.role}</Badge>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>{t("name")}</Label><Input defaultValue={currentUser.name} data-testid="input-profile-name" /></div>
                  <div className="space-y-1.5"><Label>{t("set_email")}</Label><Input defaultValue={currentUser.email} data-testid="input-profile-email" /></div>
                  <div className="space-y-1.5"><Label>{t("set_organisation")}</Label><Input defaultValue={currentUser.organisation} disabled /></div>
                  <div className="space-y-1.5"><Label>{t("set_role")}</Label><Input defaultValue={currentUser.role} disabled /></div>
                </div>
                <Button onClick={() => toast.success(t("set_profile_saved"))} data-testid="button-save-profile">{t("save")}</Button>
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
                    <Switch checked={notifications[key as keyof typeof notifications]} onCheckedChange={(v) => { setNotifications((n) => ({ ...n, [key]: v })); toast.message(`${title}: ${v ? t("set_enabled") : t("set_disabled")}`); }} data-testid={`switch-notif-${key}`} />
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
              <Card className="glass-card">
                <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> {t("set_users")}</CardTitle><p className="text-sm text-muted-foreground">{t("set_users_desc")}</p></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>{t("set_users")}</TableHead><TableHead>{t("set_role")}</TableHead><TableHead>{t("set_organisation")}</TableHead><TableHead>{t("set_entity_access")}</TableHead><TableHead>{t("set_last_activity")}</TableHead><TableHead className="text-right">{t("common_action")}</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {USERS.map((u) => (
                        <TableRow key={u.id} data-testid={`row-user-${u.id}`} className={u.id === currentUser.id ? "bg-primary/5" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8"><AvatarImage src={u.avatar} /><AvatarFallback>{u.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                              <div><div className="font-medium">{u.name}</div><div className="text-xs text-muted-foreground">{u.email}</div></div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{u.role}</Badge></TableCell>
                          <TableCell>{u.organisation}</TableCell>
                          <TableCell className="text-muted-foreground">{u.entityAccess.length} {t("entitaeten")}</TableCell>
                          <TableCell className="text-muted-foreground">{u.lastActivity}</TableCell>
                          <TableCell className="text-right">
                            {u.id === currentUser.id
                              ? <span className="inline-flex items-center gap-1 text-emerald-600 text-sm"><UserCheck className="h-4 w-4" /> {t("mit_active")}</span>
                              : <Button size="sm" variant="outline" onClick={() => { setCurrentUser(u); toast.success(`Angemeldet als ${u.name} (${u.role}).`); }} data-testid={`button-switch-${u.id}`}>{t("set_switch")}</Button>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles">
              <div className="grid gap-4 md:grid-cols-2">
                {ROLE_DEFS.map((r) => (
                  <Card key={r.role} className="glass-card" data-testid={`card-role-${r.role}`}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        {r.role}
                        <Badge variant="outline">{ROLE_PERMISSIONS[r.role].length} {t("set_modules")}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{r.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {r.permissions.map((p) => <Badge key={p} variant="outline" className="gap-1 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> {p}</Badge>)}
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
                        {ROLE_DEFS.map((r) => <TableHead key={r.role} className="text-center whitespace-nowrap text-xs">{r.role}</TableHead>)}
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

        {/* SPRACHE */}
        <TabsContent value="sprache">
          <Card className="glass-card max-w-2xl">
            <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> {t("settings_language")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("set_display_language")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {LANGS.map((l) => (
                    <Button key={l.code} variant={language === l.code ? "default" : "outline"} onClick={() => changeLang(l.code)} data-testid={`button-lang-${l.code}`}>{l.label}</Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{t("set_language_hint")}</p>
              </div>
              <Separator />
              <div className="space-y-1.5">
                <Label>{t("default_entity")}</Label>
                <Select value={selectedEntity} onValueChange={(v) => { setEntity(v as typeof selectedEntity); toast.success(`Standard-Entität: ${v}`); }}>
                  <SelectTrigger data-testid="select-default-entity"><SelectValue /></SelectTrigger>
                  <SelectContent>{ENTITY_VIEWS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                {t("set_currency_timezone")}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ENTITÄTEN */}
        <TabsContent value="entitaeten">
          <Card className="glass-card">
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> {t("set_group_structure")}</CardTitle><p className="text-sm text-muted-foreground">{ENTITIES.length} {t("set_group_entities")}</p></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>{t("set_code")}</TableHead><TableHead>{t("name")}</TableHead><TableHead>{t("mit_location")}</TableHead><TableHead className="text-right">{t("mit_employees")}</TableHead><TableHead>{t("risk_risk")}</TableHead><TableHead className="text-right">{t("common_action")}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {ENTITIES.map((e) => {
                    const c = comparison.find((x) => x.code === e.code);
                    return (
                      <TableRow key={e.code} data-testid={`row-setting-entity-${e.code}`} className={selectedEntity === e.code ? "bg-primary/5" : ""}>
                        <TableCell><Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold">{e.code}</Badge></TableCell>
                        <TableCell><div className="font-medium">{e.name}</div><div className="text-xs text-muted-foreground">{e.description}</div></TableCell>
                        <TableCell className="text-muted-foreground">{e.location}</TableCell>
                        <TableCell className="text-right">{e.employees}</TableCell>
                        <TableCell>{c ? <Badge variant="outline">{c.riskLevel}</Badge> : "—"}</TableCell>
                        <TableCell className="text-right">
                          {selectedEntity === e.code
                            ? <span className="inline-flex items-center gap-1 text-emerald-600 text-sm"><UserCheck className="h-4 w-4" /> {t("mit_active")}</span>
                            : <Button size="sm" variant="outline" onClick={() => { setEntity(e.code); toast.success(`Aktive Entität: ${e.name}`); }} data-testid={`button-activate-${e.code}`}>{t("set_activate")}</Button>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MICROSOFT 365 */}
        <TabsContent value="microsoft">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{adapters.length}</div><div className="text-sm text-muted-foreground mt-1">{t("set_adapters")}</div></CardContent></Card>
              <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-emerald-600">{connectedAdapters}</div><div className="text-sm text-muted-foreground mt-1">{t("set_connected")}</div></CardContent></Card>
              <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{adapters.length - connectedAdapters}</div><div className="text-sm text-muted-foreground mt-1">{t("set_disconnected")}</div></CardContent></Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {adapters.map((a) => (
                <Card key={a.service} className="glass-card" data-testid={`card-adapter-${a.service}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold">{a.service.slice(0, 2)}</div>
                        <div>
                          <CardTitle className="text-base">{a.service}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                        </div>
                      </div>
                      <Switch checked={a.connected} onCheckedChange={() => toggleAdapter(a.service)} data-testid={`switch-adapter-${a.service}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("status")}</span>
                      {a.connected
                        ? <Badge variant="outline" className={`gap-1 ${MS_STATUS_TONE[a.status] ?? MS_STATUS_TONE["Bereit"]}`}><CheckCircle2 className="h-3.5 w-3.5" /> {a.status}</Badge>
                        : <Badge variant="outline" className="gap-1 bg-slate-500/10 text-slate-600 border-slate-500/20"><XCircle className="h-3.5 w-3.5" /> {t("set_disconnected")}</Badge>}
                    </div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">{t("set_last_sync")}</span><span className="font-medium">{a.lastSyncTime}</span></div>
                    <Button variant="outline" size="sm" className="w-full" disabled={!a.connected} onClick={() => syncAdapter(a.service)} data-testid={`button-sync-${a.service}`}>
                      <RefreshCw className="h-4 w-4 mr-1.5" /> {t("set_sync_now")}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* EXTERNE APPS */}
        <TabsContent value="apps">
          <Card className="glass-card">
            <CardHeader><CardTitle className="flex items-center gap-2"><AppWindow className="h-4 w-4 text-primary" /> {t("set_external_apps")}</CardTitle><p className="text-sm text-muted-foreground">{t("set_external_apps_desc")}</p></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {apps.map((a) => (
                  <div key={a.name} className="flex items-center justify-between rounded-xl border border-border p-4" data-testid={`card-app-${a.name}`}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Plug className="h-4 w-4" /></div>
                      <div>
                        <div className="font-medium">{a.name}</div>
                        <div className="text-xs text-muted-foreground">{a.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.connected && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle2 className="h-3 w-3" /> {t("set_connected")}</Badge>}
                      <Switch checked={a.connected} onCheckedChange={() => toggleApp(a.name)} data-testid={`switch-app-${a.name}`} />
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
        <TabsContent value="sicherheit">
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
                  <Switch checked={security[key as keyof typeof security] as boolean} onCheckedChange={(v) => { setSecurity((s) => ({ ...s, [key]: v })); toast.message(`${title}: ${v ? t("set_enabled") : t("set_disabled")}`); }} data-testid={`switch-security-${key}`} />
                </div>
              ))}
              <div className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div><div className="font-medium text-sm">{t("set_session_timeout")}</div><div className="text-xs text-muted-foreground">{t("set_session_timeout_desc")}</div></div>
                  <span className="text-sm font-medium text-primary">{security.sessionTimeout[0]} {t("set_min")}</span>
                </div>
                <Slider value={security.sessionTimeout} onValueChange={(v) => setSecurity((s) => ({ ...s, sessionTimeout: v }))} min={5} max={120} step={5} data-testid="slider-session-timeout" />
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
                <Switch defaultChecked data-testid="switch-glass" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div><div className="font-medium text-sm">{t("set_compact_tables")}</div><div className="text-xs text-muted-foreground">{t("set_compact_desc")}</div></div>
                <Switch data-testid="switch-compact" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>{t("set_accent_color")}</Label>
                <div className="flex gap-2">
                  <div className="h-9 w-9 rounded-lg ring-2 ring-offset-2 ring-primary" style={{ background: "hsl(216 65% 11%)" }} title="Navy" />
                  <div className="h-9 w-9 rounded-lg" style={{ background: "hsl(40 48% 56%)" }} title="Brass" />
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
                  <Switch checked={copilot[key as keyof typeof copilot] as boolean} onCheckedChange={(v) => { setCopilot((c) => ({ ...c, [key]: v })); toast.message(`${title}: ${v ? t("set_enabled") : t("set_disabled")}`); }} data-testid={`switch-copilot-${key}`} />
                </div>
              ))}
              <div className="pt-4 space-y-1.5">
                <Label>{t("set_tone")}</Label>
                <Select value={copilot.tone} onValueChange={(v) => { setCopilot((c) => ({ ...c, tone: v })); toast.success(`Tonalität: ${v}`); }}>
                  <SelectTrigger data-testid="select-copilot-tone"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Sachlich", "Prägnant", "Ausführlich"].map((tone) => <SelectItem key={tone} value={tone}>{tone}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
