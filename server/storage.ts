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

export class MemStorage implements IStorage {
  private files: Map<number, UploadedFile> = new Map();
  private messages: Map<number, ChatMessage> = new Map();
  private agents: Map<number, Agent> = new Map();
  private analysisRuns: Map<number, AnalysisRun> = new Map();
  private logs: Map<number, AgentLog> = new Map();
  private outputs: Map<number, DocumentationOutput> = new Map();
  
  private currentFileId = 1;
  private currentMessageId = 1;
  private currentAgentId = 1;
  private currentRunId = 1;
  private currentLogId = 1;
  private currentOutputId = 1;

  constructor() {
    // Initialize default agents
    this.initializeDefaultAgents();
  }

  private initializeDefaultAgents() {
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

    defaultAgents.forEach(agent => {
      this.createAgent(agent);
    });
  }

  // File operations
  async createFile(file: InsertFile): Promise<UploadedFile> {
    const id = this.currentFileId++;
    const newFile: UploadedFile = {
      ...file,
      id,
      uploadedAt: new Date(),
    };
    this.files.set(id, newFile);
    return newFile;
  }

  async getFile(id: number): Promise<UploadedFile | undefined> {
    return this.files.get(id);
  }

  async getAllFiles(): Promise<UploadedFile[]> {
    return Array.from(this.files.values()).sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  async updateFileProcessed(id: number, processed: boolean, content?: string): Promise<void> {
    const file = this.files.get(id);
    if (file) {
      this.files.set(id, { ...file, processed, content: content || file.content });
    }
  }

  async deleteFile(id: number): Promise<void> {
    this.files.delete(id);
    // Delete associated messages
    Array.from(this.messages.entries())
      .filter(([, message]) => message.fileId === id)
      .forEach(([messageId]) => this.messages.delete(messageId));
  }

  // Chat message operations
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentMessageId++;
    const newMessage: ChatMessage = { ...message, id };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getMessagesByFileId(fileId: number): Promise<ChatMessage[]> {
    return Array.from(this.messages.values())
      .filter(message => message.fileId === fileId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async getMessagesByTopic(topic: string): Promise<ChatMessage[]> {
    return Array.from(this.messages.values())
      .filter(message => message.topic === topic);
  }

  // Agent operations
  async createAgent(agent: InsertAgent): Promise<Agent> {
    const id = this.currentAgentId++;
    const newAgent: Agent = { ...agent, id, lastRunAt: null };
    this.agents.set(id, newAgent);
    return newAgent;
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async updateAgent(id: number, updates: Partial<Agent>): Promise<void> {
    const agent = this.agents.get(id);
    if (agent) {
      this.agents.set(id, { ...agent, ...updates });
    }
  }

  async updateAgentLastRun(id: number): Promise<void> {
    const agent = this.agents.get(id);
    if (agent) {
      this.agents.set(id, { ...agent, lastRunAt: new Date() });
    }
  }

  // Analysis run operations
  async createAnalysisRun(run: InsertAnalysisRun): Promise<AnalysisRun> {
    const id = this.currentRunId++;
    const newRun: AnalysisRun = {
      ...run,
      id,
      startedAt: new Date(),
      completedAt: null,
    };
    this.analysisRuns.set(id, newRun);
    return newRun;
  }

  async getAnalysisRun(id: number): Promise<AnalysisRun | undefined> {
    return this.analysisRuns.get(id);
  }

  async getAnalysisRunsByFileId(fileId: number): Promise<AnalysisRun[]> {
    return Array.from(this.analysisRuns.values())
      .filter(run => run.fileId === fileId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  async updateAnalysisRunStatus(id: number, status: string, results?: any): Promise<void> {
    const run = this.analysisRuns.get(id);
    if (run) {
      this.analysisRuns.set(id, { ...run, status, results });
    }
  }

  async completeAnalysisRun(id: number, results: any): Promise<void> {
    const run = this.analysisRuns.get(id);
    if (run) {
      this.analysisRuns.set(id, { 
        ...run, 
        status: 'completed', 
        results, 
        completedAt: new Date() 
      });
    }
  }

  // Agent log operations
  async createAgentLog(log: InsertAgentLog): Promise<AgentLog> {
    const id = this.currentLogId++;
    const newLog: AgentLog = { ...log, id, timestamp: new Date() };
    this.logs.set(id, newLog);
    return newLog;
  }

  async getLogsByAnalysisRunId(analysisRunId: number): Promise<AgentLog[]> {
    return Array.from(this.logs.values())
      .filter(log => log.analysisRunId === analysisRunId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async getRecentLogs(limit = 50): Promise<AgentLog[]> {
    return Array.from(this.logs.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Documentation output operations
  async createDocumentationOutput(output: InsertDocumentationOutput): Promise<DocumentationOutput> {
    const id = this.currentOutputId++;
    const newOutput: DocumentationOutput = {
      ...output,
      id,
      generatedAt: new Date(),
    };
    this.outputs.set(id, newOutput);
    return newOutput;
  }

  async getOutputsByAnalysisRunId(analysisRunId: number): Promise<DocumentationOutput[]> {
    return Array.from(this.outputs.values())
      .filter(output => output.analysisRunId === analysisRunId)
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }
}

export const storage = new MemStorage();
