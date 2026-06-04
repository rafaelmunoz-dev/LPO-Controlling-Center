import { useState } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PageHeader, RiskBadge } from "@/components/shared/page";
import { AiInsight } from "@/components/shared/AiInsight";
import { scopeByEntity, PREMORTEMS, ENTITY_CODES } from "@/data";
import { can } from "@/data/governance";
import type { PreMortem, Risk, EntityCode, RiskLevel } from "@/data/types";
import { ShieldAlert, TrendingUp, TrendingDown, Minus, FlaskConical, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const LEVELS = ["Niedrig", "Mittel", "Hoch"] as const;
const RISK_STATUS = ["Offen", "In Beobachtung", "Geschlossen"] as const;
const TRENDS = ["up", "down", "flat"] as const;

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-destructive" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-emerald-600" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

type RiskForm = Omit<Risk, "id">;
const emptyRisk = (entity: EntityCode): RiskForm => ({ title: "", entity, impact: "Mittel", probability: "Mittel", owner: "", status: "Offen", trend: "flat" });

export default function Risiko() {
  const { t } = useTranslation();
  const { selectedEntity, risks: allRisks, currentUser, addRisk, updateRisk, removeRisk, logAction } = useAppStore();
  const risks = scopeByEntity(allRisks, selectedEntity);
  const premortems = scopeByEntity(PREMORTEMS, selectedEntity);
  const [active, setActive] = useState<PreMortem | null>(null);

  const canCreate = can(currentUser.role, "risiko:create");
  const canEdit = can(currentUser.role, "risiko:edit");
  const canDelete = can(currentUser.role, "risiko:delete");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<RiskForm>(emptyRisk("IMP"));

  const openCreate = () => {
    setEditId(null);
    setForm(emptyRisk(selectedEntity === "MiGu Group Gesamt" ? "IMP" : (selectedEntity as EntityCode)));
    setOpen(true);
  };
  const openEdit = (r: Risk) => { setEditId(r.id); setForm({ ...r }); setOpen(true); };
  const save = () => {
    if (editId ? !canEdit : !canCreate) { toast.error(t("no_permission")); return; }
    if (!form.title.trim()) { toast.error(t("risk_risk")); return; }
    if (editId) {
      updateRisk(editId, form);
      logAction(t("risk_edit"), `${form.title} (${form.entity})`);
      toast.success(t("risk_edit"));
    } else {
      addRisk({ ...form, id: `RK-${Math.floor(Math.random() * 9000 + 1000)}` });
      logAction(t("risk_create"), `${form.title} (${form.entity})`);
      toast.success(t("risk_create"));
    }
    setOpen(false);
  };
  const confirmDelete = () => {
    if (!deleteId) return;
    if (!canDelete) { toast.error(t("no_permission")); return; }
    const r = allRisks.find((x) => x.id === deleteId);
    removeRisk(deleteId);
    logAction(t("common_delete"), `${r?.title ?? deleteId}`);
    toast.success(t("common_delete"));
    setDeleteId(null);
  };

  const cell = (impact: string, prob: string) => risks.filter((r) => r.impact === impact && r.probability === prob);
  const heatColor = (impact: string, prob: string) => {
    const score = (LEVELS.indexOf(impact as typeof LEVELS[number]) + 1) * (LEVELS.indexOf(prob as typeof LEVELS[number]) + 1);
    if (score >= 6) return "bg-destructive/15 border-destructive/30";
    if (score >= 3) return "bg-amber-500/15 border-amber-500/30";
    return "bg-emerald-500/10 border-emerald-500/20";
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("risiko_premortem")} subtitle={t("risk_subtitle")} icon={<ShieldAlert className="h-5 w-5" />}
        actions={canCreate ? <Button onClick={openCreate} data-testid="button-add-risk"><Plus className="h-4 w-4 mr-1.5" /> {t("risk_create")}</Button> : undefined}
      />

      <AiInsight context="risiko" />

      <Tabs defaultValue="register">
        <TabsList>
          <TabsTrigger value="register" data-testid="tab-register">{t("risk_register")}</TabsTrigger>
          <TabsTrigger value="matrix" data-testid="tab-matrix">{t("risk_matrix")}</TabsTrigger>
          <TabsTrigger value="premortem" data-testid="tab-premortem">{t("risk_premortem_tab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="register">
          <Card className="glass-card">
            <CardHeader><CardTitle>{t("risk_register")}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>{t("risk_risk")}</TableHead><TableHead>{t("entity")}</TableHead><TableHead>{t("risk_impact")}</TableHead><TableHead>{t("risk_probability")}</TableHead><TableHead>{t("owner")}</TableHead><TableHead>{t("risk_trend")}</TableHead><TableHead>{t("status")}</TableHead>{(canEdit || canDelete) && <TableHead className="text-right">{t("common_action")}</TableHead>}</TableRow></TableHeader>
                <TableBody>
                  {risks.map((r) => (
                    <TableRow key={r.id} data-testid={`row-risk-${r.id}`}>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell>{r.entity}</TableCell>
                      <TableCell><RiskBadge level={r.impact} /></TableCell>
                      <TableCell><RiskBadge level={r.probability} /></TableCell>
                      <TableCell>{r.owner}</TableCell>
                      <TableCell><TrendIcon trend={r.trend} /></TableCell>
                      <TableCell className="text-muted-foreground">{r.status}</TableCell>
                      {(canEdit || canDelete) && (
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {canEdit && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)} data-testid={`button-edit-risk-${r.id}`}><Pencil className="h-3.5 w-3.5" /></Button>}
                            {canDelete && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(r.id)} data-testid={`button-delete-risk-${r.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {risks.length === 0 && <TableRow><TableCell colSpan={canEdit || canDelete ? 8 : 7} className="text-center text-muted-foreground py-8">{t("risk_empty")}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix">
          <Card className="glass-card">
            <CardHeader><CardTitle>{t("risk_matrix")}</CardTitle><p className="text-sm text-muted-foreground">{t("risk_matrix_desc")}</p></CardHeader>
            <CardContent>
              <div className="grid grid-cols-[auto_repeat(3,1fr)] gap-2">
                <div></div>
                {LEVELS.map((p) => <div key={p} className="text-center text-sm font-medium text-muted-foreground pb-1">{p}</div>)}
                {[...LEVELS].reverse().map((impact) => (
                  <div key={impact} className="contents">
                    <div className="flex items-center text-sm font-medium text-muted-foreground pr-2">{impact}</div>
                    {LEVELS.map((prob) => {
                      const items = cell(impact, prob);
                      return (
                        <div key={prob} className={`min-h-[90px] rounded-xl border p-2 ${heatColor(impact, prob)}`} data-testid={`matrix-${impact}-${prob}`}>
                          {items.map((r) => <div key={r.id} className="text-xs bg-white/70 dark:bg-slate-900/70 rounded px-1.5 py-1 mb-1 truncate" title={r.title}>{r.title}</div>)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500/40" /> {t("risk_legend_minor")}</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-500/40" /> {t("medium")}</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-destructive/40" /> {t("risk_legend_critical")}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="premortem">
          <div className="grid gap-4 md:grid-cols-2">
            {premortems.map((p) => (
              <Card key={p.id} className="glass-card cursor-pointer" onClick={() => setActive(p)} data-testid={`card-premortem-${p.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><FlaskConical className="h-4 w-4 text-primary" /> {p.project}</CardTitle>
                    <Badge variant="outline">{p.entity}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.goal}</p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><span className="text-muted-foreground">{t("risk_most_dangerous")}:</span> <span className="font-medium">{p.mostDangerousRisk}</span></div>
                  <div><span className="text-muted-foreground">{t("risk_early_warnings")}:</span> {p.earlyWarnings}</div>
                  <div className="text-xs text-primary pt-1">{t("risk_view_details")}</div>
                </CardContent>
              </Card>
            ))}
            {premortems.length === 0 && <p className="text-center text-muted-foreground py-8 col-span-2">{t("risk_premortem_empty")}</p>}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {active && (
            <>
              <DialogHeader><DialogTitle>{active.project} · {active.entity}</DialogTitle></DialogHeader>
              <div className="space-y-3 py-1 text-sm">
                {[
                  [t("risk_goal"), active.goal], [t("risk_expected_benefit"), active.expectedBenefit], [t("risk_assumptions"), active.assumptions],
                  [t("risk_what_wrong"), active.whatCouldGoWrong], [t("risk_most_likely"), active.mostLikelyRisk],
                  [t("risk_most_dangerous"), active.mostDangerousRisk], [t("risk_early_warnings"), active.earlyWarnings],
                  [t("risk_countermeasures"), active.countermeasures],
                ].map(([label, val]) => (
                  <div key={label}><div className="text-muted-foreground text-xs uppercase tracking-wide">{label}</div><p className="mt-0.5">{val}</p></div>
                ))}
                <Separator />
                <div className="flex justify-between text-muted-foreground"><span>{t("owner")}: <span className="text-foreground font-medium">{active.owner}</span></span><span>{t("strat_review")}: {active.reviewDate}</span></div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? t("risk_edit") : t("risk_create")}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>{t("risk_risk")}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-risk-title" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("entity")}</Label>
                <Select value={form.entity} onValueChange={(v) => setForm({ ...form, entity: v as EntityCode })}>
                  <SelectTrigger data-testid="select-risk-entity"><SelectValue /></SelectTrigger>
                  <SelectContent>{ENTITY_CODES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>{t("owner")}</Label><Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("risk_impact")}</Label>
                <Select value={form.impact} onValueChange={(v) => setForm({ ...form, impact: v as RiskLevel })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>{t("risk_probability")}</Label>
                <Select value={form.probability} onValueChange={(v) => setForm({ ...form, probability: v as RiskLevel })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("status")}</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof RISK_STATUS[number] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RISK_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>{t("risk_trend")}</Label>
                <Select value={form.trend} onValueChange={(v) => setForm({ ...form, trend: v as typeof TRENDS[number] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TRENDS.map((tr) => <SelectItem key={tr} value={tr}>{tr}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button onClick={save} data-testid="button-save-risk">{t("common_save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("common_delete_confirm_title")}</AlertDialogTitle><AlertDialogDescription>{t("common_delete_confirm_desc")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete-risk">{t("common_delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
