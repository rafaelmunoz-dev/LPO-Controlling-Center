import type { ReactNode } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { useTranslation } from "react-i18next";
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
  const { selectedEntity } = useAppStore();
  const { t } = useTranslation();
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
            <span className="font-medium text-foreground">{selectedEntity}</span>
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

export function RiskBadge({ level }: { level: string }) {
  return (
    <Badge variant="outline" className={RISK_STYLES[level] ?? ""} data-testid={`badge-risk-${level}`}>
      {level}
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

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={STATUS_TONES[status] ?? "bg-muted text-muted-foreground"} data-testid={`badge-status-${status}`}>
      {status}
    </Badge>
  );
}
