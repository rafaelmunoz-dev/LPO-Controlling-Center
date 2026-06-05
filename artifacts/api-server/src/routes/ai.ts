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

export default router;
