import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface AIResponse {
  content: string;
  model: string;
  provider: 'openai' | 'anthropic';
}

export class AIService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;

  constructor() {
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Initialize Anthropic if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  async callOpenAI(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      model: 'gpt-4',
      provider: 'openai',
    };
  }

  async callAnthropic(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt || 'You are a helpful AI assistant specializing in document analysis.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    return {
      content: content.text,
      model: 'claude-3-5-sonnet-20241022',
      provider: 'anthropic',
    };
  }

  async smartCall(prompt: string, systemPrompt?: string, preferredProvider?: 'openai' | 'anthropic'): Promise<AIResponse> {
    // Try preferred provider first, fallback to the other
    if (preferredProvider === 'openai' && this.openai) {
      try {
        return await this.callOpenAI(prompt, systemPrompt);
      } catch (error) {
        console.warn('OpenAI call failed, falling back to Anthropic:', error);
        if (this.anthropic) {
          return await this.callAnthropic(prompt, systemPrompt);
        }
        throw error;
      }
    }

    if (preferredProvider === 'anthropic' && this.anthropic) {
      try {
        return await this.callAnthropic(prompt, systemPrompt);
      } catch (error) {
        console.warn('Anthropic call failed, falling back to OpenAI:', error);
        if (this.openai) {
          return await this.callOpenAI(prompt, systemPrompt);
        }
        throw error;
      }
    }

    // Default behavior: try available providers
    if (this.openai) {
      try {
        return await this.callOpenAI(prompt, systemPrompt);
      } catch (error) {
        console.warn('OpenAI call failed, trying Anthropic:', error);
        if (this.anthropic) {
          return await this.callAnthropic(prompt, systemPrompt);
        }
        throw error;
      }
    }

    if (this.anthropic) {
      return await this.callAnthropic(prompt, systemPrompt);
    }

    throw new Error('No AI providers configured');
  }

  getAvailableProviders(): string[] {
    const providers = [];
    if (this.openai) providers.push('openai');
    if (this.anthropic) providers.push('anthropic');
    return providers;
  }
}

export const aiService = new AIService();