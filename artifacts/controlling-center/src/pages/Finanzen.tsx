import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/hooks/use-app-context";
import { useFormat } from "@/hooks/use-format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/shared/page";
import { Term } from "@/components/shared/Term";
import { AiInsight } from "@/components/shared/AiInsight";
import { UploadPanel } from "@/components/shared/UploadPanel";
import type { GlossaryKey } from "@/data";
import type { BalanceLineItem, BalanceSide } from "@/data/types";
import {
  getPLOverview,
  getCashflow,
  getBudget,
  getEntityComparison,
  getFinance,
  applyBookingsToBudget,
  isGroupView,
  groupViewKey,
  labelForView,
  DEFAULT_GROUP_ID,
} from "@/data";
import { can } from "@/data/governance";
import type { NavKey } from "@/data/governance";
import { CHART, PIE_COLORS } from "@/lib/chart";
import { Info, PieChart as PieIcon, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { UmsatzView } from "./Umsatz";
import { GuVView } from "./GewinnVerlust";
import { PrognosenView } from "./Prognosen";
import { BerichteView } from "./Reports";
import { BelegeView } from "./Belege";

const TAB_DEFS = [
  { value: "overview", navKey: "finanzen", labelKey: "tab_overview", testid: "tab-overview" },
  { value: "gv", navKey: "gewinnverlust", labelKey: "gewinnverlust", testid: "tab-gv" },
  { value: "umsatz", navKey: "umsatz", labelKey: "umsatz", testid: "tab-umsatz" },
  { value: "belege", navKey: "belege", labelKey: "belege", testid: "tab-belege" },
  { value: "bs", navKey: "finanzen", labelKey: "tab_balance", testid: "tab-balance" },
  { value: "konsol", navKey: "finanzen", labelKey: "tab_consolidation", testid: "tab-consolidation" },
  { value: "prognosen", navKey: "prognosen", labelKey: "prognosen", testid: "tab-prognosen" },
  { value: "berichte", navKey: "reports", labelKey: "reports", testid: "tab-berichte" },
] satisfies { value: string; navKey: NavKey; labelKey: string; testid: string }[];

function InfoLabel({ label, explain, bold }: { label: string; explain?: string; bold?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${bold ? "font-semibold" : ""}`}>
      {label}
      {explain && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="text-muted-foreground/50 hover:text-primary">
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-[240px]">{explain}</TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}

function StatCard({ glossary, label, value, sub }: { glossary: GlossaryKey; label: string; value: string; sub?: string }) {
  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground"><Term k={glossary}>{label}</Term></p>
        <p className="text-2xl font-bold text-primary mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

interface BalanceFormState {
  label: string;
  value: string;
  explain: string;
}

const emptyBalanceForm = (): BalanceFormState => ({ label: "", value: "", explain: "" });

function BalanceCard({
  side,
  title,
  addLabel,
  items,
  canCreate,
  canEdit,
  canDelete,
  onCreate,
  onEdit,
  onDelete,
}: {
  side: BalanceSide;
  title: string;
  addLabel: string;
  items: BalanceLineItem[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onCreate: (side: BalanceSide) => void;
  onEdit: (item: BalanceLineItem) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { currency } = useFormat();
  const total = items.reduce((a, b) => a + b.value, 0);
  const totalLabel = side === "asset" ? t("bs_total_assets") : t("bs_total_liabilities");
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        {canCreate && (
          <Button size="sm" variant="outline" onClick={() => onCreate(side)} data-testid={`button-add-balance-${side}`}>
            <Plus className="h-4 w-4 mr-1.5" /> {addLabel}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {items.map((r) => (
              <TableRow key={r.id} data-testid={`row-balance-${r.id}`}>
                <TableCell><InfoLabel label={r.label} explain={r.explain} /></TableCell>
                <TableCell className="text-right tabular-nums">{currency(r.value)}</TableCell>
                {(canEdit || canDelete) && (
                  <TableCell className="w-[84px] py-1.5">
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(r)} data-testid={`button-edit-balance-${r.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(r.id)} data-testid={`button-delete-balance-${r.id}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={canEdit || canDelete ? 3 : 2} className="text-center text-muted-foreground py-6">
                  {t("bs_empty")}
                </TableCell>
              </TableRow>
            )}
            <TableRow className="bg-muted/40">
              <TableCell className="font-semibold">{totalLabel}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums" data-testid={`total-balance-${side}`}>{currency(total)}</TableCell>
              {(canEdit || canDelete) && <TableCell />}
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function BilanzTab() {
  const { t } = useTranslation();
  const { selectedEntity, balanceItems, currentUser, addBalanceItem, updateBalanceItem, removeBalanceItem, logAction } = useAppStore();
  const canCreate = can(currentUser.role, "bilanz:create");
  const canEdit = can(currentUser.role, "bilanz:edit");
  const canDelete = can(currentUser.role, "bilanz:delete");

  const scoped = balanceItems.filter((b) => b.view === selectedEntity);
  const assets = scoped.filter((b) => b.side === "asset");
  const liabilities = scoped.filter((b) => b.side === "liability");

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [side, setSide] = useState<BalanceSide>("asset");
  const [form, setForm] = useState<BalanceFormState>(emptyBalanceForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = (s: BalanceSide) => {
    setEditId(null);
    setSide(s);
    setForm(emptyBalanceForm());
    setOpen(true);
  };
  const openEdit = (item: BalanceLineItem) => {
    setEditId(item.id);
    setSide(item.side);
    setForm({ label: item.label, value: String(item.value), explain: item.explain ?? "" });
    setOpen(true);
  };

  const save = () => {
    if (editId ? !canEdit : !canCreate) { toast.error(t("no_permission")); return; }
    if (!form.label.trim()) { toast.error(t("bs_item_label")); return; }
    const value = Number(form.value) || 0;
    const explain = form.explain.trim() || undefined;
    if (editId) {
      updateBalanceItem(editId, { label: form.label.trim(), value, explain });
      logAction(t("bs_edit_item"), `${form.label} · ${selectedEntity}`);
      toast.success(t("bs_saved"));
    } else {
      const item: BalanceLineItem = {
        id: `BS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        view: selectedEntity,
        side,
        label: form.label.trim(),
        value,
        explain,
      };
      addBalanceItem(item);
      logAction(t("bs_create_item"), `${form.label} · ${selectedEntity}`);
      toast.success(t("bs_created"));
    }
    setOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    if (!canDelete) { toast.error(t("no_permission")); return; }
    const item = balanceItems.find((b) => b.id === deleteId);
    removeBalanceItem(deleteId);
    logAction(t("common_delete"), `${item?.label ?? deleteId} · ${selectedEntity}`);
    toast.success(t("bs_deleted"));
    setDeleteId(null);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <BalanceCard side="asset" title={t("bs_assets")} addLabel={t("bs_add_asset")} items={assets} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} onCreate={openCreate} onEdit={openEdit} onDelete={setDeleteId} />
        <BalanceCard side="liability" title={t("bs_liabilities")} addLabel={t("bs_add_liability")} items={liabilities} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} onCreate={openCreate} onEdit={openEdit} onDelete={setDeleteId} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? t("bs_edit_item") : t("bs_create_item")}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>{t("bs_item_label")}</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} data-testid="input-balance-label" /></div>
            <div className="space-y-1.5"><Label>{t("bs_item_value")}</Label><Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} data-testid="input-balance-value" /></div>
            <div className="space-y-1.5"><Label>{t("bs_item_explain")}</Label><Input value={form.explain} onChange={(e) => setForm({ ...form, explain: e.target.value })} data-testid="input-balance-explain" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button onClick={save} data-testid="button-save-balance">{t("common_save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("common_delete_confirm_title")}</AlertDialogTitle><AlertDialogDescription>{t("common_delete_confirm_desc")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete-balance">{t("common_delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function Finanzen() {
  const { selectedEntity, entities, bankTransactions, allowedNav } = useAppStore();
  const { t } = useTranslation();
  const { currency, compact, number } = useFormat();
  const plo = getPLOverview(selectedEntity);
  const cf = getCashflow(selectedEntity);
  const isGroup = isGroupView(selectedEntity);
  const bookedByCategory = bankTransactions.reduce<Record<string, number>>((acc, tx) => {
    if (tx.status !== "booked" || !tx.category) return acc;
    if (!isGroup && tx.entity !== selectedEntity) return acc;
    acc[tx.category] = (acc[tx.category] ?? 0) + tx.amount;
    return acc;
  }, {});
  const budget = applyBookingsToBudget(getBudget(selectedEntity), bookedByCategory);
  const comparison = getEntityComparison(entities);
  // Consolidation shows the total of the group the current view belongs to.
  const groupView = isGroup
    ? selectedEntity
    : groupViewKey(entities.find((e) => e.code === selectedEntity)?.groupId ?? DEFAULT_GROUP_ID);
  const group = getFinance(groupView);

  const visibleTabs = TAB_DEFS.filter((d) => allowedNav().includes(d.navKey));
  const [tab, setTab] = useState<string>(() => {
    const h = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
    return visibleTabs.some((d) => d.value === h) ? h : "overview";
  });
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "");
      const ok = TAB_DEFS.some((d) => d.value === h && allowedNav().includes(d.navKey));
      if (ok) setTab(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [allowedNav]);
  const changeTab = (v: string) => {
    setTab(v);
    if (window.location.hash !== `#${v}`) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${v}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("finanzen")} subtitle={t("key_figures")} icon={<PieIcon className="h-5 w-5" />} />

      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList className="flex-wrap h-auto gap-1 rounded-full">
          {visibleTabs.map((d) => (
            <TabsTrigger key={d.value} value={d.value} data-testid={d.testid} className="rounded-full px-4">{t(d.labelKey)}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard glossary="umsatz" label={t("kpi_revenue")} value={compact(plo.revenue)} />
            <StatCard glossary="bruttogewinn" label={t("gross_profit")} value={compact(plo.grossProfit)} sub={`${number(Math.round(plo.grossMargin * 10) / 10)} % ${t("gross_margin")}`} />
            <StatCard glossary="ebitda" label={t("kpi_ebitda")} value={compact(plo.ebitda)} sub={`${number(Math.round(plo.ebitdaMargin * 10) / 10)} % ${t("kpi_margin")}`} />
            <StatCard glossary="nettoergebnis" label={t("kpi_net")} value={compact(plo.netProfit)} sub={`${number(Math.round(plo.netMargin * 10) / 10)} % ${t("net_margin")}`} />
          </div>
          <AiInsight context="finanzen" />
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="glass-card lg:col-span-3">
              <CardHeader><CardTitle>{t("profit_trend")}</CardTitle></CardHeader>
              <CardContent className="pl-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={plo.series}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                      <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => compact(v)} width={60} />
                      <RTooltip formatter={(v: number) => currency(v)} />
                      <Legend />
                      <Area type="monotone" name={t("kpi_revenue")} dataKey="revenue" stroke={CHART.navy} fill={CHART.navy} fillOpacity={0.12} strokeWidth={2} />
                      <Area type="monotone" name={t("kpi_ebitda")} dataKey="ebitda" stroke={CHART.teal} fill={CHART.teal} fillOpacity={0.14} strokeWidth={2} />
                      <Area type="monotone" name={t("kpi_net")} dataKey="profit" stroke={CHART.blue} fill={CHART.blue} fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card lg:col-span-2">
              <CardHeader><CardTitle>{t("cost_structure")}</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={plo.costBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                        {plo.costBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <RTooltip formatter={(v: number) => currency(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="glass-card">
            <CardHeader><CardTitle><Term k="cashflow">{t("cashflow")}</Term></CardTitle></CardHeader>
            <CardContent className="pl-0">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cf.series}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => compact(v)} width={60} />
                    <RTooltip formatter={(v: number) => currency(v)} />
                    <Legend />
                    <Area type="monotone" name={t("cf_op_short")} dataKey="operating" stroke={CHART.navy} fill={CHART.navy} fillOpacity={0.12} strokeWidth={2} />
                    <Area type="monotone" name={t("cf_inv_short")} dataKey="investing" stroke={CHART.red} fill={CHART.red} fillOpacity={0.1} strokeWidth={2} />
                    <Area type="monotone" name={t("cf_fin_short")} dataKey="financing" stroke={CHART.teal} fill={CHART.teal} fillOpacity={0.12} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gv">
          <GuVView />
        </TabsContent>

        <TabsContent value="umsatz">
          <UmsatzView />
        </TabsContent>

        <TabsContent value="belege">
          <BelegeView />
        </TabsContent>

        <TabsContent value="bs">
          <BilanzTab />
        </TabsContent>

        <TabsContent value="konsol" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle><Term k="konsolidierung">{t("tab_consolidation")}</Term></CardTitle>
              <p className="text-sm text-muted-foreground">{t("fin_group_reconcile")}</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("entity")}</TableHead>
                    <TableHead className="text-right">{t("kpi_revenue")}</TableHead>
                    <TableHead className="text-right">{t("kpi_ebitda")}</TableHead>
                    <TableHead className="text-right">{t("kpi_net")}</TableHead>
                    <TableHead className="text-right">{t("kpi_cash")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparison.map((c) => (
                    <TableRow key={c.code}>
                      <TableCell className="font-medium">{c.code}</TableCell>
                      <TableCell className="text-right">{compact(c.revenue)}</TableCell>
                      <TableCell className="text-right">{compact(c.ebitda)}</TableCell>
                      <TableCell className="text-right">{compact(c.profit)}</TableCell>
                      <TableCell className="text-right">{compact(c.liquidity)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-primary/5 font-semibold">
                    <TableCell>{labelForView(groupView)}</TableCell>
                    <TableCell className="text-right">{compact(group.revenue)}</TableCell>
                    <TableCell className="text-right">{compact(group.ebitda)}</TableCell>
                    <TableCell className="text-right">{compact(group.netProfit)}</TableCell>
                    <TableCell className="text-right">{compact(group.cash)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader><CardTitle><Term k="budget_ist">{t("budget_vs_actual")}</Term></CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {budget.map((b) => {
                const pct = Math.min(150, Math.round((b.actual / b.budget) * 100));
                const over = b.actual > b.budget;
                return (
                  <div key={b.category} className="space-y-1.5" data-testid={`budget-${b.category}`}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{b.category}</span>
                      <span className={over ? "text-destructive" : "text-emerald-600"}>
                        {currency(b.actual)} / {currency(b.budget)}
                      </span>
                    </div>
                    <Progress value={pct} className={over ? "[&>div]:bg-destructive" : "[&>div]:bg-emerald-500"} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prognosen">
          <PrognosenView />
        </TabsContent>

        <TabsContent value="berichte" className="space-y-4">
          <BerichteView />
          <UploadPanel
            docTypes={["Monatsbericht", "Rechnungsliste", "Bankübersicht", "Budgetdatei"]}
            defaultDocType="Monatsbericht"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
