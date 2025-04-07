import readline from 'readline';
import chalk from 'chalk';
import { commandHandlers } from './commands/index.js';
import { createLLMAdapter } from './agent/llm.js';
import { Agent } from './agent/agent.js';
import { LixManager } from './lix/lixManager.js';
import { OutputFormatter } from './output.js';

export interface ReplOptions {
  modelSpec: string;
  jsonOutput: boolean;
  initialFile?: string;
  debug: boolean;
  autoConfirm: boolean;
}

export interface SessionState {
  activeLixManager: LixManager | null;
  outputMode: 'human' | 'json';
  agent: Agent;
  debug: boolean;
  autoConfirm: boolean;
}

export async function startRepl(options: ReplOptions): Promise<void> {
  // Initialize components
  const outputFormatter = new OutputFormatter(options.jsonOutput ? 'json' : 'human');
  const llmAdapter = createLLMAdapter(options.modelSpec);
  const lixManager = new LixManager();
  
  // Set up backup
  lixManager.enableAutoBackup();
  
  // Handle LixManager events
  lixManager.on('error', (error) => {
    if (options.debug) {
      console.error(chalk.red('LixManager error:'), error.message);
    }
  });
  
  // Create the agent
  const agent = new Agent({
    llmAdapter,
    outputFormatter,
    debug: options.debug
  });
  
  // Initialize session state
  const state: SessionState = {
    activeLixManager: null,
    outputMode: options.jsonOutput ? 'json' : 'human',
    agent,
    debug: options.debug,
    autoConfirm: options.autoConfirm
  };
  
  // Welcome message
  if (state.outputMode === 'human') {
    console.log(chalk.cyan('Welcome to the Lix Agent CLI'));
    console.log(chalk.gray('Type /help for available commands or enter questions/instructions in natural language'));
  }
  
  // If an initial file was specified, try to open it
  if (options.initialFile) {
    try {
      await commandHandlers.open(state, [options.initialFile]);
    } catch (error) {
      if (state.outputMode === 'human') {
        console.error(chalk.red(`Failed to open initial file: ${options.initialFile}`));
        if (state.debug) {
          console.error(chalk.gray(error instanceof Error ? error.stack : String(error)));
        }
      } else {
        console.error(JSON.stringify({ error: `Failed to open file: ${options.initialFile}` }));
      }
    }
  }
  
  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green('lix> '),
    terminal: true
  });
  
  // Main REPL loop
  rl.on('line', async (input) => {
    // Ignore empty input
    if (!input.trim()) {
      rl.prompt();
      return;
    }
    
    try {
      // Update prompt based on current state
      const promptText = state.activeLixManager 
        ? `lix[${state.activeLixManager.getCurrentFilePath() || 'in-memory'}]> `
        : 'lix> ';
      
      rl.setPrompt(chalk.green(promptText));
      
      // Check if input is a command (starts with / or :)
      if (input.startsWith('/') || input.startsWith(':')) {
        const [command, ...args] = input.slice(1).trim().split(/\s+/);
        
        if (command === 'exit' || command === 'quit') {
          rl.close();
          return;
        }
        
        // Look up and execute the command handler
        const handler = commandHandlers[command as keyof typeof commandHandlers];
        if (handler) {
          await handler(state, args);
        } else {
          if (state.outputMode === 'human') {
            console.log(chalk.yellow(`Unknown command: ${command}. Type /help for available commands.`));
          } else {
            console.log(JSON.stringify({ error: `Unknown command: ${command}` }));
          }
        }
      } else {
        // Handle natural language query or instruction
        await agent.processInput(input, state);
      }
    } catch (error) {
      if (state.outputMode === 'human') {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
        if (state.debug) {
          console.error(chalk.gray(error instanceof Error ? error.stack : String(error)));
        }
      } else {
        console.error(JSON.stringify({ 
          error: error instanceof Error ? error.message : String(error),
          stack: state.debug && error instanceof Error ? error.stack : undefined
        }));
      }
    }
    
    // Set prompt back based on updated state
    const updatedPromptText = state.activeLixManager 
      ? `lix[${state.activeLixManager.getCurrentFilePath() || 'in-memory'}]> `
      : 'lix> ';
    
    rl.setPrompt(chalk.green(updatedPromptText));
    rl.prompt();
  });
  
  // Handle REPL closing
  rl.on('close', () => {
    // Shutdown gracefully
    if (state.outputMode === 'human') {
      console.log(chalk.cyan('\nGoodbye!'));
    }
    process.exit(0);
  });
  
  // Start the prompt
  rl.prompt();
}