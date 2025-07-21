import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const uploadedFiles = pgTable("uploaded_files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  size: integer("size").notNull(),
  contentType: text("content_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  processed: boolean("processed").default(false).notNull(),
  content: text("content"),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").references(() => uploadedFiles.id),
  timestamp: text("timestamp").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  topic: text("topic"),
  containerType: text("container_type"),
  developmentStage: text("development_stage"),
});

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  configuration: json("configuration"),
  lastRunAt: timestamp("last_run_at"),
});

export const analysisRuns = pgTable("analysis_runs", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").references(() => uploadedFiles.id),
  status: text("status").notNull(), // 'pending', 'running', 'completed', 'failed'
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  results: json("results"),
});

export const agentLogs = pgTable("agent_logs", {
  id: serial("id").primaryKey(),
  analysisRunId: integer("analysis_run_id").references(() => analysisRuns.id),
  agentId: integer("agent_id").references(() => agents.id),
  level: text("level").notNull(), // 'info', 'warning', 'error'
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  data: json("data"),
});

export const documentationOutput = pgTable("documentation_output", {
  id: serial("id").primaryKey(),
  analysisRunId: integer("analysis_run_id").references(() => analysisRuns.id),
  format: text("format").notNull(), // 'markdown', 'html', 'json'
  content: text("content").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertFileSchema = createInsertSchema(uploadedFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  lastRunAt: true,
});

export const insertAnalysisRunSchema = createInsertSchema(analysisRuns).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertAgentLogSchema = createInsertSchema(agentLogs).omit({
  id: true,
  timestamp: true,
});

export const insertDocumentationOutputSchema = createInsertSchema(documentationOutput).omit({
  id: true,
  generatedAt: true,
});

// Types
export type InsertFile = z.infer<typeof insertFileSchema>;
export type UploadedFile = typeof uploadedFiles.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

export type InsertAnalysisRun = z.infer<typeof insertAnalysisRunSchema>;
export type AnalysisRun = typeof analysisRuns.$inferSelect;

export type InsertAgentLog = z.infer<typeof insertAgentLogSchema>;
export type AgentLog = typeof agentLogs.$inferSelect;

export type InsertDocumentationOutput = z.infer<typeof insertDocumentationOutputSchema>;
export type DocumentationOutput = typeof documentationOutput.$inferSelect;

// Analysis result types
export const analysisResultSchema = z.object({
  agentType: z.string(),
  sections: z.array(z.string()),
  requirements: z.array(z.string()),
  userPerspectives: z.array(z.string()),
  documentationGaps: z.array(z.string()),
  metaInsights: z.array(z.string()),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
