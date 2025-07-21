import { IStorage } from "../storage";
import { Agent, AnalysisRun, ChatMessage } from "@shared/schema";
import { FileProcessor } from "./file-processor";
import { MarkdownGenerator } from "./markdown-generator";

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

    // Group messages by topic
    const topicGroups = this.groupMessagesByTopic(messages);
    const sections: string[] = [];

    for (const [topic, topicMessages] of Object.entries(topicGroups)) {
      if (topicMessages.length >= (config.minMessagesPerSection || 3)) {
        sections.push(`${topic.charAt(0).toUpperCase() + topic.slice(1)}`);
        await this.logMessage(analysisRunId, agentId, 'info', `Identified section: ${topic} (${topicMessages.length} messages)`);
      }
    }

    // Add overview sections
    sections.unshift('Executive Summary', 'Overview');
    sections.push('Next Steps', 'Conclusion');

    await this.logMessage(analysisRunId, agentId, 'info', `Generated document outline with ${sections.length} sections`);

    return {
      sections,
      topicGroups: Object.keys(topicGroups),
      messageCount: messages.length,
      topicCount: Object.keys(topicGroups).length,
    };
  }

  private async runRequirementsAgent(messages: ChatMessage[], config: any, analysisRunId: number, agentId: number): Promise<any> {
    const requirements: string[] = [];
    const requirementTypes = config.requirementTypes || ['functional', 'non-functional', 'technical'];

    // Look for requirement-indicating keywords
    const requirementKeywords = [
      'should', 'must', 'require', 'need', 'implement', 'support',
      'allow', 'enable', 'provide', 'ensure', 'guarantee'
    ];

    for (const message of messages) {
      const content = message.content.toLowerCase();
      
      if (requirementKeywords.some(keyword => content.includes(keyword))) {
        // Extract potential requirement
        const sentences = message.content.split(/[.!?]+/);
        for (const sentence of sentences) {
          if (requirementKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
            requirements.push(sentence.trim());
          }
        }
      }
    }

    await this.logMessage(analysisRunId, agentId, 'info', `Extracted ${requirements.length} potential requirements`);

    return {
      requirements: requirements.slice(0, 20), // Limit to top 20
      requirementTypes,
      totalMessages: messages.length,
      requirementDensity: requirements.length / messages.length,
    };
  }

  private async runUserPerspectiveAgent(messages: ChatMessage[], config: any, analysisRunId: number, agentId: number): Promise<any> {
    const userPerspectives: string[] = [];
    const personaTypes = config.personaTypes || ['developer', 'researcher', 'project_manager'];
    const personas: Record<string, string[]> = {};

    // Initialize personas
    personaTypes.forEach((type: string) => {
      personas[type] = [];
    });

    // Look for user-focused language
    const userKeywords = {
      developer: ['code', 'implementation', 'technical', 'api', 'debug', 'maintain'],
      researcher: ['analyze', 'study', 'investigate', 'data', 'findings', 'methodology'],
      project_manager: ['timeline', 'delivery', 'stakeholder', 'progress', 'milestone', 'resource']
    };

    for (const message of messages) {
      const content = message.content.toLowerCase();
      
      // Check for user needs language
      if (content.includes('user') || content.includes('need') || content.includes('want')) {
        userPerspectives.push(message.content);
      }

      // Categorize by persona
      for (const [persona, keywords] of Object.entries(userKeywords)) {
        if (keywords.some(keyword => content.includes(keyword))) {
          personas[persona].push(message.content.substring(0, 100) + '...');
        }
      }
    }

    const identifiedPersonas = Object.entries(personas)
      .filter(([, messages]) => messages.length > 0)
      .map(([persona, messages]) => ({ persona, messageCount: messages.length, examples: messages.slice(0, 3) }));

    await this.logMessage(analysisRunId, agentId, 'info', `Identified ${identifiedPersonas.length} user personas and ${userPerspectives.length} user needs`);

    return {
      userPerspectives: userPerspectives.slice(0, 15),
      personas: identifiedPersonas,
      personaTypes,
      totalUserReferences: userPerspectives.length,
    };
  }

  private async runDocumentationAgent(messages: ChatMessage[], config: any, analysisRunId: number, agentId: number): Promise<any> {
    const documentationGaps: string[] = [];
    const gapTypes = config.gapTypes || ['missing_context', 'incomplete_specs', 'outdated_info'];

    // Look for gaps and questions
    const gapIndicators = [
      'unclear', 'missing', 'incomplete', 'undefined', 'not specified',
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
