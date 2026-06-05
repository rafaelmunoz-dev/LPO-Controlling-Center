import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { useTranslation } from "react-i18next";
import { X, Send, Sparkles, ListTodo, FileText, ShieldAlert, Maximize2, Minimize2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { answerCopilot, getCopilotSuggestions, defaultFirmForView } from "@/data";
import { can } from "@/data/governance";
import type { EntityCode, Risk } from "@/data/types";

interface Msg {
  role: "user" | "bot";
  text: string;
  question?: string;
}

export function CopilotPanel() {
  const {
    copilotOpen,
    setCopilotOpen,
    selectedEntity,
    copilotContext,
    copilotSeed,
    clearCopilotSeed,
    addTask,
    addReportDraft,
    addRisk,
    currentUser,
  } = useAppStore();
  const { t } = useTranslation();
  const canTask = can(currentUser.role, "tasks:create");
  const canReport = can(currentUser.role, "reports:create");
  const canRisk = can(currentUser.role, "risiko:create");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    const reply = answerCopilot(q, selectedEntity);
    setMessages((m) => [...m, { role: "user", text: q }, { role: "bot", text: reply, question: q }]);
    setHistory((h) => [q, ...h.filter((x) => x !== q)].slice(0, 6));
    setInput("");
  };

  // consume a seeded question coming from anywhere in the app
  useEffect(() => {
    if (copilotOpen && copilotSeed) {
      send(copilotSeed);
      clearCopilotSeed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copilotOpen, copilotSeed]);

  if (!copilotOpen) return null;

  const saveTask = (m: Msg) => {
    if (!canTask) { toast.error(t("no_permission")); return; }
    addTask(m.question ?? "Copilot-Analyse", `${t("ai_analysis")} · ${selectedEntity}`);
    toast.success(t("task_saved"));
  };
  const toReport = (m: Msg) => {
    if (!canReport) { toast.error(t("no_permission")); return; }
    addReportDraft(m.question ?? "Copilot-Analyse", t("ai_analysis"), selectedEntity);
    toast.success(t("added_to_report"));
  };
  const toRisk = (m: Msg) => {
    if (!canRisk) { toast.error(t("no_permission")); return; }
    const entity: EntityCode = defaultFirmForView(selectedEntity) ?? "IMP";
    const risk: Risk = {
      id: `R-${Date.now()}`,
      title: m.question ?? "Copilot-Risiko",
      entity,
      impact: "Mittel",
      probability: "Mittel",
      owner: "AI Copilot",
      status: "Offen",
      trend: "flat",
    };
    addRisk(risk);
    toast.success(t("risk_created"));
  };

  return (
    <div
      className={`${expanded ? "w-[34rem]" : "w-96"} glass-panel border-l border-white/40 flex flex-col shadow-xl z-40 sticky top-16 self-start h-[calc(100vh-64px)] transition-all`}
    >
      <div className="p-4 border-b border-white/40 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-medium">
          <div className="rounded-lg brass-gradient p-1.5 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span>{t("copilot_title")}</span>
            <span className="text-[0.65rem] font-normal text-muted-foreground">{t("copilot_subtitle")} · {selectedEntity}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setExpanded((e) => !e)} data-testid="button-expand-copilot">
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCopilotOpen(false)} data-testid="button-close-copilot">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="rounded-2xl bg-white/60 border border-slate-200/70 p-3 text-sm">
              {t("copilot_subtitle")}. {selectedEntity}.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className="space-y-1.5">
              <div
                className={`text-sm p-3 rounded-2xl max-w-[92%] ${
                  m.role === "user"
                    ? "brass-gradient text-white ml-auto rounded-br-sm"
                    : "bg-white/70 border border-slate-200/70 rounded-tl-sm"
                }`}
                data-testid={`msg-${m.role}-${i}`}
              >
                {m.text}
              </div>
              {m.role === "bot" && m.question && (canTask || canReport || canRisk) && (
                <div className="flex flex-wrap gap-1.5">
                  {canTask && (
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-xs bg-white/60" onClick={() => saveTask(m)} data-testid={`action-task-${i}`}>
                      <ListTodo className="h-3.5 w-3.5" />
                      {t("save_as_task")}
                    </Button>
                  )}
                  {canReport && (
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-xs bg-white/60" onClick={() => toReport(m)} data-testid={`action-report-${i}`}>
                      <FileText className="h-3.5 w-3.5" />
                      {t("add_to_report")}
                    </Button>
                  )}
                  {canRisk && (
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-xs bg-white/60" onClick={() => toRisk(m)} data-testid={`action-risk-${i}`}>
                      <ShieldAlert className="h-3.5 w-3.5" />
                      {t("create_risk")}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}

          {messages.length === 0 && (
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" /> {t("suggested_questions")}
              </div>
              {getCopilotSuggestions(copilotContext).map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  className="w-full text-xs justify-start h-auto py-2 whitespace-normal text-left bg-white/60"
                  onClick={() => send(s)}
                  data-testid={`button-suggestion-${s.slice(0, 10)}`}
                >
                  {s}
                </Button>
              ))}
            </div>
          )}

          {history.length > 0 && (
            <div className="pt-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <History className="h-3 w-3" /> {t("recent_analyses")}
              </div>
              {history.map((h) => (
                <button key={h} onClick={() => send(h)} className="block w-full truncate rounded-lg px-2 py-1 text-left text-xs text-muted-foreground hover:bg-white/60">
                  {h}
                </button>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-white/40">
        <div className="flex items-center gap-2">
          <Input
            placeholder={t("ask_placeholder")}
            className="text-sm h-9 bg-white/60"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            data-testid="input-copilot"
          />
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => send(input)} data-testid="button-send-copilot">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
