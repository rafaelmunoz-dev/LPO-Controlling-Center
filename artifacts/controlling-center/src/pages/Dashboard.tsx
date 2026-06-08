import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/hooks/use-app-context";
import { useFormat } from "@/hooks/use-format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, RiskBadge, statusLabel } from "@/components/shared/page";
import { Term } from "@/components/shared/Term";
import { AiInsight } from "@/components/shared/AiInsight";
import type { GlossaryKey } from "@/data";
import {
  getFinance,
  getCashflow,
  getLiquidity,
  scopeByEntity,
} from "@/data";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Wallet,
  Percent,
  PiggyBank,
  ReceiptText,
  Timer,
  LayoutDashboard,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { CHART } from "@/lib/chart";

const NAVY = CHART.navy;
const BRASS = CHART.gold;
const GREY = CHART.grey;
const RED = CHART.red;
const BLUE = CHART.blue;
const AMBER = CHART.amber;
const EMERALD = CHART.emerald;

function Spark({ data, color }: { data: { v: number }[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function Kpi({
  glossary,
  title,
  value,
  change,
  spark,
  color,
  icon,
  hint,
  valueClass,
  onClick,
}: {
  glossary: GlossaryKey;
  title: string;
  value: string;
  change?: number;
  spark?: { v: number }[];
  color: string;
  icon: React.ReactNode;
  hint?: string;
  valueClass?: string;
  onClick?: () => void;
}) {
  const { t } = useTranslation();
  const positive = (change ?? 0) >= 0;
  return (
    <Card className="glass-card card-link" onClick={onClick} data-testid={`kpi-${glossary}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          <Term k={glossary}>{title}</Term>
        </CardTitle>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, white)` }}
        >
          {icon}
        </span>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClass ?? ""}`} data-testid={`value-${glossary}`}>{value}</div>
        <div className="flex items-center justify-between mt-1">
          {change !== undefined ? (
            <p className="text-xs text-muted-foreground flex items-center">
              <span className={`flex items-center mr-1 ${positive ? "text-emerald-600" : "text-destructive"}`}>
                {positive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                {positive ? "+" : ""}
                {change.toFixed(1)}%
              </span>
              {t("vs_prev_month")}
            </p>
          ) : (
            <span className="text-xs text-muted-foreground">{hint}</span>
          )}
          {spark && (
            <div className="w-20">
              <Spark data={spark} color={color} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { selectedEntity, risks: allRisks } = useAppStore();
  const { t } = useTranslation();
  const { compact, currency, number } = useFormat();
  const [, navigate] = useLocation();
  const f = getFinance(selectedEntity);
  const cashflow = getCashflow(selectedEntity);
  const liquidity = getLiquidity(selectedEntity);
  const risks = scopeByEntity(allRisks, selectedEntity).filter((r) => r.status !== "Geschlossen");
  const spark = (key: "revenue" | "ebitda" | "profit") => f.series.map((m) => ({ v: m[key] }));

  return (
    <div className="space-y-6">
      <PageHeader title={t("dashboard")} subtitle={t("financial_development")} icon={<LayoutDashboard className="h-5 w-5" />} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi glossary="umsatz" title={t("kpi_revenue")} value={compact(f.revenue)} change={f.revenueChange} spark={spark("revenue")} color={NAVY} icon={<DollarSign className="h-4 w-4" />} onClick={() => navigate("/finanzen")} />
        <Kpi glossary="ebitda" title={t("kpi_ebitda")} value={compact(f.ebitda)} change={f.ebitdaChange} spark={spark("ebitda")} color={BRASS} icon={<TrendingUp className="h-4 w-4" />} onClick={() => navigate("/finanzen")} />
        <Kpi glossary="ebitda_marge" title={t("kpi_margin")} value={`${number(Math.round(f.ebitdaMargin * 10) / 10)} %`} change={f.marginChange} color={BLUE} icon={<Percent className="h-4 w-4" />} onClick={() => navigate("/finanzen")} />
        <Kpi glossary="nettoergebnis" title={t("kpi_net")} value={compact(f.netProfit)} change={f.netChange} spark={spark("profit")} color={EMERALD} icon={<PiggyBank className="h-4 w-4" />} onClick={() => navigate("/finanzen")} />
        <Kpi glossary="liquiditaet" title={t("kpi_cash")} value={compact(f.cash)} change={f.cashChange} color={AMBER} icon={<Wallet className="h-4 w-4" />} onClick={() => navigate("/finanzen#prognosen")} />
        <Kpi glossary="cash_runway" title={t("kpi_runway")} value={`${number(Math.round(f.cashRunway * 10) / 10)} ${t("months")}`} color={BLUE} icon={<Timer className="h-4 w-4" />} hint={t("kpi_runway")} onClick={() => navigate("/finanzen#prognosen")} />
        <Kpi glossary="offene_rechnungen" title={t("kpi_open_invoices")} value={compact(f.openInvoices)} color={AMBER} icon={<ReceiptText className="h-4 w-4" />} hint={`${number(f.openInvoicesCount)} ${t("open")}`} onClick={() => navigate("/finanzen")} />
        <Kpi glossary="pre_mortem" title={t("kpi_risk")} value={t(f.riskLevel === "Hoch" ? "high" : f.riskLevel === "Mittel" ? "medium" : "low")} color={RED} icon={<AlertCircle className="h-4 w-4" />} hint={`${risks.filter((r) => r.status === "Offen").length} ${t("open")}`} valueClass={f.riskLevel === "Hoch" ? "text-destructive" : f.riskLevel === "Mittel" ? "text-amber-500" : "text-emerald-600"} onClick={() => navigate("/risiko")} />
      </div>

      <AiInsight context="dashboard" />

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="glass-card lg:col-span-4">
          <CardHeader>
            <CardTitle>{t("financial_development")}</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={f.series}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => compact(v)} width={60} />
                  <RTooltip formatter={(v: number) => currency(v)} />
                  <Legend />
                  <Line type="monotone" name={t("kpi_revenue")} dataKey="revenue" stroke={NAVY} strokeWidth={2} dot={false} />
                  <Line type="monotone" name={t("cogs")} dataKey="costs" stroke={RED} strokeWidth={2} dot={false} />
                  <Line type="monotone" name={t("kpi_ebitda")} dataKey="ebitda" stroke={BRASS} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-3">
          <CardHeader>
            <CardTitle><Term k="cashflow">{t("cashflow")}</Term></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: t("cf_operating"), value: cashflow.operating },
              { label: t("cf_investing"), value: cashflow.investing },
              { label: t("cf_financing"), value: cashflow.financing },
              { label: t("difference"), value: cashflow.netChange, bold: true },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className={`text-sm ${r.bold ? "font-semibold" : "text-muted-foreground"}`}>{r.label}</span>
                <span className={`font-medium ${r.value >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                  {currency(r.value)}
                </span>
              </div>
            ))}
            <div className="h-[120px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashflow.series}>
                  <Area type="monotone" dataKey="operating" stroke={NAVY} fill={NAVY} fillOpacity={0.12} strokeWidth={2} />
                  <XAxis dataKey="month" hide />
                  <RTooltip formatter={(v: number) => currency(v)} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle><Term k="cash_runway">{t("liquidity_forecast")}</Term></CardTitle>
        </CardHeader>
        <CardContent className="pl-0">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liquidity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} fontSize={11} interval={1} />
                <YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => compact(v)} width={60} />
                <RTooltip formatter={(v: number) => currency(v)} />
                <Legend />
                <Area type="monotone" name={t("best_case")} dataKey="best" stroke={BRASS} fill={BRASS} fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" name={t("realistic")} dataKey="realistic" stroke={NAVY} fill={NAVY} fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" name={t("worst_case")} dataKey="worst" stroke={RED} fill={RED} fillOpacity={0.08} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{t("open_risks")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("risiko_premortem")}</TableHead>
                <TableHead>{t("entity")}</TableHead>
                <TableHead>{t("high")}/{t("low")}</TableHead>
                <TableHead>{t("owner")}</TableHead>
                <TableHead>{t("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {risks.map((r) => (
                <TableRow key={r.id} className="card-link" onClick={() => navigate("/risiko")} data-testid={`row-risk-${r.id}`}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell>{r.entity}</TableCell>
                  <TableCell><RiskBadge level={r.impact} /></TableCell>
                  <TableCell>{r.owner}</TableCell>
                  <TableCell className="text-muted-foreground">{statusLabel(t, r.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
