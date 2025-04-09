#!/usr/bin/env node
import { Command } from 'commander';
import { startRepl } from './repl.js';
import chalk from 'chalk';

/**
 * Start the CLI with the given options
 * This is exported for programmatic usage
 */
export async function startCli(options: {
  model?: string;
  json?: boolean;
  file?: string;
  debug?: boolean;
  yes?: boolean;
} = {}) {
  try {
    // Start the interactive REPL
    await startRepl({
      modelSpec: options.model || 'openai:gpt-4',
      jsonOutput: options.json || false,
      initialFile: options.file,
      debug: options.debug || false,
      autoConfirm: options.yes || false
    });
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
    if (options.debug && error instanceof Error) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

// Only run command-line processing if this is executed directly
// Check for running as main module
if (typeof process !== 'undefined' && 
    process.argv && 
    process.argv.length > 1 && 
    process.argv[1].includes('lix-agent')) {
  // Create the command-line program
  const program = new Command();

  program
    .name('lix-agent')
    .description('Interactive CLI agent for Lix change control system')
    .version('0.1.0');

  program
    .option('-m, --model <model>', 'Specify which LLM model to use (openai:gpt-4, anthropic:claude, etc.)', 'openai:gpt-4')
    .option('-j, --json', 'Output in JSON format instead of human-readable text')
    .option('-f, --file <path>', 'Open a specific .lix file at startup')
    .option('-d, --debug', 'Enable debug mode with verbose logging')
    .option('-y, --yes', 'Auto-confirm all prompts (use with caution)')
    .action(async (options) => {
      await startCli(options);
    });

  program.parse();
}

// Export default for compatibility
export default startCli;