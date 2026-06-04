import { useTranslation } from "react-i18next";
import { useAppStore } from "@/hooks/use-app-context";
import { useFormat } from "@/hooks/use-format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page";
import { Term } from "@/components/shared/Term";
import { AiInsight } from "@/components/shared/AiInsight";
import { UploadPanel } from "@/components/shared/UploadPanel";
import type { GlossaryKey } from "@/data";
import {
  getProfitLoss,
  getPLOverview,
  getBalanceSheet,
  getCashflow,
  getBudget,
  getEntityComparison,
  getFinance,
  INTERCOMPANY,
} from "@/data";
import { Info, PieChart as PieIcon } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const NAVY = "hsl(216 65% 11%)";
const BRASS = "hsl(190 80% 42%)";
const RED = "hsl(0 84% 60%)";
const GREY = "hsl(215 16% 47%)";
const PIE_COLORS = [NAVY, BRASS, GREY, RED, "hsl(216 40% 40%)"];

function InfoLabel({ label, explain, bold }: { label: string; explain?: string; bold?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${bold ? "font-semibold" : ""}`}>
      {label}
      {explain && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="text-muted-foreground/50 hover:text-primary">
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-[240px]">{explain}</TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}

function StatCard({ glossary, label, value, sub }: { glossary: GlossaryKey; label: string; value: string; sub?: string }) {
  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground"><Term k={glossary}>{label}</Term></p>
        <p className="text-2xl font-bold text-primary mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function Finanzen() {
  const { selectedEntity, entities } = useAppStore();
  const { t } = useTranslation();
  const { currency, compact, number } = useFormat();
  const pl = getProfitLoss(selectedEntity);
  const plo = getPLOverview(selectedEntity);
  const bs = getBalanceSheet(selectedEntity);
  const cf = getCashflow(selectedEntity);
  const budget = getBudget(selectedEntity);
  const comparison = getEntityComparison(entities);
  const group = getFinance("MiGu Group Gesamt");

  return (
    <div className="space-y-6">
      <PageHeader title={t("finanzen")} subtitle={t("key_figures")} icon={<PieIcon className="h-5 w-5" />} />

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview" data-testid="tab-overview">{t("tab_overview")}</TabsTrigger>
          <TabsTrigger value="pl" data-testid="tab-pl">{t("tab_pl")}</TabsTrigger>
          <TabsTrigger value="bs" data-testid="tab-balance">{t("tab_balance")}</TabsTrigger>
          <TabsTrigger value="cf" data-testid="tab-cashflow">{t("tab_cashflow")}</TabsTrigger>
          <TabsTrigger value="budget" data-testid="tab-budget">{t("tab_budget")}</TabsTrigger>
          <TabsTrigger value="konsol" data-testid="tab-consolidation">{t("tab_consolidation")}</TabsTrigger>
          <TabsTrigger value="ic" data-testid="tab-intercompany">{t("tab_intercompany")}</TabsTrigger>
          <TabsTrigger value="uploads" data-testid="tab-uploads">{t("tab_uploads")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard glossary="umsatz" label={t("kpi_revenue")} value={compact(plo.revenue)} />
            <StatCard glossary="bruttogewinn" label={t("gross_profit")} value={compact(plo.grossProfit)} sub={`${number(Math.round(plo.grossMargin * 10) / 10)} % ${t("gross_margin")}`} />
            <StatCard glossary="ebitda" label={t("kpi_ebitda")} value={compact(plo.ebitda)} sub={`${number(Math.round(plo.ebitdaMargin * 10) / 10)} % ${t("kpi_margin")}`} />
            <StatCard glossary="nettoergebnis" label={t("kpi_net")} value={compact(plo.netProfit)} sub={`${number(Math.round(plo.netMargin * 10) / 10)} % ${t("net_margin")}`} />
          </div>
          <AiInsight context="finanzen" />
          <Card className="glass-card">
            <CardHeader><CardTitle>{t("profit_trend")}</CardTitle></CardHeader>
            <CardContent className="pl-0">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={plo.series}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => compact(v)} width={60} />
                    <RTooltip formatter={(v: number) => currency(v)} />
                    <Legend />
                    <Area type="monotone" name={t("kpi_revenue")} dataKey="revenue" stroke={NAVY} fill={NAVY} fillOpacity={0.12} strokeWidth={2} />
                    <Area type="monotone" name={t("kpi_ebitda")} dataKey="ebitda" stroke={BRASS} fill={BRASS} fillOpacity={0.12} strokeWidth={2} />
                    <Area type="monotone" name={t("kpi_net")} dataKey="profit" stroke={GREY} fill={GREY} fillOpacity={0.08} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pl" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard glossary="bruttogewinn" label={t("gross_profit")} value={compact(plo.grossProfit)} sub={`${number(Math.round(plo.grossMargin * 10) / 10)} %`} />
            <StatCard glossary="ebit" label={t("ebit")} value={compact(plo.ebit)} />
            <StatCard glossary="nettoergebnis" label={t("kpi_net")} value={compact(plo.netProfit)} sub={`${number(Math.round(plo.netMargin * 10) / 10)} %`} />
            <StatCard glossary="abschreibung" label={t("depreciation")} value={compact(plo.depreciation)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="glass-card lg:col-span-3">
              <CardHeader><CardTitle>{t("profit_trend")}</CardTitle></CardHeader>
              <CardContent className="pl-0">
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={plo.series}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                      <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => compact(v)} width={60} />
                      <RTooltip formatter={(v: number) => currency(v)} />
                      <Legend />
                      <Area type="monotone" name={t("kpi_revenue")} dataKey="revenue" stroke={NAVY} fill={NAVY} fillOpacity={0.12} strokeWidth={2} />
                      <Area type="monotone" name={t("kpi_net")} dataKey="profit" stroke={BRASS} fill={BRASS} fillOpacity={0.12} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card lg:col-span-2">
              <CardHeader><CardTitle>{t("cost_structure")}</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={plo.costBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                        {plo.costBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <RTooltip formatter={(v: number) => currency(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card">
            <CardHeader><CardTitle>{t("pl_title")}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {pl.map((r) => (
                    <TableRow key={r.label} className={r.bold ? "bg-muted/40" : ""} data-testid={`row-pl-${r.label}`}>
                      <TableCell className="py-2.5"><InfoLabel label={r.label} explain={r.explain} bold={r.bold} /></TableCell>
                      <TableCell className={`text-right py-2.5 ${r.bold ? "font-semibold" : ""} ${r.value < 0 ? "text-destructive" : ""}`}>
                        {currency(r.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bs">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass-card">
              <CardHeader><CardTitle>Aktiva</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {bs.assets.map((r) => (
                      <TableRow key={r.label}>
                        <TableCell><InfoLabel label={r.label} explain={r.explain} /></TableCell>
                        <TableCell className="text-right">{currency(r.value)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/40">
                      <TableCell className="font-semibold">Summe Aktiva</TableCell>
                      <TableCell className="text-right font-semibold">{currency(bs.assets.reduce((a, b) => a + b.value, 0))}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader><CardTitle>Passiva</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {bs.liabilities.map((r) => (
                      <TableRow key={r.label}>
                        <TableCell><InfoLabel label={r.label} explain={r.explain} /></TableCell>
                        <TableCell className="text-right">{currency(r.value)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/40">
                      <TableCell className="font-semibold">Summe Passiva</TableCell>
                      <TableCell className="text-right font-semibold">{currency(bs.liabilities.reduce((a, b) => a + b.value, 0))}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cf">
          <Card className="glass-card">
            <CardHeader><CardTitle><Term k="cashflow">{t("cashflow")}</Term></CardTitle></CardHeader>
            <CardContent className="pl-0">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cf.series}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => compact(v)} width={60} />
                    <RTooltip formatter={(v: number) => currency(v)} />
                    <Legend />
                    <Area type="monotone" name="Operativ" dataKey="operating" stroke={NAVY} fill={NAVY} fillOpacity={0.12} strokeWidth={2} />
                    <Area type="monotone" name="Investition" dataKey="investing" stroke={RED} fill={RED} fillOpacity={0.1} strokeWidth={2} />
                    <Area type="monotone" name="Finanzierung" dataKey="financing" stroke={BRASS} fill={BRASS} fillOpacity={0.1} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget">
          <Card className="glass-card">
            <CardHeader><CardTitle><Term k="budget_ist">{t("budget_vs_actual")}</Term></CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {budget.map((b) => {
                const pct = Math.min(150, Math.round((b.actual / b.budget) * 100));
                const over = b.actual > b.budget;
                return (
                  <div key={b.category} className="space-y-1.5" data-testid={`budget-${b.category}`}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{b.category}</span>
                      <span className={over ? "text-destructive" : "text-emerald-600"}>
                        {currency(b.actual)} / {currency(b.budget)}
                      </span>
                    </div>
                    <Progress value={pct} className={over ? "[&>div]:bg-destructive" : "[&>div]:bg-emerald-500"} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="konsol">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle><Term k="konsolidierung">{t("tab_consolidation")}</Term></CardTitle>
              <p className="text-sm text-muted-foreground">Gruppensumme im Abgleich mit der Summe aller Entitäten.</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("entity")}</TableHead>
                    <TableHead className="text-right">{t("kpi_revenue")}</TableHead>
                    <TableHead className="text-right">{t("kpi_ebitda")}</TableHead>
                    <TableHead className="text-right">{t("kpi_net")}</TableHead>
                    <TableHead className="text-right">{t("kpi_cash")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparison.map((c) => (
                    <TableRow key={c.code}>
                      <TableCell className="font-medium">{c.code}</TableCell>
                      <TableCell className="text-right">{compact(c.revenue)}</TableCell>
                      <TableCell className="text-right">{compact(c.ebitda)}</TableCell>
                      <TableCell className="text-right">{compact(c.profit)}</TableCell>
                      <TableCell className="text-right">{compact(c.liquidity)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-primary/5 font-semibold">
                    <TableCell>{t("all_entities")}</TableCell>
                    <TableCell className="text-right">{compact(group.revenue)}</TableCell>
                    <TableCell className="text-right">{compact(group.ebitda)}</TableCell>
                    <TableCell className="text-right">{compact(group.netProfit)}</TableCell>
                    <TableCell className="text-right">{compact(group.cash)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ic">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle><Term k="intercompany">{t("tab_intercompany")}</Term></CardTitle>
              <p className="text-sm text-muted-foreground">Leistungsbeziehungen zwischen den MiGu-Entitäten, die bei der Konsolidierung eliminiert werden.</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Von</TableHead>
                    <TableHead>An</TableHead>
                    <TableHead>{t("description")}</TableHead>
                    <TableHead className="text-right">{t("amount")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {INTERCOMPANY.map((r, i) => (
                    <TableRow key={i} data-testid={`row-ic-${i}`}>
                      <TableCell className="font-semibold text-primary">{r.from}</TableCell>
                      <TableCell className="font-semibold text-primary">{r.to}</TableCell>
                      <TableCell>{r.description}</TableCell>
                      <TableCell className="text-right">{currency(r.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="uploads">
          <UploadPanel
            docTypes={["Monatsbericht", "Rechnungsliste", "Bankübersicht", "Budgetdatei"]}
            defaultDocType="Monatsbericht"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
