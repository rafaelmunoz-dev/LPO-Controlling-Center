import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/hooks/use-app-context";
import { useFormat } from "@/hooks/use-format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page";
import {
  costCenterReport, costCentersForView, emptyCostCenter,
  defaultFirmForView, entityCodesForView, labelForView,
} from "@/data";
import { can } from "@/data/governance";
import type { CostCenter, EntityCode } from "@/data/types";
import { Layers, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type CCForm = { id: string; entity: EntityCode; code: string; name: string; responsible: string; monthlyBudget: string };

function toForm(cc: CostCenter): CCForm {
  return { id: cc.id, entity: cc.entity, code: cc.code, name: cc.name, responsible: cc.responsible, monthlyBudget: String(cc.monthlyBudget || "") };
}

export default function Kostenstellen() {
  const { t } = useTranslation();
  const { currency, number, percent } = useFormat();
  const {
    costCenters, bankTransactions, purchaseRequests, entities,
    selectedEntity, period, currentUser,
    addCostCenter, updateCostCenter, removeCostCenter, logAction,
  } = useAppStore();

  const canCreate = can(currentUser.role, "kostenstelle:create");
  const canEdit = can(currentUser.role, "kostenstelle:edit");
  const canDelete = can(currentUser.role, "kostenstelle:delete");

  const firmCodes = useMemo(() => {
    const inView = new Set(entityCodesForView(selectedEntity));
    return entities.filter((e) => !e.archived && inView.has(e.code)).map((e) => e.code);
  }, [entities, selectedEntity]);
  const defaultEntity: EntityCode = (defaultFirmForView(selectedEntity) ?? firmCodes[0] ?? "IMP") as EntityCode;

  const visible = costCentersForView(costCenters, selectedEntity);
  const report = useMemo(
    () => costCenterReport(costCenters, bankTransactions, purchaseRequests, selectedEntity, period),
    [costCenters, bankTransactions, purchaseRequests, selectedEntity, period],
  );

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<CCForm>(() => toForm(emptyCostCenter(defaultEntity)));

  const openCreate = () => { setEditId(null); setForm(toForm(emptyCostCenter(defaultEntity))); setOpen(true); };
  const openEdit = (cc: CostCenter) => { setEditId(cc.id); setForm(toForm(cc)); setOpen(true); };

  const save = () => {
    if (editId ? !canEdit : !canCreate) { toast.error(t("no_permission")); return; }
    const code = form.code.trim();
    const name = form.name.trim();
    if (!code || !name) { toast.error(t("cc_code_required")); return; }
    const dupe = costCenters.some(
      (c) => c.entity === form.entity && c.code.toLowerCase() === code.toLowerCase() && c.id !== form.id,
    );
    if (dupe) { toast.error(t("cc_code_exists")); return; }
    const payload = {
      entity: form.entity,
      code,
      name,
      responsible: form.responsible.trim(),
      monthlyBudget: Number(form.monthlyBudget) || 0,
    };
    if (editId) {
      updateCostCenter(editId, payload);
      logAction(t("cc_updated"), `${code} · ${name}`);
      toast.success(t("cc_updated"));
    } else {
      addCostCenter({ id: form.id, ...payload });
      logAction(t("cc_created"), `${code} · ${name}`);
      toast.success(t("cc_created"));
    }
    setOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    if (!canDelete) { toast.error(t("no_permission")); return; }
    const cc = costCenters.find((c) => c.id === deleteId);
    removeCostCenter(deleteId);
    logAction(t("cc_deleted"), cc ? `${cc.code} · ${cc.name}` : deleteId);
    toast.success(t("cc_deleted"));
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("kostenstellen")}
        subtitle={`${t("cc_subtitle")} · ${labelForView(selectedEntity)} · ${period}`}
        icon={<Layers className="h-5 w-5" />}
        actions={canCreate && <Button onClick={openCreate} data-testid="button-new-cc"><Plus className="h-4 w-4 mr-1.5" /> {t("cc_new")}</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary" data-testid="text-cc-count">{number(visible.length)}</div><div className="text-sm text-muted-foreground mt-1">{t("cc_count")}</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{currency(report.totals.budget)}</div><div className="text-sm text-muted-foreground mt-1">{t("cc_total_budget")}</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{currency(report.totals.actual)}</div><div className="text-sm text-muted-foreground mt-1">{t("cc_total_actual")}</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{currency(report.totals.committed)}</div><div className="text-sm text-muted-foreground mt-1">{t("cc_total_committed")}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="analysis">
        <TabsList>
          <TabsTrigger value="analysis" data-testid="tab-cc-analysis">{t("cc_analysis")}</TabsTrigger>
          <TabsTrigger value="master" data-testid="tab-cc-master">{t("cc_master")}</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis">
          <Card className="glass-card">
            <CardHeader><CardTitle>{t("cc_analysis")}</CardTitle></CardHeader>
            <CardContent>
              {report.rows.length === 0 && report.unassignedCount === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">{t("cc_empty_analysis")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("cc_code")}</TableHead>
                      <TableHead>{t("cc_name")}</TableHead>
                      <TableHead className="text-right">{t("cc_budget_period")}</TableHead>
                      <TableHead className="text-right">{t("cc_actual")}</TableHead>
                      <TableHead className="text-right">{t("cc_committed")}</TableHead>
                      <TableHead className="text-right">{t("cc_variance")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.rows.map((r) => {
                      const over = r.variance < 0;
                      return (
                        <TableRow key={r.cc.id} data-testid={`row-cc-analysis-${r.cc.id}`}>
                          <TableCell className="font-mono text-xs">{r.cc.code}</TableCell>
                          <TableCell>
                            <p className="font-medium">{r.cc.name}</p>
                            <p className="text-xs text-muted-foreground">{r.cc.entity}{r.cc.responsible ? ` · ${r.cc.responsible}` : ""} · {number(r.txCount)} {t("cc_tx_count")}</p>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{r.budget > 0 ? currency(r.budget) : "—"}</TableCell>
                          <TableCell className="text-right tabular-nums">{currency(r.actual)}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">{r.committed > 0 ? currency(r.committed) : "—"}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {r.budget > 0 ? (
                              <span className={over ? "text-destructive" : "text-emerald-600"} data-testid={`text-cc-variance-${r.cc.id}`}>
                                {currency(r.variance)} <span className="text-xs">({percent(r.variancePct / 100)})</span>
                              </span>
                            ) : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(report.unassignedCount > 0 || report.unassignedCommittedCount > 0) && (
                      <TableRow className="bg-muted/30" data-testid="row-cc-unassigned">
                        <TableCell className="font-mono text-xs text-muted-foreground">—</TableCell>
                        <TableCell>
                          <p className="font-medium">{t("cc_unassigned")}</p>
                          <p className="text-xs text-muted-foreground">{t("cc_unassigned_hint")} · {number(report.unassignedCount)} {t("cc_tx_count")}</p>
                        </TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right tabular-nums">{report.unassignedActual ? currency(report.unassignedActual) : "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{report.unassignedCommitted ? currency(report.unassignedCommitted) : "—"}</TableCell>
                        <TableCell className="text-right">—</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="master">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("cc_master")}</CardTitle>
                {canCreate && <Button size="sm" onClick={openCreate} data-testid="button-add-cc"><Plus className="h-4 w-4 mr-1.5" /> {t("cc_new")}</Button>}
              </div>
            </CardHeader>
            <CardContent>
              {visible.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">{t("cc_empty")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("cc_code")}</TableHead>
                      <TableHead>{t("cc_name")}</TableHead>
                      <TableHead>{t("entity")}</TableHead>
                      <TableHead>{t("cc_responsible")}</TableHead>
                      <TableHead className="text-right">{t("cc_budget_monthly")}</TableHead>
                      {(canEdit || canDelete) && <TableHead className="text-right">{t("common_action")}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((cc) => (
                      <TableRow key={cc.id} data-testid={`row-cc-${cc.id}`}>
                        <TableCell className="font-mono text-xs">{cc.code}</TableCell>
                        <TableCell className="font-medium">{cc.name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{cc.entity}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{cc.responsible || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{cc.monthlyBudget > 0 ? currency(cc.monthlyBudget) : "—"}</TableCell>
                        {(canEdit || canDelete) && (
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              {canEdit && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(cc)} data-testid={`button-edit-cc-${cc.id}`}><Pencil className="h-3.5 w-3.5" /></Button>}
                              {canDelete && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(cc.id)} data-testid={`button-delete-cc-${cc.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? t("cc_edit") : t("cc_create")}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("cc_code")}</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} data-testid="input-cc-code" /></div>
              <div className="space-y-1.5"><Label>{t("entity")}</Label>
                <Select value={form.entity} onValueChange={(v) => setForm({ ...form, entity: v as EntityCode })}>
                  <SelectTrigger data-testid="select-cc-entity"><SelectValue /></SelectTrigger>
                  <SelectContent>{firmCodes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>{t("cc_name")}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-cc-name" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("cc_responsible")}</Label><Input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} data-testid="input-cc-responsible" /></div>
              <div className="space-y-1.5"><Label>{t("cc_budget_monthly")}</Label><Input type="number" value={form.monthlyBudget} onChange={(e) => setForm({ ...form, monthlyBudget: e.target.value })} data-testid="input-cc-budget" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button onClick={save} data-testid="button-save-cc">{t("common_save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("common_delete_confirm_title")}</AlertDialogTitle><AlertDialogDescription>{t("common_delete_confirm_desc")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete-cc">{t("common_delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
