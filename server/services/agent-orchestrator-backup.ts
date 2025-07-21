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
      await this.logMessage(analysisRunId, null, 'info', 'Starting analysis pipeline');

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

      await this.logMessage(analysisRunId, null, 'info', `Running ${enabledAgents.length} agents`);

      // Run each agent
      const agentResults: Record<string, any> = {};
      for (const agent of enabledAgents) {
        await this.logMessage(analysisRunId, agent.id, 'info', `Starting ${agent.name}`);
        
        const result = await this.runAgent(agent, messages, analysisRunId);
        agentResults[agent.type] = result;

        await this.storage.updateAgentLastRun(agent.id);
        await this.logMessage(analysisRunId, agent.id, 'info', `Completed ${agent.name}`);
      }

      // Generate documentation outputs
      await this.logMessage(analysisRunId, null, 'info', 'Generating documentation outputs');
      
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

      const jsonContent = JSON.stringify(agentResults, null, 2);
      await this.storage.createDocumentationOutput({
        analysisRunId,
        format: 'json',
        content: jsonContent,
      });

      // Complete the analysis
      await this.storage.completeAnalysisRun(analysisRunId, agentResults);
      await this.logMessage(analysisRunId, null, 'info', 'Analysis completed successfully');

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
    await this.logMessage(analysisRunId, agentId, 'info', `Processing ${messages.length} messages`);

    const messageContent = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    
    const systemPrompt = `You are a document structure analysis expert. Analyze the chat conversation and suggest a logical document structure with appropriate sections.`;
    
    const prompt = `Analyze this conversation and suggest a document structure:

${messageContent}

Provide a JSON response with:
- sections: array of section names for the document
- topicGroups: array of main topics discussed
- insights: key structural insights

Format: {"sections": [...], "topicGroups": [...], "insights": [...]}`;

    try {
      const response = await aiService.smartCall(prompt, systemPrompt, 'openai');
      const result = JSON.parse(response.content);
      
      await this.logMessage(analysisRunId, agentId, 'info', `AI identified ${result.sections?.length || 0} sections and ${result.topicGroups?.length || 0} topic groups`);
      
      return {
        sections: result.sections || [],
        topicGroups: result.topicGroups || [],
        messageCount: messages.length,
        topicCount: result.topicGroups?.length || 0,
        insights: result.insights || [],
        aiModel: response.model,
        aiProvider: response.provider
      };
    } catch (error) {
      await this.logMessage(analysisRunId, agentId, 'warn', `AI analysis failed, using fallback: ${error}`);
      return this.runStructureAgentFallback(messages, config, analysisRunId, agentId);
    }
  }

  private async runRequirementsAgent(messages: ChatMessage[], config: any, analysisRunId: number, agentId: number): Promise<any> {
    const messageContent = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    
    const systemPrompt = `You are a requirements analysis expert. Extract and categorize technical requirements from conversations.`;
    
    const prompt = `Analyze this conversation and extract requirements:

${messageContent}

Identify and categorize requirements as:
- functional: What the system should do
- non-functional: Performance, security, usability requirements  
- technical: Implementation, architecture, technology requirements

Provide a JSON response:
{"functional": [...], "non_functional": [...], "technical": [...], "summary": "brief analysis"}`;

    try {
      const response = await aiService.smartCall(prompt, systemPrompt, 'openai');
      const result = JSON.parse(response.content);
      
      const totalRequirements = (result.functional?.length || 0) + (result.non_functional?.length || 0) + (result.technical?.length || 0);
      await this.logMessage(analysisRunId, agentId, 'info', `AI extracted ${totalRequirements} requirements`);
      
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
      await this.logMessage(analysisRunId, agentId, 'warn', `AI analysis failed, using fallback: ${error}`);
      return this.runRequirementsAgentFallback(messages, config, analysisRunId, agentId);
    }
  }

  private async runUserPerspectiveAgent(messages: ChatMessage[], config: any, analysisRunId: number, agentId: number): Promise<any> {
    const messageContent = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    
    const systemPrompt = `You are a user experience expert. Analyze conversations to identify user perspectives, needs, and personas.`;
    
    const prompt = `Analyze this conversation from a user perspective:

${messageContent}

Identify:
- User personas mentioned or implied
- User needs and pain points
- User feedback and preferences
- Experience requirements

Provide a JSON response:
{"personas": [...], "needs": [...], "feedback": [...], "insights": [...]}`;

    try {
      const response = await aiService.smartCall(prompt, systemPrompt, 'anthropic');
      const result = JSON.parse(response.content);
      
      await this.logMessage(analysisRunId, agentId, 'info', `AI identified ${result.personas?.length || 0} personas and ${result.needs?.length || 0} user needs`);
      
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
      await this.logMessage(analysisRunId, agentId, 'warn', `AI analysis failed, using fallback: ${error}`);
      return this.runUserPerspectiveAgentFallback(messages, config, analysisRunId, agentId);
    }
  }

  private async runDocumentationAgent(messages: ChatMessage[], config: any, analysisRunId: number, agentId: number): Promise<any> {
    const messageContent = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    
    const systemPrompt = `You are a documentation expert. Analyze conversations to identify documentation gaps and generate content suggestions.`;
    
    const prompt = `Analyze this conversation for documentation needs:

${messageContent}

Identify:
- Missing documentation or context
- Incomplete specifications
- Areas needing clarification
- Content that should be documented

Provide a JSON response:
{"gaps": [...], "suggestions": [...], "priorities": [...], "topics": [...]}`;

    try {
      const response = await aiService.smartCall(prompt, systemPrompt, 'anthropic');
      const result = JSON.parse(response.content);
      
      await this.logMessage(analysisRunId, agentId, 'info', `AI identified ${result.gaps?.length || 0} documentation gaps`);
      
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
      await this.logMessage(analysisRunId, agentId, 'warn', `AI analysis failed, using fallback: ${error}`);
      return this.runDocumentationAgentFallback(messages, config, analysisRunId, agentId);
    }
  }

  private async runMetaAgent(messages: ChatMessage[], config: any, analysisRunId: number, agentId: number): Promise<any> {
    const messageContent = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    
    const systemPrompt = `You are a meta-analysis expert. Provide high-level insights about conversation quality, patterns, and overall analysis.`;
    
    const prompt = `Perform a meta-analysis of this conversation:

${messageContent}

Analyze:
- Overall conversation quality and depth
- Communication patterns and dynamics
- Key themes and recurring topics
- Analysis completeness and gaps

Provide a JSON response:
{"insights": [...], "patterns": [...], "themes": [...], "quality_assessment": "..."}`;

    try {
      const response = await aiService.smartCall(prompt, systemPrompt, 'anthropic');
      const result = JSON.parse(response.content);
      
      await this.logMessage(analysisRunId, agentId, 'info', `AI generated ${result.insights?.length || 0} meta insights`);
      
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
      await this.logMessage(analysisRunId, agentId, 'warn', `AI analysis failed, using fallback: ${error}`);
      return this.runMetaAgentFallback(messages, config, analysisRunId, agentId);
    }
  }

  // Fallback methods for when AI fails
  private async runStructureAgentFallback(messages: ChatMessage[], config: any, analysisRunId: number, agentId: number): Promise<any> {
    const topicGroups = this.groupMessagesByTopic(messages);
    const sections = ['Executive Summary', 'Overview', 'General', 'Next Steps', 'Conclusion'];
    
    return {
      sections,
      topicGroups: Object.keys(topicGroups),
      messageCount: messages.length,
      topicCount: Object.keys(topicGroups).length,
      fallbackUsed: true
    };
  }

  private async runRequirementsAgentFallback(messages: ChatMessage[], config: any, analysisRunId: number, agentId: number): Promise<any> {
    const requirements: string[] = [];
    const requirementKeywords = ['should', 'must', 'require', 'need', 'implement'];

    for (const message of messages) {
      if (requirementKeywords.some(keyword => message.content.toLowerCase().includes(keyword))) {
        requirements.push(message.content.substring(0, 100) + '...');
      }
    }

    return {
      functional: requirements.slice(0, 5),
      nonFunctional: [],
      technical: [],
      summary: 'Basic keyword-based extraction',
      totalMessages: messages.length,
      requirementDensity: requirements.length / messages.length,
      fallbackUsed: true
    };
  }

  private async runUserPerspectiveAgentFallback(messages: ChatMessage[], config: any, analysisRunId: number, agentId: number): Promise<any> {
    const userMentions = messages.filter(m => m.content.toLowerCase().includes('user')).length;
    
    return {
      personas: [],
      userNeeds: [],
      feedback: [],
      insights: ['Basic user mention analysis'],
      totalMessages: messages.length,
      fallbackUsed: true
    };
  }

  private async runDocumentationAgentFallback(messages: ChatMessage[], config: any, analysisRunId: number, agentId: number): Promise<any> {
    const questionMarks = messages.filter(m => m.content.includes('?')).length;
    
    return {
      gaps: [],
      suggestions: ['Review conversation for missing context'],
      priorities: ['high', 'medium', 'low'],
      topics: [],
      totalMessages: messages.length,
      gapDensity: questionMarks / messages.length,
      fallbackUsed: true
    };
  }

  private async runMetaAgentFallback(messages: ChatMessage[], config: any, analysisRunId: number, agentId: number): Promise<any> {
    const messagesByRole = this.getMessagesByRole(messages);
    
    return {
      insights: ['Basic conversation analysis', 'Message distribution by role', 'Limited meta-analysis available'],
      patterns: [],
      themes: [],
      qualityAssessment: 'Basic analysis only',
      messageStats: {
        total: messages.length,
        byRole: messagesByRole,
      },
      fallbackUsed: true
    };
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
      '?', 'how', 'what', 'why', 'when', 'where', 'todo', 'fixme'
    ];

    for (const message of messages) {
      const content = message.content.toLowerCase();
      
      if (gapIndicators.some(indicator => content.includes(indicator))) {
        documentationGaps.push(message.content);
      }
    }

    await this.logMessage(analysisRunId, agentId, 'info', `Identified ${documentationGaps.length} potential documentation gaps`);

    return {
      documentationGaps: documentationGaps.slice(0, 15),
      gapTypes,
      totalMessages: messages.length,
      gapDensity: documentationGaps.length / messages.length,
    };
  }

  private async runMetaAgent(messages: ChatMessage[], config: any, analysisRunId: number, agentId: number): Promise<any> {
    const metaInsights: string[] = [];

    // Analyze message patterns
    const messagesByRole = this.groupMessagesByRole(messages);
    const topicGroups = this.groupMessagesByTopic(messages);

    // Check for balance between user and assistant messages
    const userMessages = messagesByRole.user?.length || 0;
    const assistantMessages = messagesByRole.assistant?.length || 0;
    const messageRatio = userMessages / (assistantMessages || 1);

    if (messageRatio > 2) {
      metaInsights.push('Heavy user input - may indicate complex requirements gathering phase');
    } else if (messageRatio < 0.5) {
      metaInsights.push('Heavy assistant output - may indicate explanation or documentation phase');
    } else {
      metaInsights.push('Balanced conversation - good collaborative discussion');
    }

    // Analyze topic diversity
    const topicCount = Object.keys(topicGroups).length;
    if (topicCount > messages.length * 0.3) {
      metaInsights.push('High topic diversity - broad scope discussion');
    } else if (topicCount < messages.length * 0.1) {
      metaInsights.push('Low topic diversity - focused discussion');
    }

    // Check for recurring themes
    const wordFrequency = this.calculateWordFrequency(messages);
    const topWords = Object.entries(wordFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    metaInsights.push(`Key recurring themes: ${topWords.join(', ')}`);

    await this.logMessage(analysisRunId, agentId, 'info', `Generated ${metaInsights.length} meta insights`);

    return {
      metaInsights,
      messageStats: {
        total: messages.length,
        byRole: messagesByRole,
        topicCount,
        messageRatio: Math.round(messageRatio * 100) / 100,
      },
      topWords,
      analysisQuality: metaInsights.length > 3 ? 'comprehensive' : 'basic',
    };
  }

  private groupMessagesByTopic(messages: ChatMessage[]): Record<string, ChatMessage[]> {
    const groups: Record<string, ChatMessage[]> = {};
    
    for (const message of messages) {
      const topic = message.topic || 'general';
      if (!groups[topic]) {
        groups[topic] = [];
      }
      groups[topic].push(message);
    }

    return groups;
  }

  private groupMessagesByRole(messages: ChatMessage[]): Record<string, ChatMessage[]> {
    const groups: Record<string, ChatMessage[]> = {};
    
    for (const message of messages) {
      if (!groups[message.role]) {
        groups[message.role] = [];
      }
      groups[message.role].push(message);
    }

    return groups;
  }

  private calculateWordFrequency(messages: ChatMessage[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);

    for (const message of messages) {
      const words = message.content
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.has(word));

      for (const word of words) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    }

    return frequency;
  }

  private async logMessage(analysisRunId: number, agentId: number | null, level: string, message: string, data?: any): Promise<void> {
    await this.storage.createAgentLog({
      analysisRunId,
      agentId,
      level,
      message,
      data,
    });
  }
}
