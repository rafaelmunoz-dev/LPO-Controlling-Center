import { useAppStore } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page";
import { scopeByEntity, STRATEGY_DECISIONS, formatCurrency } from "@/data";
import { Target, CheckCircle2, TrendingUp, AlertTriangle, Circle } from "lucide-react";

const EVAL: Record<string, { tone: string; icon: React.ReactNode }> = {
  "Übertroffen": { tone: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: <TrendingUp className="h-3.5 w-3.5" /> },
  "Erfüllt": { tone: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  "Verfehlt": { tone: "bg-destructive/10 text-destructive border-destructive/20", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  "Offen": { tone: "bg-slate-500/10 text-slate-600 border-slate-500/20", icon: <Circle className="h-3.5 w-3.5" /> },
};

export default function Strategie() {
  const { selectedEntity } = useAppStore();
  const decisions = scopeByEntity(STRATEGY_DECISIONS, selectedEntity);

  return (
    <div className="space-y-6">
      <PageHeader title="Strategie Bewertung" subtitle="Entscheidungen & Wirkung" icon={<Target className="h-5 w-5" />} />

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
                <Badge variant="outline" className={`gap-1 ${EVAL[d.evaluation].tone}`}>{EVAL[d.evaluation].icon} {d.evaluation}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Entität</span><div className="font-medium">{d.entity}</div></div>
                <div><span className="text-muted-foreground">Budget</span><div className="font-medium">{formatCurrency(d.budget)}</div></div>
                <div><span className="text-muted-foreground">Erwartetes KPI</span><div className="font-medium">{d.expectedKpi}</div></div>
                <div><span className="text-muted-foreground">Tatsächliches KPI</span><div className="font-medium">{d.actualKpi}</div></div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3"><span className="text-muted-foreground text-xs uppercase tracking-wide">Learnings</span><p className="mt-0.5">{d.learnings}</p></div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>Verantwortlich: {d.owner}</span><span>Review: {d.reviewDate}</span></div>
            </CardContent>
          </Card>
        ))}
        {decisions.length === 0 && <p className="text-center text-muted-foreground py-8 col-span-2">Keine Strategieentscheidungen für diese Entität.</p>}
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>Übersicht</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Entscheidung</TableHead><TableHead>Entität</TableHead><TableHead>Erwarteter Effekt</TableHead><TableHead className="text-right">Budget</TableHead><TableHead>Bewertung</TableHead></TableRow></TableHeader>
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
    </div>
  );
}
