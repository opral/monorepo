import chalk from 'chalk';
import * as diff from 'diff';
import fs from 'fs/promises';
import path from 'path';

export type OutputMode = 'human' | 'json';

export interface DiffResult {
  original: string;
  modified: string;
  diff: diff.Change[];
}

export class OutputFormatter {
  private mode: OutputMode;
  private streamingEnabled: boolean = false;
  
  constructor(mode: OutputMode = 'human') {
    this.mode = mode;
  }
  
  setMode(mode: OutputMode): void {
    this.mode = mode;
  }
  
  getMode(): OutputMode {
    return this.mode;
  }
  
  /**
   * Enable/disable streaming output (for future implementation)
   */
  setStreamingEnabled(enabled: boolean): void {
    this.streamingEnabled = enabled;
  }
  
  /**
   * Format a response message from the agent
   * With improved formatting, hierarchy and color
   */
  formatMessage(message: string, type: 'task' | 'answer' = 'answer'): void {
    if (this.mode === 'human') {
      if (type === 'task') {
        // Format task results with subtle blue and structure
        console.log(chalk.blue('Task Result:'));
        
        // Split response into sections if it has specific patterns
        if (message.includes('success') || message.includes('Success')) {
          console.log(chalk.green('✓ ') + chalk.bold('Success'));
          
          // Extract and format details
          const details = message.replace(/success:?\s*true/i, '').trim();
          if (details) {
            console.log(chalk.blue('Details:'));
            
            // Format as list if it appears to have list items
            if (details.includes('\n-') || details.includes('\n•')) {
              console.log(details);
            } else {
              // Display as clean indented output
              console.log('  ' + details.split('\n').join('\n  '));
            }
          }
        } else {
          // Format nicely with indentation for other task outputs
          console.log(chalk.cyan('▶ ') + message.split('\n').join('\n  '));
        }
      } else {
        // Information/answer type response
        const lines = message.split('\n');
        
        // Check if the message has a clear structure
        if (lines.some(line => line.startsWith('#') || line.startsWith('-') || 
            /^\d+\./.test(line) || line.includes(':') && !line.includes(' http'))) {
          // Already structured, preserve formatting but add subtle highlights
          let inCodeBlock = false;
          lines.forEach(line => {
            // Handle code blocks
            if (line.startsWith('```')) {
              inCodeBlock = !inCodeBlock;
              console.log(chalk.gray(line));
              return;
            }
            
            if (inCodeBlock) {
              console.log(chalk.gray(line));
              return;
            }
            
            // Headers
            if (line.startsWith('# ')) {
              console.log(chalk.cyan.bold(line));
            } 
            // Subheaders
            else if (line.startsWith('## ')) {
              console.log(chalk.cyan(line));
            }
            // List items
            else if (line.startsWith('- ') || /^\d+\./.test(line)) {
              console.log(chalk.yellow('•') + ' ' + line.substring(line.indexOf(' ') + 1));
            }
            // Key-value pairs
            else if (line.includes(':') && !line.includes(' http')) {
              const [key, ...valueParts] = line.split(':');
              const value = valueParts.join(':');
              console.log(chalk.blue(key + ':') + value);
            }
            // Regular lines
            else {
              console.log(line);
            }
          });
        } else {
          // Simple text response
          console.log(message);
        }
      }
    } else {
      console.log(JSON.stringify({ 
        message,
        type 
      }));
    }
  }
  
  /**
   * Show a loading animation with elapsed time counter
   */
  startLoading(message: string = 'Thinking'): { stop: () => void } {
    if (this.mode !== 'human') {
      return { stop: () => {} };
    }

    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    const startTime = Date.now();
    let timeElapsed = 0;

    process.stdout.write('\r');
    
    const timer = setInterval(() => {
      timeElapsed = Math.floor((Date.now() - startTime) / 1000);
      const frame = frames[i = ++i % frames.length];
      
      // Clear the line and write the new frame
      process.stdout.write(`\r${chalk.cyan(frame)} ${message}... ${chalk.gray(`${timeElapsed}s`)}     `);
    }, 80);

    return {
      stop: () => {
        clearInterval(timer);
        // Clear the line when done
        process.stdout.write('\r' + ' '.repeat(50) + '\r');
      }
    };
  }

  /**
   * Format a streaming message chunk (for future implementation)
   */
  formatStreamingChunk(chunk: string): void {
    if (!this.streamingEnabled) return;
    
    if (this.mode === 'human') {
      process.stdout.write(chunk);
    } else {
      // For JSON mode, we'd need to handle this differently
      // probably buffer chunks and output complete JSON at the end
      process.stdout.write(chunk);
    }
  }
  
  /**
   * Format an error message
   */
  formatError(error: string, details?: any): void {
    if (this.mode === 'human') {
      console.error(chalk.red('Error:'), error);
      if (details) {
        console.error(chalk.gray(JSON.stringify(details, null, 2)));
      }
    } else {
      console.error(JSON.stringify({ error, details }));
    }
  }
  
  /**
   * Format a diff between two text contents
   */
  formatDiff(original: string, modified: string): void {
    const changes = diff.diffLines(original, modified);
    
    if (this.mode === 'human') {
      console.log(chalk.cyan('--- Original'));
      console.log(chalk.cyan('+++ Modified'));
      console.log();
      
      for (const part of changes) {
        // Green for additions, red for deletions, gray for context
        const color = part.added ? chalk.green : part.removed ? chalk.red : chalk.gray;
        const prefix = part.added ? '+' : part.removed ? '-' : ' ';
        
        // Add the prefix to each line in this part
        const lines = part.value.split('\n').filter(line => line.length > 0);
        for (const line of lines) {
          console.log(color(`${prefix} ${line}`));
        }
      }
    } else {
      // In JSON mode, output the raw diff
      console.log(JSON.stringify({
        diff: changes,
        original,
        modified
      }));
    }
  }
  
  /**
   * Format query results (typically from an SQL query)
   */
  formatQueryResults(results: any): void {
    if (this.mode === 'human') {
      if (Array.isArray(results)) {
        if (results.length === 0) {
          console.log(chalk.yellow('No results found.'));
          return;
        }
        
        // For arrays, print as a table if not too many columns
        const keys = Object.keys(results[0]);
        if (keys.length <= 5) {
          // Determine column widths for better alignment
          const columnWidths = keys.map(key => {
            const headerLength = key.length;
            const maxDataLength = Math.max(
              ...results.map(row => String(row[key] || '').length)
            );
            return Math.max(headerLength, maxDataLength, 5) + 2; // Min 5 chars + 2 padding
          });
          
          // Print table header
          console.log(
            keys.map((key, index) => 
              chalk.cyan(key.padEnd(columnWidths[index]))
            ).join('')
          );
          
          // Print header separator
          console.log(
            keys.map((_, index) => 
              chalk.cyan('='.repeat(columnWidths[index]))
            ).join('')
          );
          
          // Print rows
          for (const row of results) {
            console.log(
              keys.map((key, index) => 
                String(row[key] || '').padEnd(columnWidths[index])
              ).join('')
            );
          }
        } else {
          // For more complex results, print one by one
          for (const [i, row] of results.entries()) {
            console.log(chalk.cyan(`--- Result ${i + 1} ---`));
            for (const [key, value] of Object.entries(row)) {
              console.log(`${key}: ${value}`);
            }
            console.log();
          }
        }
      } else if (typeof results === 'object' && results !== null) {
        // For a single object, print key-value pairs
        for (const [key, value] of Object.entries(results)) {
          console.log(`${chalk.cyan(key)}: ${value}`);
        }
      } else {
        // For simple values, just print them
        console.log(results);
      }
    } else {
      console.log(JSON.stringify(results));
    }
  }
  
  /**
   * Save content to a file
   */
  async saveToFile(content: string, filePath: string): Promise<void> {
    try {
      // Ensure the directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      // Write the content to the file
      await fs.writeFile(filePath, content, 'utf8');
      
      if (this.mode === 'human') {
        console.log(chalk.green(`Content saved to ${filePath}`));
      } else {
        console.log(JSON.stringify({ saved: filePath }));
      }
    } catch (error) {
      if (this.mode === 'human') {
        console.error(chalk.red(`Failed to save to file: ${filePath}`));
        console.error(chalk.gray(error instanceof Error ? error.message : String(error)));
      } else {
        console.error(JSON.stringify({ 
          error: 'Failed to save to file',
          path: filePath,
          message: error instanceof Error ? error.message : String(error)
        }));
      }
    }
  }
  
  /**
   * Save diff to a patch file
   */
  async saveDiffToPatchFile(original: string, modified: string, filePath: string): Promise<void> {
    try {
      // Generate unified diff
      const diffText = diff.createPatch(
        path.basename(filePath),
        original,
        modified,
        'Original',
        'Modified'
      );
      
      // Ensure the directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      // Write the diff to the file
      await fs.writeFile(filePath, diffText, 'utf8');
      
      if (this.mode === 'human') {
        console.log(chalk.green(`Diff saved to ${filePath}`));
      } else {
        console.log(JSON.stringify({ saved: filePath, type: 'diff' }));
      }
    } catch (error) {
      if (this.mode === 'human') {
        console.error(chalk.red(`Failed to save diff to file: ${filePath}`));
        console.error(chalk.gray(error instanceof Error ? error.message : String(error)));
      } else {
        console.error(JSON.stringify({ 
          error: 'Failed to save diff to file',
          path: filePath,
          message: error instanceof Error ? error.message : String(error)
        }));
      }
    }
  }
}