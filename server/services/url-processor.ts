import axios from 'axios';
import * as cheerio from 'cheerio';
import { IStorage } from "../storage";
import { UploadedFile } from "@shared/schema";

export class UrlProcessor {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async processUrl(url: string): Promise<UploadedFile> {
    try {
      console.log(`Processing URL: ${url}`);

      // Validate URL
      if (!this.isValidUrl(url)) {
        throw new Error('Invalid URL format');
      }

      // Extract content from the URL
      const content = await this.extractContentFromUrl(url);
      
      if (!content || content.trim().length === 0) {
        throw new Error('No content could be extracted from the URL');
      }

      // Create file record in database
      const filename = this.generateFilenameFromUrl(url);
      const file = await this.storage.createFile({
        filename,
        originalName: filename,
        content,
        size: content.length,
        contentType: 'text/plain',
        sourceType: 'chatgpt_share',
        sourceUrl: url,
        processed: false,
      });

      console.log(`URL processed successfully. File ID: ${file.id}`);
      return file;
    } catch (error) {
      console.error(`Error processing URL ${url}:`, error);
      throw error;
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  private async extractContentFromUrl(url: string): Promise<string> {
    try {
      // Set user agent to mimic a real browser
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 30000, // 30 second timeout
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Check if this is a ChatGPT share link
      if (url.includes('chatgpt.com/share/')) {
        return this.extractChatGPTContent($);
      }

      // Generic content extraction
      return this.extractGenericContent($);
    } catch (error) {
      console.error('Error fetching URL content:', error);
      throw new Error(`Failed to fetch content from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractChatGPTContent($: cheerio.CheerioAPI): string {
    const messages: string[] = [];

    try {
      // Try different selectors for ChatGPT content
      const possibleSelectors = [
        '[data-message-author-role]',
        '.min-h-[20px]',
        '[data-testid^="conversation-turn-"]',
        '.group',
        '.flex.flex-col',
      ];

      for (const selector of possibleSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((_, element) => {
            const $element = $(element);
            const text = $element.text().trim();
            
            if (text && text.length > 10) { // Ignore very short text
              // Try to determine role from element attributes or content
              const role = this.determineChatGPTRole($element, text);
              messages.push(`${role}: ${text}`);
            }
          });
          
          if (messages.length > 0) {
            break; // Found content with this selector
          }
        }
      }

      // If no structured messages found, try to get all text content
      if (messages.length === 0) {
        const bodyText = $('body').text().trim();
        if (bodyText) {
          messages.push(`user: ${bodyText}`);
        }
      }

      return messages.join('\n\n');
    } catch (error) {
      console.error('Error parsing ChatGPT content:', error);
      throw new Error('Failed to parse ChatGPT conversation content');
    }
  }

  private determineChatGPTRole($element: cheerio.Cheerio<any>, text: string): string {
    // Check for role attributes
    const roleAttr = $element.attr('data-message-author-role');
    if (roleAttr) {
      return roleAttr === 'assistant' ? 'assistant' : 'user';
    }

    // Check for common ChatGPT patterns
    if (text.toLowerCase().includes('chatgpt') || 
        text.toLowerCase().includes('as an ai') ||
        text.toLowerCase().includes('i\'m here to help')) {
      return 'assistant';
    }

    // Check element classes or structure for hints
    const className = $element.attr('class') || '';
    if (className.includes('assistant') || className.includes('ai')) {
      return 'assistant';
    }

    // Default to user for questions or commands
    if (text.includes('?') || text.toLowerCase().startsWith('can you') || 
        text.toLowerCase().startsWith('please') || text.toLowerCase().startsWith('how')) {
      return 'user';
    }

    return 'user'; // Default fallback
  }

  private extractGenericContent($: cheerio.CheerioAPI): string {
    // Remove script and style elements
    $('script, style, nav, header, footer').remove();

    // Try to extract main content
    const contentSelectors = [
      'main',
      '[role="main"]',
      '.content',
      '.main-content',
      'article',
      '.post',
      '.conversation',
      'body'
    ];

    for (const selector of contentSelectors) {
      const content = $(selector).first().text().trim();
      if (content && content.length > 100) {
        return content;
      }
    }

    // Fallback to body text
    const bodyText = $('body').text().trim();
    return bodyText || 'No content could be extracted from this page.';
  }

  private generateFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const timestamp = Date.now();
      
      if (url.includes('chatgpt.com/share/')) {
        const shareId = url.split('/').pop()?.substring(0, 8) || 'share';
        return `${timestamp}-chatgpt-${shareId}.txt`;
      }
      
      const domain = urlObj.hostname.replace('www.', '');
      return `${timestamp}-${domain}.txt`;
    } catch {
      return `${Date.now()}-url-content.txt`;
    }
  }
}