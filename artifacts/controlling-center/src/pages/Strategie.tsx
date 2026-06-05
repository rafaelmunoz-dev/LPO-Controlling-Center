import { useState } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page";
import { AiInsight } from "@/components/shared/AiInsight";
import { scopeByEntity, defaultFirmForView, formatCurrency } from "@/data";
import { can } from "@/data/governance";
import type { EntityCode, StrategyDecision } from "@/data/types";
import { Target, CheckCircle2, TrendingUp, AlertTriangle, Circle, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const EVAL: Record<string, { tone: string; icon: React.ReactNode }> = {
  "Übertroffen": { tone: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: <TrendingUp className="h-3.5 w-3.5" /> },
  "Erfüllt": { tone: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  "Verfehlt": { tone: "bg-destructive/10 text-destructive border-destructive/20", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  "Offen": { tone: "bg-slate-500/10 text-slate-600 border-slate-500/20", icon: <Circle className="h-3.5 w-3.5" /> },
};

const RISK_LEVELS = ["Niedrig", "Mittel", "Hoch"] as const;
const EVALS = ["Offen", "Übertroffen", "Erfüllt", "Verfehlt"] as const;

type FormState = Omit<StrategyDecision, "id" | "budget"> & { budget: string };

const emptyForm = (entity: EntityCode): FormState => ({
  title: "", entity, goal: "", expectedEffect: "", budget: "", risk: "Mittel", owner: "",
  startDate: new Date().toISOString().slice(0, 10), reviewDate: "", expectedKpi: "", actualKpi: "", evaluation: "Offen", learnings: "",
});

export default function Strategie() {
  const { t } = useTranslation();
  const { selectedEntity, strategyDecisions, currentUser, addStrategyDecision, updateStrategyDecision, removeStrategyDecision, logAction, entities } = useAppStore();
  const decisions = scopeByEntity(strategyDecisions, selectedEntity);
  const canCreate = can(currentUser.role, "strategie:create");
  const canEdit = can(currentUser.role, "strategie:edit");
  const canDelete = can(currentUser.role, "strategie:delete");

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(defaultFirmForView(selectedEntity) ?? "IMP"));

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm(defaultFirmForView(selectedEntity) ?? "IMP"));
    setOpen(true);
  };
  const openEdit = (d: StrategyDecision) => {
    setEditId(d.id);
    setForm({ ...d, budget: String(d.budget) });
    setOpen(true);
  };

  const save = () => {
    if (editId ? !canEdit : !canCreate) { toast.error(t("no_permission")); return; }
    if (!form.title.trim()) { toast.error(t("common_title")); return; }
    const payload = { ...form, budget: Number(form.budget) || 0 };
    if (editId) {
      updateStrategyDecision(editId, payload);
      logAction(t("strat_edit"), `${form.title} (${form.entity})`);
      toast.success(t("strat_edit"));
    } else {
      const d: StrategyDecision = { ...payload, id: `SD-${Math.floor(Math.random() * 9000 + 1000)}` };
      addStrategyDecision(d);
      logAction(t("strat_create"), `${form.title} (${form.entity})`);
      toast.success(t("strat_create"));
    }
    setOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    if (!canDelete) { toast.error(t("no_permission")); return; }
    const d = strategyDecisions.find((x) => x.id === deleteId);
    removeStrategyDecision(deleteId);
    logAction(t("common_delete"), `${d?.title ?? deleteId}`);
    toast.success(t("common_delete"));
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("strat_title")}
        subtitle={t("strat_subtitle")}
        icon={<Target className="h-5 w-5" />}
        actions={canCreate ? <Button onClick={openCreate} data-testid="button-add-strategy"><Plus className="h-4 w-4 mr-1.5" /> {t("strat_create")}</Button> : undefined}
      />

      <AiInsight context="strategie" />

      <div className="grid gap-4 sm:grid-cols-4">
        {(["Übertroffen", "Erfüllt", "Verfehlt", "Offen"] as const).map((k) => (
          <Card key={k} className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{decisions.filter((d) => d.evaluation === k).length}</div><div className="text-sm text-muted-foreground mt-1">{k}</div></CardContent></Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {decisions.map((d) => (
          <Card key={d.id} className="glass-card" data-testid={`card-strategy-${d.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{d.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">{d.goal}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className={`gap-1 ${EVAL[d.evaluation].tone}`}>{EVAL[d.evaluation].icon} {d.evaluation}</Badge>
                  {canEdit && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(d)} data-testid={`button-edit-strategy-${d.id}`}><Pencil className="h-3.5 w-3.5" /></Button>}
                  {canDelete && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(d.id)} data-testid={`button-delete-strategy-${d.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">{t("entity")}</span><div className="font-medium">{d.entity}</div></div>
                <div><span className="text-muted-foreground">{t("budget")}</span><div className="font-medium">{formatCurrency(d.budget)}</div></div>
                <div><span className="text-muted-foreground">{t("strat_expected_kpi")}</span><div className="font-medium">{d.expectedKpi}</div></div>
                <div><span className="text-muted-foreground">{t("strat_actual_kpi")}</span><div className="font-medium">{d.actualKpi}</div></div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3"><span className="text-muted-foreground text-xs uppercase tracking-wide">{t("strat_learnings")}</span><p className="mt-0.5">{d.learnings}</p></div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>{t("strat_owner_label")}: {d.owner}</span><span>{t("strat_review")}: {d.reviewDate}</span></div>
            </CardContent>
          </Card>
        ))}
        {decisions.length === 0 && <p className="text-center text-muted-foreground py-8 col-span-2">{t("strat_empty")}</p>}
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>{t("strat_overview")}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>{t("strat_decision")}</TableHead><TableHead>{t("entity")}</TableHead><TableHead>{t("strat_expected_effect")}</TableHead><TableHead className="text-right">{t("budget")}</TableHead><TableHead>{t("strat_evaluation")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {decisions.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.title}</TableCell>
                  <TableCell>{d.entity}</TableCell>
                  <TableCell>{d.expectedEffect}</TableCell>
                  <TableCell className="text-right">{formatCurrency(d.budget)}</TableCell>
                  <TableCell><Badge variant="outline" className={EVAL[d.evaluation].tone}>{d.evaluation}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? t("strat_edit") : t("strat_create")}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>{t("strat_decision")}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-strategy-title" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("entity")}</Label>
                <Select value={form.entity} onValueChange={(v) => setForm({ ...form, entity: v as EntityCode })}>
                  <SelectTrigger data-testid="select-strategy-entity"><SelectValue /></SelectTrigger>
                  <SelectContent>{entities.filter((e) => !e.archived).map((e) => <SelectItem key={e.code} value={e.code}>{e.code}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>{t("budget")}</Label><Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} data-testid="input-strategy-budget" /></div>
            </div>
            <div className="space-y-1.5"><Label>{t("risk_goal")}</Label><Textarea value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("strat_expected_effect")}</Label><Input value={form.expectedEffect} onChange={(e) => setForm({ ...form, expectedEffect: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("strat_expected_kpi")}</Label><Input value={form.expectedKpi} onChange={(e) => setForm({ ...form, expectedKpi: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>{t("strat_actual_kpi")}</Label><Input value={form.actualKpi} onChange={(e) => setForm({ ...form, actualKpi: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("owner")}</Label><Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>{t("strat_start")}</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("strat_review")}</Label><Input type="date" value={form.reviewDate} onChange={(e) => setForm({ ...form, reviewDate: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>{t("risk_impact")}</Label>
                <Select value={form.risk} onValueChange={(v) => setForm({ ...form, risk: v as typeof RISK_LEVELS[number] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RISK_LEVELS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("strat_evaluation")}</Label>
                <Select value={form.evaluation} onValueChange={(v) => setForm({ ...form, evaluation: v as typeof EVALS[number] })}>
                  <SelectTrigger data-testid="select-strategy-eval"><SelectValue /></SelectTrigger>
                  <SelectContent>{EVALS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>{t("strat_learnings")}</Label><Textarea value={form.learnings} onChange={(e) => setForm({ ...form, learnings: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button onClick={save} data-testid="button-save-strategy">{t("common_save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("common_delete_confirm_title")}</AlertDialogTitle><AlertDialogDescription>{t("common_delete_confirm_desc")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete-strategy">{t("common_delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
