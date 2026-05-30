import { useAppStore } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, RiskBadge } from "@/components/shared/page";
import {
  getFinance,
  getEntityComparison,
  getBudget,
  getCashflow,
  getLiquidity,
  scopeByEntity,
  formatCompact,
  formatCurrency,
  RISKS,
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
  Info,
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

const NAVY = "hsl(216 65% 11%)";
const BRASS = "hsl(40 48% 56%)";
const GREY = "hsl(215 16% 47%)";
const RED = "hsl(0 84% 60%)";

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
  title,
  value,
  change,
  spark,
  color,
  icon,
  explain,
  valueClass,
}: {
  title: string;
  value: string;
  change?: number;
  spark?: { v: number }[];
  color: string;
  icon: React.ReactNode;
  explain: string;
  valueClass?: string;
}) {
  const positive = (change ?? 0) >= 0;
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="text-muted-foreground/60 hover:text-primary" data-testid={`info-${title}`}>
              {icon}
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-[220px]">{explain}</TooltipContent>
        </Tooltip>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClass ?? ""}`} data-testid={`value-${title}`}>{value}</div>
        <div className="flex items-center justify-between mt-1">
          {change !== undefined ? (
            <p className="text-xs text-muted-foreground flex items-center">
              <span className={`flex items-center mr-1 ${positive ? "text-emerald-600" : "text-destructive"}`}>
                {positive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                {positive ? "+" : ""}
                {change.toFixed(1)}%
              </span>
              vs. Vormonat
            </p>
          ) : (
            <span className="text-xs text-muted-foreground">{explain.split(".")[0]}</span>
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
  const { selectedEntity } = useAppStore();
  const f = getFinance(selectedEntity);
  const comparison = getEntityComparison();
  const budget = getBudget(selectedEntity);
  const cashflow = getCashflow(selectedEntity);
  const liquidity = getLiquidity(selectedEntity);
  const risks = scopeByEntity(RISKS, selectedEntity);
  const spark = (key: "revenue" | "ebitda" | "profit") => f.series.map((m) => ({ v: m[key] }));

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Finanzielle Steuerung" icon={<LayoutDashboard className="h-5 w-5" />} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi title="Umsatz" value={formatCompact(f.revenue)} change={f.revenueChange} spark={spark("revenue")} color={NAVY} icon={<DollarSign className="h-4 w-4" />} explain="Umsatz: Gesamte Einnahmen aus Verkäufen und Leistungen im Zeitraum." />
        <Kpi title="EBITDA" value={formatCompact(f.ebitda)} change={f.ebitdaChange} spark={spark("ebitda")} color={BRASS} icon={<TrendingUp className="h-4 w-4" />} explain="EBITDA: Operatives Ergebnis vor Zinsen, Steuern und Abschreibungen." />
        <Kpi title="EBITDA-Marge" value={`${f.ebitdaMargin.toFixed(1)} %`} change={f.marginChange} color={BRASS} icon={<Percent className="h-4 w-4" />} explain="EBITDA-Marge: Anteil des EBITDA am Umsatz – misst die operative Profitabilität." />
        <Kpi title="Nettoergebnis" value={formatCompact(f.netProfit)} change={f.netChange} spark={spark("profit")} color={NAVY} icon={<PiggyBank className="h-4 w-4" />} explain="Nettoergebnis: Gewinn nach allen Kosten, Zinsen und Steuern." />
        <Kpi title="Cash & Liquidität" value={formatCompact(f.cash)} change={f.cashChange} color={GREY} icon={<Wallet className="h-4 w-4" />} explain="Cash & Liquidität: Verfügbare liquide Mittel auf Bankkonten." />
        <Kpi title="Cash Runway" value={`${f.cashRunway.toFixed(1)} Mon.`} color={GREY} icon={<Timer className="h-4 w-4" />} explain="Cash Runway: Anzahl Monate, die das Unternehmen mit aktueller Liquidität auskommt." />
        <Kpi title="Offene Rechnungen" value={formatCompact(f.openInvoices)} color={GREY} icon={<ReceiptText className="h-4 w-4" />} explain={`Offene Rechnungen: ${f.openInvoicesCount} unbezahlte Kundenrechnungen.`} />
        <Kpi title="Risiko-Level" value={f.riskLevel} color={RED} icon={<AlertCircle className="h-4 w-4" />} explain={`Risiko-Level: Gesamtbewertung. ${risks.filter((r) => r.status === "Offen").length} offene Risiken.`} valueClass={f.riskLevel === "Hoch" ? "text-destructive" : f.riskLevel === "Mittel" ? "text-amber-500" : "text-emerald-600"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="glass-card lg:col-span-4">
          <CardHeader>
            <CardTitle>Finanzielle Entwicklung</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={f.series}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => formatCompact(v)} width={60} />
                  <RTooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Line type="monotone" name="Umsatz" dataKey="revenue" stroke={NAVY} strokeWidth={2} dot={false} />
                  <Line type="monotone" name="Kosten" dataKey="costs" stroke={RED} strokeWidth={2} dot={false} />
                  <Line type="monotone" name="EBITDA" dataKey="ebitda" stroke={BRASS} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-3">
          <CardHeader>
            <CardTitle>Cashflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Operativer Cashflow", value: cashflow.operating },
              { label: "Investitions-Cashflow", value: cashflow.investing },
              { label: "Finanzierungs-Cashflow", value: cashflow.financing },
              { label: "Veränderung Liquidität", value: cashflow.netChange, bold: true },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className={`text-sm ${r.bold ? "font-semibold" : "text-muted-foreground"}`}>{r.label}</span>
                <span className={`font-medium ${r.value >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                  {formatCurrency(r.value)}
                </span>
              </div>
            ))}
            <div className="h-[120px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashflow.series}>
                  <Area type="monotone" dataKey="operating" stroke={NAVY} fill={NAVY} fillOpacity={0.12} strokeWidth={2} />
                  <XAxis dataKey="month" hide />
                  <RTooltip formatter={(v: number) => formatCurrency(v)} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Budget vs. Ist</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategorie</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Ist</TableHead>
                  <TableHead className="text-right">Diff.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budget.map((b) => {
                  const diff = b.actual - b.budget;
                  return (
                    <TableRow key={b.category} data-testid={`row-budget-${b.category}`}>
                      <TableCell className="font-medium">{b.category}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCompact(b.budget)}</TableCell>
                      <TableCell className="text-right">{formatCompact(b.actual)}</TableCell>
                      <TableCell className={`text-right font-medium ${diff > 0 ? "text-destructive" : "text-emerald-600"}`}>
                        {diff > 0 ? "+" : ""}
                        {formatCompact(diff)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>13-Wochen-Liquiditätsvorschau</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liquidity}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} fontSize={11} interval={1} />
                  <YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => formatCompact(v)} width={60} />
                  <RTooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Area type="monotone" name="Best" dataKey="best" stroke={BRASS} fill={BRASS} fillOpacity={0.1} strokeWidth={2} />
                  <Area type="monotone" name="Realistisch" dataKey="realistic" stroke={NAVY} fill={NAVY} fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" name="Worst" dataKey="worst" stroke={RED} fill={RED} fillOpacity={0.08} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedEntity === "MiGu Group Gesamt" && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Entitätsvergleich</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entität</TableHead>
                  <TableHead className="text-right">Umsatz</TableHead>
                  <TableHead className="text-right">Kosten</TableHead>
                  <TableHead className="text-right">EBITDA</TableHead>
                  <TableHead className="text-right">Gewinn</TableHead>
                  <TableHead className="text-right">Liquidität</TableHead>
                  <TableHead>Risiko</TableHead>
                  <TableHead className="text-right">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparison.map((c) => (
                  <TableRow key={c.code} data-testid={`row-entity-${c.code}`}>
                    <TableCell className="font-semibold text-primary">{c.code}</TableCell>
                    <TableCell className="text-right">{formatCompact(c.revenue)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCompact(c.costs)}</TableCell>
                    <TableCell className="text-right">{formatCompact(c.ebitda)}</TableCell>
                    <TableCell className="text-right">{formatCompact(c.profit)}</TableCell>
                    <TableCell className="text-right">{formatCompact(c.liquidity)}</TableCell>
                    <TableCell><RiskBadge level={c.riskLevel} /></TableCell>
                    <TableCell className={`text-right font-medium ${c.trend >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                      {c.trend >= 0 ? "+" : ""}
                      {c.trend.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Offene Risiken</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Risiko</TableHead>
                <TableHead>Entität</TableHead>
                <TableHead>Wirkung</TableHead>
                <TableHead>Wahrscheinlichkeit</TableHead>
                <TableHead>Verantwortlich</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {risks.map((r) => (
                <TableRow key={r.id} data-testid={`row-risk-${r.id}`}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell>{r.entity}</TableCell>
                  <TableCell><RiskBadge level={r.impact} /></TableCell>
                  <TableCell><RiskBadge level={r.probability} /></TableCell>
                  <TableCell>{r.owner}</TableCell>
                  <TableCell className="text-muted-foreground">{r.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
