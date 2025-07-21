import { IStorage } from "../storage";
import { UploadedFile, ChatMessage } from "@shared/schema";

export class FileProcessor {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async processFile(fileId: number): Promise<void> {
    const file = await this.storage.getFile(fileId);
    if (!file) {
      throw new Error(`File ${fileId} not found`);
    }

    try {
      const messages = await this.parseFileContent(file);
      
      // Save messages to storage
      for (const messageData of messages) {
        await this.storage.createChatMessage({
          fileId: file.id,
          ...messageData,
        });
      }

      // Mark file as processed
      await this.storage.updateFileProcessed(file.id, true);
      
      console.log(`Processed ${messages.length} messages from file ${file.originalName}`);
    } catch (error) {
      console.error(`Error processing file ${file.id}:`, error);
      // Keep processed as false so user knows there was an error
    }
  }

  private async parseFileContent(file: UploadedFile): Promise<Omit<ChatMessage, 'id' | 'fileId'>[]> {
    const content = file.content;
    if (!content) {
      throw new Error('File content is empty');
    }

    if (file.contentType === 'application/json') {
      return this.parseJsonContent(content);
    } else if (file.contentType === 'text/markdown') {
      return this.parseMarkdownContent(content);
    } else if (file.contentType === 'text/plain') {
      return this.parseTextContent(content);
    } else {
      throw new Error(`Unsupported file type: ${file.contentType}`);
    }
  }

  private parseJsonContent(content: string): Omit<ChatMessage, 'id' | 'fileId'>[] {
    try {
      const data = JSON.parse(content);
      
      // Handle the sample format from requirements
      if (data.messages && Array.isArray(data.messages)) {
        return data.messages.map((msg: any) => ({
          timestamp: msg.timestamp || new Date().toISOString(),
          role: msg.role || 'user',
          content: msg.content || '',
          topic: msg.topic || null,
          containerType: msg.containerType || null,
          developmentStage: msg.developmentStage || null,
        }));
      }

      // Handle array of messages directly
      if (Array.isArray(data)) {
        return data.map((msg: any) => ({
          timestamp: msg.timestamp || new Date().toISOString(),
          role: msg.role || 'user',
          content: msg.content || msg.message || '',
          topic: msg.topic || null,
          containerType: msg.containerType || msg.container_type || null,
          developmentStage: msg.developmentStage || msg.development_stage || null,
        }));
      }

      throw new Error('Invalid JSON format: expected messages array');
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }

  private parseMarkdownContent(content: string): Omit<ChatMessage, 'id' | 'fileId'>[] {
    const messages: Omit<ChatMessage, 'id' | 'fileId'>[] = [];
    const lines = content.split('\n');
    
    let currentMessage: Partial<ChatMessage> = {};
    let inCodeBlock = false;
    
    for (const line of lines) {
      // Toggle code block state
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      // Skip content inside code blocks
      if (inCodeBlock) {
        continue;
      }

      // Look for user/assistant indicators
      if (line.match(/^(User|Human|You):/i)) {
        if (currentMessage.content) {
          messages.push({
            timestamp: currentMessage.timestamp || new Date().toISOString(),
            role: currentMessage.role || 'user',
            content: currentMessage.content.trim(),
            topic: currentMessage.topic || null,
            containerType: null,
            developmentStage: null,
          });
        }
        
        currentMessage = {
          role: 'user',
          content: line.replace(/^(User|Human|You):/i, '').trim(),
          timestamp: new Date().toISOString(),
        };
      } else if (line.match(/^(Assistant|AI|Bot):/i)) {
        if (currentMessage.content) {
          messages.push({
            timestamp: currentMessage.timestamp || new Date().toISOString(),
            role: currentMessage.role || 'user',
            content: currentMessage.content.trim(),
            topic: currentMessage.topic || null,
            containerType: null,
            developmentStage: null,
          });
        }
        
        currentMessage = {
          role: 'assistant',
          content: line.replace(/^(Assistant|AI|Bot):/i, '').trim(),
          timestamp: new Date().toISOString(),
        };
      } else if (currentMessage.content !== undefined) {
        currentMessage.content += '\n' + line;
      } else if (line.trim()) {
        // First line without role indicator - assume user
        currentMessage = {
          role: 'user',
          content: line,
          timestamp: new Date().toISOString(),
        };
      }
    }

    // Add final message
    if (currentMessage.content) {
      messages.push({
        timestamp: currentMessage.timestamp || new Date().toISOString(),
        role: currentMessage.role || 'user',
        content: currentMessage.content.trim(),
        topic: currentMessage.topic || null,
        containerType: null,
        developmentStage: null,
      });
    }

    return messages.filter(msg => msg.content.length > 0);
  }

  private parseTextContent(content: string): Omit<ChatMessage, 'id' | 'fileId'>[] {
    // Simple text parsing - split by double newlines and treat each as a separate message
    const chunks = content.split(/\n\s*\n/);
    const messages: Omit<ChatMessage, 'id' | 'fileId'>[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim();
      if (chunk.length > 0) {
        messages.push({
          timestamp: new Date().toISOString(),
          role: i % 2 === 0 ? 'user' : 'assistant', // Alternate between user and assistant
          content: chunk,
          topic: null,
          containerType: null,
          developmentStage: null,
        });
      }
    }

    return messages;
  }
}
