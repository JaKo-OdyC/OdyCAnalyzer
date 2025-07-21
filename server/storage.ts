import { 
  uploadedFiles, chatMessages, agents, analysisRuns, agentLogs, documentationOutput,
  type UploadedFile, type InsertFile,
  type ChatMessage, type InsertChatMessage,
  type Agent, type InsertAgent,
  type AnalysisRun, type InsertAnalysisRun,
  type AgentLog, type InsertAgentLog,
  type DocumentationOutput, type InsertDocumentationOutput
} from "@shared/schema";

export interface IStorage {
  // File operations
  createFile(file: InsertFile): Promise<UploadedFile>;
  getFile(id: number): Promise<UploadedFile | undefined>;
  getAllFiles(): Promise<UploadedFile[]>;
  updateFileProcessed(id: number, processed: boolean, content?: string): Promise<void>;
  deleteFile(id: number): Promise<void>;

  // Chat message operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getMessagesByFileId(fileId: number): Promise<ChatMessage[]>;
  getMessagesByTopic(topic: string): Promise<ChatMessage[]>;

  // Agent operations
  createAgent(agent: InsertAgent): Promise<Agent>;
  getAgent(id: number): Promise<Agent | undefined>;
  getAllAgents(): Promise<Agent[]>;
  updateAgent(id: number, updates: Partial<Agent>): Promise<void>;
  updateAgentLastRun(id: number): Promise<void>;

  // Analysis run operations
  createAnalysisRun(run: InsertAnalysisRun): Promise<AnalysisRun>;
  getAnalysisRun(id: number): Promise<AnalysisRun | undefined>;
  getAnalysisRunsByFileId(fileId: number): Promise<AnalysisRun[]>;
  updateAnalysisRunStatus(id: number, status: string, results?: any): Promise<void>;
  completeAnalysisRun(id: number, results: any): Promise<void>;

  // Agent log operations
  createAgentLog(log: InsertAgentLog): Promise<AgentLog>;
  getLogsByAnalysisRunId(analysisRunId: number): Promise<AgentLog[]>;
  getRecentLogs(limit?: number): Promise<AgentLog[]>;

  // Documentation output operations
  createDocumentationOutput(output: InsertDocumentationOutput): Promise<DocumentationOutput>;
  getOutputsByAnalysisRunId(analysisRunId: number): Promise<DocumentationOutput[]>;
}

import { db } from "./db";
import { eq } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize default agents on first run
    this.initializeDefaultAgents();
  }

  private async initializeDefaultAgents() {
    // Check if agents already exist
    const existingAgents = await this.getAllAgents();
    if (existingAgents.length > 0) {
      return; // Agents already initialized
    }

    const defaultAgents: InsertAgent[] = [
      {
        name: "Structure Agent",
        type: "structure",
        description: "Analyzes document structure and suggests organization patterns",
        enabled: true,
        configuration: { maxSections: 20, minMessagesPerSection: 3 }
      },
      {
        name: "Requirements Agent", 
        type: "requirements",
        description: "Extracts and categorizes technical requirements and specifications",
        enabled: true,
        configuration: { requirementTypes: ["functional", "non-functional", "technical"] }
      },
      {
        name: "User Perspective Agent",
        type: "user_perspective", 
        description: "Identifies user needs, feedback, and experience requirements",
        enabled: true,
        configuration: { personaTypes: ["developer", "researcher", "project_manager"] }
      },
      {
        name: "Documentation Agent",
        type: "documentation",
        description: "Tracks documentation gaps and generates content outlines", 
        enabled: false,
        configuration: { gapTypes: ["missing_context", "incomplete_specs", "outdated_info"] }
      },
      {
        name: "Meta Agent",
        type: "meta",
        description: "Reviews and optimizes overall analysis quality and coherence",
        enabled: true,
        configuration: { analysisDepth: "comprehensive" }
      }
    ];

    for (const agent of defaultAgents) {
      await this.createAgent(agent);
    }
  }

  // File operations
  async createFile(file: InsertFile): Promise<UploadedFile> {
    const [newFile] = await db
      .insert(uploadedFiles)
      .values(file)
      .returning();
    return newFile;
  }

  async getFile(id: number): Promise<UploadedFile | undefined> {
    const [file] = await db.select().from(uploadedFiles).where(eq(uploadedFiles.id, id));
    return file || undefined;
  }

  async getAllFiles(): Promise<UploadedFile[]> {
    return await db.select().from(uploadedFiles).orderBy(uploadedFiles.uploadedAt);
  }

  async updateFileProcessed(id: number, processed: boolean, content?: string): Promise<void> {
    await db
      .update(uploadedFiles)
      .set({ processed, content })
      .where(eq(uploadedFiles.id, id));
  }

  async deleteFile(id: number): Promise<void> {
    // Delete associated messages first
    await db.delete(chatMessages).where(eq(chatMessages.fileId, id));
    // Delete the file
    await db.delete(uploadedFiles).where(eq(uploadedFiles.id, id));
  }

  // Chat message operations
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getMessagesByFileId(fileId: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.fileId, fileId))
      .orderBy(chatMessages.timestamp);
  }

  async getMessagesByTopic(topic: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.topic, topic));
  }

  // Agent operations
  async createAgent(agent: InsertAgent): Promise<Agent> {
    const [newAgent] = await db
      .insert(agents)
      .values(agent)
      .returning();
    return newAgent;
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent || undefined;
  }

  async getAllAgents(): Promise<Agent[]> {
    return await db.select().from(agents);
  }

  async updateAgent(id: number, updates: Partial<Agent>): Promise<void> {
    await db
      .update(agents)
      .set(updates)
      .where(eq(agents.id, id));
  }

  async updateAgentLastRun(id: number): Promise<void> {
    await db
      .update(agents)
      .set({ lastRunAt: new Date() })
      .where(eq(agents.id, id));
  }

  // Analysis run operations
  async createAnalysisRun(run: InsertAnalysisRun): Promise<AnalysisRun> {
    const [newRun] = await db
      .insert(analysisRuns)
      .values(run)
      .returning();
    return newRun;
  }

  async getAnalysisRun(id: number): Promise<AnalysisRun | undefined> {
    const [run] = await db.select().from(analysisRuns).where(eq(analysisRuns.id, id));
    return run || undefined;
  }

  async getAnalysisRunsByFileId(fileId: number): Promise<AnalysisRun[]> {
    return await db
      .select()
      .from(analysisRuns)
      .where(eq(analysisRuns.fileId, fileId))
      .orderBy(analysisRuns.startedAt);
  }

  async updateAnalysisRunStatus(id: number, status: string, results?: any): Promise<void> {
    await db
      .update(analysisRuns)
      .set({ status, results })
      .where(eq(analysisRuns.id, id));
  }

  async completeAnalysisRun(id: number, results: any): Promise<void> {
    await db
      .update(analysisRuns)
      .set({ 
        status: 'completed', 
        results, 
        completedAt: new Date() 
      })
      .where(eq(analysisRuns.id, id));
  }

  // Agent log operations
  async createAgentLog(log: InsertAgentLog): Promise<AgentLog> {
    const [newLog] = await db
      .insert(agentLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getLogsByAnalysisRunId(analysisRunId: number): Promise<AgentLog[]> {
    return await db
      .select()
      .from(agentLogs)
      .where(eq(agentLogs.analysisRunId, analysisRunId))
      .orderBy(agentLogs.timestamp);
  }

  async getRecentLogs(limit = 50): Promise<AgentLog[]> {
    return await db
      .select()
      .from(agentLogs)
      .orderBy(agentLogs.timestamp)
      .limit(limit);
  }

  // Documentation output operations
  async createDocumentationOutput(output: InsertDocumentationOutput): Promise<DocumentationOutput> {
    const [newOutput] = await db
      .insert(documentationOutput)
      .values(output)
      .returning();
    return newOutput;
  }

  async getOutputsByAnalysisRunId(analysisRunId: number): Promise<DocumentationOutput[]> {
    return await db
      .select()
      .from(documentationOutput)
      .where(eq(documentationOutput.analysisRunId, analysisRunId))
      .orderBy(documentationOutput.generatedAt);
  }
}

export const storage = new DatabaseStorage();
