import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, DOMAIN_TABLES, type DomainKind } from "@workspace/db";
import { requireAuth, requireMembership, canWriteDomain } from "../lib/auth";

const router: IRouter = Router();

// Maps URL path segments to domain table keys.
const KINDS: Record<string, DomainKind> = {
  groups: "groups",
  entities: "entities",
  employees: "employees",
  suppliers: "suppliers",
  "purchase-requests": "purchaseRequests",
  "bank-transactions": "bankTransactions",
  inventory: "inventory",
  "balance-items": "balanceItems",
  "finance-inputs": "financeInputs",
  "budget-plans": "budgetPlans",
  invoices: "invoices",
  "cost-centers": "costCenters",
  "intercompany-flows": "intercompanyFlows",
  "liquidity-lines": "liquidityLines",
  "kpi-targets": "kpiTargets",
  risks: "risks",
  premortems: "premortems",
  "strategy-decisions": "strategyDecisions",
  approvals: "approvals",
  uploads: "uploads",
  "audit-log": "auditLog",
};

function resolveKind(param: string | string[] | undefined): DomainKind | null {
  const key = Array.isArray(param) ? param[0] : param;
  return key ? (KINDS[key] ?? null) : null;
}

// Extracts the entity code from a domain object for the denormalized column.
function entityCodeOf(kind: DomainKind, data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (kind === "entities") {
    return typeof d.code === "string" ? d.code : null;
  }
  if (kind === "balanceItems" || kind === "financeInputs" || kind === "budgetPlans") {
    const v = d.view;
    return typeof v === "string" && !v.startsWith("group:") ? v : null;
  }
  if (kind === "intercompanyFlows") {
    return typeof d.fromEntity === "string" ? d.fromEntity : null;
  }
  if (kind === "liquidityLines" || kind === "kpiTargets") {
    const v = d.view;
    return typeof v === "string" && !v.startsWith("group:") ? v : null;
  }
  return typeof d.entity === "string" ? d.entity : null;
}

// List all records of a kind for the caller's organization.
router.get(
  "/records/:kind",
  requireAuth,
  requireMembership,
  async (req, res) => {
    const kind = resolveKind(req.params.kind);
    if (!kind) {
      res.status(404).json({ error: "unknown_kind" });
      return;
    }
    const table = DOMAIN_TABLES[kind];
    const rows = await db
      .select()
      .from(table)
      .where(eq(table.organizationId, req.ctx!.membership!.organizationId));
    res.json(rows.map((r) => r.data));
  },
);

// Upsert a single record (body = the full domain object).
router.put(
  "/records/:kind/:id",
  requireAuth,
  requireMembership,
  async (req, res) => {
    const kind = resolveKind(req.params.kind);
    if (!kind) {
      res.status(404).json({ error: "unknown_kind" });
      return;
    }
    const m = req.ctx!.membership!;
    const data = req.body;
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      res.status(400).json({ error: "invalid_body" });
      return;
    }

    const table = DOMAIN_TABLES[kind];
    const recordId = String(req.params.id);
    const [existing] = await db
      .select()
      .from(table)
      .where(
        and(
          eq(table.organizationId, m.organizationId),
          eq(table.recordId, recordId),
        ),
      )
      .limit(1);

    const action = existing ? "update" : "create";
    if (!canWriteDomain({ role: m.role, kind, action })) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    const entityCode = entityCodeOf(kind, data);
    await db
      .insert(table)
      .values({
        organizationId: m.organizationId,
        recordId,
        entityCode,
        data,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [table.organizationId, table.recordId],
        set: { data, entityCode, updatedAt: new Date() },
      });

    res.json(data);
  },
);

// Delete a single record.
router.delete(
  "/records/:kind/:id",
  requireAuth,
  requireMembership,
  async (req, res) => {
    const kind = resolveKind(req.params.kind);
    if (!kind) {
      res.status(404).json({ error: "unknown_kind" });
      return;
    }
    const m = req.ctx!.membership!;
    const table = DOMAIN_TABLES[kind];
    const recordId = String(req.params.id);

    const [existing] = await db
      .select()
      .from(table)
      .where(
        and(
          eq(table.organizationId, m.organizationId),
          eq(table.recordId, recordId),
        ),
      )
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    if (!canWriteDomain({ role: m.role, kind, action: "delete" })) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    await db
      .delete(table)
      .where(
        and(
          eq(table.organizationId, m.organizationId),
          eq(table.recordId, recordId),
        ),
      );
    res.json({ ok: true });
  },
);

export default router;
