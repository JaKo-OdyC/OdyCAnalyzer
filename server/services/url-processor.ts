import axios from 'axios';
import * as cheerio from 'cheerio';
import { IStorage } from '../storage';
import { UploadedFile } from '@shared/schema';

export class UrlProcessor {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async processUrl(url: string): Promise<UploadedFile> {
    const normalizedUrl = this.normalizeUrl(url);
    const sourceType = this.detectSourceType(normalizedUrl);
    
    let content: string;
    let title: string;
    
    switch (sourceType) {
      case 'chatgpt_share':
        ({ content, title } = await this.processChatGPTShare(normalizedUrl));
        break;
      default:
        throw new Error(`Unsupported URL type: ${sourceType}`);
    }

    // Create file record
    const file = await this.storage.createFile({
      filename: `${Date.now()}-${this.slugify(title)}.json`,
      originalName: title,
      size: content.length,
      contentType: 'application/json',
      processed: false,
      content,
      sourceUrl: normalizedUrl,
      sourceType,
    });

    return file;
  }

  private normalizeUrl(url: string): string {
    // Remove any trailing slashes or fragments
    return url.replace(/[#?].*$/, '').replace(/\/$/, '');
  }

  private detectSourceType(url: string): string {
    if (url.includes('chatgpt.com/share/') || url.includes('chat.openai.com/share/')) {
      return 'chatgpt_share';
    }
    
    throw new Error('Unsupported URL format');
  }

  private async processChatGPTShare(url: string): Promise<{ content: string; title: string }> {
    try {
      // Fetch the shared conversation page
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      
      // Extract title
      let title = $('title').text() || 'ChatGPT Conversation';
      if (title.includes('ChatGPT')) {
        title = title.replace(/^ChatGPT\s*[-–]?\s*/, '').trim();
      }
      if (!title || title === 'ChatGPT') {
        title = 'Untitled ChatGPT Conversation';
      }

      // Look for conversation data in various possible locations
      let conversationData: any[] = [];
      
      // Method 1: Look for JSON data in script tags
      $('script').each((_, element) => {
        const scriptContent = $(element).html();
        if (scriptContent && scriptContent.includes('conversation')) {
          try {
            // Try to extract JSON from various patterns
            const jsonMatch = scriptContent.match(/(?:conversation|messages|data)[\s]*:[\s]*(\[[\s\S]*?\])/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[1]);
              if (Array.isArray(parsed) && parsed.length > 0) {
                conversationData = parsed;
                return false; // Break the loop
              }
            }
          } catch (e) {
            // Continue trying other methods
          }
        }
      });

      // Method 2: Extract from visible conversation elements
      if (conversationData.length === 0) {
        const messages: any[] = [];
        
        // Look for conversation messages in the DOM
        $('[data-message-author-role], .message, .conversation-turn').each((index, element) => {
          const $element = $(element);
          
          // Determine the role
          let role = 'user';
          const authorRole = $element.attr('data-message-author-role');
          if (authorRole) {
            role = authorRole === 'assistant' ? 'assistant' : 'user';
          } else {
            // Try to infer from class names or content
            const classes = $element.attr('class') || '';
            if (classes.includes('assistant') || classes.includes('ai')) {
              role = 'assistant';
            }
          }

          // Extract content
          const content = $element.text().trim();
          if (content && content.length > 0) {
            messages.push({
              timestamp: new Date().toISOString(),
              role,
              content,
              topic: null
            });
          }
        });

        if (messages.length > 0) {
          conversationData = messages;
        }
      }

      // Method 3: Fallback - extract all text and try to parse as alternating messages
      if (conversationData.length === 0) {
        const bodyText = $('body').text();
        const lines = bodyText.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 20 && !line.includes('ChatGPT') && !line.includes('OpenAI'));

        if (lines.length > 0) {
          lines.forEach((line, index) => {
            conversationData.push({
              timestamp: new Date().toISOString(),
              role: index % 2 === 0 ? 'user' : 'assistant',
              content: line,
              topic: null
            });
          });
        }
      }

      if (conversationData.length === 0) {
        throw new Error('No conversation data could be extracted from the ChatGPT share link');
      }

      // Format as expected JSON structure
      const formattedData = {
        messages: conversationData.map((msg, index) => ({
          timestamp: msg.timestamp || new Date().toISOString(),
          role: msg.role || (index % 2 === 0 ? 'user' : 'assistant'),
          content: msg.content || '',
          topic: msg.topic || null,
          containerType: null,
          developmentStage: null
        }))
      };

      return {
        content: JSON.stringify(formattedData, null, 2),
        title
      };

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to process ChatGPT share link: ${error.message}`);
      }
      throw new Error('Failed to process ChatGPT share link: Unknown error');
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }
}