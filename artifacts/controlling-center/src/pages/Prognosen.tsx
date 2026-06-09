import { useState } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { useFormat } from "@/hooks/use-format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AiInsight } from "@/components/shared/AiInsight";
import {
  getForecasts,
  getFinance,
  labelForView,
  formatCurrency,
  formatNumber,
  liquidityPlanFor,
  liquidityDirection,
  emptyLiquidityLine,
  liquidityLineId,
  LIQUIDITY_HORIZON,
  LIQUIDITY_CATEGORIES,
} from "@/data";
import { can } from "@/data/governance";
import type { ForecastSeries, EntityCode, LiquidityCategory, LiquidityLine } from "@/data/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CHART } from "@/lib/chart";

const NAVY = CHART.navy;
const BRASS = CHART.gold;
const RED = CHART.red;

export function PrognosenView() {
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="period" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => (active.unit === "€" ? formatCurrency(v) : formatNumber(v))} width={75} />
                <RTooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Area type="monotone" name={t("best_case")} dataKey="best" stroke={BRASS} fill={BRASS} fillOpacity={0.12} strokeWidth={2} isAnimationActive={false} />
                <Area type="monotone" name={t("realistic")} dataKey="realistic" stroke={NAVY} fill={NAVY} fillOpacity={0.18} strokeWidth={2} isAnimationActive={false} />
                <Area type="monotone" name={t("worst_case")} dataKey="worst" stroke={RED} fill={RED} fillOpacity={0.08} strokeWidth={2} isAnimationActive={false} />
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

      <LiquidityPlanCard view={selectedEntity} />

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

function LiquidityPlanCard({ view }: { view: EntityCode }) {
  const { t } = useTranslation();
  const { currency } = useFormat();
  const lines = useAppStore((s) => s.liquidityLines);
  const role = useAppStore((s) => s.currentUser.role);
  const canEdit = can(role, "finanzdaten:edit");
  const [open, setOpen] = useState(false);

  const openingCash = getFinance(view).cash;
  const plan = liquidityPlanFor(lines, view, openingCash);
  const chartData = [
    { week: t("liq_week_now"), closing: Math.round(plan.openingCash) },
    ...plan.weeks.map((w) => ({ week: `KW ${w.week}`, closing: Math.round(w.closing) })),
  ];
  const negative = plan.lowPoint < 0;

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <div>
            <CardTitle>{t("liq_title")}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{t("liq_subtitle")} · {labelForView(view)}</p>
          </div>
          <Button variant="outline" onClick={() => setOpen(true)} data-testid="button-liq-edit">{t("liq_edit")}</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label={t("liq_opening_cash")} value={currency(plan.openingCash)} />
          <Kpi label={t("liq_ending_cash")} value={currency(plan.endingCash)} tone={plan.endingCash < 0 ? "bad" : undefined} />
          <Kpi
            label={t("liq_low_point")}
            value={currency(plan.lowPoint)}
            sub={plan.lowWeek === 0 ? t("liq_week_now") : `KW ${plan.lowWeek}`}
            tone={negative ? "bad" : undefined}
          />
          <Kpi label={t("liq_total_net")} value={currency(plan.totalIn - plan.totalOut)} tone={plan.totalIn - plan.totalOut < 0 ? "bad" : "good"} />
        </div>

        {negative && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" data-testid="liq-negative-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t("liq_negative_warning", { week: plan.lowWeek, amount: currency(plan.lowPoint) })}</span>
          </div>
        )}

        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
              <XAxis dataKey="week" axisLine={false} tickLine={false} fontSize={11} interval={0} />
              <YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => formatCurrency(v)} width={80} />
              <RTooltip formatter={(v: number) => currency(v)} />
              <ReferenceLine y={0} stroke={RED} strokeDasharray="4 4" />
              <Area type="monotone" name={t("liq_closing")} dataKey="closing" stroke={NAVY} fill={NAVY} fillOpacity={0.16} strokeWidth={2} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("liq_col_week")}</TableHead>
                <TableHead className="text-right">{t("liq_col_opening")}</TableHead>
                <TableHead className="text-right">{t("liq_col_inflows")}</TableHead>
                <TableHead className="text-right">{t("liq_col_outflows")}</TableHead>
                <TableHead className="text-right">{t("liq_col_net")}</TableHead>
                <TableHead className="text-right">{t("liq_col_closing")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plan.weeks.map((w) => (
                <TableRow key={w.week} data-testid={`liq-row-${w.week}`}>
                  <TableCell className="font-medium">KW {w.week}</TableCell>
                  <TableCell className="text-right tabular-nums">{currency(w.opening)}</TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-600">{w.inflows ? currency(w.inflows) : "–"}</TableCell>
                  <TableCell className="text-right tabular-nums text-destructive">{w.outflows ? currency(w.outflows) : "–"}</TableCell>
                  <TableCell className={`text-right tabular-nums ${w.net < 0 ? "text-destructive" : ""}`}>{currency(w.net)}</TableCell>
                  <TableCell className={`text-right tabular-nums font-semibold ${w.closing < 0 ? "text-destructive" : ""}`}>{currency(w.closing)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <LiquidityEditDialog open={open} onOpenChange={setOpen} view={view} canEdit={canEdit} />
    </Card>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "bad" }) {
  const color = tone === "bad" ? "text-destructive" : tone === "good" ? "text-emerald-600" : "text-primary";
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold mt-1 tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function LiquidityEditDialog({
  open,
  onOpenChange,
  view,
  canEdit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  view: EntityCode;
  canEdit: boolean;
}) {
  const { t } = useTranslation();
  const { currency } = useFormat();
  const lines = useAppStore((s) => s.liquidityLines);
  const addLine = useAppStore((s) => s.addLiquidityLine);
  const updateLine = useAppStore((s) => s.updateLiquidityLine);
  const removeLine = useAppStore((s) => s.removeLiquidityLine);
  const logAction = useAppStore((s) => s.logAction);

  const rows = lines
    .filter((l) => l.view === view)
    .sort((a, b) => a.week - b.week || a.category.localeCompare(b.category));

  const addRow = () => {
    if (!canEdit) {
      toast.error(t("no_permission"));
      return;
    }
    addLine({ id: liquidityLineId(), ...emptyLiquidityLine(view) });
  };

  const del = (l: LiquidityLine) => {
    removeLine(l.id);
    logAction(t("liq_log_delete"), `${labelForView(view)} · KW ${l.week} · ${t(`liq_cat_${l.category}`)}`);
  };

  const weekOptions = Array.from({ length: LIQUIDITY_HORIZON }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("liq_edit_title")}</DialogTitle>
          <p className="text-sm text-muted-foreground">{t("liq_edit_subtitle")} · {labelForView(view)}</p>
        </DialogHeader>
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {rows.length === 0 && <p className="text-sm text-muted-foreground">{t("liq_empty")}</p>}
          {rows.map((l) => (
            <div key={l.id} className="grid grid-cols-[auto_1fr_1fr_auto] items-end gap-2" data-testid={`liq-line-${l.id}`}>
              <div className="space-y-1">
                <Label className="text-xs">{t("liq_col_week")}</Label>
                <Select value={String(l.week)} onValueChange={(v) => updateLine(l.id, { week: Number(v) })} disabled={!canEdit}>
                  <SelectTrigger className="h-9 w-20" data-testid={`select-liq-week-${l.id}`}><SelectValue /></SelectTrigger>
                  <SelectContent>{weekOptions.map((w) => <SelectItem key={w} value={String(w)}>KW {w}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("liq_category")}</Label>
                <Select value={l.category} onValueChange={(v) => updateLine(l.id, { category: v as LiquidityCategory })} disabled={!canEdit}>
                  <SelectTrigger className="h-9" data-testid={`select-liq-cat-${l.id}`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LIQUIDITY_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {liquidityDirection(c) === "in" ? "↑ " : "↓ "}{t(`liq_cat_${c}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("liq_amount")}</Label>
                <Input
                  type="number"
                  className="h-9"
                  value={String(l.amount)}
                  disabled={!canEdit}
                  min={0}
                  onChange={(e) => updateLine(l.id, { amount: Math.max(0, Number(e.target.value) || 0) })}
                  data-testid={`input-liq-amount-${l.id}`}
                />
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" disabled={!canEdit} onClick={() => del(l)} data-testid={`button-liq-delete-${l.id}`}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {rows.length > 0 && (
            <div className="flex justify-between border-t border-border/50 pt-2 text-sm font-medium">
              <span>{t("liq_total_net")}</span>
              <span className="tabular-nums">
                {currency(
                  rows.reduce((a, l) => a + (liquidityDirection(l.category) === "in" ? l.amount : -l.amount), 0),
                )}
              </span>
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={addRow} disabled={!canEdit} data-testid="button-liq-add">
            <Plus className="mr-1.5 h-4 w-4" />
            {t("liq_add_line")}
          </Button>
          <Button onClick={() => onOpenChange(false)} data-testid="button-liq-done">{t("liq_done")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
