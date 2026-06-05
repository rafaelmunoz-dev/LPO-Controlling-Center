import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  ownerClerkUserId: text("owner_clerk_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;
