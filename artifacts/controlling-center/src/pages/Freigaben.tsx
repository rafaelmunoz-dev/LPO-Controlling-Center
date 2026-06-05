import { useState } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader, StatusBadge, statusLabel } from "@/components/shared/page";
import { AiInsight } from "@/components/shared/AiInsight";
import { scopeByEntity, formatCurrency } from "@/data";
import type { Approval } from "@/data/types";
import { CheckSquare, CheckCircle2, XCircle, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { APPROVER_ROLES } from "@/data/governance";
import { useTranslation } from "react-i18next";

export default function Freigaben() {
  const { t } = useTranslation();
  const { selectedEntity, approvals, updateApprovalStatus, currentUser } = useAppStore();
  const list = scopeByEntity(approvals, selectedEntity);
  const canApprove = APPROVER_ROLES.includes(currentUser.role);
  const [active, setActive] = useState<Approval | null>(null);

  const decide = (a: Approval, status: "Freigegeben" | "Abgelehnt") => {
    if (!canApprove) { toast.error(t("no_permission")); return; }
    updateApprovalStatus(a.id, status, currentUser.name);
    if (status === "Freigegeben") toast.success(t("toast_approved", { id: a.id }));
    else toast.error(t("toast_rejected", { id: a.id }));
    setActive(null);
  };

  const open = list.filter((a) => a.status === "Offen" || a.status === "In Prüfung");

  return (
    <div className="space-y-6">
      <PageHeader title={t("freigaben")} subtitle={t("freig_subtitle")} icon={<CheckSquare className="h-5 w-5" />} />

      <AiInsight context="freigaben" />

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: t("total"), value: list.length },
          { label: t("open"), value: open.length },
          { label: t("freig_approved"), value: list.filter((a) => a.status === "Freigegeben").length },
          { label: t("freig_rejected"), value: list.filter((a) => a.status === "Abgelehnt").length },
        ].map((s) => (
          <Card key={s.label} className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{s.value}</div><div className="text-sm text-muted-foreground mt-1">{s.label}</div></CardContent></Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>{t("freig_processes")}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common_id")}</TableHead><TableHead>{t("type")}</TableHead><TableHead>{t("freig_subject")}</TableHead><TableHead>{t("entity")}</TableHead>
                <TableHead className="text-right">{t("amount")}</TableHead><TableHead>{t("freig_submitted_by")}</TableHead><TableHead>{t("status")}</TableHead><TableHead className="text-right">{t("common_action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((a) => (
                <TableRow key={a.id} data-testid={`row-approval-${a.id}`}>
                  <TableCell className="font-mono text-xs">{a.id}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{a.type}</Badge></TableCell>
                  <TableCell className="font-medium">{a.subject}</TableCell>
                  <TableCell>{a.entity}</TableCell>
                  <TableCell className="text-right">{a.amount ? formatCurrency(a.amount) : "—"}</TableCell>
                  <TableCell>{a.requestedBy}</TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setActive(a)} data-testid={`button-review-${a.id}`}>{t("review")}</Button>
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">{t("freig_empty")}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">{active.subject} <StatusBadge status={active.status} /></DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-1 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">{t("type")}</span><div className="font-medium">{active.type}</div></div>
                  <div><span className="text-muted-foreground">{t("entity")}</span><div className="font-medium">{active.entity}</div></div>
                  <div><span className="text-muted-foreground">{t("amount")}</span><div className="font-medium">{active.amount ? formatCurrency(active.amount) : "—"}</div></div>
                  <div><span className="text-muted-foreground">{t("date")}</span><div className="font-medium">{active.date}</div></div>
                  <div><span className="text-muted-foreground">{t("freig_submitted_by")}</span><div className="font-medium">{active.requestedBy}</div></div>
                  <div><span className="text-muted-foreground">{t("freig_reviewer")}</span><div className="font-medium">{active.reviewedBy}</div></div>
                </div>
                <Separator />
                <div><span className="text-muted-foreground">{t("common_justification")}</span><p className="mt-0.5">{active.reason}</p></div>
                <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-amber-700">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /><div><span className="font-medium">{t("freig_risks")}:</span> {active.risks}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("freig_documents")}</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {active.documents.map((d) => <Badge key={d} variant="outline" className="gap-1"><FileText className="h-3 w-3" /> {d}</Badge>)}
                  </div>
                </div>
              </div>
              <DialogFooter>
                {(active.status === "Offen" || active.status === "In Prüfung") ? (
                  canApprove ? (
                    <>
                      <Button variant="outline" className="text-destructive" onClick={() => decide(active, "Abgelehnt")} data-testid="button-dialog-reject"><XCircle className="h-4 w-4 mr-1.5" /> {t("reject")}</Button>
                      <Button onClick={() => decide(active, "Freigegeben")} data-testid="button-dialog-approve"><CheckCircle2 className="h-4 w-4 mr-1.5" /> {t("approve")}</Button>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">{t("no_permission")}</div>
                  )
                ) : (
                  <div className="text-sm text-muted-foreground">{t("freig_decision")}: {statusLabel(t, active.status)}{active.approvedBy ? ` ${t("freig_by")} ${active.approvedBy}` : ""}</div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
