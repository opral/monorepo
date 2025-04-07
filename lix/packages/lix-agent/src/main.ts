#!/usr/bin/env node
import { Command } from 'commander';
import { startRepl } from './repl.js';
import chalk from 'chalk';

// Create the command-line program
const program = new Command();

program
  .name('lix-agent')
  .description('Interactive CLI agent for Lix change control system')
  .version('0.1.0');

program
  .option('-m, --model <model>', 'Specify which LLM model to use (openai:gpt-4, anthropic:claude, etc.)', 'openai:gpt-4')
  .option('-j, --json', 'Output in JSON format instead of human-readable text')
  .option('-q, --query <text>', 'Run a one-shot query instead of starting interactive REPL')
  .option('-f, --file <path>', 'Open a specific .lix file at startup')
  .option('-d, --debug', 'Enable debug mode with verbose logging')
  .option('-y, --yes', 'Auto-confirm all prompts (use with caution)')
  .action(async (options) => {
    try {
      if (options.query) {
        // TODO: Handle one-shot query mode
        console.log(chalk.yellow('One-shot query mode not yet implemented'));
        process.exit(1);
      } else {
        // Start the interactive REPL
        await startRepl({
          modelSpec: options.model,
          jsonOutput: options.json,
          initialFile: options.file,
          debug: options.debug,
          autoConfirm: options.yes
        });
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      if (options.debug && error instanceof Error) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

program.parse();