import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/hooks/use-app-context";
import { X, Send, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { answerCopilot, getCopilotSuggestions } from "@/data";

interface Msg {
  role: "user" | "bot";
  text: string;
}

export function CopilotPanel() {
  const { copilotOpen, setCopilotOpen, selectedEntity } = useAppStore();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "bot", text: "Hallo! Ich bin Ihr LPO Copilot. Ich analysiere die Daten der gewählten Entität. Stellen Sie mir eine Frage oder wählen Sie einen Vorschlag." },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    const reply = answerCopilot(q, selectedEntity);
    setMessages((m) => [...m, { role: "user", text: q }, { role: "bot", text: reply }]);
    setInput("");
  };

  if (!copilotOpen) return null;

  return (
    <div className="w-96 border-l border-border bg-white dark:bg-slate-950 flex flex-col shadow-xl z-40 h-[calc(100vh-64px)]">
      <div className="p-4 border-b border-border flex items-center justify-between bg-primary/5">
        <div className="flex items-center gap-2 text-primary font-medium">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span>AI Copilot</span>
            <span className="text-[0.65rem] font-normal text-muted-foreground">{selectedEntity}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCopilotOpen(false)} data-testid="button-close-copilot">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`text-sm p-3 rounded-2xl max-w-[90%] ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground ml-auto rounded-br-sm"
                  : "bg-muted rounded-tl-sm"
              }`}
              data-testid={`msg-${m.role}-${i}`}
            >
              {m.text}
            </div>
          ))}
          {messages.length <= 1 && (
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" /> Vorschläge
              </div>
              {getCopilotSuggestions().map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  className="w-full text-xs justify-start h-auto py-2 whitespace-normal text-left"
                  onClick={() => send(s)}
                  data-testid={`button-suggestion-${s.slice(0, 10)}`}
                >
                  {s}
                </Button>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Frage stellen..."
            className="text-sm h-9"
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
