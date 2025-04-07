import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Specific message types for Anthropic API
type AnthropicUserMessage = {
  role: "user";
  content: string;
};

type AnthropicAssistantMessage = {
  role: "assistant";
  content: string;
};

type AnthropicMessage = AnthropicUserMessage | AnthropicAssistantMessage;

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  message: string;
  raw?: any;
}

export interface LLMAdapter {
  name: string;
  maxContextTokens: number;
  generate(messages: ChatMessage[], options?: LLMOptions): Promise<LLMResponse>;
}

/**
 * OpenAI API adapter
 */
export class OpenAIAdapter implements LLMAdapter {
  private client: OpenAI;
  private modelName: string;
  
  constructor(modelName: string = 'gpt-4') {
    this.modelName = modelName;
    
    // Get API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required for OpenAI adapter');
    }
    
    this.client = new OpenAI({ apiKey });
  }
  
  get name(): string {
    return `openai:${this.modelName}`;
  }
  
  get maxContextTokens(): number {
    // Model-specific context window sizes
    const contextSizes: Record<string, number> = {
      'gpt-3.5-turbo': 4096,
      'gpt-3.5-turbo-16k': 16384,
      'gpt-4': 8192,
      'gpt-4-32k': 32768,
      'gpt-4-turbo': 128000,
    };
    
    return contextSizes[this.modelName] || 4096;
  }
  
  async generate(messages: ChatMessage[], options?: LLMOptions): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
      });
      
      const content = response.choices[0]?.message?.content || '';
      
      return {
        message: content,
        raw: response
      };
    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Anthropic API adapter
 */
export class AnthropicAdapter implements LLMAdapter {
  private client: Anthropic;
  private modelName: string;
  
  constructor(modelName: string = 'claude-3-haiku-20240307') {
    this.modelName = modelName;
    
    // Get API key from environment
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required for Anthropic adapter');
    }
    
    this.client = new Anthropic({ apiKey });
  }
  
  get name(): string {
    return `anthropic:${this.modelName}`;
  }
  
  get maxContextTokens(): number {
    // Model-specific context window sizes
    const contextSizes: Record<string, number> = {
      'claude-1': 100000,
      'claude-2': 100000,
      'claude-instant-1': 100000,
      'claude-3-opus-20240229': 200000,
      'claude-3-sonnet-20240229': 200000,
      'claude-3-haiku-20240307': 200000,
    };
    
    return contextSizes[this.modelName] || 100000;
  }
  
  async generate(messages: ChatMessage[], options?: LLMOptions): Promise<LLMResponse> {
    try {
      // For Anthropic API v0.39.0, we need to format messages differently
      // Extract the system message if present
      const systemPrompt = messages.find(msg => msg.role === 'system')?.content || '';
      
      // Format user/assistant messages into a prompt string
      let prompt = '';
      
      // If there's a system prompt, include it at the beginning
      if (systemPrompt) {
        prompt = `\n\nHuman: ${systemPrompt}\n\n`;
      }
      
      for (const msg of messages.filter(m => m.role !== 'system')) {
        if (msg.role === 'user') {
          prompt += `\n\nHuman: ${msg.content}`;
        } else if (msg.role === 'assistant') {
          prompt += `\n\nAssistant: ${msg.content}`;
        }
      }
      
      // Add the final Assistant: prefix to prompt the model to respond
      prompt += '\n\nAssistant: ';
      
      // Use the completions API for older SDK versions
      // Need to cast because the SDK type definitions may not match the actual API
      const params: any = {
        model: this.modelName,
        prompt: prompt,
      };
      
      if (options?.temperature !== undefined) {
        params.temperature = options.temperature;
      }
      
      if (options?.maxTokens !== undefined) {
        params.max_tokens = options.maxTokens;
      } else {
        params.max_tokens = 1000;
      }
      
      const response = await this.client.completions.create(params);
      
      return {
        message: response.completion,
        raw: response
      };
    } catch (error) {
      throw new Error(`Anthropic API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Local model adapter (placeholder for future implementation)
 */
export class LocalModelAdapter implements LLMAdapter {
  private modelPath: string;
  
  constructor(modelPath: string) {
    this.modelPath = modelPath;
  }
  
  get name(): string {
    return `local:${this.modelPath}`;
  }
  
  get maxContextTokens(): number {
    // This would depend on the specific local model
    return 4096;
  }
  
  async generate(messages: ChatMessage[], options?: LLMOptions): Promise<LLMResponse> {
    // This is a placeholder - a real implementation would either:
    // 1. Call a local API server running the model
    // 2. Use a JS library that can run models like transformers.js
    // 3. Spawn a process to run a local model script
    throw new Error('Local model support not yet implemented');
  }
}

/**
 * Factory function to create the appropriate LLM adapter based on the model spec
 */
export function createLLMAdapter(modelSpec: string): LLMAdapter {
  const [provider, model] = modelSpec.split(':');
  
  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIAdapter(model || 'gpt-4');
    
    case 'anthropic':
      return new AnthropicAdapter(model || 'claude-2');
    
    case 'local':
      return new LocalModelAdapter(model || 'default');
    
    default:
      throw new Error(`Unknown model provider: ${provider}`);
  }
}