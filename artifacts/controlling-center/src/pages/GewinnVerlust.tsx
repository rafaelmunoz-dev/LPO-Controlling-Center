import { useTranslation } from "react-i18next";
import { useAppStore } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page";
import { AiInsight } from "@/components/shared/AiInsight";
import { EntityAvatar } from "@/components/shared/EntityAvatar";
import {
  getPLOverview,
  getProfitLoss,
  getEntityComparison,
  formatCompact,
  formatCurrency,
} from "@/data";
import { Scale, TrendingUp, TrendingDown } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const NAVY = "hsl(216 65% 11%)";
const BRASS = "hsl(190 80% 42%)";
const RED = "hsl(0 84% 60%)";
const EMERALD = "hsl(160 70% 38%)";

function KpiCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "bad" }) {
  const valueColor = tone === "bad" ? "text-destructive" : tone === "good" ? "text-emerald-600" : "text-primary";
  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${valueColor}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function GewinnVerlust() {
  const { t } = useTranslation();
  const { selectedEntity, entities } = useAppStore();
  const pl = getPLOverview(selectedEntity);
  const statement = getProfitLoss(selectedEntity);
  const comparison = getEntityComparison(entities);

  const lossEntities = comparison.filter((c) => c.profit < 0);
  const trendData = pl.series.map((s) => ({ month: s.month, EBITDA: s.ebitda, [t("gv_result")]: s.profit }));
  const byEntity = comparison.map((c) => ({ name: c.code, EBITDA: c.ebitda, [t("gv_result")]: c.profit }));
  const profitIsLoss = pl.netProfit < 0;

  return (
    <div className="space-y-6">
      <PageHeader title={t("gv_title")} subtitle={t("gv_subtitle")} icon={<Scale className="h-5 w-5" />} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("kpi_ebitda")} value={formatCompact(pl.ebitda)} sub={`${t("gv_ebitda_margin")}: ${pl.ebitdaMargin.toFixed(1)}%`} />
        <KpiCard label="EBIT" value={formatCompact(pl.ebit)} />
        <KpiCard
          label={t("gv_result")}
          value={formatCompact(pl.netProfit)}
          sub={`${t("gv_net_margin")}: ${pl.netMargin.toFixed(1)}%`}
          tone={profitIsLoss ? "bad" : "good"}
        />
        <KpiCard
          label={t("gv_loss_entities")}
          value={String(lossEntities.length)}
          sub={lossEntities.length > 0 ? lossEntities.map((c) => c.code).join(", ") : t("gv_profitable")}
          tone={lossEntities.length > 0 ? "bad" : "good"}
        />
      </div>

      <AiInsight context="finanzen" />

      <Card className="glass-card">
        <CardHeader><CardTitle>{t("gv_ebitda_profit_trend")}</CardTitle></CardHeader>
        <CardContent className="pl-0">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => formatCompact(v)} width={60} />
                <RTooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="EBITDA" fill={BRASS} radius={[6, 6, 0, 0]} />
                <Line type="monotone" dataKey={t("gv_result")} stroke={NAVY} strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader><CardTitle>{t("gv_by_entity")}</CardTitle></CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={byEntity}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => formatCompact(v)} width={60} />
                  <RTooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="EBITDA" fill={BRASS} radius={[6, 6, 0, 0]} />
                  <Bar dataKey={t("gv_result")} fill={NAVY} radius={[6, 6, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle>{t("gv_statement")}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {statement.map((row) => {
                  const negative = row.value < 0;
                  return (
                    <TableRow key={row.label} className={row.bold ? "font-semibold" : ""}>
                      <TableCell className="py-2">{row.label}</TableCell>
                      <TableCell className={`py-2 text-right tabular-nums ${negative ? "text-destructive" : "text-foreground"}`}>
                        {formatCurrency(row.value)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>{t("gv_entity_detail")}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {comparison.map((c) => {
              const e = entities.find((x) => x.code === c.code);
              const loss = c.profit < 0;
              return (
                <div key={c.code} className="rounded-xl border border-slate-200/70 bg-white/60 p-3" data-testid={`gv-entity-${c.code}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {e && <EntityAvatar entity={e} size={28} />}
                    <span className="font-semibold text-sm">{c.code}</span>
                    <span className={`ml-auto inline-flex items-center gap-1 text-xs font-medium ${loss ? "text-destructive" : "text-emerald-600"}`}>
                      {loss ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                      {loss ? t("gv_loss_making") : t("gv_profitable")}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">{t("kpi_ebitda")}</div>
                      <div className="font-semibold text-sm">{formatCompact(c.ebitda)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{t("gv_result")}</div>
                      <div className={`font-semibold text-sm ${loss ? "text-destructive" : "text-emerald-600"}`} style={{ color: loss ? RED : EMERALD }}>
                        {formatCompact(c.profit)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
