import { useState } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { PageHeader } from "@/components/shared/page";
import { AiInsight } from "@/components/shared/AiInsight";
import { getForecasts, formatCurrency, formatNumber } from "@/data";
import type { ForecastSeries } from "@/data/types";
import { TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend } from "recharts";
import { useTranslation } from "react-i18next";

const NAVY = "hsl(216 65% 11%)";
const BRASS = "hsl(40 48% 56%)";
const RED = "hsl(0 84% 60%)";

export default function Prognosen() {
  const { t } = useTranslation();
  const { selectedEntity } = useAppStore();
  const forecasts = getForecasts(selectedEntity);
  const [kind, setKind] = useState<ForecastSeries["kind"]>("Umsatz");
  const [growth, setGrowth] = useState([100]);

  const active = forecasts.find((f) => f.kind === kind)!;
  const factor = growth[0] / 100;
  const fmt = (v: number) => (active.unit === "€" ? formatCurrency(v) : `${formatNumber(Math.round(v))} ${active.unit}`);
  const data = active.points.map((p) => ({
    period: p.period,
    best: Math.round(p.best * factor),
    realistic: Math.round(p.realistic * factor),
    worst: Math.round(p.worst * factor),
  }));
  const yearRealistic = data.reduce((a, p) => a + p.realistic, 0);

  return (
    <div className="space-y-6">
      <PageHeader title={t("prognosen")} subtitle={t("prog_subtitle")} icon={<TrendingUp className="h-5 w-5" />} />

      <AiInsight context="prognosen" />

      <Card className="glass-card">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
            <CardTitle>{t("prog_scenario_analysis")}</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
              <Select value={kind} onValueChange={(v) => setKind(v as ForecastSeries["kind"])}>
                <SelectTrigger className="w-52" data-testid="select-forecast-kind"><SelectValue /></SelectTrigger>
                <SelectContent>{forecasts.map((f) => <SelectItem key={f.kind} value={f.kind}>{f.kind}</SelectItem>)}</SelectContent>
              </Select>
              <div className="flex items-center gap-3 min-w-[220px]">
                <span className="text-sm text-muted-foreground whitespace-nowrap">{t("prog_assumption")}: {growth[0]}%</span>
                <Slider value={growth} onValueChange={setGrowth} min={70} max={130} step={5} data-testid="slider-growth" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pl-0">
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => (active.unit === "€" ? formatCurrency(v) : formatNumber(v))} width={75} />
                <RTooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Area type="monotone" name={t("best_case")} dataKey="best" stroke={BRASS} fill={BRASS} fillOpacity={0.12} strokeWidth={2} />
                <Area type="monotone" name={t("realistic")} dataKey="realistic" stroke={NAVY} fill={NAVY} fillOpacity={0.18} strokeWidth={2} />
                <Area type="monotone" name={t("worst_case")} dataKey="worst" stroke={RED} fill={RED} fillOpacity={0.08} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">{t("prog_year_realistic")}</div><div className="text-2xl font-bold text-primary mt-1">{fmt(yearRealistic)}</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">{t("best_case")}</div><div className="text-2xl font-bold text-emerald-600 mt-1">{fmt(data.reduce((a, p) => a + p.best, 0))}</div></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">{t("worst_case")}</div><div className="text-2xl font-bold text-destructive mt-1">{fmt(data.reduce((a, p) => a + p.worst, 0))}</div></CardContent></Card>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>{t("prog_all_areas")}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {forecasts.map((f) => {
              const year = f.points.reduce((a, p) => a + p.realistic, 0);
              const label = f.unit === "€" ? formatCurrency(year) : `${formatNumber(year)} ${f.unit}`;
              return (
                <button key={f.kind} onClick={() => setKind(f.kind)} className={`text-left border rounded-xl p-4 transition-all hover:border-primary/40 ${kind === f.kind ? "border-primary/50 bg-primary/5" : "border-border"}`} data-testid={`card-forecast-${f.kind}`}>
                  <div className="text-sm text-muted-foreground">{f.kind}</div>
                  <div className="text-lg font-semibold text-primary mt-1">{label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t("prog_year_forecast")}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
