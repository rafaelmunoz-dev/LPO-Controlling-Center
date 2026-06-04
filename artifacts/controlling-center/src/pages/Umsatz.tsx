import { useAppStore } from "@/hooks/use-app-context";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page";
import { AiInsight } from "@/components/shared/AiInsight";
import { getEntityComparison, getFinance, formatCompact, formatCurrency, formatPercent } from "@/data";
import { Coins, TrendingUp, Users, Trophy } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Legend,
} from "recharts";

const NAVY = "hsl(216 65% 11%)";
const PIE_COLORS = ["hsl(190 80% 42%)", "hsl(216 65% 11%)", "hsl(190 60% 60%)", "hsl(216 40% 40%)", "hsl(190 70% 30%)", "hsl(216 30% 65%)"];

export default function Umsatz() {
  const { t } = useTranslation();
  const { selectedEntity, entities } = useAppStore();
  const comparison = getEntityComparison(entities);
  const finance = getFinance(selectedEntity);

  const employees =
    selectedEntity === "MiGu Group Gesamt"
      ? entities.reduce((a, e) => a + e.employees, 0)
      : entities.find((e) => e.code === selectedEntity)?.employees ?? 0;
  const revenuePerEmployee = employees > 0 ? finance.revenue / employees : 0;
  const topEntity = [...comparison].sort((a, b) => b.revenue - a.revenue)[0];

  const byEntity = comparison.map((c) => ({ name: c.code, Umsatz: c.revenue }));
  const trend = finance.series.map((m) => ({ month: m.month, Umsatz: m.revenue }));
  const totalRevenue = comparison.reduce((a, c) => a + c.revenue, 0);
  const share = comparison.map((c) => ({ name: c.code, value: c.revenue }));

  return (
    <div className="space-y-6">
      <PageHeader title={t("rev_title")} subtitle={t("rev_subtitle")} icon={<Coins className="h-5 w-5" />} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Coins className="h-4 w-4" /> {t("rev_total")}</div>
            <div className="text-2xl font-bold text-primary">{formatCompact(finance.revenue)}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><TrendingUp className="h-4 w-4" /> {t("rev_growth")}</div>
            <div className={`text-2xl font-bold ${finance.revenueChange >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {formatPercent(finance.revenueChange)}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Users className="h-4 w-4" /> {t("rev_per_employee")}</div>
            <div className="text-2xl font-bold text-primary">{formatCompact(revenuePerEmployee)}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Trophy className="h-4 w-4" /> {t("rev_top_entity")}</div>
            <div className="text-2xl font-bold text-primary">{topEntity?.code ?? "—"}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{topEntity ? formatCompact(topEntity.revenue) : ""}</div>
          </CardContent>
        </Card>
      </div>

      <AiInsight context="entitaeten" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader><CardTitle>{t("rev_by_entity")}</CardTitle></CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byEntity}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => formatCompact(v)} width={60} />
                  <RTooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="Umsatz" radius={[6, 6, 0, 0]}>{byEntity.map((_, i) => <Cell key={i} fill={NAVY} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle>{t("rev_share")}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={share} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(e) => `${e.name} ${Math.round((e.value / totalRevenue) * 100)}%`}>
                    {share.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <RTooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>{t("rev_trend")}</CardTitle></CardHeader>
        <CardContent className="pl-0">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(190 80% 42%)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(190 80% 42%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => formatCompact(v)} width={60} />
                <RTooltip formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="Umsatz" stroke="hsl(190 80% 42%)" strokeWidth={2} fill="url(#revFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
