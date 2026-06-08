import { Router, type IRouter } from "express";

const router: IRouter = Router();

// The OpenAI integration library throws at module-load time when its env vars
// are missing. AI assist is optional here, so we never import it at the top
// level: we env-check first and lazily import inside the handler, caching the
// resolved client. This keeps the server healthy (and the rest of the routes
// working) when the AI integration is not provisioned.
type OpenAIClient = (typeof import("@workspace/integrations-openai-ai-server"))["openai"];
let clientPromise: Promise<OpenAIClient> | null = null;

async function getOpenAI(): Promise<OpenAIClient | null> {
  if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || !process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    return null;
  }
  if (!clientPromise) {
    clientPromise = import("@workspace/integrations-openai-ai-server").then((m) => m.openai);
  }
  try {
    return await clientPromise;
  } catch {
    clientPromise = null;
    return null;
  }
}

interface ClassifyBody {
  description?: unknown;
  payee?: unknown;
  amount?: unknown;
  entities?: unknown;
  categories?: unknown;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

router.post("/ai/classify-expense", async (req, res) => {
  const body = (req.body ?? {}) as ClassifyBody;
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const payee = typeof body.payee === "string" ? body.payee.trim() : "";
  const amount = typeof body.amount === "number" ? body.amount : undefined;
  const entities = asStringList(body.entities);
  const categories = asStringList(body.categories);

  if (!description && !payee) {
    res.status(400).json({ error: "description or payee required" });
    return;
  }
  if (entities.length === 0 || categories.length === 0) {
    res.status(400).json({ error: "entities and categories required" });
    return;
  }

  const openai = await getOpenAI();
  if (!openai) {
    res.status(503).json({ error: "ai_unavailable" });
    return;
  }

  try {
    const prompt = [
      "You are a German accounting assistant for a corporate controlling tool.",
      "Classify a single bank-statement expense line into exactly one company entity and one budget category.",
      "Respond ONLY with strict JSON: {\"entity\": <one of the entity codes>, \"category\": <one of the categories>, \"reason\": <short German explanation>}.",
      "Pick values strictly from the provided lists. If unsure, choose the most plausible.",
      "",
      `Entity codes: ${entities.join(", ")}`,
      `Budget categories: ${categories.join(", ")}`,
      "",
      "Transaction:",
      `- Payee/Empfänger: ${payee || "(unbekannt)"}`,
      `- Description/Verwendungszweck: ${description || "(keine)"}`,
      amount !== undefined ? `- Amount EUR: ${amount}` : "- Amount EUR: (unbekannt)",
    ].join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    let parsed: { entity?: string; category?: string; reason?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      res.status(502).json({ error: "ai_unparsable" });
      return;
    }

    const entity = entities.includes(parsed.entity ?? "") ? parsed.entity : undefined;
    const category = categories.includes(parsed.category ?? "") ? parsed.category : undefined;

    if (!entity || !category) {
      res.status(502).json({ error: "ai_out_of_range" });
      return;
    }

    res.json({ entity, category, reason: typeof parsed.reason === "string" ? parsed.reason : "" });
  } catch (err) {
    req.log?.error({ err }, "ai classify-expense failed");
    res.status(503).json({ error: "ai_unavailable" });
  }
});

interface ChatMessage {
  role?: unknown;
  content?: unknown;
}

interface ChatBody {
  question?: unknown;
  context?: unknown;
  language?: unknown;
  history?: unknown;
}

const LANGUAGE_LABELS: Record<string, string> = {
  de: "German (Deutsch)",
  en: "English",
  es: "Spanish (Español)",
};

router.post("/ai/chat", async (req, res) => {
  const body = (req.body ?? {}) as ChatBody;
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const context = typeof body.context === "string" ? body.context.trim() : "";
  const langCode = typeof body.language === "string" ? body.language.slice(0, 2).toLowerCase() : "de";
  const language = LANGUAGE_LABELS[langCode] ?? "German (Deutsch)";

  if (!question) {
    res.status(400).json({ error: "question required" });
    return;
  }

  const history: { role: "user" | "assistant"; content: string }[] = Array.isArray(body.history)
    ? (body.history as ChatMessage[])
        .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && (m.content as string).trim().length > 0)
        .slice(-8)
        .map((m) => ({ role: m.role as "user" | "assistant", content: (m.content as string).trim() }))
    : [];

  const openai = await getOpenAI();
  if (!openai) {
    res.status(503).json({ error: "ai_unavailable" });
    return;
  }

  try {
    const systemPrompt = [
      "You are the AI Copilot inside the LPO Controlling Center, a corporate financial controlling tool for a group of companies.",
      "Your role is to help finance and management users understand their numbers: answer free-form questions, explain financial terms in plain language, and surface relevant insights, deviations, and risks.",
      `Always answer in ${language}, regardless of the language of the question or the context data.`,
      "Ground every factual statement in the CONTEXT block below, which reflects exactly what the user is currently looking at. Use those figures; do not invent numbers. If the context does not contain the answer, say so honestly and explain what is missing.",
      "When asked to explain a term, give a concise, accessible definition and then relate it to the user's current figures when relevant.",
      "You are read-only and advisory: you cannot create tasks, reports, risks, or change any data. If asked to perform such an action, explain that the user can do it via the buttons in the app.",
      "Keep answers focused and reasonably short; use brief lists when helpful. Format currency clearly.",
      "",
      "CONTEXT (current page and data the user sees):",
      context || "(no context provided)",
    ].join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: question },
      ],
    });

    const answer = response.choices[0]?.message?.content?.trim() ?? "";
    if (!answer) {
      res.status(502).json({ error: "ai_empty" });
      return;
    }

    res.json({ answer });
  } catch (err) {
    req.log?.error({ err }, "ai chat failed");
    res.status(503).json({ error: "ai_unavailable" });
  }
});

export default router;
