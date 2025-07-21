import { IStorage } from "../storage";
import { Agent, AnalysisRun, ChatMessage } from "@shared/schema";
import { FileProcessor } from "./file-processor";
import { MarkdownGenerator } from "./markdown-generator";
import { aiService } from "./ai-service";

export class AgentOrchestrator {
  private storage: IStorage;
  private fileProcessor: FileProcessor;
  private markdownGenerator: MarkdownGenerator;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.fileProcessor = new FileProcessor(storage);
    this.markdownGenerator = new MarkdownGenerator();
  }

  async runAnalysis(analysisRunId: number): Promise<void> {
    const analysisRun = await this.storage.getAnalysisRun(analysisRunId);
    if (!analysisRun) {
      throw new Error(`Analysis run ${analysisRunId} not found`);
    }

    try {
      await this.storage.updateAnalysisRunStatus(analysisRunId, 'running');
      await this.logMessage(analysisRunId, null, 'info', 'Starting AI-powered analysis pipeline');

      const file = await this.storage.getFile(analysisRun.fileId!);
      if (!file) {
        throw new Error(`File ${analysisRun.fileId} not found`);
      }

      // Get chat messages for this file
      const messages = await this.storage.getMessagesByFileId(file.id);
      if (messages.length === 0) {
        throw new Error('No messages found in file');
      }

      // Get enabled agents
      const allAgents = await this.storage.getAllAgents();
      const enabledAgents = allAgents.filter(agent => agent.enabled);

      await this.logMessage(analysisRunId, null, 'info', `Running ${enabledAgents.length} AI agents with ${aiService.getAvailableProviders().join(', ')}`);

      // Run each agent
      const agentResults: Record<string, any> = {};
      for (const agent of enabledAgents) {
        await this.logMessage(analysisRunId, agent.id, 'info', `Starting ${agent.name}`);
        
        const result = await this.runAgent(agent, messages, analysisRunId);
        agentResults[agent.type] = result;

        await this.storage.updateAgentLastRun(agent.id);
        await this.logMessage(analysisRunId, agent.id, 'info', `Completed ${agent.name}`);
      }

      // Generate documentation outputs in multiple formats
      await this.logMessage(analysisRunId, null, 'info', 'Generating documentation outputs in multiple formats');
      
      const markdownContent = this.markdownGenerator.generateMarkdown(agentResults, messages);
      await this.storage.createDocumentationOutput({
        analysisRunId,
        format: 'markdown',
        content: markdownContent,
      });

      const htmlContent = this.markdownGenerator.generateHTML(markdownContent);
      await this.storage.createDocumentationOutput({
        analysisRunId,
        format: 'html',
        content: htmlContent,
      });

      const latexContent = this.markdownGenerator.generateLaTeX(markdownContent);
      await this.storage.createDocumentationOutput({
        analysisRunId,
        format: 'latex',
        content: latexContent,
      });

      const wikiContent = this.markdownGenerator.generateWiki(markdownContent);
      await this.storage.createDocumentationOutput({
        analysisRunId,
        format: 'wiki',
        content: wikiContent,
      });

      try {
        const wordBuffer = await this.markdownGenerator.generateWord(markdownContent);
        await this.storage.createDocumentationOutput({
          analysisRunId,
          format: 'docx',
          content: wordBuffer.toString('base64'),
        });
      } catch (error) {
        await this.logMessage(analysisRunId, null, 'warn', `Word generation failed: ${error}`);
      }

      const jsonContent = JSON.stringify(agentResults, null, 2);
      await this.storage.createDocumentationOutput({
        analysisRunId,
        format: 'json',
        content: jsonContent,
      });

      // Complete the analysis
      await this.storage.completeAnalysisRun(analysisRunId, agentResults);
      await this.logMessage(analysisRunId, null, 'info', 'AI analysis completed successfully');

    } catch (error) {
      await this.storage.updateAnalysisRunStatus(analysisRunId, 'failed');
      await this.logMessage(analysisRunId, null, 'error', `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async runAgent(agent: Agent, messages: ChatMessage[], analysisRunId: number): Promise<any> {
    const config = agent.configuration as Record<string, any> || {};
    
    switch (agent.type) {
      case 'structure':
        return this.runStructureAgent(messages, config, analysisRunId, agent.id);
      case 'requirements':
        return this.runRequirementsAgent(messages, config, analysisRunId, agent.id);
      case 'user_perspective':
        return this.runUserPerspectiveAgent(messages, config, analysisRunId, agent.id);
      case 'documentation':
        return this.runDocumentationAgent(messages, config, analysisRunId, agent.id);
      case 'meta':
        return this.runMetaAgent(messages, config, analysisRunId, agent.id);
      default:
        throw new Error(`Unknown agent type: ${agent.type}`);
    }
  }

  private async runStructureAgent(messages: ChatMessage[], config: any, analysisRunId: number, agentId: number): Promise<any> {
    await this.logMessage(analysisRunId, agentId, 'info', `Processing ${messages.length} messages with AI`);

    const messageContent = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    
    const systemPrompt = `You are a document structure analysis expert. You MUST respond with valid JSON only. No explanation text before or after the JSON.`;
    
    const prompt = `Analyze this conversation and suggest a document structure:

${messageContent}

You MUST respond with ONLY valid JSON in this exact format:
{"sections": ["Section 1", "Section 2"], "topicGroups": ["Topic A", "Topic B"], "insights": ["Insight 1", "Insight 2"]}

Do not include any text before or after the JSON.`;

    try {
      const response = await aiService.smartCall(prompt, systemPrompt, 'openai');
      let result;
      try {
        result = JSON.parse(response.content);
      } catch (parseError) {
        // Try to extract JSON from the response if it's wrapped in text
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error(`Invalid JSON response: ${response.content}`);
        }
      }
      
      await this.logMessage(analysisRunId, agentId, 'info', `AI identified ${result.sections?.length || 0} sections using ${response.model}`);
      
      return {
        sections: result.sections || [],
        topicGroups: result.topicGroups || [],
        insights: result.insights || [],
        messageCount: messages.length,
        topicCount: result.topicGroups?.length || 0,
        aiModel: response.model,
        aiProvider: response.provider
      };
    } catch (error) {
      await this.logMessage(analysisRunId, agentId, 'warn', `AI analysis failed: ${error}`);
      throw error;
    }
  }

  private async runRequirementsAgent(messages: ChatMessage[], config: any, analysisRunId: number, agentId: number): Promise<any> {
    const messageContent = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    
    const systemPrompt = `You are a requirements analysis expert. You MUST respond with valid JSON only. No explanation text before or after the JSON.`;
    
    const prompt = `Analyze this conversation and extract requirements:

${messageContent}

You MUST respond with ONLY valid JSON in this exact format:
{"functional": ["req1", "req2"], "non_functional": ["req1", "req2"], "technical": ["req1", "req2"], "summary": "brief analysis"}

Do not include any text before or after the JSON.`;

    try {
      const response = await aiService.smartCall(prompt, systemPrompt, 'openai');
      let result;
      try {
        result = JSON.parse(response.content);
      } catch (parseError) {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error(`Invalid JSON response: ${response.content}`);
        }
      }
      
      const totalRequirements = (result.functional?.length || 0) + (result.non_functional?.length || 0) + (result.technical?.length || 0);
      await this.logMessage(analysisRunId, agentId, 'info', `AI extracted ${totalRequirements} requirements using ${response.model}`);
      
      return {
        functional: result.functional || [],
        nonFunctional: result.non_functional || [],
        technical: result.technical || [],
        summary: result.summary || '',
        totalMessages: messages.length,
        requirementDensity: totalRequirements / messages.length,
        aiModel: response.model,
        aiProvider: response.provider
      };
    } catch (error) {
      await this.logMessage(analysisRunId, agentId, 'warn', `AI analysis failed: ${error}`);
      throw error;
    }
  }

  private async runUserPerspectiveAgent(messages: ChatMessage[], config: any, analysisRunId: number, agentId: number): Promise<any> {
    const messageContent = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    
    const systemPrompt = `You are a user experience expert. You MUST respond with valid JSON only. No explanation text before or after the JSON.`;
    
    const prompt = `Analyze this conversation from a user perspective:

${messageContent}

You MUST respond with ONLY valid JSON in this exact format:
{"personas": ["persona1", "persona2"], "needs": ["need1", "need2"], "feedback": ["feedback1", "feedback2"], "insights": ["insight1", "insight2"]}

Do not include any text before or after the JSON.`;

    try {
      const response = await aiService.smartCall(prompt, systemPrompt, 'anthropic');
      let result;
      try {
        result = JSON.parse(response.content);
      } catch (parseError) {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error(`Invalid JSON response: ${response.content}`);
        }
      }
      
      await this.logMessage(analysisRunId, agentId, 'info', `AI identified ${result.personas?.length || 0} personas using ${response.model}`);
      
      return {
        personas: result.personas || [],
        userNeeds: result.needs || [],
        feedback: result.feedback || [],
        insights: result.insights || [],
        totalMessages: messages.length,
        aiModel: response.model,
        aiProvider: response.provider
      };
    } catch (error) {
      await this.logMessage(analysisRunId, agentId, 'warn', `AI analysis failed: ${error}`);
      throw error;
    }
  }

  private async runDocumentationAgent(messages: ChatMessage[], config: any, analysisRunId: number, agentId: number): Promise<any> {
    const messageContent = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    
    const systemPrompt = `You are a documentation expert. You MUST respond with valid JSON only. No explanation text before or after the JSON.`;
    
    const prompt = `Analyze this conversation for documentation needs:

${messageContent}

You MUST respond with ONLY valid JSON in this exact format:
{"gaps": ["gap1", "gap2"], "suggestions": ["suggestion1", "suggestion2"], "priorities": ["priority1", "priority2"], "topics": ["topic1", "topic2"]}

Do not include any text before or after the JSON.`;

    try {
      const response = await aiService.smartCall(prompt, systemPrompt, 'anthropic');
      let result;
      try {
        result = JSON.parse(response.content);
      } catch (parseError) {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error(`Invalid JSON response: ${response.content}`);
        }
      }
      
      await this.logMessage(analysisRunId, agentId, 'info', `AI identified ${result.gaps?.length || 0} documentation gaps using ${response.model}`);
      
      return {
        gaps: result.gaps || [],
        suggestions: result.suggestions || [],
        priorities: result.priorities || [],
        topics: result.topics || [],
        totalMessages: messages.length,
        gapDensity: (result.gaps?.length || 0) / messages.length,
        aiModel: response.model,
        aiProvider: response.provider
      };
    } catch (error) {
      await this.logMessage(analysisRunId, agentId, 'warn', `AI analysis failed: ${error}`);
      throw error;
    }
  }

  private async runMetaAgent(messages: ChatMessage[], config: any, analysisRunId: number, agentId: number): Promise<any> {
    const messageContent = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    
    const systemPrompt = `You are a meta-analysis expert. You MUST respond with valid JSON only. No explanation text before or after the JSON.`;
    
    const prompt = `Perform a meta-analysis of this conversation:

${messageContent}

You MUST respond with ONLY valid JSON in this exact format:
{"insights": ["insight1", "insight2"], "patterns": ["pattern1", "pattern2"], "themes": ["theme1", "theme2"], "quality_assessment": "brief quality assessment"}

Do not include any text before or after the JSON.`;

    try {
      const response = await aiService.smartCall(prompt, systemPrompt, 'anthropic');
      let result;
      try {
        result = JSON.parse(response.content);
      } catch (parseError) {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error(`Invalid JSON response: ${response.content}`);
        }
      }
      
      await this.logMessage(analysisRunId, agentId, 'info', `AI generated ${result.insights?.length || 0} meta insights using ${response.model}`);
      
      return {
        insights: result.insights || [],
        patterns: result.patterns || [],
        themes: result.themes || [],
        qualityAssessment: result.quality_assessment || '',
        messageStats: {
          total: messages.length,
          byRole: this.getMessagesByRole(messages),
        },
        aiModel: response.model,
        aiProvider: response.provider
      };
    } catch (error) {
      await this.logMessage(analysisRunId, agentId, 'warn', `AI analysis failed: ${error}`);
      throw error;
    }
  }

  private getMessagesByRole(messages: ChatMessage[]): Record<string, ChatMessage[]> {
    const byRole: Record<string, ChatMessage[]> = {};
    for (const message of messages) {
      if (!byRole[message.role]) {
        byRole[message.role] = [];
      }
      byRole[message.role].push(message);
    }
    return byRole;
  }

  private async logMessage(analysisRunId: number, agentId: number | null, level: string, message: string, data?: any): Promise<void> {
    await this.storage.createAgentLog({
      analysisRunId,
      agentId,
      level,
      message,
      data: data ? JSON.stringify(data) : null,
    });
  }
}