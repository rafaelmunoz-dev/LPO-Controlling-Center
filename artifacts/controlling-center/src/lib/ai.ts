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
