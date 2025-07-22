#!/usr/bin/env node

/**
 * Test server for 404 endpoint testing
 * Uses mock storage instead of database
 */

import express from "express";
import { createServer } from "http";
import { MockStorage } from "./mock-storage.js";

// Mock modules to avoid database dependencies
const mockOrchestrator = {
  runAnalysis: async () => {}
};

const mockFileProcessor = {
  processFile: async () => {}
};

const mockUrlProcessor = {
  processUrl: async () => {}
};

const mockApiMonitor = {
  startMonitoring: () => {},
  checkAllServices: async () => ({ status: 'healthy', services: [] }),
  getHealthStatus: () => ({ overall: 'healthy', lastUpdate: new Date(), services: [] }),
  generateHealthReport: () => 'All services healthy'
};

// Initialize mock storage with some test data
const storage = new MockStorage();

// Create express app
const app = express();
app.use(express.json());

// Register the same routes as the main application but with mock dependencies
function registerTestRoutes() {
  // Get all uploaded files
  app.get("/api/files", async (req, res) => {
    try {
      const files = await storage.getAllFiles();
      res.json(files);
    } catch (error) {
      console.error("Get files error:", error);
      res.status(500).json({ message: "Failed to retrieve files" });
    }
  });

  // Get a specific file by ID
  app.get("/api/files/:id", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      
      // Check if fileId is valid
      if (isNaN(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }
      
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      res.json(file);
    } catch (error) {
      console.error("Get file error:", error);
      res.status(500).json({ message: "Failed to retrieve file" });
    }
  });

  // Delete a file
  app.delete("/api/files/:id", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      
      // Check if fileId is valid
      if (isNaN(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }
      
      // Check if the file exists first
      const file = await storage.getFile(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      await storage.deleteFile(fileId);
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Delete file error:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Get analysis runs for a file
  app.get("/api/files/:fileId/analysis", async (req, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      
      // Check if fileId is valid
      if (isNaN(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }
      
      // Validate that the file exists first
      const file = await storage.getFile(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      const analysisRuns = await storage.getAnalysisRunsByFileId(fileId);
      res.json(analysisRuns);
    } catch (error) {
      console.error("Get file analysis error:", error);
      res.status(500).json({ message: "Failed to retrieve analysis runs" });
    }
  });

  // Get analysis run status
  app.get("/api/analysis/:id", async (req, res) => {
    try {
      const analysisId = parseInt(req.params.id);
      
      // Check if analysisId is valid
      if (isNaN(analysisId)) {
        return res.status(400).json({ message: "Invalid analysis ID" });
      }
      
      const analysisRun = await storage.getAnalysisRun(analysisId);
      
      if (!analysisRun) {
        return res.status(404).json({ message: "Analysis run not found" });
      }

      res.json(analysisRun);
    } catch (error) {
      console.error("Get analysis error:", error);
      res.status(500).json({ message: "Failed to retrieve analysis" });
    }
  });

  // Get logs for specific analysis run
  app.get("/api/analysis/:id/logs", async (req, res) => {
    try {
      const analysisId = parseInt(req.params.id);
      
      // Check if analysisId is valid
      if (isNaN(analysisId)) {
        return res.status(400).json({ message: "Invalid analysis ID" });
      }
      
      // Validate that the analysis run exists first
      const analysisRun = await storage.getAnalysisRun(analysisId);
      if (!analysisRun) {
        return res.status(404).json({ message: "Analysis run not found" });
      }
      
      const logs = await storage.getLogsByAnalysisRunId(analysisId);
      res.json(logs);
    } catch (error) {
      console.error("Get analysis logs error:", error);
      res.status(500).json({ message: "Failed to retrieve analysis logs" });
    }
  });

  // Get documentation output
  app.get("/api/analysis/:id/output", async (req, res) => {
    try {
      const analysisId = parseInt(req.params.id);
      
      // Check if analysisId is valid
      if (isNaN(analysisId)) {
        return res.status(400).json({ message: "Invalid analysis ID" });
      }
      
      // Validate that the analysis run exists first
      const analysisRun = await storage.getAnalysisRun(analysisId);
      if (!analysisRun) {
        return res.status(404).json({ message: "Analysis run not found" });
      }
      
      const outputs = await storage.getOutputsByAnalysisRunId(analysisId);
      res.json(outputs);
    } catch (error) {
      console.error("Get output error:", error);
      res.status(500).json({ message: "Failed to retrieve output" });
    }
  });

  // Download documentation in specific format
  app.get('/api/analysis/:id/download/:format', async (req, res) => {
    try {
      const analysisId = parseInt(req.params.id);
      const format = req.params.format;
      
      // Check if analysisId is valid
      if (isNaN(analysisId)) {
        return res.status(400).json({ message: "Invalid analysis ID" });
      }
      
      // Validate that the analysis run exists first
      const analysisRun = await storage.getAnalysisRun(analysisId);
      if (!analysisRun) {
        return res.status(404).json({ message: "Analysis run not found" });
      }
      
      const outputs = await storage.getOutputsByAnalysisRunId(analysisId);
      const output = outputs.find((o) => o.format === format);
      
      if (!output) {
        return res.status(404).json({ error: `Format ${format} not found` });
      }

      res.json({ message: "Download would start here", format, content: "mock content" });
    } catch (error) {
      console.error('Error downloading documentation:', error);
      res.status(500).json({ error: 'Failed to download documentation' });
    }
  });

  // Export documentation
  app.get("/api/analysis/:id/export/:format", async (req, res) => {
    try {
      const analysisId = parseInt(req.params.id);
      const format = req.params.format;
      
      // Check if analysisId is valid
      if (isNaN(analysisId)) {
        return res.status(400).json({ message: "Invalid analysis ID" });
      }
      
      // Validate that the analysis run exists first
      const analysisRun = await storage.getAnalysisRun(analysisId);
      if (!analysisRun) {
        return res.status(404).json({ message: "Analysis run not found" });
      }
      
      const outputs = await storage.getOutputsByAnalysisRunId(analysisId);
      const output = outputs.find(o => o.format === format);
      
      if (!output) {
        return res.status(404).json({ message: `No ${format} output found` });
      }

      res.json({ message: "Export would start here", format, content: "mock content" });
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export documentation" });
    }
  });

  // Get all agents
  app.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAllAgents();
      res.json(agents);
    } catch (error) {
      console.error("Get agents error:", error);
      res.status(500).json({ message: "Failed to retrieve agents" });
    }
  });

  // Update agent configuration
  app.patch("/api/agents/:id", async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      
      // Check if agentId is valid
      if (isNaN(agentId)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      // Check if the agent exists first
      const existingAgent = await storage.getAgent(agentId);
      if (!existingAgent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const updates = req.body;
      await storage.updateAgent(agentId, updates);
      const updatedAgent = await storage.getAgent(agentId);
      res.json(updatedAgent);
    } catch (error) {
      console.error("Update agent error:", error);
      res.status(500).json({ message: "Failed to update agent" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });
}

// Start test server
function startTestServer() {
  registerTestRoutes();
  
  const server = createServer(app);
  const port = 5000;
  
  server.listen(port, () => {
    console.log(`Test server running on port ${port}`);
  });

  return server;
}

// Auto-start if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startTestServer();
}

export { startTestServer };