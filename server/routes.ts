import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFileSchema, insertAnalysisRunSchema, urlAnalysisSchema } from "@shared/schema";
import { AgentOrchestrator } from "./services/agent-orchestrator";
import { FileProcessor } from "./services/file-processor";
import { UrlProcessor } from "./services/url-processor";
import { ApiMonitor } from "./services/api-monitor";
import multer from "multer";
import { z } from "zod";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/json', 'text/plain', 'text/markdown'];
    const allowedExtensions = ['.json', '.txt', '.md'];
    const extension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JSON, TXT, and Markdown files are allowed.'));
    }
  }
});

const orchestrator = new AgentOrchestrator(storage);
const fileProcessor = new FileProcessor(storage);
const urlProcessor = new UrlProcessor(storage);
const apiMonitor = new ApiMonitor(storage);

// Start API monitoring (check every 5 minutes)
apiMonitor.startMonitoring(300000);

export async function registerRoutes(app: Express): Promise<Server> {
  // File upload endpoint
  app.post("/api/files/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const fileData = {
        filename: `${Date.now()}-${req.file.originalname}`,
        originalName: req.file.originalname,
        size: req.file.size,
        contentType: req.file.mimetype,
        processed: false,
        content: req.file.buffer.toString('utf8'),
        sourceType: 'file',
      };

      const validatedFile = insertFileSchema.parse(fileData);
      const file = await storage.createFile(validatedFile);

      // Process the file in the background
      fileProcessor.processFile(file.id).catch(console.error);

      res.json(file);
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // URL analysis endpoint
  app.post("/api/files/analyze-url", async (req, res) => {
    try {
      const { url } = urlAnalysisSchema.parse(req.body);
      
      // Process URL in the background
      const file = await urlProcessor.processUrl(url);
      
      // Process the extracted content
      fileProcessor.processFile(file.id).catch(console.error);

      res.json(file);
    } catch (error) {
      console.error("URL analysis error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to analyze URL" 
      });
    }
  });

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

  // Start analysis
  app.post("/api/analysis/start", async (req, res) => {
    try {
      const { fileId } = req.body;
      
      if (!fileId) {
        return res.status(400).json({ message: "File ID is required" });
      }

      const file = await storage.getFile(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      if (!file.processed) {
        return res.status(400).json({ message: "File is still being processed" });
      }

      const analysisRun = await storage.createAnalysisRun({
        fileId,
        status: 'pending',
        results: null,
      });

      // Start analysis in background
      orchestrator.runAnalysis(analysisRun.id).catch(console.error);

      res.json(analysisRun);
    } catch (error) {
      console.error("Start analysis error:", error);
      res.status(500).json({ message: "Failed to start analysis" });
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

  // Get recent logs
  app.get("/api/logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getRecentLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Get logs error:", error);
      res.status(500).json({ message: "Failed to retrieve logs" });
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
      const output = outputs.find((o: any) => o.format === format);
      
      if (!output) {
        return res.status(404).json({ error: `Format ${format} not found` });
      }

      // Set appropriate headers for download
      const filename = `analysis-${analysisId}-report.${format === 'docx' ? 'docx' : format}`;
      
      switch (format) {
        case 'markdown':
          res.setHeader('Content-Type', 'text/markdown');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send(output.content);
          break;
          
        case 'html':
          res.setHeader('Content-Type', 'text/html');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send(output.content);
          break;
          
        case 'latex':
          res.setHeader('Content-Type', 'application/x-latex');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send(output.content);
          break;
          
        case 'wiki':
          res.setHeader('Content-Type', 'text/plain');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send(output.content);
          break;
          
        case 'docx':
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          const buffer = Buffer.from(output.content, 'base64');
          res.send(buffer);
          break;
          
        case 'json':
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send(output.content);
          break;
          
        default:
          res.status(400).json({ error: 'Unsupported format' });
      }
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

      const mimeTypes = {
        markdown: 'text/markdown',
        html: 'text/html',
        json: 'application/json',
      };

      res.setHeader('Content-Type', mimeTypes[format as keyof typeof mimeTypes] || 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="analysis-${analysisId}.${format}"`);
      res.send(output.content);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export documentation" });
    }
  });

  // Enhanced health check endpoint with comprehensive monitoring
  app.get("/api/health", async (req, res) => {
    try {
      const detailed = req.query.detailed === 'true';
      
      if (detailed) {
        // Perform fresh health checks for all services
        const healthStatus = await apiMonitor.checkAllServices();
        res.json(healthStatus);
      } else {
        // Return cached health status
        const healthStatus = apiMonitor.getHealthStatus();
        res.json({
          status: healthStatus.overall,
          timestamp: healthStatus.lastUpdate.toISOString(),
          services: healthStatus.services.length
        });
      }
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({ 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get detailed health report
  app.get("/api/health/report", async (req, res) => {
    try {
      const report = apiMonitor.generateHealthReport();
      res.setHeader('Content-Type', 'text/plain');
      res.send(report);
    } catch (error) {
      console.error("Health report error:", error);
      res.status(500).json({ message: "Failed to generate health report" });
    }
  });

  // API connectivity test endpoint
  app.post("/api/health/test", async (req, res) => {
    try {
      const { service } = req.body;
      
      if (!service) {
        return res.status(400).json({ message: "Service parameter required" });
      }

      const healthStatus = await apiMonitor.checkAllServices();
      const serviceStatus = healthStatus.services.find(s => s.service === service);
      
      if (!serviceStatus) {
        return res.status(404).json({ message: `Service '${service}' not found` });
      }

      res.json(serviceStatus);
    } catch (error) {
      console.error("Service test error:", error);
      res.status(500).json({ message: "Failed to test service" });
    }
  });

  // API info endpoint
  app.get("/api/info", async (req, res) => {
    try {
      const info = {
        name: 'OdyCAnalyzer API',
        version: '1.0.0',
        description: 'Multi-Agent Documentation Analyzer API',
        endpoints: {
          files: '/api/files',
          analysis: '/api/analysis',
          agents: '/api/agents',
          logs: '/api/logs',
          health: '/api/health'
        },
        externalServices: {
          openai: !!process.env.OPENAI_API_KEY,
          anthropic: !!process.env.ANTHROPIC_API_KEY,
          database: !!process.env.DATABASE_URL
        }
      };

      res.json(info);
    } catch (error) {
      console.error("API info error:", error);
      res.status(500).json({ message: "Failed to retrieve API info" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
