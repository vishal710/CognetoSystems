import { pgTable, text, serial, timestamp, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(),
  keyName: text("key_name").notNull(),
  keyValue: text("key_value").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const promptTemplates = pgTable("prompt_templates", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  description: text("description"),
  prompt: text("prompt").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contentPlans = pgTable("content_plans", {
  id: serial("id").primaryKey(),
  theme: text("theme").notNull(),
  description: text("description").notNull(),
  prompt: text("prompt"),
  medium: text("medium").notNull(),
  channels: json("channels").$type<Array<{
    medium: string;
    channel: string;
  }>>(),
  targetPublishDate: timestamp("target_publish_date").notNull(),
  actualPublishDate: timestamp("actual_publish_date"),
  status: text("status").notNull().default("pending"),
  contentUrl: text("content_url"),
  metadata: json("metadata").$type<{
    views?: number;
    likes?: number;
    comments?: number;
    seoScore?: number;
    generatedContent?: {
      caption?: string;
      tags?: string[];
      title?: string;
      imagePrompt?: string;
      videoPrompt?: string;
      imageUrl?: string;
      videoUrl?: string;
      publishingStatus?: {
        instagram?: boolean;
        youtube?: boolean;
      };
    };
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contentPlanRelations = relations(contentPlans, ({ one }) => ({
  user: one(users, {
    fields: [contentPlans.id],
    references: [users.id],
  }),
}));

// Types
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertContentPlan = typeof contentPlans.$inferInsert;
export type SelectContentPlan = typeof contentPlans.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;
export type SelectApiKey = typeof apiKeys.$inferSelect;
export type InsertPromptTemplate = typeof promptTemplates.$inferInsert;
export type SelectPromptTemplate = typeof promptTemplates.$inferSelect;

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertContentPlanSchema = createInsertSchema(contentPlans);
export const selectContentPlanSchema = createSelectSchema(contentPlans);
export const insertApiKeySchema = createInsertSchema(apiKeys);
export const selectApiKeySchema = createSelectSchema(apiKeys);
export const insertPromptTemplateSchema = createInsertSchema(promptTemplates);
export const selectPromptTemplateSchema = createSelectSchema(promptTemplates);