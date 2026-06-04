import { useAppStore } from "@/hooks/use-app-context";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader, RiskBadge } from "@/components/shared/page";
import { AiInsight } from "@/components/shared/AiInsight";
import { ENTITIES, getEntityComparison, getFinance, formatCompact, formatCurrency } from "@/data";
import { Building2, MapPin, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend } from "recharts";

const NAVY = "hsl(216 65% 11%)";
const BRASS = "hsl(190 80% 42%)";

export default function Entitaeten() {
  const { t } = useTranslation();
  const { setEntity, selectedEntity } = useAppStore();
  const comparison = getEntityComparison();
  const group = getFinance("MiGu Group Gesamt");
  const chartData = comparison.map((c) => ({ name: c.code, Umsatz: c.revenue, EBITDA: c.ebitda }));

  return (
    <div className="space-y-6">
      <PageHeader title={t("ent_title")} subtitle={t("ent_subtitle")} icon={<Building2 className="h-5 w-5" />} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{ENTITIES.length}</div><div className="text-sm text-muted-foreground mt-1">{t("entitaeten")}</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{formatCompact(group.revenue)}</div><div className="text-sm text-muted-foreground mt-1">{t("ent_total_revenue")}</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{ENTITIES.reduce((a, e) => a + e.employees, 0)}</div><div className="text-sm text-muted-foreground mt-1">{t("ent_total_employees")}</div></CardContent></Card>
      </div>

      <AiInsight context="entitaeten" />

      <Card className="glass-card">
        <CardHeader><CardTitle>{t("ent_revenue_ebitda")}</CardTitle></CardHeader>
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
          const active = selectedEntity === e.code;
          return (
            <Card key={e.code} className={`glass-card flex flex-col transition-shadow ${active ? "ring-2 ring-brass shadow-lg" : ""}`} data-testid={`card-entity-${e.code}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 text-primary font-bold px-2.5 py-1 text-sm">{e.code}</div>
                    <RiskBadge level={c.riskLevel} />
                  </div>
                  {active && <span className="inline-flex items-center gap-1 text-xs font-medium text-brass"><CheckCircle2 className="h-3.5 w-3.5" /> {t("ent_active_view")}</span>}
                </div>
                <CardTitle className="text-base mt-2">{e.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{e.description}</p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm flex-1">
                <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {e.location}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-3.5 w-3.5" /> {e.employees} {t("mit_employees")}</div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border mt-2">
                  <div><div className="text-xs text-muted-foreground">{t("kpi_revenue")}</div><div className="font-semibold">{formatCompact(c.revenue)}</div></div>
                  <div><div className="text-xs text-muted-foreground">{t("kpi_ebitda")}</div><div className="font-semibold">{formatCompact(c.ebitda)}</div></div>
                  <div><div className="text-xs text-muted-foreground">{t("ent_profit")}</div><div className="font-semibold">{formatCompact(c.profit)}</div></div>
                  <div><div className="text-xs text-muted-foreground">{t("ent_liquidity")}</div><div className="font-semibold">{formatCompact(c.liquidity)}</div></div>
                </div>
              </CardContent>
              <div className="p-4 pt-0">
                <Button variant={active ? "default" : "outline"} className="w-full" disabled={active} onClick={() => setEntity(e.code)} data-testid={`button-view-${e.code}`}>
                  {active ? t("ent_active_view") : <>{t("ent_open_view")} <ArrowRight className="h-4 w-4 ml-1.5" /></>}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
