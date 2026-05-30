import { useState } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader, StatusBadge } from "@/components/shared/page";
import { scopeByEntity, formatCurrency } from "@/data";
import type { Approval } from "@/data/types";
import { CheckSquare, CheckCircle2, XCircle, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function Freigaben() {
  const { selectedEntity, approvals, updateApprovalStatus, currentUser } = useAppStore();
  const list = scopeByEntity(approvals, selectedEntity);
  const [active, setActive] = useState<Approval | null>(null);

  const decide = (a: Approval, status: "Freigegeben" | "Abgelehnt") => {
    updateApprovalStatus(a.id, status, currentUser.name);
    if (status === "Freigegeben") toast.success(`${a.id} freigegeben.`);
    else toast.error(`${a.id} abgelehnt.`);
    setActive(null);
  };

  const open = list.filter((a) => a.status === "Offen" || a.status === "In Prüfung");

  return (
    <div className="space-y-6">
      <PageHeader title="Freigaben" subtitle="Genehmigungsworkflows" icon={<CheckSquare className="h-5 w-5" />} />

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Gesamt", value: list.length },
          { label: "Offen", value: open.length },
          { label: "Freigegeben", value: list.filter((a) => a.status === "Freigegeben").length },
          { label: "Abgelehnt", value: list.filter((a) => a.status === "Abgelehnt").length },
        ].map((s) => (
          <Card key={s.label} className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{s.value}</div><div className="text-sm text-muted-foreground mt-1">{s.label}</div></CardContent></Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>Freigabeprozesse</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead><TableHead>Typ</TableHead><TableHead>Betreff</TableHead><TableHead>Entität</TableHead>
                <TableHead className="text-right">Betrag</TableHead><TableHead>Eingereicht von</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aktion</TableHead>
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
                    <Button size="sm" variant="outline" onClick={() => setActive(a)} data-testid={`button-review-${a.id}`}>Prüfen</Button>
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Keine Freigaben.</TableCell></TableRow>}
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
                  <div><span className="text-muted-foreground">Typ</span><div className="font-medium">{active.type}</div></div>
                  <div><span className="text-muted-foreground">Entität</span><div className="font-medium">{active.entity}</div></div>
                  <div><span className="text-muted-foreground">Betrag</span><div className="font-medium">{active.amount ? formatCurrency(active.amount) : "—"}</div></div>
                  <div><span className="text-muted-foreground">Datum</span><div className="font-medium">{active.date}</div></div>
                  <div><span className="text-muted-foreground">Eingereicht von</span><div className="font-medium">{active.requestedBy}</div></div>
                  <div><span className="text-muted-foreground">Prüfer</span><div className="font-medium">{active.reviewedBy}</div></div>
                </div>
                <Separator />
                <div><span className="text-muted-foreground">Begründung</span><p className="mt-0.5">{active.reason}</p></div>
                <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-amber-700">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /><div><span className="font-medium">Risiken:</span> {active.risks}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Dokumente</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {active.documents.map((d) => <Badge key={d} variant="outline" className="gap-1"><FileText className="h-3 w-3" /> {d}</Badge>)}
                  </div>
                </div>
              </div>
              <DialogFooter>
                {(active.status === "Offen" || active.status === "In Prüfung") ? (
                  <>
                    <Button variant="outline" className="text-destructive" onClick={() => decide(active, "Abgelehnt")} data-testid="button-dialog-reject"><XCircle className="h-4 w-4 mr-1.5" /> Ablehnen</Button>
                    <Button onClick={() => decide(active, "Freigegeben")} data-testid="button-dialog-approve"><CheckCircle2 className="h-4 w-4 mr-1.5" /> Freigeben</Button>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Entscheidung: {active.status}{active.approvedBy ? ` von ${active.approvedBy}` : ""}</div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
