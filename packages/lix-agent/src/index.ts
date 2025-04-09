/**
 * Lix Agent - Main entry point
 * Exports both browser and Node.js APIs
 */

import { isNode } from './environment.js';
import { createLixAgent, LixAgentOptions } from './browser.js';

// Re-export the browser API
export { createLixAgent, LixAgentOptions };

// We'll use a different approach for Node.js-only exports
let startCli: any = null;

// Dynamically load Node.js-only modules
if (isNode()) {
  try {
    import('./main.js').then(module => {
      startCli = module.startCli;
    }).catch(err => {
      console.warn('Failed to load CLI functionality:', err);
    });
  } catch (err) {
    console.warn('Failed to load CLI functionality:', err);
  }
}

// Expose a getter for startCli that will be populated asynchronously
export { startCli };

// Export base types for both environments
export { Agent, AgentOptions } from './agent/agent.js';
export { OutputFormatter } from './output.js';
export { LLMAdapter, ChatMessage, LLMOptions, LLMResponse } from './agent/llm.js';