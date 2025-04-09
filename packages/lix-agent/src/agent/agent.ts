import { ConversationContext } from './context.js';
import { LLMAdapter, ChatMessage } from './llm.js';
import { SQLOrchestrator } from './sql_orchestrator.js';
import { OutputFormatter } from '../output.js';
import { SessionState } from '../repl.js';
import readline from 'readline-sync';
import chalk from 'chalk';
import { validateContent } from '../validate.js';
import * as diff from 'diff';
import { Lix } from '@lix-js/sdk';
import { sql } from 'kysely';

export interface AgentOptions {
  llmAdapter: LLMAdapter;
  outputFormatter: OutputFormatter;
  debug?: boolean;
}

/**
 * JavaScript Code Executor for safely running LIX API code
 */
class JSCodeExecutor {
  private llmAdapter: LLMAdapter;
  
  constructor(llmAdapter: LLMAdapter) {
    this.llmAdapter = llmAdapter;
  }
  
  /**
   * Generate and execute JavaScript code based on a natural language request
   */
  async generateAndExecuteCode(
    request: string,
    lixObj: Lix,
    previousError?: string
  ): Promise<{ success: boolean; result?: any; error?: string; code?: string }> {
    try {
      // Generate the code
      const code = await this.generateCode(request, previousError);
      
      // Execute the code with the LIX object
      const result = await this.executeCode(code, lixObj);
      
      return {
        success: true,
        result,
        code
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        code: ''
      };
    }
  }
  
  /**
   * Generate JavaScript code using the LLM
   */
  private async generateCode(request: string, previousError?: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an AI assistant that generates JavaScript code to interact with a Lix object.
        
The Lix object (from @lix-js/sdk) has the following key properties:
- db: A Kysely database instance for SQL operations
- metadata: Information about the Lix file

DYNAMIC DATABASE EXPLORATION:
Instead of relying on hardcoded database schema, dynamically explore the database structure:

1. For database schema exploration:
\`\`\`javascript
// Dynamically discover available tables
const tables = await lix.db
  .introspection
  .getTables()
  .execute();

// For a specific table, explore its columns
const columns = await lix.db
  .introspection
  .getColumns('table_name')
  .execute();
\`\`\`

2. For file format discovery:
\`\`\`javascript
// Get the file extension to determine format
const extension = filePath.split('.').pop().toLowerCase();

// Dynamically import the appropriate plugin
let plugin;
try {
  if (extension === 'json') {
    plugin = (await import('@lix-js/plugin-json')).plugin;
  } else if (extension === 'csv') {
    plugin = (await import('@lix-js/plugin-csv')).plugin;
  } else {
    // Handle other formats or try to find a plugin dynamically
    plugin = await findPluginForExtension(extension);
  }
} catch (error) {
  console.warn('Plugin import failed:', error);
}
\`\`\`

IMPORTANT - FILE HANDLING PRINCIPLES:
1. All file operations must use the plugin system
2. Never implement file format-specific logic directly
3. Each plugin has a standard interface with detectChanges and applyChanges methods
4. Create proper before/after states for all modifications

For working with files, follow this pattern:

\`\`\`javascript
async function workWithFile() {
  try {
    // 1. Get the file (or determine the file path from the request)
    const filePath = '/path/to/file.ext'; // Normalize path to start with '/'
    const fileResult = await lix.db
      .selectFrom('file')
      .select(['id', 'path', 'data'])
      .where('path', '=', filePath)
      .execute();
    
    if (!fileResult || fileResult.length === 0) {
      return { error: \`File not found: \${filePath}\` };
    }
    
    const fileData = fileResult[0];
    
    // 2. Determine extension and load the appropriate plugin dynamically
    const extension = fileData.path.split('.').pop().toLowerCase();
    
    // Get plugin registry from the lix pluginLoader
    const pluginLoader = lix.pluginLoader || { // Fallback if pluginLoader not available
      async loadPlugin(ext) {
        try {
          if (ext === 'json') return (await import('@lix-js/plugin-json')).plugin;
          if (ext === 'csv') return (await import('@lix-js/plugin-csv')).plugin;
          return null;
        } catch (e) {
          return null;
        }
      }
    };
    
    // Load the plugin
    const plugin = await pluginLoader.loadPlugin(extension);
    if (!plugin) {
      // For read-only operations on unsupported formats, we can still return the content
      if (isReadOnlyOperation) {
        // Convert binary data to string for viewing
        let content = fileData.data;
        if (Buffer.isBuffer(content)) {
          content = content.toString('utf8');
        } else if (content instanceof Uint8Array) {
          content = new TextDecoder().decode(content);
        } else if (typeof content !== 'string') {
          content = String(content);
        }
        
        return {
          success: true,
          fileName: fileData.path,
          content: content
        };
      }
      
      return { error: \`No plugin available for file type: \${extension}\` };
    }
    
    // 3. For modifications, create before/after states and apply changes
    // For read operations, just return the content
    
    // 4. Use the standard plugin interface
    // const changes = await plugin.detectChanges({...});
    // const result = await plugin.applyChanges({...});
    
    // 5. Return appropriate results
    return { success: true, message: 'Operation completed successfully' };
  } catch (e) {
    return { 
      error: 'Operation failed',
      details: e.message
    };
  }
}
\`\`\`

Generate concise JavaScript code that accomplishes the user's request while following these principles.
The code will be executed with the Lix object available as 'lix'. Handle errors appropriately.`
      },
      {
        role: 'user',
        content: `Generate JavaScript code for the following request: ${request}`
      }
    ];
    
    // If there was an error in a previous attempt, add it for refinement
    if (previousError) {
      messages.push({
        role: 'assistant',
        content: '```javascript\n// Code goes here\n```' // Placeholder
      });
      
      messages.push({
        role: 'user',
        content: `The code failed with error: "${previousError}". Please fix it and try again.`
      });
    }
    
    // Generate the code with lower temperature for more deterministic results
    const response = await this.llmAdapter.generate(messages, { temperature: 0.2 });
    
    // Extract just the code
    return this.extractCodeFromResponse(response.message);
  }
  
  /**
   * Extract JavaScript code from the LLM response
   */
  private extractCodeFromResponse(responseText: string): string {
    // Look for JavaScript code blocks
    const codeBlockRegex = /```(?:javascript|js)?\s*([\s\S]*?)\s*```/i;
    const match = responseText.match(codeBlockRegex);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // No code block, use the entire response
    return responseText.trim()
      .replace(/^```/gm, '')
      .replace(/```$/gm, '')
      .trim();
  }
  
  /**
   * Execute the generated JavaScript code
   */
  private async executeCode(code: string, lixObj: Lix): Promise<any> {
    try {
      // Create a safe execution context with the Lix object
      const executionContext = {
        lix: lixObj,
        // Provide real console methods but wrapped to catch any errors
        console: { 
          log: (...args: any[]) => {
            try { console.log(...args); } catch (e) {}
          },
          error: (...args: any[]) => {
            try { console.error(...args); } catch (e) {}
          },
          warn: (...args: any[]) => {
            try { console.warn(...args); } catch (e) {}
          },
          info: (...args: any[]) => {
            try { console.info(...args); } catch (e) {}
          }
        },
        Buffer: Buffer,
      };
      
      // Create a function from the code
      // This approach is safer than using eval directly
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const codeFunction = new AsyncFunction('context', `
        with (context) {
          ${code}
        }
      `);
      
      // Execute the function and return the result
      return await codeFunction(executionContext);
    } catch (error) {
      throw new Error(`Code execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Improved SQL Execution Helper
 */
class SQLExecutionHelper {
  private debug: boolean;
  
  constructor(debug: boolean = false) {
    this.debug = debug;
  }
  
  /**
   * Execute a SQL query against the Lix database
   */
  async executeQuery(lix: Lix, query: string): Promise<any> {
    if (this.debug) {
      console.log(`Executing query: ${query}`);
    }
    
    try {
      // For simplicity in this POC, determine basic query type and handle accordingly
      const queryType = this.getQueryType(query);
      
      if (queryType === 'SELECT') {
        return await this.executeSelect(lix, query);
      } else if (queryType === 'INSERT') {
        return await this.executeInsert(lix, query);
      } else if (queryType === 'UPDATE') {
        return await this.executeUpdate(lix, query);
      } else if (queryType === 'DELETE') {
        return await this.executeDelete(lix, query);
      } else {
        return {
          success: false,
          error: `Unsupported query type in POC: ${queryType}`
        };
      }
    } catch (error) {
      console.error('Error executing query:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get the basic type of SQL query (SELECT, INSERT, etc.)
   */
  private getQueryType(query: string): string {
    const upperQuery = query.trim().toUpperCase();
    if (upperQuery.startsWith('SELECT')) return 'SELECT';
    if (upperQuery.startsWith('INSERT')) return 'INSERT';
    if (upperQuery.startsWith('UPDATE')) return 'UPDATE';
    if (upperQuery.startsWith('DELETE')) return 'DELETE';
    return 'UNKNOWN';
  }
  
  /**
   * Execute a SELECT query
   */
  private async executeSelect(lix: Lix, query: string): Promise<any> {
    // For POC, we'll implement a simple version that extracts table name
    // and handles only basic queries against the file table
    try {
      // Extract table name from query - simple regex approach
      const tableMatch = query.match(/from\s+(\w+)/i);
      if (!tableMatch || !tableMatch[1]) {
        return { error: 'Could not determine table name from query' };
      }
      
      const tableName = tableMatch[1].toLowerCase();
      
      if (tableName === 'file') {
        // Get records from file table
        const files = await lix.db
          .selectFrom('file')
          .select(['id', 'path', 'data'])
          .execute();
          
        // Process files to handle binary data
        return files.map(file => {
          // Handle binary data conversion
          let content: any = file.data;
          if (Buffer.isBuffer(content)) {
            try {
              content = content.toString('utf8');
            } catch (e) {
              // Keep as is if can't convert
              content = '[Binary data]';
            }
          } else if (content instanceof Uint8Array) {
            try {
              content = Array.from(content)
                .map(byte => String.fromCharCode(byte))
                .join('');
            } catch (e) {
              // Keep as is if can't convert
              content = '[Binary data]';
            }
          }
          
          return {
            id: file.id,
            path: file.path,
            data: content
          };
        });
      } else {
        // For POC, we'll return empty results for other tables
        return [];
      }
    } catch (error) {
      console.error('SELECT query error:', error);
      throw error;
    }
  }
  
  /**
   * Execute an INSERT query
   */
  private async executeInsert(lix: Lix, query: string): Promise<any> {
    // For POC, we'll only implement basic INSERT into file table
    try {
      // Check if query is inserting into file table
      const tableMatch = query.match(/insert\s+into\s+(\w+)/i);
      if (!tableMatch || tableMatch[1].toLowerCase() !== 'file') {
        return { error: 'Only INSERT INTO file is implemented in POC' };
      }
      
      // Try to extract path and data values - this is simplified!
      // In a real parser, this would be much more robust
      const pathMatch = query.match(/path\s*=\s*['"](.*?)['"]/i);
      const dataMatch = query.match(/data\s*=\s*['"](.*?)['"]/i);
      
      if (!pathMatch || !dataMatch) {
        return { error: 'Could not extract path or data from INSERT query' };
      }
      
      const path = pathMatch[1];
      const data = dataMatch[1];
      
      // Ensure path starts with / as this is a requirement
      const fixedPath = path.startsWith('/') ? path : `/${path}`;
      
      // Convert data to Buffer for BLOB column
      const dataBuffer = Buffer.from(data, 'utf8');
      
      // Insert the file
      await lix.db
        .insertInto('file')
        .values({
          path: fixedPath,
          data: dataBuffer
        })
        .execute();
        
      return { success: true, message: `Inserted file at ${fixedPath}` };
    } catch (error) {
      console.error('INSERT query error:', error);
      throw error;
    }
  }
  
  /**
   * Execute an UPDATE query
   */
  private async executeUpdate(lix: Lix, query: string): Promise<any> {
    // For POC, we'll only implement basic UPDATE for file table
    try {
      // Check if query is updating file table
      const tableMatch = query.match(/update\s+(\w+)/i);
      if (!tableMatch || tableMatch[1].toLowerCase() !== 'file') {
        return { error: 'Only UPDATE file is implemented in POC' };
      }
      
      // Very basic extraction of SET and WHERE clauses
      const setMatch = query.match(/set\s+(.*?)\s+where/i);
      const whereMatch = query.match(/where\s+(.*?)(\s+|$)/i);
      
      if (!setMatch || !whereMatch) {
        return { error: 'Could not extract SET or WHERE clauses from UPDATE query' };
      }
      
      // Extract the path to update and the new data value
      const pathMatch = whereMatch[1].match(/path\s*=\s*['"](.*?)['"]/i);
      const dataMatch = setMatch[1].match(/data\s*=\s*['"](.*?)['"]/i);
      
      if (!pathMatch || !dataMatch) {
        return { error: 'Could not extract path or data from UPDATE query' };
      }
      
      const path = pathMatch[1];
      const data = dataMatch[1];
      
      // Convert data to Buffer for BLOB column
      const dataBuffer = Buffer.from(data, 'utf8');
      
      // Update the file
      await lix.db
        .updateTable('file')
        .set({ data: dataBuffer })
        .where('path', '=', path)
        .execute();
        
      return { success: true, message: `Updated file at ${path}` };
    } catch (error) {
      console.error('UPDATE query error:', error);
      throw error;
    }
  }
  
  /**
   * Execute a DELETE query
   */
  private async executeDelete(lix: Lix, query: string): Promise<any> {
    // For POC, we'll only implement basic DELETE from file table
    try {
      // Check if query is deleting from file table
      const tableMatch = query.match(/delete\s+from\s+(\w+)/i);
      if (!tableMatch || tableMatch[1].toLowerCase() !== 'file') {
        return { error: 'Only DELETE FROM file is implemented in POC' };
      }
      
      // Extract WHERE condition
      const whereMatch = query.match(/where\s+(.*?)(\s+|$)/i);
      if (!whereMatch) {
        return { error: 'DELETE requires a WHERE clause for safety' };
      }
      
      // Extract the path to delete
      const pathMatch = whereMatch[1].match(/path\s*=\s*['"](.*?)['"]/i);
      if (!pathMatch) {
        return { error: 'Could not extract path from DELETE query' };
      }
      
      const path = pathMatch[1];
      
      // Delete the file
      await lix.db
        .deleteFrom('file')
        .where('path', '=', path)
        .execute();
        
      return { success: true, message: `Deleted file at ${path}` };
    } catch (error) {
      console.error('DELETE query error:', error);
      throw error;
    }
  }
}

export class Agent {
  private context: ConversationContext;
  llmAdapter: LLMAdapter; // Made public for testing and direct access
  private sqlOrchestrator: SQLOrchestrator;
  private jsExecutor: JSCodeExecutor;
  private sqlExecutor: SQLExecutionHelper;
  private outputFormatter: OutputFormatter;
  private debug: boolean;
  
  constructor(options: AgentOptions) {
    this.llmAdapter = options.llmAdapter;
    this.context = new ConversationContext(this.llmAdapter);
    this.sqlOrchestrator = new SQLOrchestrator(this.llmAdapter);
    this.jsExecutor = new JSCodeExecutor(this.llmAdapter);
    this.sqlExecutor = new SQLExecutionHelper(options.debug || false);
    this.outputFormatter = options.outputFormatter;
    this.debug = options.debug || false;
    
    // Set default system instructions
    this.context.setSystemInstructions(this.getDefaultSystemInstructions());
  }
  
  /**
   * Determine if input is a task (operation) or a general question
   */
  private isTaskRequest(input: string): boolean {
    // Task-related keywords and patterns
    const taskPatterns = [
      // Data manipulation verbs
      /\b(create|add|insert|update|modify|change|edit|delete|remove)\b/i,
      // Show/list commands
      /\b(show|display|list|get) (all|the|files|content|data)\b/i,
      // SQL-like requests
      /\bselect\b.*\bfrom\b/i,
      /\bwhere\b.*\b(=|equals|is|contains)\b/i,
      // File operations
      /\bfile[s]?\b.*(content|open|save|read|write)/i,
      // Explicit commands
      /\bexecute\b|\brun\b|\bperform\b/i
    ];
    
    // Check if input matches any task pattern
    return taskPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Process a natural language input from the user
   */
  async processInput(input: string, sessionState: SessionState): Promise<void> {
    try {
      // Add user message to conversation history
      this.context.addUserMessage(input);
      
      // Determine if this is a task or a question
      const isTask = this.isTaskRequest(input);
      
      // Start loading animation
      const loader = this.outputFormatter.startLoading(
        isTask ? "Executing task" : "Thinking"
      );
      
      // Update file context if we have a Lix file open
      if (sessionState.activeLixManager?.isOpen()) {
        await this.updateFileContext(sessionState);
      }
      
      // Handle the input based on whether we have an active Lix file
      if (sessionState.activeLixManager?.isOpen()) {
        // We have a Lix file open, so we can directly work with it
        const lix = sessionState.activeLixManager.getLixObject();
        if (lix) {
          // Stop the loader when done
          loader.stop();
          
          if (isTask) {
            // Process as a task - generate and execute code/SQL
            await this.handleLixTask(input, lix);
          } else {
            // Process as a general question about the project
            await this.handleLixQuestion(input, lix);
          }
        } else {
          // Handle with general response
          loader.stop();
          await this.generateGeneralResponse(input);
        }
      } else {
        // No Lix file is open, provide guidance
        const response = await this.generateGeneralResponse(
          input,
          "I don't have a Lix file open, so I can't access any file or change data. You can use /open or /new commands to work with a Lix file."
        );
        
        // Stop the loader when done
        loader.stop();
        
        this.context.addAssistantMessage(response);
        this.outputFormatter.formatMessage(response);
      }
    } catch (error) {
      // Stop any running loader
      this.outputFormatter.startLoading().stop();
      
      this.outputFormatter.formatError(
        `Error processing your request: ${error instanceof Error ? error.message : String(error)}`
      );
      
      if (this.debug && error instanceof Error) {
        console.error(chalk.gray(error.stack));
      }
    }
  }
  
  /**
   * Handle task-oriented requests that require execution
   */
  private async handleLixTask(input: string, lix: Lix): Promise<void> {
    try {
      // First attempt: Try direct JavaScript code execution
      const codeResult = await this.jsExecutor.generateAndExecuteCode(input, lix);
      
      if (codeResult.success && codeResult.result !== undefined) {
        // Code execution succeeded
        if (this.debug) {
          console.log(chalk.gray('Generated code:'), codeResult.code);
        }
        
        // Format the result
        const response = await this.formatExecutionResult(input, codeResult);
        this.context.addAssistantMessage(response);
        this.outputFormatter.formatMessage(response, 'task');
        return;
      }
      
      // Second attempt: Try SQL query if JS execution failed
      // Get database schema
      const dbSchema = await this.getDatabaseSchema(lix);
      
      // Configure the SQL execution function
      const executeQuery = async (query: string) => {
        if (this.debug) {
          console.log(chalk.gray('Generated SQL query:'), query);
        }
        
        return await this.sqlExecutor.executeQuery(lix, query);
      };
      
      // Use the SQL orchestrator to generate and execute a query
      const sqlResult = await this.sqlOrchestrator.generateAndExecuteQuery(
        input,
        executeQuery,
        dbSchema
      );
      
      if (sqlResult.success) {
        // SQL execution succeeded
        if (this.debug) {
          console.log(chalk.gray('Generated SQL:'), sqlResult.sql);
        }
        
        // Format the results
        const response = await this.sqlOrchestrator.formatQueryResults(
          input,
          sqlResult.data,
          sqlResult.sql!
        );
        
        this.context.addAssistantMessage(response);
        this.outputFormatter.formatMessage(response, 'task');
        return;
      }
      
      // Both JavaScript and SQL approaches failed, use general response
      const fallbackContext = `I tried to execute your request but encountered technical issues:
      ${codeResult.error ? `- JavaScript execution: ${codeResult.error}` : ''}
      ${sqlResult.error ? `- SQL execution: ${sqlResult.error}` : ''}
      
      Let me try to help you in a different way.`;
      
      const response = await this.generateGeneralResponse(input, fallbackContext);
      this.context.addAssistantMessage(response);
      this.outputFormatter.formatMessage(response, 'answer');
    } catch (error) {
      const errorMsg = `Failed to process your request: ${error instanceof Error ? error.message : String(error)}`;
      this.context.addAssistantMessage(errorMsg);
      this.outputFormatter.formatError(errorMsg);
    }
  }
  
  /**
   * Handle general questions that don't require execution
   */
  private async handleLixQuestion(input: string, lix: Lix): Promise<void> {
    try {
      // For general questions, we don't need to execute code/SQL
      const response = await this.generateGeneralResponse(input);
      this.context.addAssistantMessage(response);
      this.outputFormatter.formatMessage(response, 'answer');
    } catch (error) {
      const errorMsg = `Failed to answer your question: ${error instanceof Error ? error.message : String(error)}`;
      this.context.addAssistantMessage(errorMsg);
      this.outputFormatter.formatError(errorMsg);
    }
  }
  
  /**
   * Handle a request using the Lix object directly
   * Delegates to either task or question handler based on request type
   */
  private async handleLixRequest(input: string, lix: Lix): Promise<void> {
    // Determine if this is a task or a question
    const isTask = this.isTaskRequest(input);
    
    if (isTask) {
      await this.handleLixTask(input, lix);
    } else {
      await this.handleLixQuestion(input, lix);
    }
  }
  
  /**
   * Get database schema as a string description
   */
  private async getDatabaseSchema(lix: Lix): Promise<string> {
    try {
      // For our POC, let's create a simple schema description
      return `
Database Schema:
- file (id: INTEGER PRIMARY KEY, path: TEXT, data: BLOB)
- The path column contains file names and always starts with a slash (/)
- The data column contains the file content as a BLOB
`;
    } catch (error) {
      console.error('Error getting schema:', error);
      return 'Database schema could not be retrieved.';
    }
  }
  
  /**
   * Format the result of code execution into a natural language response
   */
  private async formatExecutionResult(
    input: string,
    executionResult: { success: boolean; result?: any; code?: string }
  ): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an AI assistant that explains the results of JavaScript code execution.
        
Given the user's original request and the result of executing JavaScript code,
provide a clear, concise explanation of what was accomplished.
Focus on the information the user wanted, not the technical details of the code.`
      },
      {
        role: 'user',
        content: `
User request: ${input}

Execution result: 
${JSON.stringify(executionResult.result, null, 2)}

Please explain these results in a clear, natural way that directly answers the original request.`
      }
    ];
    
    const response = await this.llmAdapter.generate(messages);
    return response.message;
  }
  
  private async updateFileContext(sessionState: SessionState): Promise<void> {
    if (!sessionState.activeLixManager) {
      this.context.setFileContext('');
      return;
    }
    
    const filePath = sessionState.activeLixManager.getCurrentFilePath();
    
    // Get schema dynamically from the DB if possible
    let schemaInfo = '';
    const lix = sessionState.activeLixManager.getLixObject();
    
    if (lix) {
      try {
        schemaInfo = 'Database Schema:\n';
        schemaInfo += '- file (id, path, data): Stores file information\n';
        
        // Try to get file count
        const files = await lix.db
          .selectFrom('file')
          .select(sql`count(*)`.as('count'))
          .execute();
          
        const fileCount = files[0]?.count || 0;
        schemaInfo += `- ${fileCount} files currently stored in database\n`;
        
        // Get plugins information
        const pluginsInfo = await sessionState.activeLixManager.getPluginsInfo();
        if (pluginsInfo && pluginsInfo.available && pluginsInfo.available.length > 0) {
          schemaInfo += '\nActive Plugins:\n';
          
          for (const plugin of pluginsInfo.available) {
            if (plugin.active) {
              schemaInfo += `- ${plugin.key} (supports: ${plugin.supports})\n`;
            }
          }
        }
      } catch (error) {
        schemaInfo = 'Could not retrieve database schema information. ';
      }
    }
    
    let fileContext = `Current Lix file: ${filePath || 'in-memory'}\n`;
    fileContext += schemaInfo;
    
    this.context.setFileContext(fileContext);
  }
  
  /**
   * Generate a general response when other approaches fail
   */
  private async generateGeneralResponse(input: string, context?: string): Promise<string> {
    const messages = this.context.getMessages().slice(); // Clone current context
    
    // If additional context was provided, add it
    if (context) {
      messages.push({
        role: 'system',
        content: context
      });
    }
    
    // Generate response
    const response = await this.llmAdapter.generate(messages);
    return response.message;
  }
  
  /**
   * Get default system instructions
   */
  private getDefaultSystemInstructions(): string {
    return `You are an AI assistant for the Lix change control system.
    
Your capabilities:
- Answer questions about data stored in Lix files
- Dynamically explore and understand the Lix database schema
- Execute SQL queries directly to retrieve data
- Execute JavaScript code using the Lix SDK to perform operations
- Help users work with the full Lix API through natural language requests
- Use specialized plugins for different file types 

When users ask about data or changes, you'll interpret their request and:
1. Generate and execute JavaScript code against the Lix API
2. Generate and execute SQL queries against the Lix database
3. Utilize appropriate plugins based on file types
4. Provide natural language explanations of the results

IMPORTANT: Always follow the plugin-based architecture when working with files:
1. Determine the file type/extension
2. Import the appropriate plugin dynamically
3. Create proper before/after states with any required metadata
4. Use the plugin's standard interface (detectChanges/applyChanges)
5. Never implement format-specific logic directly

For binary data conversion:
- TextDecoder: new TextDecoder().decode(data)
- For Buffer: data.toString('utf8')

You can handle any request related to Lix files, including:
- Exploring file contents and change history
- Querying structured data
- Modifying data and tracking changes
- Advanced operations like filtering, aggregation, and transformation
- Working with specialized file formats using the appropriate plugins

Always be clear, concise, and helpful in your responses.`;
  }
  
  /**
   * Change the LLM adapter
   */
  setLLMAdapter(adapter: LLMAdapter): void {
    this.llmAdapter = adapter;
    this.context = new ConversationContext(adapter);
    this.sqlOrchestrator = new SQLOrchestrator(adapter);
    
    // Reset system instructions
    this.context.setSystemInstructions(this.getDefaultSystemInstructions());
  }
  
  /**
   * Get the current conversation context
   * Useful for testing and debugging
   */
  getContext(): ConversationContext {
    return this.context;
  }
}