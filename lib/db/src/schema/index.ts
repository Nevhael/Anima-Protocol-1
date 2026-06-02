import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default("New conversation"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Generic per-user entity store. One row per (user, entity name, entity id),
// holding the whole record as JSON. Backs the client's base44 entity CRUD so
// that all user progress (characters, chats, journals, inventory, quests, world
// state, settings, etc.) persists on the server scoped to the Clerk account.
export const userEntities = pgTable(
  "user_entities",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    entityName: text("entity_name").notNull(),
    entityId: text("entity_id").notNull(),
    data: jsonb("data").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    userEntityIdUq: uniqueIndex("user_entities_user_entity_id_uq").on(
      t.userId,
      t.entityName,
      t.entityId,
    ),
    userEntityIdx: index("user_entities_user_entity_idx").on(
      t.userId,
      t.entityName,
    ),
  }),
);

export type UserEntity = typeof userEntities.$inferSelect;

// Per-user profile/settings record (the data previously kept in the browser's
// `anima_auth_user`). One row per Clerk user id.
export const userProfiles = pgTable("user_profiles", {
  userId: text("user_id").primaryKey(),
  data: jsonb("data").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
