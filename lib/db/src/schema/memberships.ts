import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email").notNull(),
    name: text("name").notNull().default(""),
    // Admin | Mitarbeiter | Betrachter (permission level)
    role: text("role").notNull(),
    // Free-text job title (e.g. "Geschäftsführer", "Buchhaltung"). Cosmetic.
    jobTitle: text("job_title").notNull().default(""),
    // Profile picture as a data URL (or empty).
    avatar: text("avatar").notNull().default(""),
    // Legacy entity-scoping columns; retained for back-compat, no longer used.
    managedEntities: jsonb("managed_entities")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    entityAccess: jsonb("entity_access")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    // active | suspended
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    uniqMember: unique("memberships_org_user_unique").on(
      t.organizationId,
      t.clerkUserId,
    ),
  }),
);

export type Membership = typeof memberships.$inferSelect;
export type InsertMembership = typeof memberships.$inferInsert;
