import { useAppStore } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, RiskBadge } from "@/components/shared/page";
import { ENTITIES, getEntityComparison, getFinance, formatCompact, formatCurrency } from "@/data";
import { Building2, MapPin, Users, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend } from "recharts";

const NAVY = "hsl(216 65% 11%)";
const BRASS = "hsl(40 48% 56%)";

export default function Entitaeten() {
  const { setEntity } = useAppStore();
  const comparison = getEntityComparison();
  const group = getFinance("MiGu Group Gesamt");
  const chartData = comparison.map((c) => ({ name: c.code, Umsatz: c.revenue, EBITDA: c.ebitda }));

  return (
    <div className="space-y-6">
      <PageHeader title="Entitäten" subtitle="MiGu Group Struktur" icon={<Building2 className="h-5 w-5" />} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{ENTITIES.length}</div><div className="text-sm text-muted-foreground mt-1">Entitäten</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{formatCompact(group.revenue)}</div><div className="text-sm text-muted-foreground mt-1">Gesamtumsatz</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{ENTITIES.reduce((a, e) => a + e.employees, 0)}</div><div className="text-sm text-muted-foreground mt-1">Mitarbeiter gesamt</div></CardContent></Card>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>Umsatz & EBITDA je Entität</CardTitle></CardHeader>
        <CardContent className="pl-0">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => formatCompact(v)} width={60} />
                <RTooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="Umsatz" fill={NAVY} radius={[6, 6, 0, 0]} />
                <Bar dataKey="EBITDA" fill={BRASS} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ENTITIES.map((e) => {
          const c = comparison.find((x) => x.code === e.code)!;
          return (
            <Card key={e.code} className="glass-card flex flex-col" data-testid={`card-entity-${e.code}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 text-primary font-bold px-2.5 py-1 text-sm">{e.code}</div>
                    <RiskBadge level={c.riskLevel} />
                  </div>
                </div>
                <CardTitle className="text-base mt-2">{e.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{e.description}</p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm flex-1">
                <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {e.location}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-3.5 w-3.5" /> {e.employees} Mitarbeiter</div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border mt-2">
                  <div><div className="text-xs text-muted-foreground">Umsatz</div><div className="font-semibold">{formatCompact(c.revenue)}</div></div>
                  <div><div className="text-xs text-muted-foreground">EBITDA</div><div className="font-semibold">{formatCompact(c.ebitda)}</div></div>
                  <div><div className="text-xs text-muted-foreground">Gewinn</div><div className="font-semibold">{formatCompact(c.profit)}</div></div>
                  <div><div className="text-xs text-muted-foreground">Liquidität</div><div className="font-semibold">{formatCompact(c.liquidity)}</div></div>
                </div>
              </CardContent>
              <div className="p-4 pt-0">
                <Button variant="outline" className="w-full" onClick={() => setEntity(e.code)} data-testid={`button-view-${e.code}`}>
                  Ansicht öffnen <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
