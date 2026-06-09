import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Target } from "lucide-react";
import { useAppStore } from "@/hooks/use-app-context";
import { useFormat } from "@/hooks/use-format";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PanelHeader } from "@/components/shared/PanelHeader";
import { Term } from "@/components/shared/Term";
import { CHART } from "@/lib/chart";
import {
  getFinance,
  can,
  KPI_METRICS,
  kpiActual,
  kpiStatus,
  kpiAttainment,
  kpiTargetId,
  type KpiMetricMeta,
  type KpiStatus,
} from "@/data";

const STATUS_COLOR: Record<KpiStatus, string> = {
  green: "var(--color-emerald-600, #059669)",
  amber: "var(--color-amber-500, #f59e0b)",
  red: "var(--color-destructive, #dc2626)",
};

const STATUS_LABEL_KEY: Record<KpiStatus, string> = {
  green: "kpi_status_green",
  amber: "kpi_status_amber",
  red: "kpi_status_red",
};

function StatusDot({ status }: { status: KpiStatus }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: STATUS_COLOR[status] }}
      aria-hidden
    />
  );
}

export function KpiGoals() {
  const { selectedEntity, kpiTargets, currentUser } = useAppStore();
  // Reading financeInputs keeps actuals reactive to data edits.
  useAppStore((s) => s.financeInputs);
  const { t } = useTranslation();
  const { compact, number } = useFormat();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const canEdit = can(currentUser.role, "finanzdaten:edit");

  const f = getFinance(selectedEntity);
  const targets = kpiTargets.filter((k) => k.view === selectedEntity && k.target > 0);

  const fmt = (meta: KpiMetricMeta, value: number): string => {
    if (meta.unit === "€") return compact(value);
    if (meta.unit === "%") return `${number(Math.round(value * 10) / 10)} %`;
    if (meta.unit === "months") return `${number(Math.round(value * 10) / 10)} ${t("months")}`;
    return number(value);
  };

  const rows = targets
    .map((target) => {
      const meta = KPI_METRICS.find((m) => m.metric === target.metric);
      if (!meta) return null;
      const actual = kpiActual(f, target.metric);
      const status = kpiStatus(actual, target.target, meta.direction, target.tolerance);
      const attainment = kpiAttainment(actual, target.target, meta.direction);
      return { target, meta, actual, status, attainment };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => KPI_METRICS.indexOf(a.meta) - KPI_METRICS.indexOf(b.meta));

  const onTrack = rows.filter((r) => r.status === "green").length;
  const critical = rows.filter((r) => r.status === "red").length;

  return (
    <Card className="glass-card" data-testid="card-kpi-goals">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <PanelHeader
            icon={Target}
            color={CHART.gold}
            title={t("kpi_goals_title")}
            subtitle={t("kpi_goals_subtitle")}
            statValue={number(onTrack)}
            statLabel={t("kpi_goal_status")}
          />
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setOpen(true)} data-testid="button-kpi-goals-edit">
              {t("kpi_goals_edit")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground" data-testid="text-kpi-goals-empty">
            {t("kpi_goals_empty")}
          </p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <StatusDot status="green" /> {t("kpi_goals_on_track", { n: onTrack })}
              </span>
              <span className="flex items-center gap-1.5">
                <StatusDot status="red" /> {t("kpi_goals_off_track", { n: critical })}
              </span>
            </div>
            <div className="space-y-1">
              {rows.map(({ target, meta, actual, status, attainment }) => (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => navigate(meta.nav)}
                  className="card-link flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left"
                  data-testid={`row-kpi-goal-${meta.metric}`}
                >
                  <StatusDot status={status} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      <Term k={meta.glossary}>{t(meta.labelKey)}</Term>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("kpi_goal_actual")}: {fmt(meta, actual)} · {t("kpi_goal_target")}: {fmt(meta, target.target)}
                    </span>
                  </span>
                  <span className="hidden w-32 shrink-0 sm:block">
                    <span className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <span
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, attainment)}%`,
                          backgroundColor: STATUS_COLOR[status],
                        }}
                      />
                    </span>
                  </span>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{
                      color: STATUS_COLOR[status],
                      backgroundColor: `color-mix(in srgb, ${STATUS_COLOR[status]} 14%, transparent)`,
                    }}
                    data-testid={`badge-kpi-goal-${meta.metric}`}
                  >
                    {t(STATUS_LABEL_KEY[status])}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </CardContent>
      <KpiGoalsDialog open={open} onOpenChange={setOpen} canEdit={canEdit} />
    </Card>
  );
}

function metricLabel(t: (k: string) => string, meta: KpiMetricMeta): string {
  return t(meta.labelKey);
}

function KpiGoalsDialog({
  open,
  onOpenChange,
  canEdit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  canEdit: boolean;
}) {
  const { selectedEntity, kpiTargets, addKpiTarget, updateKpiTarget, logAction } = useAppStore();
  const { t } = useTranslation();

  const current = (metric: KpiMetricMeta["metric"]) =>
    kpiTargets.find((k) => k.view === selectedEntity && k.metric === metric);

  const setTarget = (meta: KpiMetricMeta, rawTarget: number, rawTol: number) => {
    if (!canEdit) {
      toast.error(t("no_permission"));
      return;
    }
    const id = kpiTargetId(selectedEntity, meta.metric);
    const existing = current(meta.metric);
    const targetValue = Math.max(0, rawTarget || 0);
    const tolerance = Math.min(100, Math.max(0, rawTol || 0));
    if (targetValue <= 0) {
      // Clearing a goal is an edit (persist target=0), not a delete: the card and
      // dashboard filter target>0, so Mitarbeiter (edit, no delete) can clear safely.
      if (existing && existing.target > 0) {
        updateKpiTarget(existing.id, { target: 0 });
        logAction("kpi_target_removed", `${metricLabel(t, meta)} · ${selectedEntity}`);
      }
      return;
    }
    if (existing) {
      updateKpiTarget(existing.id, { target: targetValue, tolerance });
    } else {
      addKpiTarget({ id, view: selectedEntity, metric: meta.metric, target: targetValue, tolerance });
    }
    logAction("kpi_target_set", `${metricLabel(t, meta)} · ${selectedEntity}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("kpi_goals_edit_title")}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          <div className="grid grid-cols-[1fr_8rem_7rem] gap-3 px-1 text-xs font-medium text-muted-foreground">
            <span>{t("kpi_goal_metric")}</span>
            <span>{t("kpi_goal_target")}</span>
            <span>{t("kpi_goal_tolerance")}</span>
          </div>
          {KPI_METRICS.map((meta) => {
            const existing = current(meta.metric);
            return (
              <div key={meta.metric} className="grid grid-cols-[1fr_8rem_7rem] items-center gap-3">
                <Label className="text-sm font-medium">{metricLabel(t, meta)}</Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  defaultValue={existing?.target ?? ""}
                  disabled={!canEdit}
                  onBlur={(e) =>
                    setTarget(meta, Number(e.target.value), existing?.tolerance ?? 10)
                  }
                  data-testid={`input-kpi-target-${meta.metric}`}
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  defaultValue={existing?.tolerance ?? 10}
                  disabled={!canEdit}
                  onBlur={(e) => {
                    const cur = current(meta.metric);
                    if (cur) updateKpiTarget(cur.id, { tolerance: Math.min(100, Math.max(0, Number(e.target.value) || 0)) });
                  }}
                  data-testid={`input-kpi-tolerance-${meta.metric}`}
                />
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} data-testid="button-kpi-goals-close">
            {t("common_save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
