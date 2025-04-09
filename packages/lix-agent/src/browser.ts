/**
 * Browser-compatible version of the Lix Agent
 * Provides an API for using the agent in browser environments
 */

import { Lix } from '@lix-js/sdk';
import { Agent } from './agent/agent.js';
import { OutputFormatter } from './output.js';
import { LLMAdapter, createLLMAdapter } from './agent/llm.js';

// Browser-compatible output formatter
class BrowserOutputFormatter extends OutputFormatter {
  private callback: (message: string, type: string) => void;
  
  constructor(callback: (message: string, type: string) => void) {
    super('human'); // Default to 'human' mode
    this.callback = callback;
  }
  
  formatMessage(message: string, type: 'task' | 'answer' = 'answer'): void {
    // Instead of console.log, use the callback
    this.callback(message, type);
  }
  
  formatError(error: string): void {
    // Send errors to the callback as well
    this.callback(error, 'error');
  }
  
  // Override any console-specific methods
  startLoading(): { stop: () => void } {
    // In browser, return a no-op
    return { stop: () => {} };
  }
}

export interface LixAgentOptions {
  lix: Lix;
  apiKey: string;
  provider?: 'openai' | 'anthropic';
  model?: string;
  onMessage?: (message: string, type: string) => void;
  debug?: boolean;
}

/**
 * Create a browser-compatible Lix Agent
 */
export function createLixAgent(options: LixAgentOptions) {
  // Default callback if not provided
  const onMessage = options.onMessage || ((message: string) => {
    console.log(message);
  });
  
  // Create output formatter that uses the callback
  const outputFormatter = new BrowserOutputFormatter(onMessage);
  
  // Determine model spec
  const provider = options.provider || 'openai';
  const model = options.model || (provider === 'openai' ? 'gpt-4' : 'claude-3-haiku-20240307');
  const modelSpec = `${provider}:${model}`;
  
  // Create the appropriate LLM adapter
  const llmAdapter = createLLMAdapter(modelSpec);
  
  // Set API key
  if (provider === 'openai') {
    (llmAdapter as any).client.apiKey = options.apiKey;
  } else if (provider === 'anthropic') {
    (llmAdapter as any).client.apiKey = options.apiKey;
  }
  
  // Create the agent
  const agent = new Agent({
    llmAdapter,
    outputFormatter,
    debug: options.debug
  });
  
  // Import the SessionState and LixManager types without importing their implementation
  // We're defining this interface here to match the expected structure without a direct import
  interface LixManagerInterface {
    isOpen(): boolean;
    getLixObject(): Lix | null;
    getCurrentFilePath(): string | null;
    getPluginsInfo(): Promise<{
      available: Array<{
        key: string;
        supports: string;
        active?: boolean;
      }>;
      count: number;
    }>;
    getPluginsForExtension(extension: string): Promise<any[]>;
    on(event: string, listener: (...args: any[]) => void): any;
    close(): Promise<void>;
    createNew(): Promise<void>;
    openFile(path: string): Promise<void>;
    saveFile(path?: string): Promise<void>;
  }
  
  // Create a mock LixManager that implements the required interface
  // Implements the same interface as the Node.js LixManager
  class BrowserLixManager implements LixManagerInterface {
    private lixObj: Lix;
    private eventListeners: Map<string, Array<(...args: any[]) => void>> = new Map();
    
    constructor(lix: Lix) {
      this.lixObj = lix;
    }
    
    /**
     * Check if a Lix file is open
     */
    isOpen(): boolean {
      return this.lixObj !== null;
    }
    
    /**
     * Get direct access to the Lix object
     */
    getLixObject(): Lix | null {
      return this.lixObj;
    }
    
    /**
     * Get the current file path (in browser, returns placeholder)
     */
    getCurrentFilePath(): string | null {
      return 'browser-session';
    }
    
    /**
     * Get information about loaded plugins
     */
    async getPluginsInfo(): Promise<{
      available: Array<{
        key: string;
        supports: string;
        active?: boolean;
      }>;
      count: number;
    }> {
      // In browser, return minimal plugin info
      // This could be enhanced to get actual plugin info from the Lix object
      return {
        available: [
          {
            key: 'json',
            supports: '*.json',
            active: true
          },
          {
            key: 'csv',
            supports: '*.csv',
            active: true
          }
        ],
        count: 2
      };
    }
    
    /**
     * Get plugins for a file extension
     */
    async getPluginsForExtension(extension: string): Promise<any[]> {
      // Simulate plugin discovery based on extension
      if (extension === '.json' || extension === 'json') {
        return [{ key: 'json', supports: '*.json' }];
      } else if (extension === '.csv' || extension === 'csv') {
        return [{ key: 'csv', supports: '*.csv' }];
      }
      return [];
    }
    
    /**
     * Implements EventEmitter-like interface for compatibility
     */
    on(event: string, listener: (...args: any[]) => void): this {
      // Store event listeners
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, []);
      }
      this.eventListeners.get(event)?.push(listener);
      return this;
    }
    
    /**
     * Emit an event to registered listeners
     */
    private emit(event: string, ...args: any[]): void {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        for (const listener of listeners) {
          try {
            listener(...args);
          } catch (error) {
            console.error(`Error in ${event} listener:`, error);
          }
        }
      }
    }
    
    /**
     * Close the Lix file (no-op in browser)
     */
    async close(): Promise<void> {
      this.emit('fileClosed');
    }
    
    /**
     * Create a new Lix file (no-op in browser)
     */
    async createNew(): Promise<void> {
      // No-op in browser
    }
    
    /**
     * Open a Lix file (no-op in browser)
     */
    async openFile(path: string): Promise<void> {
      this.emit('fileOpened', path);
    }
    
    /**
     * Save a Lix file (no-op in browser)
     */
    async saveFile(path?: string): Promise<void> {
      if (path) {
        this.emit('fileSaved', path);
      }
    }
  }
  
  // Interface for the session state to match the expected structure
  interface SessionStateInterface {
    activeLixManager: LixManagerInterface | null;
    outputMode: 'human' | 'json';
    agent: Agent;
    debug: boolean;
    autoConfirm: boolean;
  }
  
  // Create a simple session state
  const sessionState: SessionStateInterface = {
    activeLixManager: new BrowserLixManager(options.lix),
    outputMode: 'human' as const,
    agent,
    debug: options.debug || false,
    autoConfirm: true
  };
  
  // Return a simplified API
  return {
    /**
     * Send a prompt to the agent
     */
    prompt: async (input: string): Promise<void> => {
      // Use type assertion to bypass TypeScript's type checking
      // This is safe because we've made sure our interface matches what the agent expects
      return agent.processInput(input, sessionState as any);
    },
    
    /**
     * Get the agent instance directly
     */
    agent
  };
}