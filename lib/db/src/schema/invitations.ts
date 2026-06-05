import { sql } from "drizzle-orm";
import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const invitations = pgTable("invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull(),
  managedEntities: jsonb("managed_entities")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  token: text("token").notNull().unique(),
  // pending | accepted | revoked
  status: text("status").notNull().default("pending"),
  invitedByClerkUserId: text("invited_by_clerk_user_id").notNull(),
  invitedByName: text("invited_by_name").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
});

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;
