import { useState } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PageHeader, RiskBadge } from "@/components/shared/page";
import { scopeByEntity, RISKS, PREMORTEMS } from "@/data";
import type { PreMortem } from "@/data/types";
import { ShieldAlert, TrendingUp, TrendingDown, Minus, FlaskConical } from "lucide-react";

const LEVELS = ["Niedrig", "Mittel", "Hoch"] as const;

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-destructive" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-emerald-600" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export default function Risiko() {
  const { selectedEntity } = useAppStore();
  const risks = scopeByEntity(RISKS, selectedEntity);
  const premortems = scopeByEntity(PREMORTEMS, selectedEntity);
  const [active, setActive] = useState<PreMortem | null>(null);

  const cell = (impact: string, prob: string) => risks.filter((r) => r.impact === impact && r.probability === prob);
  const heatColor = (impact: string, prob: string) => {
    const score = (LEVELS.indexOf(impact as typeof LEVELS[number]) + 1) * (LEVELS.indexOf(prob as typeof LEVELS[number]) + 1);
    if (score >= 6) return "bg-destructive/15 border-destructive/30";
    if (score >= 3) return "bg-amber-500/15 border-amber-500/30";
    return "bg-emerald-500/10 border-emerald-500/20";
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Risiko & Pre-Mortem" subtitle="Risikoregister & Szenarien" icon={<ShieldAlert className="h-5 w-5" />} />

      <Tabs defaultValue="register">
        <TabsList>
          <TabsTrigger value="register" data-testid="tab-register">Risikoregister</TabsTrigger>
          <TabsTrigger value="matrix" data-testid="tab-matrix">Risikomatrix</TabsTrigger>
          <TabsTrigger value="premortem" data-testid="tab-premortem">Pre-Mortem</TabsTrigger>
        </TabsList>

        <TabsContent value="register">
          <Card className="glass-card">
            <CardHeader><CardTitle>Risikoregister</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Risiko</TableHead><TableHead>Entität</TableHead><TableHead>Wirkung</TableHead><TableHead>Wahrscheinlichkeit</TableHead><TableHead>Verantwortlich</TableHead><TableHead>Trend</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
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
                    </TableRow>
                  ))}
                  {risks.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Keine Risiken.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix">
          <Card className="glass-card">
            <CardHeader><CardTitle>Risikomatrix</CardTitle><p className="text-sm text-muted-foreground">Wirkung (vertikal) gegen Eintrittswahrscheinlichkeit (horizontal).</p></CardHeader>
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
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500/40" /> Gering</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-500/40" /> Mittel</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-destructive/40" /> Kritisch</span>
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
                  <div><span className="text-muted-foreground">Gefährlichstes Risiko:</span> <span className="font-medium">{p.mostDangerousRisk}</span></div>
                  <div><span className="text-muted-foreground">Frühwarnsignale:</span> {p.earlyWarnings}</div>
                  <div className="text-xs text-primary pt-1">Details ansehen →</div>
                </CardContent>
              </Card>
            ))}
            {premortems.length === 0 && <p className="text-center text-muted-foreground py-8 col-span-2">Keine Pre-Mortem-Analysen für diese Entität.</p>}
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
                  ["Ziel", active.goal], ["Erwarteter Nutzen", active.expectedBenefit], ["Annahmen", active.assumptions],
                  ["Was könnte schiefgehen?", active.whatCouldGoWrong], ["Wahrscheinlichstes Risiko", active.mostLikelyRisk],
                  ["Gefährlichstes Risiko", active.mostDangerousRisk], ["Frühwarnsignale", active.earlyWarnings],
                  ["Gegenmaßnahmen", active.countermeasures],
                ].map(([label, val]) => (
                  <div key={label}><div className="text-muted-foreground text-xs uppercase tracking-wide">{label}</div><p className="mt-0.5">{val}</p></div>
                ))}
                <Separator />
                <div className="flex justify-between text-muted-foreground"><span>Verantwortlich: <span className="text-foreground font-medium">{active.owner}</span></span><span>Review: {active.reviewDate}</span></div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
