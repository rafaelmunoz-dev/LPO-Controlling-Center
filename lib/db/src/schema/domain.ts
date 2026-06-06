import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

// Operational-core domain tables. Each record is a row, scoped to an
// organization (tenant) and keyed by its natural app id (record_id). The full
// domain object is stored in `data`; `entity_code` is denormalized for tenant
// scope checks (e.g. Geschäftsführer managedEntities). Phase 2 will add typed
// columns where reporting/querying needs them.
function domainTable(name: string) {
  return pgTable(
    name,
    {
      organizationId: uuid("organization_id")
        .notNull()
        .references(() => organizations.id, { onDelete: "cascade" }),
      recordId: text("record_id").notNull(),
      entityCode: text("entity_code"),
      data: jsonb("data").notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (t) => ({
      pk: primaryKey({ columns: [t.organizationId, t.recordId] }),
    }),
  );
}

export const groups = domainTable("groups");
export const entities = domainTable("entities");
export const employees = domainTable("employees");
export const suppliers = domainTable("suppliers");
export const purchaseRequests = domainTable("purchase_requests");
export const bankTransactions = domainTable("bank_transactions");
export const inventory = domainTable("inventory");
export const balanceItems = domainTable("balance_items");
export const risks = domainTable("risks");
export const premortems = domainTable("premortems");
export const strategyDecisions = domainTable("strategy_decisions");
export const approvals = domainTable("approvals");
export const uploads = domainTable("uploads");
export const auditLog = domainTable("audit_log");

export const DOMAIN_TABLES = {
  groups,
  entities,
  employees,
  suppliers,
  purchaseRequests,
  bankTransactions,
  inventory,
  balanceItems,
  risks,
  premortems,
  strategyDecisions,
  approvals,
  uploads,
  auditLog,
} as const;

export type DomainKind = keyof typeof DOMAIN_TABLES;
