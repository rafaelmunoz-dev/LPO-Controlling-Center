import { useAppStore } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page";
import { AiInsight } from "@/components/shared/AiInsight";
import { scopeByEntity, STRATEGY_DECISIONS, formatCurrency } from "@/data";
import { Target, CheckCircle2, TrendingUp, AlertTriangle, Circle } from "lucide-react";
import { useTranslation } from "react-i18next";

const EVAL: Record<string, { tone: string; icon: React.ReactNode }> = {
  "Übertroffen": { tone: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: <TrendingUp className="h-3.5 w-3.5" /> },
  "Erfüllt": { tone: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  "Verfehlt": { tone: "bg-destructive/10 text-destructive border-destructive/20", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  "Offen": { tone: "bg-slate-500/10 text-slate-600 border-slate-500/20", icon: <Circle className="h-3.5 w-3.5" /> },
};

export default function Strategie() {
  const { t } = useTranslation();
  const { selectedEntity } = useAppStore();
  const decisions = scopeByEntity(STRATEGY_DECISIONS, selectedEntity);

  return (
    <div className="space-y-6">
      <PageHeader title={t("strat_title")} subtitle={t("strat_subtitle")} icon={<Target className="h-5 w-5" />} />

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
                <Badge variant="outline" className={`gap-1 ${EVAL[d.evaluation].tone}`}>{EVAL[d.evaluation].icon} {d.evaluation}</Badge>
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
    </div>
  );
}
