import type { ReactNode } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { useTranslation } from "react-i18next";
import { groupIdFromView } from "@/data";
import { Badge } from "@/components/ui/badge";

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  const { selectedEntity, groups, entities } = useAppStore();
  const { t } = useTranslation();
  const gid = groupIdFromView(selectedEntity);
  const viewLabel = gid
    ? groups.find((g) => g.id === gid)?.name ?? t("grp_label")
    : entities.find((e) => e.code === selectedEntity)?.code ?? selectedEntity;
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="rounded-xl bg-primary/10 text-primary p-2.5 hidden sm:flex">{icon}</div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary" data-testid="text-page-title">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {subtitle ? `${subtitle} · ` : ""}
            {t("view_for")}{" "}
            <span className="font-medium text-foreground">{viewLabel}</span>
          </p>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

const RISK_STYLES: Record<string, string> = {
  Hoch: "bg-destructive/10 text-destructive border-destructive/20",
  Mittel: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Niedrig: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

const RISK_I18N: Record<string, string> = { Hoch: "high", Mittel: "medium", Niedrig: "low" };

export function riskLabel(t: (k: string) => string, s: string): string {
  return RISK_I18N[s] ? t(RISK_I18N[s]) : s;
}

export function RiskBadge({ level }: { level: string }) {
  const { t } = useTranslation();
  return (
    <Badge variant="outline" className={RISK_STYLES[level] ?? ""} data-testid={`badge-risk-${level}`}>
      {RISK_I18N[level] ? t(RISK_I18N[level]) : level}
    </Badge>
  );
}

const STATUS_TONES: Record<string, string> = {
  // positive / done
  Verarbeitet: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Freigegeben: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Bezahlt: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Erhalten: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Bereit: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Aktiv: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Übertroffen: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Erfüllt: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  // in progress
  "In Prüfung": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Eingereicht: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Bestellt: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Offen: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "In Beobachtung": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Mock-Daten": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  // neutral / new
  Neu: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  Entwurf: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  Archiviert: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  "Nicht verbunden": "bg-slate-500/10 text-slate-600 border-slate-500/20",
  Offen2: "",
  // negative
  Fehler: "bg-destructive/10 text-destructive border-destructive/20",
  Abgelehnt: "bg-destructive/10 text-destructive border-destructive/20",
  Verfehlt: "bg-destructive/10 text-destructive border-destructive/20",
  verloren: "bg-destructive/10 text-destructive border-destructive/20",
};

export const STATUS_I18N: Record<string, string> = {
  Verarbeitet: "st_verarbeitet",
  Freigegeben: "st_freigegeben",
  Bezahlt: "st_bezahlt",
  Erhalten: "st_erhalten",
  Bereit: "st_bereit",
  Aktiv: "st_aktiv",
  Übertroffen: "st_uebertroffen",
  Erfüllt: "st_erfuellt",
  "In Prüfung": "st_in_pruefung",
  Eingereicht: "st_eingereicht",
  Bestellt: "st_bestellt",
  Offen: "st_offen",
  "In Beobachtung": "st_in_beobachtung",
  "Mock-Daten": "st_mock_daten",
  Neu: "st_neu",
  Entwurf: "st_entwurf",
  Archiviert: "st_archiviert",
  "Nicht verbunden": "st_nicht_verbunden",
  Fehler: "st_fehler",
  Abgelehnt: "st_abgelehnt",
  Verfehlt: "st_verfehlt",
  verloren: "st_verloren",
  Geschlossen: "st_geschlossen",
  Beurlaubt: "st_beurlaubt",
  Ausgeschieden: "st_ausgeschieden",
  "verfügbar": "st_verfuegbar",
  zugewiesen: "st_zugewiesen",
  "in Reparatur": "st_in_reparatur",
  ausgemustert: "st_ausgemustert",
  verkauft: "st_verkauft",
  offen: "st_offen",
  "gezählt": "st_gezaehlt",
  abweichend: "st_abweichend",
  fehlt: "st_fehlt",
};

export function statusLabel(t: (k: string) => string, s: string): string {
  return STATUS_I18N[s] ? t(STATUS_I18N[s]) : s;
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <Badge variant="outline" className={STATUS_TONES[status] ?? "bg-muted text-muted-foreground"} data-testid={`badge-status-${status}`}>
      {STATUS_I18N[status] ? t(STATUS_I18N[status]) : status}
    </Badge>
  );
}
