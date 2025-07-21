import { IStorage } from "../storage";
import { InsertChatMessage } from "@shared/schema";

export class FileProcessor {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async processFile(fileId: number): Promise<void> {
    try {
      const file = await this.storage.getFile(fileId);
      if (!file) {
        throw new Error(`File ${fileId} not found`);
      }

      if (file.processed) {
        console.log(`File ${fileId} already processed`);
        return;
      }

      console.log(`Processing file: ${file.filename}`);

      // Parse the file content based on file type
      const messages = await this.parseFileContent(file.content || '', file.filename);

      // Store parsed messages in database
      for (const message of messages) {
        await this.storage.createChatMessage({
          ...message,
          fileId,
        });
      }

      // Mark file as processed
      await this.storage.updateFileProcessed(fileId, true);

      console.log(`File ${fileId} processed successfully. Extracted ${messages.length} messages.`);
    } catch (error) {
      console.error(`Error processing file ${fileId}:`, error);
      throw error;
    }
  }

  private async parseFileContent(content: string, filename: string): Promise<InsertChatMessage[]> {
    const messages: InsertChatMessage[] = [];

    try {
      if (filename.endsWith('.json')) {
        return this.parseJsonContent(content);
      } else if (filename.endsWith('.md') || filename.endsWith('.txt')) {
        return this.parseTextContent(content);
      } else {
        throw new Error(`Unsupported file type: ${filename}`);
      }
    } catch (error) {
      console.error(`Error parsing file content:`, error);
      // Return basic message structure if parsing fails
      return [{
        role: 'user',
        content: content.substring(0, 1000), // Limit content length
        timestamp: new Date().toISOString(),
        topic: 'general',
      }];
    }
  }

  private parseJsonContent(content: string): InsertChatMessage[] {
    const messages: InsertChatMessage[] = [];

    try {
      const data = JSON.parse(content);

      // Handle different JSON structures
      if (Array.isArray(data)) {
        // Array of messages
        for (const item of data) {
          const message = this.extractMessageFromObject(item);
          if (message) messages.push(message);
        }
      } else if (data.messages && Array.isArray(data.messages)) {
        // Object with messages array
        for (const item of data.messages) {
          const message = this.extractMessageFromObject(item);
          if (message) messages.push(message);
        }
      } else if (data.conversation && Array.isArray(data.conversation)) {
        // ChatGPT export format
        for (const item of data.conversation) {
          const message = this.extractMessageFromObject(item);
          if (message) messages.push(message);
        }
      } else {
        // Single object, treat as one message
        const message = this.extractMessageFromObject(data);
        if (message) messages.push(message);
      }
    } catch (error) {
      console.error('JSON parsing error:', error);
    }

    return messages;
  }

  private parseTextContent(content: string): InsertChatMessage[] {
    const messages: InsertChatMessage[] = [];
    const lines = content.split('\n');
    let currentMessage = '';
    let currentRole = 'user';
    let messageIndex = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detect role changes
      if (trimmedLine.toLowerCase().startsWith('user:') || 
          trimmedLine.toLowerCase().startsWith('human:') ||
          trimmedLine.toLowerCase().startsWith('question:')) {
        if (currentMessage.trim()) {
          messages.push({
            role: currentRole,
            content: currentMessage.trim(),
            timestamp: new Date(Date.now() + messageIndex * 1000).toISOString(),
            topic: this.extractTopic(currentMessage),
          });
          messageIndex++;
        }
        currentRole = 'user';
        currentMessage = trimmedLine.replace(/^(user:|human:|question:)/i, '').trim();
      } else if (trimmedLine.toLowerCase().startsWith('assistant:') || 
                 trimmedLine.toLowerCase().startsWith('ai:') ||
                 trimmedLine.toLowerCase().startsWith('answer:') ||
                 trimmedLine.toLowerCase().startsWith('response:')) {
        if (currentMessage.trim()) {
          messages.push({
            role: currentRole,
            content: currentMessage.trim(),
            timestamp: new Date(Date.now() + messageIndex * 1000).toISOString(),
            topic: this.extractTopic(currentMessage),
          });
          messageIndex++;
        }
        currentRole = 'assistant';
        currentMessage = trimmedLine.replace(/^(assistant:|ai:|answer:|response:)/i, '').trim();
      } else if (trimmedLine === '' && currentMessage.trim()) {
        // Empty line might indicate message boundary
        messages.push({
          role: currentRole,
          content: currentMessage.trim(),
          timestamp: new Date(Date.now() + messageIndex * 1000).toISOString(),
          topic: this.extractTopic(currentMessage),
        });
        messageIndex++;
        currentMessage = '';
      } else {
        // Continue current message
        if (currentMessage) currentMessage += '\n';
        currentMessage += trimmedLine;
      }
    }

    // Add final message if any
    if (currentMessage.trim()) {
      messages.push({
        role: currentRole,
        content: currentMessage.trim(),
        timestamp: new Date(Date.now() + messageIndex * 1000).toISOString(),
        topic: this.extractTopic(currentMessage),
      });
    }

    // If no structured messages found, treat entire content as one message
    if (messages.length === 0) {
      messages.push({
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
        topic: 'general',
      });
    }

    return messages;
  }

  private extractMessageFromObject(obj: any): InsertChatMessage | null {
    try {
      // Try different property names for role
      const role = obj.role || obj.author || obj.sender || obj.type || 'user';
      
      // Try different property names for content
      const content = obj.content || obj.message || obj.text || obj.body || '';
      
      if (!content) return null;

      // Try different property names for timestamp
      let timestamp = new Date().toISOString();
      if (obj.timestamp) {
        timestamp = new Date(obj.timestamp).toISOString();
      } else if (obj.created_at) {
        timestamp = new Date(obj.created_at).toISOString();
      } else if (obj.date) {
        timestamp = new Date(obj.date).toISOString();
      } else if (obj.time) {
        timestamp = new Date(obj.time).toISOString();
      }

      // Extract topic
      const topic = obj.topic || obj.category || obj.subject || this.extractTopic(content);

      return {
        role: this.normalizeRole(role),
        content: String(content),
        timestamp,
        topic,
      };
    } catch (error) {
      console.error('Error extracting message from object:', error);
      return null;
    }
  }

  private normalizeRole(role: string): string {
    const normalizedRole = String(role).toLowerCase();
    if (normalizedRole.includes('user') || normalizedRole.includes('human')) {
      return 'user';
    } else if (normalizedRole.includes('assistant') || normalizedRole.includes('ai') || normalizedRole.includes('bot')) {
      return 'assistant';
    } else {
      return 'user'; // Default to user
    }
  }

  private extractTopic(content: string): string {
    // Simple topic extraction based on content
    const words = content.toLowerCase().split(/\s+/);
    
    // Look for technical terms that might indicate topic
    const technicalTerms = [
      'database', 'api', 'frontend', 'backend', 'ui', 'design', 'architecture',
      'development', 'testing', 'deployment', 'authentication', 'security',
      'performance', 'optimization', 'bug', 'feature', 'requirement'
    ];

    for (const term of technicalTerms) {
      if (words.includes(term)) {
        return term;
      }
    }

    // Fallback to first few words
    const firstWords = words.slice(0, 3).join(' ');
    return firstWords || 'general';
  }
}