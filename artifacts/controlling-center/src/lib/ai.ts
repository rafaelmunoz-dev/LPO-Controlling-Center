import type { EntityCode } from "@/data/types";

export interface AiExpenseSuggestion {
  entity: EntityCode;
  category: string;
  reason: string;
}

const API_BASE = `${import.meta.env.BASE_URL}api`.replace(/\/{2,}api$/, "/api");

/**
 * Ask the AI proxy (server-side, no client key) to classify a transaction into
 * an entity + budget category. Returns null on any failure so callers can fall
 * back to the learned/heuristic suggestion without surfacing an error.
 */
export async function aiSuggestExpense(input: {
  payee: string;
  description: string;
  amount: number;
  entities: string[];
  categories: string[];
}): Promise<AiExpenseSuggestion | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${API_BASE}/ai/classify-expense`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<AiExpenseSuggestion>;
    if (!data.entity || !data.category) return null;
    if (!input.entities.includes(data.entity) || !input.categories.includes(data.category)) return null;
    return { entity: data.entity as EntityCode, category: data.category, reason: data.reason ?? "" };
  } catch {
    return null;
  }
}

export interface CopilotChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type CopilotChatResult =
  | { ok: true; answer: string }
  | { ok: false; error: "unavailable" | "failed" };

/**
 * Ask the AI Copilot a free-form question. Unlike the expense classifier, this
 * surfaces failures explicitly (it never fabricates an answer) so the UI can
 * show a clear error state when the model is unavailable.
 */
export async function chatCopilot(input: {
  question: string;
  context: string;
  history: CopilotChatMessage[];
  language: string;
}): Promise<CopilotChatResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.status === 503) return { ok: false, error: "unavailable" };
    if (!res.ok) return { ok: false, error: "failed" };
    const data = (await res.json()) as { answer?: string };
    if (!data.answer || !data.answer.trim()) return { ok: false, error: "failed" };
    return { ok: true, answer: data.answer.trim() };
  } catch {
    return { ok: false, error: "failed" };
  }
}
