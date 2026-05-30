import { useAppStore } from "@/hooks/use-app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page";
import {
  getProfitLoss,
  getBalanceSheet,
  getCashflow,
  getBudget,
  getEntityComparison,
  getFinance,
  INTERCOMPANY,
  formatCurrency,
  formatCompact,
} from "@/data";
import { Info, PieChart } from "lucide-react";
import {
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
const RED = "hsl(0 84% 60%)";

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

export default function Finanzen() {
  const { selectedEntity } = useAppStore();
  const pl = getProfitLoss(selectedEntity);
  const bs = getBalanceSheet(selectedEntity);
  const cf = getCashflow(selectedEntity);
  const budget = getBudget(selectedEntity);
  const comparison = getEntityComparison();
  const group = getFinance("MiGu Group Gesamt");

  return (
    <div className="space-y-6">
      <PageHeader title="Finanzen" subtitle="Berichte & Konsolidierung" icon={<PieChart className="h-5 w-5" />} />

      <Tabs defaultValue="pl">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="pl" data-testid="tab-pl">Ergebnisrechnung</TabsTrigger>
          <TabsTrigger value="bs" data-testid="tab-bs">Bilanz</TabsTrigger>
          <TabsTrigger value="cf" data-testid="tab-cf">Cashflow</TabsTrigger>
          <TabsTrigger value="budget" data-testid="tab-budget">Budget vs. Ist</TabsTrigger>
          <TabsTrigger value="konsol" data-testid="tab-konsol">Konsolidierung</TabsTrigger>
          <TabsTrigger value="ic" data-testid="tab-ic">Intercompany</TabsTrigger>
        </TabsList>

        <TabsContent value="pl">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Gewinn- und Verlustrechnung</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {pl.map((r) => (
                    <TableRow key={r.label} className={r.bold ? "bg-muted/40" : ""} data-testid={`row-pl-${r.label}`}>
                      <TableCell className="py-2.5"><InfoLabel label={r.label} explain={r.explain} bold={r.bold} /></TableCell>
                      <TableCell className={`text-right py-2.5 ${r.bold ? "font-semibold" : ""} ${r.value < 0 ? "text-destructive" : ""}`}>
                        {formatCurrency(r.value)}
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
                        <TableCell className="text-right">{formatCurrency(r.value)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/40">
                      <TableCell className="font-semibold">Summe Aktiva</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(bs.assets.reduce((a, b) => a + b.value, 0))}</TableCell>
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
                        <TableCell className="text-right">{formatCurrency(r.value)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/40">
                      <TableCell className="font-semibold">Summe Passiva</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(bs.liabilities.reduce((a, b) => a + b.value, 0))}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cf">
          <Card className="glass-card">
            <CardHeader><CardTitle>Cashflow-Entwicklung</CardTitle></CardHeader>
            <CardContent className="pl-0">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cf.series}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => formatCompact(v)} width={60} />
                    <RTooltip formatter={(v: number) => formatCurrency(v)} />
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
            <CardHeader><CardTitle>Budget vs. Ist</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {budget.map((b) => {
                const pct = Math.min(150, Math.round((b.actual / b.budget) * 100));
                const over = b.actual > b.budget;
                return (
                  <div key={b.category} className="space-y-1.5" data-testid={`budget-${b.category}`}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{b.category}</span>
                      <span className={over ? "text-destructive" : "text-emerald-600"}>
                        {formatCurrency(b.actual)} / {formatCurrency(b.budget)}
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
              <CardTitle>Konsolidierung</CardTitle>
              <p className="text-sm text-muted-foreground">Gruppensumme im Abgleich mit der Summe aller Entitäten.</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entität</TableHead>
                    <TableHead className="text-right">Umsatz</TableHead>
                    <TableHead className="text-right">EBITDA</TableHead>
                    <TableHead className="text-right">Gewinn</TableHead>
                    <TableHead className="text-right">Liquidität</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparison.map((c) => (
                    <TableRow key={c.code}>
                      <TableCell className="font-medium">{c.code}</TableCell>
                      <TableCell className="text-right">{formatCompact(c.revenue)}</TableCell>
                      <TableCell className="text-right">{formatCompact(c.ebitda)}</TableCell>
                      <TableCell className="text-right">{formatCompact(c.profit)}</TableCell>
                      <TableCell className="text-right">{formatCompact(c.liquidity)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-primary/5 font-semibold">
                    <TableCell>MiGu Group Gesamt</TableCell>
                    <TableCell className="text-right">{formatCompact(group.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCompact(group.ebitda)}</TableCell>
                    <TableCell className="text-right">{formatCompact(group.netProfit)}</TableCell>
                    <TableCell className="text-right">{formatCompact(group.cash)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ic">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Intercompany-Verrechnungen</CardTitle>
              <p className="text-sm text-muted-foreground">Leistungsbeziehungen zwischen den MiGu-Entitäten, die bei der Konsolidierung eliminiert werden.</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Von</TableHead>
                    <TableHead>An</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {INTERCOMPANY.map((r, i) => (
                    <TableRow key={i} data-testid={`row-ic-${i}`}>
                      <TableCell className="font-semibold text-primary">{r.from}</TableCell>
                      <TableCell className="font-semibold text-primary">{r.to}</TableCell>
                      <TableCell>{r.description}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
