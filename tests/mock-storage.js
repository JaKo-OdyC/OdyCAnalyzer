// Mock storage for testing 404 endpoints without database

export class MockStorage {
  constructor() {
    this.files = new Map();
    this.agents = new Map(); 
    this.analysisRuns = new Map();
    this.logs = new Map();
    this.outputs = new Map();
    this.chatMessages = new Map();
  }

  // File operations
  async createFile(file) {
    const id = Date.now();
    const newFile = { id, ...file };
    this.files.set(id, newFile);
    return newFile;
  }

  async getFile(id) {
    return this.files.get(id) || undefined;
  }

  async getAllFiles() {
    return Array.from(this.files.values());
  }

  async updateFileProcessed(id, processed, content) {
    const file = this.files.get(id);
    if (file) {
      file.processed = processed;
      if (content) file.content = content;
    }
  }

  async deleteFile(id) {
    return this.files.delete(id);
  }

  // Chat message operations
  async createChatMessage(message) {
    const id = Date.now();
    const newMessage = { id, ...message };
    this.chatMessages.set(id, newMessage);
    return newMessage;
  }

  async getMessagesByFileId(fileId) {
    return Array.from(this.chatMessages.values()).filter(m => m.fileId === fileId);
  }

  async getMessagesByTopic(topic) {
    return Array.from(this.chatMessages.values()).filter(m => m.topic === topic);
  }

  // Agent operations
  async createAgent(agent) {
    const id = Date.now();
    const newAgent = { id, ...agent };
    this.agents.set(id, newAgent);
    return newAgent;
  }

  async getAgent(id) {
    return this.agents.get(id) || undefined;
  }

  async getAllAgents() {
    return Array.from(this.agents.values());
  }

  async updateAgent(id, updates) {
    const agent = this.agents.get(id);
    if (agent) {
      Object.assign(agent, updates);
    }
  }

  async updateAgentLastRun(id) {
    const agent = this.agents.get(id);
    if (agent) {
      agent.lastRunAt = new Date();
    }
  }

  // Analysis run operations
  async createAnalysisRun(run) {
    const id = Date.now();
    const newRun = { id, ...run };
    this.analysisRuns.set(id, newRun);
    return newRun;
  }

  async getAnalysisRun(id) {
    return this.analysisRuns.get(id) || undefined;
  }

  async getAnalysisRunsByFileId(fileId) {
    return Array.from(this.analysisRuns.values()).filter(r => r.fileId === fileId);
  }

  async updateAnalysisRunStatus(id, status, results) {
    const run = this.analysisRuns.get(id);
    if (run) {
      run.status = status;
      if (results) run.results = results;
    }
  }

  async completeAnalysisRun(id, results) {
    const run = this.analysisRuns.get(id);
    if (run) {
      run.status = 'completed';
      run.results = results;
      run.completedAt = new Date();
    }
  }

  // Agent log operations  
  async createAgentLog(log) {
    const id = Date.now();
    const newLog = { id, ...log };
    this.logs.set(id, newLog);
    return newLog;
  }

  async getLogsByAnalysisRunId(analysisRunId) {
    return Array.from(this.logs.values()).filter(l => l.analysisRunId === analysisRunId);
  }

  async getRecentLogs(limit = 50) {
    return Array.from(this.logs.values()).slice(-limit);
  }

  // Documentation output operations
  async createDocumentationOutput(output) {
    const id = Date.now();
    const newOutput = { id, ...output };
    this.outputs.set(id, newOutput);
    return newOutput;
  }

  async getOutputsByAnalysisRunId(analysisRunId) {
    return Array.from(this.outputs.values()).filter(o => o.analysisRunId === analysisRunId);
  }
}

export const mockStorage = new MockStorage();