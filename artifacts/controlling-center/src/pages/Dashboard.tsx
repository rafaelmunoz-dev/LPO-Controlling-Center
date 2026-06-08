import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/hooks/use-app-context";
import { useFormat } from "@/hooks/use-format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RiskBadge, statusLabel } from "@/components/shared/page";
import { Term } from "@/components/shared/Term";
import { AiInsight } from "@/components/shared/AiInsight";
import { QuickAccess } from "@/components/shared/QuickAccess";
import { PanelHeader } from "@/components/shared/PanelHeader";
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
  ShieldAlert,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { CHART } from "@/lib/chart";

const AXIS_TICK = { fontSize: 12, fill: CHART.grey } as const;
const TOOLTIP_STYLE = {
  borderRadius: 16,
  border: `1px solid ${CHART.grid}`,
  boxShadow: "0 8px 32px rgba(30,58,95,0.12)",
  fontSize: 12,
  padding: "8px 12px",
} as const;

const NAVY = CHART.navy;
const BRASS = CHART.gold;
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
          className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{
            color,
            backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 28%, transparent)`,
          }}
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
  const { selectedEntity, risks: allRisks, currentUser, period, financeInputs } = useAppStore();
  const { t } = useTranslation();
  const { compact, currency, number } = useFormat();
  const [, navigate] = useLocation();
  const f = getFinance(selectedEntity);
  const cashflow = getCashflow(selectedEntity);
  const liquidity = getLiquidity(selectedEntity);
  const risks = scopeByEntity(allRisks, selectedEntity).filter((r) => r.status !== "Geschlossen");
  const spark = (key: "revenue" | "ebitda" | "profit") => f.series.map((m) => ({ v: m[key] }));

  const cfBreakdown = [
    { label: t("cf_operating"), value: cashflow.operating, abs: Math.abs(cashflow.operating), color: NAVY },
    { label: t("cf_investing"), value: cashflow.investing, abs: Math.abs(cashflow.investing), color: BLUE },
    { label: t("cf_financing"), value: cashflow.financing, abs: Math.abs(cashflow.financing), color: AMBER },
  ];

  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? "greeting_morning" : hour < 18 ? "greeting_day" : "greeting_evening";
  const firstName = (currentUser.name || "").trim().split(" ")[0];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-primary/10 text-primary p-2.5 hidden sm:flex">
          <LayoutDashboard className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary" data-testid="text-page-title">
            {t(greetingKey)}{firstName ? `, ${firstName}` : ""} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm sm:text-base text-muted-foreground">
            {t("greeting_subtitle")}
          </p>
        </div>
      </div>

      <QuickAccess />

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
            <PanelHeader
              icon={TrendingUp}
              color={BRASS}
              title={t("financial_development")}
              subtitle={`${t("kpi_revenue")} · ${t("kpi_ebitda")} · ${t("cogs")}`}
              statValue={compact(f.revenue)}
              statLabel={t("kpi_revenue")}
            />
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={f.series}>
                  <defs>
                    <linearGradient id="grad-revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={NAVY} stopOpacity={0.22} />
                      <stop offset="100%" stopColor={NAVY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={CHART.grid} strokeOpacity={0.6} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_TICK} dy={6} />
                  <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} tickFormatter={(v) => compact(v)} width={60} />
                  <RTooltip formatter={(v: number) => currency(v)} contentStyle={TOOLTIP_STYLE} cursor={{ stroke: CHART.grid }} />
                  <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Area type="monotone" name={t("kpi_revenue")} dataKey="revenue" stroke={NAVY} strokeWidth={2.5} fill="url(#grad-revenue)" dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" name={t("kpi_ebitda")} dataKey="ebitda" stroke={BRASS} strokeWidth={2} dot={false} />
                  <Line type="monotone" name={t("cogs")} dataKey="costs" stroke={RED} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-3">
          <CardHeader>
            <PanelHeader
              icon={Wallet}
              color={BLUE}
              title={t("cashflow")}
              subtitle={`${t("cf_operating")} · ${t("cf_investing")} · ${t("cf_financing")}`}
              statValue={currency(cashflow.netChange)}
              statLabel={t("difference")}
              statClass={cashflow.netChange >= 0 ? "text-emerald-600" : "text-destructive"}
            />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-5">
              <div className="relative h-[160px] w-[160px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cfBreakdown}
                      dataKey="abs"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={74}
                      paddingAngle={2}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {cfBreakdown.map((d) => (
                        <Cell key={d.label} fill={d.color} />
                      ))}
                    </Pie>
                    <RTooltip
                      formatter={(_v: number, _n, item) => [currency(item.payload.value), item.payload.label]}
                      contentStyle={TOOLTIP_STYLE}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-base font-bold leading-none ${cashflow.netChange >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                    {currency(cashflow.netChange)}
                  </span>
                  <span className="mt-1 text-[0.65rem] text-muted-foreground">{t("difference")}</span>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                {cfBreakdown.map((d) => (
                  <div key={d.label} className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="truncate text-sm text-muted-foreground">{d.label}</span>
                    </span>
                    <span className={`shrink-0 text-sm font-medium ${d.value >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                      {currency(d.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <PanelHeader
            icon={Timer}
            color={AMBER}
            title={t("liquidity_forecast")}
            subtitle={`${t("best_case")} · ${t("realistic")} · ${t("worst_case")}`}
            statValue={`${number(Math.round(f.cashRunway * 10) / 10)} ${t("months")}`}
            statLabel={t("kpi_runway")}
          />
        </CardHeader>
        <CardContent className="pl-0">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liquidity}>
                <defs>
                  <linearGradient id="grad-liq-best" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRASS} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={BRASS} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-liq-real" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={NAVY} stopOpacity={0.26} />
                    <stop offset="100%" stopColor={NAVY} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-liq-worst" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={RED} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={RED} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={CHART.grid} strokeOpacity={0.6} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={AXIS_TICK} interval={1} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} tickFormatter={(v) => compact(v)} width={60} />
                <RTooltip formatter={(v: number) => currency(v)} contentStyle={TOOLTIP_STYLE} cursor={{ stroke: CHART.grid }} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area type="monotone" name={t("best_case")} dataKey="best" stroke={BRASS} fill="url(#grad-liq-best)" strokeWidth={2} dot={false} />
                <Area type="monotone" name={t("realistic")} dataKey="realistic" stroke={NAVY} fill="url(#grad-liq-real)" strokeWidth={2.5} dot={false} />
                <Area type="monotone" name={t("worst_case")} dataKey="worst" stroke={RED} fill="url(#grad-liq-worst)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <PanelHeader
            icon={ShieldAlert}
            color={RED}
            title={t("open_risks")}
            subtitle={t("risiko_premortem")}
            statValue={number(risks.filter((r) => r.status === "Offen").length)}
            statLabel={t("open")}
          />
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
