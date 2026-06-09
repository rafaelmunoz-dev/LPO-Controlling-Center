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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/shared/page";
import { Term } from "@/components/shared/Term";
import { AiInsight } from "@/components/shared/AiInsight";
import { UploadPanel } from "@/components/shared/UploadPanel";
import type { GlossaryKey } from "@/data";
import type { BalanceLineItem, BalanceSide, BudgetPlan, EntityCode, FinanceInput, IntercompanyFlow, IntercompanyType, Invoice, InvoiceKind, RiskLevel } from "@/data/types";
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
  financeInputId,
  emptyFinanceInput,
  computeFinance,
  FINANCE_INPUT_FIELDS,
  type FinanceInputField,
  budgetPlanId,
  emptyBudgetPlan,
  budgetPlanState,
  BUDGET_PLAN_FIELDS,
  type BudgetPlanField,
  getWorkingCapital,
  getAging,
  scopedInvoices,
  invoiceOpenAmount,
  invoiceStatus,
  emptyInvoice,
  AGING_BUCKETS,
  type AgingBucket,
  type InvoiceStatus,
  formatDate,
  entityCodesForView,
  consolidationReport,
  emptyIntercompanyFlow,
  intercompanyFlowId,
  INTERCOMPANY_TYPES,
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
import Kostenstellen from "./Kostenstellen";

const TAB_DEFS = [
  { value: "overview", navKey: "finanzen", labelKey: "tab_overview", testid: "tab-overview" },
  { value: "data", navKey: "finanzen", labelKey: "tab_finance_data", testid: "tab-finance-data" },
  { value: "gv", navKey: "gewinnverlust", labelKey: "gewinnverlust", testid: "tab-gv" },
  { value: "umsatz", navKey: "umsatz", labelKey: "umsatz", testid: "tab-umsatz" },
  { value: "belege", navKey: "belege", labelKey: "belege", testid: "tab-belege" },
  { value: "bs", navKey: "finanzen", labelKey: "tab_balance", testid: "tab-balance" },
  { value: "wc", navKey: "finanzen", labelKey: "tab_working_capital", testid: "tab-working-capital" },
  { value: "kostenstellen", navKey: "kostenstellen", labelKey: "kostenstellen", testid: "tab-kostenstellen" },
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

function FinanzdatenTab() {
  const { t } = useTranslation();
  const { currency, number } = useFormat();
  const selectedEntity = useAppStore((s) => s.selectedEntity);
  const period = useAppStore((s) => s.period);
  const entities = useAppStore((s) => s.entities);
  const financeInputs = useAppStore((s) => s.financeInputs);
  const upsertFinanceInput = useAppStore((s) => s.upsertFinanceInput);
  const logAction = useAppStore((s) => s.logAction);
  const role = useAppStore((s) => s.currentUser.role);
  const canEdit = can(role, "finanzdaten:edit");

  const isGroup = isGroupView(selectedEntity);
  // Real figures are always entered per firm; a group view lets the user pick
  // which member firm to maintain (the group itself is derived, never stored).
  const memberFirms = entities.filter(
    (e) => !e.archived && (isGroup ? groupViewKey(e.groupId) === selectedEntity : e.code === selectedEntity),
  );

  const [firm, setFirm] = useState<EntityCode | "">("");
  const activeFirm: EntityCode | "" = memberFirms.some((e) => e.code === firm)
    ? firm
    : memberFirms[0]?.code ?? "";

  const [form, setForm] = useState<Record<FinanceInputField, string>>(
    () => Object.fromEntries(FINANCE_INPUT_FIELDS.map((f) => [f, "0"])) as Record<FinanceInputField, string>,
  );
  const [risk, setRisk] = useState<RiskLevel>("Niedrig");

  // Load the existing record for the selected firm/period (or a blank one) into
  // the form whenever the firm, period, or synced data changes.
  useEffect(() => {
    if (!activeFirm) return;
    const existing =
      financeInputs.find((i) => i.id === financeInputId(activeFirm, period)) ??
      emptyFinanceInput(activeFirm, period);
    setForm(
      Object.fromEntries(FINANCE_INPUT_FIELDS.map((f) => [f, String(existing[f])])) as Record<
        FinanceInputField,
        string
      >,
    );
    setRisk(existing.riskLevel);
  }, [activeFirm, period, financeInputs]);

  if (!activeFirm) {
    return (
      <Card className="glass-card">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {t("fd_no_firms")}
        </CardContent>
      </Card>
    );
  }

  const draft: FinanceInput = {
    ...emptyFinanceInput(activeFirm, period),
    ...(Object.fromEntries(
      FINANCE_INPUT_FIELDS.map((f) => [f, Number(form[f]) || 0]),
    ) as Record<FinanceInputField, number>),
    riskLevel: risk,
  };
  const preview = computeFinance(activeFirm, draft);

  const save = () => {
    if (!canEdit) {
      toast.error(t("no_permission"));
      return;
    }
    upsertFinanceInput(draft);
    logAction(t("fd_log_save"), `${activeFirm} · ${period}`);
    toast.success(t("fd_saved"));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="glass-card lg:col-span-2">
        <CardHeader>
          <CardTitle>{t("fd_title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("fd_subtitle")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("fd_firm")}</Label>
              <Select value={activeFirm} onValueChange={(v) => setFirm(v as EntityCode)} disabled={memberFirms.length <= 1}>
                <SelectTrigger data-testid="select-finance-firm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {memberFirms.map((e) => (
                    <SelectItem key={e.code} value={e.code}>{e.code} · {e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("fd_period")}</Label>
              <Input value={period} disabled data-testid="input-finance-period" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {FINANCE_INPUT_FIELDS.map((f) => (
              <div key={f} className="space-y-1.5">
                <Label>{t(`fd_${f}`)}</Label>
                <Input
                  type="number"
                  value={form[f]}
                  disabled={!canEdit}
                  onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                  data-testid={`input-finance-${f}`}
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>{t("fd_riskLevel")}</Label>
              <Select value={risk} onValueChange={(v) => setRisk(v as RiskLevel)} disabled={!canEdit}>
                <SelectTrigger data-testid="select-finance-risk"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Niedrig">{t("low")}</SelectItem>
                  <SelectItem value="Mittel">{t("medium")}</SelectItem>
                  <SelectItem value="Hoch">{t("high")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={save} disabled={!canEdit} data-testid="button-save-finance">{t("common_save")}</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card h-fit">
        <CardHeader><CardTitle>{t("fd_preview")}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <PreviewRow label={t("kpi_revenue")} value={currency(preview.revenue)} />
          <PreviewRow label={t("kpi_ebitda")} value={currency(preview.ebitda)} sub={`${number(Math.round(preview.ebitdaMargin * 10) / 10)} %`} />
          <PreviewRow label={t("kpi_net")} value={currency(preview.netProfit)} />
          <PreviewRow label={t("kpi_cash")} value={currency(preview.cash)} sub={`${number(Math.round(preview.cashRunway * 10) / 10)} ${t("fd_months")}`} />
          <PreviewRow label={t("kpi_open_invoices")} value={currency(preview.openInvoices)} sub={`${number(preview.openInvoicesCount)}`} />
        </CardContent>
      </Card>
    </div>
  );
}

// Plan/budget entry dialog. Plans are kept per firm and period; a group view
// lets the user pick which member firm's plan to maintain (groups aggregate).
function BudgetEditDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const selectedEntity = useAppStore((s) => s.selectedEntity);
  const period = useAppStore((s) => s.period);
  const entities = useAppStore((s) => s.entities);
  const budgetPlans = useAppStore((s) => s.budgetPlans);
  const upsertBudgetPlan = useAppStore((s) => s.upsertBudgetPlan);
  const logAction = useAppStore((s) => s.logAction);
  const role = useAppStore((s) => s.currentUser.role);
  const canEdit = can(role, "finanzdaten:edit");

  const isGroup = isGroupView(selectedEntity);
  const memberFirms = entities.filter(
    (e) => !e.archived && (isGroup ? groupViewKey(e.groupId) === selectedEntity : e.code === selectedEntity),
  );

  const [firm, setFirm] = useState<EntityCode | "">("");
  const activeFirm: EntityCode | "" = memberFirms.some((e) => e.code === firm)
    ? firm
    : memberFirms[0]?.code ?? "";

  const [form, setForm] = useState<Record<BudgetPlanField, string>>(
    () => Object.fromEntries(BUDGET_PLAN_FIELDS.map((f) => [f, "0"])) as Record<BudgetPlanField, string>,
  );

  // Load the existing plan for the selected firm/period (or a blank one) into the
  // form whenever the firm, period, synced data, or open state changes.
  useEffect(() => {
    if (!activeFirm) return;
    const existing =
      budgetPlans.find((p) => p.id === budgetPlanId(activeFirm, period)) ??
      emptyBudgetPlan(activeFirm, period);
    setForm(
      Object.fromEntries(BUDGET_PLAN_FIELDS.map((f) => [f, String(existing[f])])) as Record<
        BudgetPlanField,
        string
      >,
    );
  }, [activeFirm, period, budgetPlans, open]);

  const save = () => {
    if (!canEdit) {
      toast.error(t("no_permission"));
      return;
    }
    if (!activeFirm) return;
    const draft: BudgetPlan = {
      ...emptyBudgetPlan(activeFirm, period),
      ...(Object.fromEntries(
        BUDGET_PLAN_FIELDS.map((f) => [f, Number(form[f]) || 0]),
      ) as Record<BudgetPlanField, number>),
    };
    upsertBudgetPlan(draft);
    logAction(t("budget_log_save"), `${activeFirm} · ${period}`);
    toast.success(t("budget_saved"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("budget_plan_title")}</DialogTitle>
          <p className="text-sm text-muted-foreground">{t("budget_plan_subtitle")}</p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("fd_firm")}</Label>
              <Select value={activeFirm} onValueChange={(v) => setFirm(v as EntityCode)} disabled={memberFirms.length <= 1}>
                <SelectTrigger data-testid="select-budget-firm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {memberFirms.map((e) => (
                    <SelectItem key={e.code} value={e.code}>{e.code} · {e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("fd_period")}</Label>
              <Input value={period} disabled data-testid="input-budget-period" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {BUDGET_PLAN_FIELDS.map((f) => (
              <div key={f} className="space-y-1.5">
                <Label>{t(`fd_${f}`)}</Label>
                <Input
                  type="number"
                  value={form[f]}
                  disabled={!canEdit}
                  onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                  data-testid={`input-budget-${f}`}
                />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={save} disabled={!canEdit || !activeFirm} data-testid="button-save-budget">{t("common_save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Intercompany flow editor. Flows are kept per group + period; the consolidation
// view eliminates those whose both ends sit inside the active group.
function IntercompanyEditDialog({
  open,
  onOpenChange,
  groupView,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  groupView: string;
}) {
  const { t } = useTranslation();
  const { currency } = useFormat();
  const period = useAppStore((s) => s.period);
  const entities = useAppStore((s) => s.entities);
  const flows = useAppStore((s) => s.intercompanyFlows);
  const addFlow = useAppStore((s) => s.addIntercompanyFlow);
  const updateFlow = useAppStore((s) => s.updateIntercompanyFlow);
  const removeFlow = useAppStore((s) => s.removeIntercompanyFlow);
  const logAction = useAppStore((s) => s.logAction);
  const role = useAppStore((s) => s.currentUser.role);
  const canEdit = can(role, "finanzdaten:edit");

  const codes = new Set(entityCodesForView(groupView as EntityCode));
  const memberFirms = entities.filter((e) => !e.archived && codes.has(e.code));
  const rows = flows.filter((f) => f.period === period && codes.has(f.fromEntity) && codes.has(f.toEntity));

  const addRow = () => {
    if (!canEdit) {
      toast.error(t("no_permission"));
      return;
    }
    const from = memberFirms[0]?.code;
    const to = memberFirms[1]?.code ?? memberFirms[0]?.code;
    if (!from || !to) return;
    addFlow({ id: intercompanyFlowId(), ...emptyIntercompanyFlow(period, from, to) });
  };

  const del = (f: IntercompanyFlow) => {
    removeFlow(f.id);
    logAction(t("ic_log_delete"), `${f.fromEntity}→${f.toEntity} · ${period}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("ic_title")}</DialogTitle>
          <p className="text-sm text-muted-foreground">{t("ic_subtitle")} · {labelForView(groupView)} · {period}</p>
        </DialogHeader>
        <div className="space-y-3">
          {memberFirms.length < 2 && (
            <p className="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">{t("ic_need_two_firms")}</p>
          )}
          {rows.length === 0 && memberFirms.length >= 2 && (
            <p className="text-sm text-muted-foreground">{t("ic_empty")}</p>
          )}
          {rows.map((f) => (
            <div key={f.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-end gap-2" data-testid={`ic-row-${f.id}`}>
              <div className="space-y-1">
                <Label className="text-xs">{t("ic_from")}</Label>
                <Select value={f.fromEntity} onValueChange={(v) => updateFlow(f.id, { fromEntity: v as EntityCode })} disabled={!canEdit}>
                  <SelectTrigger className="h-9" data-testid={`select-ic-from-${f.id}`}><SelectValue /></SelectTrigger>
                  <SelectContent>{memberFirms.map((e) => <SelectItem key={e.code} value={e.code}>{e.code}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("ic_to")}</Label>
                <Select value={f.toEntity} onValueChange={(v) => updateFlow(f.id, { toEntity: v as EntityCode })} disabled={!canEdit}>
                  <SelectTrigger className="h-9" data-testid={`select-ic-to-${f.id}`}><SelectValue /></SelectTrigger>
                  <SelectContent>{memberFirms.map((e) => <SelectItem key={e.code} value={e.code}>{e.code}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("ic_type")}</Label>
                <Select value={f.type} onValueChange={(v) => updateFlow(f.id, { type: v as IntercompanyType })} disabled={!canEdit}>
                  <SelectTrigger className="h-9" data-testid={`select-ic-type-${f.id}`}><SelectValue /></SelectTrigger>
                  <SelectContent>{INTERCOMPANY_TYPES.map((ty) => <SelectItem key={ty} value={ty}>{t(`ic_type_${ty}`)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("ic_amount")}</Label>
                <Input
                  type="number"
                  className="h-9"
                  value={String(f.amount)}
                  disabled={!canEdit}
                  min={0}
                  onChange={(e) => updateFlow(f.id, { amount: Math.max(0, Number(e.target.value) || 0) })}
                  data-testid={`input-ic-amount-${f.id}`}
                />
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" disabled={!canEdit} onClick={() => del(f)} data-testid={`button-ic-delete-${f.id}`}>
                <Trash2 className="h-4 w-4" />
              </Button>
              {f.fromEntity === f.toEntity && (
                <p className="col-span-full -mt-1 text-xs text-destructive">{t("ic_same_firm_warning")}</p>
              )}
            </div>
          ))}
          {rows.length > 0 && (
            <div className="flex justify-between border-t border-border/50 pt-2 text-sm font-medium">
              <span>{t("ic_elimination_total")}</span>
              <span className="tabular-nums">{currency(rows.filter((f) => f.fromEntity !== f.toEntity).reduce((a, f) => a + f.amount, 0))}</span>
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={addRow} disabled={!canEdit || memberFirms.length < 2} data-testid="button-ic-add">
            <Plus className="mr-1.5 h-4 w-4" />
            {t("ic_add_flow")}
          </Button>
          <Button onClick={() => onOpenChange(false)} data-testid="button-ic-done">{t("ic_done")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/40 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">
        {value}
        {sub && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{sub}</span>}
      </span>
    </div>
  );
}

const INVOICE_KINDS: InvoiceKind[] = ["receivable", "payable"];

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  bezahlt: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  teilbezahlt: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  offen: "bg-muted text-muted-foreground",
  ueberfaellig: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
};

// Create/edit dialog for a single receivable or payable invoice (Beleg). A group
// view lets the user pick which member firm the invoice belongs to.
function InvoiceDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Invoice | null;
}) {
  const { t } = useTranslation();
  const selectedEntity = useAppStore((s) => s.selectedEntity);
  const entities = useAppStore((s) => s.entities);
  const addInvoice = useAppStore((s) => s.addInvoice);
  const updateInvoice = useAppStore((s) => s.updateInvoice);
  const logAction = useAppStore((s) => s.logAction);
  const role = useAppStore((s) => s.currentUser.role);
  const canEdit = can(role, "finanzdaten:edit");

  const isGroup = isGroupView(selectedEntity);
  const memberFirms = entities.filter(
    (e) => !e.archived && (isGroup ? groupViewKey(e.groupId) === selectedEntity : e.code === selectedEntity),
  );

  const [form, setForm] = useState<Invoice>(() => emptyInvoice("receivable", memberFirms[0]?.code ?? ""));

  // Load the invoice being edited (or a fresh blank one scoped to the first
  // member firm) whenever the dialog opens or the target changes.
  useEffect(() => {
    if (!open) return;
    setForm(editing ? { ...editing } : emptyInvoice("receivable", memberFirms[0]?.code ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const set = (patch: Partial<Invoice>) => setForm((f) => ({ ...f, ...patch }));

  const save = () => {
    if (!canEdit) {
      toast.error(t("no_permission"));
      return;
    }
    if (!form.entity) {
      toast.error(t("inv_need_firm"));
      return;
    }
    if (!form.counterparty.trim() || !form.invoiceNumber.trim()) {
      toast.error(t("inv_need_fields"));
      return;
    }
    const draft: Invoice = {
      ...form,
      amount: Number(form.amount) || 0,
      paidAmount: Number(form.paidAmount) || 0,
    };
    if (editing) {
      const { id, ...patch } = draft;
      updateInvoice(id, patch);
      logAction(t("inv_log_update"), `${draft.entity} · ${draft.invoiceNumber}`);
    } else {
      addInvoice(draft);
      logAction(t("inv_log_create"), `${draft.entity} · ${draft.invoiceNumber}`);
    }
    toast.success(t("inv_saved"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? t("inv_edit_title") : t("inv_new_title")}</DialogTitle>
          <p className="text-sm text-muted-foreground">{t("inv_dialog_subtitle")}</p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("inv_kind")}</Label>
              <Select value={form.kind} onValueChange={(v) => set({ kind: v as InvoiceKind })}>
                <SelectTrigger data-testid="select-invoice-kind"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INVOICE_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>{t(`inv_kind_${k}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("fd_firm")}</Label>
              <Select
                value={form.entity}
                onValueChange={(v) => set({ entity: v as EntityCode })}
                disabled={memberFirms.length <= 1}
              >
                <SelectTrigger data-testid="select-invoice-firm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {memberFirms.map((e) => (
                    <SelectItem key={e.code} value={e.code}>{e.code} · {e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("inv_counterparty")}</Label>
              <Input
                value={form.counterparty}
                disabled={!canEdit}
                onChange={(e) => set({ counterparty: e.target.value })}
                data-testid="input-invoice-counterparty"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("inv_number")}</Label>
              <Input
                value={form.invoiceNumber}
                disabled={!canEdit}
                onChange={(e) => set({ invoiceNumber: e.target.value })}
                data-testid="input-invoice-number"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("inv_issue_date")}</Label>
              <Input
                type="date"
                value={form.issueDate}
                disabled={!canEdit}
                onChange={(e) => set({ issueDate: e.target.value })}
                data-testid="input-invoice-issue"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("inv_due_date")}</Label>
              <Input
                type="date"
                value={form.dueDate}
                disabled={!canEdit}
                onChange={(e) => set({ dueDate: e.target.value })}
                data-testid="input-invoice-due"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("inv_amount")}</Label>
              <Input
                type="number"
                value={String(form.amount)}
                disabled={!canEdit}
                onChange={(e) => set({ amount: Number(e.target.value) })}
                data-testid="input-invoice-amount"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("inv_paid_amount")}</Label>
              <Input
                type="number"
                value={String(form.paidAmount)}
                disabled={!canEdit}
                onChange={(e) => set({ paidAmount: Number(e.target.value) })}
                data-testid="input-invoice-paid"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={save} disabled={!canEdit} data-testid="button-save-invoice">{t("common_save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AgingCard({ kind }: { kind: InvoiceKind }) {
  const { t } = useTranslation();
  const { currency } = useFormat();
  const selectedEntity = useAppStore((s) => s.selectedEntity);
  // Re-read invoices so the report recomputes when the store changes.
  useAppStore((s) => s.invoices);
  const report = getAging(selectedEntity, kind);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {kind === "receivable" ? t("inv_aging_receivable") : t("inv_aging_payable")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("inv_aging_bucket")}</TableHead>
              <TableHead className="text-right">{t("inv_aging_count")}</TableHead>
              <TableHead className="text-right">{t("inv_aging_amount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.buckets.map((b) => (
              <TableRow key={b.bucket} data-testid={`aging-${kind}-${b.bucket}`}>
                <TableCell className={b.bucket === "d90plus" && b.amount > 0 ? "font-medium text-rose-600 dark:text-rose-400" : ""}>
                  {t(`aging_${b.bucket}` as const)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{b.count}</TableCell>
                <TableCell className="text-right tabular-nums">{currency(b.amount)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2">
              <TableCell className="font-semibold">{t("inv_aging_total")}</TableCell>
              <TableCell />
              <TableCell className="text-right font-semibold tabular-nums">{currency(report.total)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function WorkingCapitalTab() {
  const { t } = useTranslation();
  const { currency } = useFormat();
  const selectedEntity = useAppStore((s) => s.selectedEntity);
  const period = useAppStore((s) => s.period);
  const invoices = useAppStore((s) => s.invoices);
  const removeInvoice = useAppStore((s) => s.removeInvoice);
  const logAction = useAppStore((s) => s.logAction);
  const role = useAppStore((s) => s.currentUser.role);
  const canEdit = can(role, "finanzdaten:edit");
  // Delete is Admin-only, mirroring the server-side policy (Mitarbeiter never
  // delete) so a Mitarbeiter never sees an action that the API would reject.
  const canDelete = can(role, "finanzdaten:delete");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const wc = getWorkingCapital(selectedEntity, period);
  // Both kinds in scope, open items first then most overdue, for the register.
  const list = [...scopedInvoices(selectedEntity, "receivable"), ...scopedInvoices(selectedEntity, "payable")].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );
  // Referenced so the register recomputes on store changes.
  void invoices;

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (inv: Invoice) => {
    setEditing(inv);
    setDialogOpen(true);
  };
  const confirmDelete = () => {
    if (!deleteId) return;
    const inv = list.find((i) => i.id === deleteId);
    removeInvoice(deleteId);
    if (inv) logAction(t("inv_log_delete"), `${inv.entity} · ${inv.invoiceNumber}`);
    toast.success(t("inv_deleted"));
    setDeleteId(null);
  };

  const kpis: { key: string; label: string; value: string; sub?: string; danger?: boolean }[] = [
    { key: "dso", label: t("inv_dso"), value: t("inv_days", { n: wc.dso }) },
    { key: "dpo", label: t("inv_dpo"), value: t("inv_days", { n: wc.dpo }) },
    { key: "ccc", label: t("inv_ccc"), value: t("inv_days", { n: wc.ccc }) },
    { key: "wc", label: t("inv_working_capital"), value: currency(wc.workingCapital) },
    {
      key: "ar",
      label: t("inv_open_receivables"),
      value: currency(wc.openReceivables),
      sub: wc.overdueReceivables > 0 ? t("inv_overdue_sub", { amount: currency(wc.overdueReceivables) }) : undefined,
      danger: wc.overdueReceivables > 0,
    },
    {
      key: "ap",
      label: t("inv_open_payables"),
      value: currency(wc.openPayables),
      sub: wc.overduePayables > 0 ? t("inv_overdue_sub", { amount: currency(wc.overduePayables) }) : undefined,
      danger: wc.overduePayables > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.key} data-testid={`wc-kpi-${k.key}`}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{k.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{k.value}</p>
              {k.sub && (
                <p className={`mt-1 text-xs ${k.danger ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}>
                  {k.sub}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AgingCard kind="receivable" />
        <AgingCard kind="payable" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">{t("inv_register")}</CardTitle>
          {canEdit && (
            <Button size="sm" onClick={openCreate} data-testid="button-new-invoice">
              <Plus className="mr-1.5 h-4 w-4" />
              {t("inv_new")}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("inv_empty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("inv_kind")}</TableHead>
                  <TableHead>{t("fd_firm")}</TableHead>
                  <TableHead>{t("inv_counterparty")}</TableHead>
                  <TableHead>{t("inv_number")}</TableHead>
                  <TableHead>{t("inv_due_date")}</TableHead>
                  <TableHead className="text-right">{t("inv_amount")}</TableHead>
                  <TableHead className="text-right">{t("inv_open")}</TableHead>
                  <TableHead>{t("inv_status")}</TableHead>
                  {(canEdit || canDelete) && <TableHead className="text-right">{t("actions")}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((inv) => {
                  const status = invoiceStatus(inv);
                  return (
                    <TableRow key={inv.id} data-testid={`invoice-row-${inv.id}`}>
                      <TableCell>{t(`inv_kind_${inv.kind}`)}</TableCell>
                      <TableCell>{inv.entity}</TableCell>
                      <TableCell>{inv.counterparty}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.invoiceNumber}</TableCell>
                      <TableCell>{formatDate(inv.dueDate)}</TableCell>
                      <TableCell className="text-right tabular-nums">{currency(inv.amount)}</TableCell>
                      <TableCell className="text-right tabular-nums">{currency(invoiceOpenAmount(inv))}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[status]}`}>
                          {t(`inv_status_${status}` as const)}
                        </span>
                      </TableCell>
                      {(canEdit || canDelete) && (
                        <TableCell className="text-right">
                          {canEdit && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(inv)} data-testid={`button-edit-invoice-${inv.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600" onClick={() => setDeleteId(inv.id)} data-testid={`button-delete-invoice-${inv.id}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <p className="mt-3 text-xs text-muted-foreground">{t("inv_disclaimer")}</p>
        </CardContent>
      </Card>

      <InvoiceDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("inv_delete_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("inv_delete_confirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} data-testid="button-confirm-delete-invoice">{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function Finanzen() {
  const { selectedEntity, entities, bankTransactions, allowedNav, period, financeInputs, currentUser, intercompanyFlows } = useAppStore();
  const { t } = useTranslation();
  const { currency, compact, number } = useFormat();
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [icOpen, setIcOpen] = useState(false);
  const canEditBudget = can(currentUser.role, "finanzdaten:edit");
  const planState = budgetPlanState(selectedEntity, period);
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
  // Consolidation: gross member sums vs. Konzern after eliminating intra-group
  // trade. Operating costs = revenue − EBITDA (both drop by the same amount).
  const consol = consolidationReport(
    intercompanyFlows,
    groupView,
    period,
    group.revenue,
    group.revenue - group.ebitda,
  );
  // Only the active group's firms belong in the consolidation reconciliation.
  const groupCodes = new Set(entityCodesForView(groupView));
  const groupComparison = comparison.filter((c) => groupCodes.has(c.code));

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

        <TabsContent value="data">
          <FinanzdatenTab />
        </TabsContent>

        <TabsContent value="bs">
          <BilanzTab />
        </TabsContent>

        <TabsContent value="wc">
          <WorkingCapitalTab />
        </TabsContent>

        <TabsContent value="kostenstellen">
          <Kostenstellen />
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
                  {groupComparison.map((c) => (
                    <TableRow key={c.code}>
                      <TableCell className="font-medium">{c.code}</TableCell>
                      <TableCell className="text-right">{compact(c.revenue)}</TableCell>
                      <TableCell className="text-right">{compact(c.ebitda)}</TableCell>
                      <TableCell className="text-right">{compact(c.profit)}</TableCell>
                      <TableCell className="text-right">{compact(c.liquidity)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-medium text-muted-foreground">
                    <TableCell>{t("ic_member_sum")}</TableCell>
                    <TableCell className="text-right">{compact(consol.grossRevenue)}</TableCell>
                    <TableCell className="text-right">{compact(group.ebitda)}</TableCell>
                    <TableCell className="text-right">{compact(group.netProfit)}</TableCell>
                    <TableCell className="text-right">{compact(group.cash)}</TableCell>
                  </TableRow>
                  <TableRow className="text-destructive">
                    <TableCell>{t("ic_elimination")}</TableCell>
                    <TableCell className="text-right">−{compact(consol.eliminationTotal)}</TableCell>
                    <TableCell className="text-right">0</TableCell>
                    <TableCell className="text-right">0</TableCell>
                    <TableCell className="text-right">0</TableCell>
                  </TableRow>
                  <TableRow className="bg-primary/5 font-semibold">
                    <TableCell>{labelForView(groupView)}</TableCell>
                    <TableCell className="text-right">{compact(consol.consolidatedRevenue)}</TableCell>
                    <TableCell className="text-right">{compact(group.ebitda)}</TableCell>
                    <TableCell className="text-right">{compact(group.netProfit)}</TableCell>
                    <TableCell className="text-right">{compact(group.cash)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle><Term k="konsolidierung">{t("ic_title")}</Term></CardTitle>
                <p className="text-sm text-muted-foreground">{t("ic_card_subtitle")}</p>
              </div>
              {canEditBudget && (
                <Button size="sm" variant="outline" onClick={() => setIcOpen(true)} data-testid="button-edit-intercompany">
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  {t("ic_manage")}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {consol.internal.length === 0 ? (
                <p className="text-sm text-muted-foreground" data-testid="ic-empty-state">{t("ic_none_for_period")}</p>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("ic_from")}</TableHead>
                        <TableHead>{t("ic_to")}</TableHead>
                        <TableHead>{t("ic_type")}</TableHead>
                        <TableHead className="text-right">{t("ic_amount")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consol.internal.map((f) => (
                        <TableRow key={f.id} data-testid={`ic-flow-${f.id}`}>
                          <TableCell className="font-medium">{f.fromEntity}</TableCell>
                          <TableCell>{f.toEntity}</TableCell>
                          <TableCell>{t(`ic_type_${f.type}`)}</TableCell>
                          <TableCell className="text-right tabular-nums">{currency(f.amount)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-primary/5 font-semibold">
                        <TableCell colSpan={3}>{t("ic_elimination_total")}</TableCell>
                        <TableCell className="text-right tabular-nums">{currency(consol.eliminationTotal)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  {consol.byType.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {consol.byType.map((b) => (
                        <span key={b.type} className="rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
                          {t(`ic_type_${b.type}`)}: <span className="font-medium text-foreground tabular-nums">{compact(b.amount)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle><Term k="budget_ist">{t("budget_vs_actual")}</Term></CardTitle>
                {planState === "none" && (
                  <p className="text-xs text-muted-foreground">{t("budget_benchmark_hint")}</p>
                )}
                {planState === "partial" && (
                  <p className="text-xs text-muted-foreground">{t("budget_partial_hint")}</p>
                )}
              </div>
              {canEditBudget && (
                <Button size="sm" variant="outline" onClick={() => setBudgetOpen(true)} data-testid="button-edit-budget">
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  {t("budget_plan_edit")}
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 text-[11px] uppercase tracking-wide text-muted-foreground">
                <span>{t("budget_plan_col")} / {t("budget_actual_col")}</span>
                <span className="text-right">{t("budget_variance")}</span>
                <span className="text-right">%</span>
              </div>
              {budget.map((b) => {
                const pct = b.budget > 0 ? Math.min(150, Math.round((b.actual / b.budget) * 100)) : 0;
                const variance = b.actual - b.budget;
                const variancePct = b.budget > 0 ? Math.round((variance / b.budget) * 100) : 0;
                const isRevenue = b.category === "Umsatzerlöse";
                // Revenue above plan is good; costs above plan are bad.
                const good = isRevenue ? variance >= 0 : variance <= 0;
                const toneText = good ? "text-emerald-600" : "text-destructive";
                const barTone = good ? "[&>div]:bg-emerald-500" : "[&>div]:bg-destructive";
                const sign = variance > 0 ? "+" : "";
                return (
                  <div key={b.category} className="space-y-1.5" data-testid={`budget-${b.category}`}>
                    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 text-sm">
                      <span className="font-medium">{b.category}</span>
                      <span className={`text-right tabular-nums ${toneText}`} data-testid={`budget-variance-${b.category}`}>
                        {sign}{currency(variance)}
                      </span>
                      <span className={`text-right tabular-nums ${toneText}`}>
                        {sign}{variancePct}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                      <span>{currency(b.actual)} {t("budget_actual_col")}</span>
                      <span>{currency(b.budget)} {t("budget_plan_col")}</span>
                    </div>
                    <Progress value={pct} className={barTone} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <BudgetEditDialog open={budgetOpen} onOpenChange={setBudgetOpen} />
          <IntercompanyEditDialog open={icOpen} onOpenChange={setIcOpen} groupView={groupView} />
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
