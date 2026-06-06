import { FlaskConical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

const WRAP =
  "flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700";

export function SampleDataBanner() {
  const { t } = useTranslation();
  return (
    <div className={WRAP} data-testid="notice-sample-data">
      <FlaskConical className="h-3.5 w-3.5 shrink-0" />
      <span>
        <span className="font-semibold">{t("sim_sample_data")}</span> — {t("sim_sample_note")}
      </span>
    </div>
  );
}

export function SimulatedNotice({ text }: { text: string }) {
  return (
    <div className={WRAP} data-testid="notice-simulated">
      <FlaskConical className="h-3.5 w-3.5 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

export function SimulatedBadge({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <Badge
      variant="outline"
      className="gap-1 bg-amber-500/10 text-amber-700 border-amber-500/30"
      data-testid="badge-simulated"
    >
      <FlaskConical className="h-3 w-3" /> {label ?? t("sim_simulated")}
    </Badge>
  );
}
