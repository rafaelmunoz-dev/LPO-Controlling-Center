import { useEffect } from "react";
import { Sparkles, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/hooks/use-app-context";
import { getInsights, type CopilotContext, type InsightTone } from "@/data";

const TONE: Record<InsightTone, { icon: typeof Info; cls: string }> = {
  positive: { icon: TrendingUp, cls: "text-emerald-600" },
  warning: { icon: AlertTriangle, cls: "text-amber-600" },
  neutral: { icon: Info, cls: "text-slate-500" },
};

export function AiInsight({ context }: { context: CopilotContext }) {
  const { t } = useTranslation();
  const { selectedEntity, setCopilotContext, setCopilotOpen } = useAppStore();
  const insights = getInsights(context, selectedEntity, t);

  // keep the copilot context in sync with the page that mounted this insight
  useEffect(() => {
    setCopilotContext(context);
  }, [context, setCopilotContext]);

  const openCopilot = () => {
    setCopilotContext(context);
    setCopilotOpen(true);
  };

  return (
    <div className="glass-card p-5 brass-ring/0 relative overflow-hidden">
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full brass-gradient opacity-10" />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg brass-gradient p-1.5 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-semibold text-primary">{t("ai_insight")}</span>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={openCopilot} data-testid="button-ai-analyze">
          <Sparkles className="h-3.5 w-3.5" />
          {t("ai_analysis")}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {insights.map((ins, i) => {
          const Tone = TONE[ins.tone];
          return (
            <div key={i} className="rounded-xl bg-muted/50 border border-slate-200/70 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Tone.icon className={`h-3.5 w-3.5 ${Tone.cls}`} />
                <span className="text-xs font-semibold text-foreground">{ins.title}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{ins.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
