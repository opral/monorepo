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
- changes: Change tracking functionality

Instructions:
1. Generate JavaScript code that accomplishes the user's request using the Lix API.
2. Return only the executable code, with no explanation or commentary.
3. The code will be executed with the Lix object available as 'lix'.
4. Your code should return a result that can be shown to the user.
5. Keep your code concise and focused on the task.
6. Handle errors appropriately.
7. Use async/await for asynchronous operations.`
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
        console: { log: () => {} }, // Suppress console.log
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

export class Agent {
  private context: ConversationContext;
  llmAdapter: LLMAdapter; // Made public for testing and direct access
  private sqlOrchestrator: SQLOrchestrator;
  private jsExecutor: JSCodeExecutor;
  private outputFormatter: OutputFormatter;
  private debug: boolean;
  
  constructor(options: AgentOptions) {
    this.llmAdapter = options.llmAdapter;
    this.context = new ConversationContext(this.llmAdapter);
    this.sqlOrchestrator = new SQLOrchestrator(this.llmAdapter);
    this.jsExecutor = new JSCodeExecutor(this.llmAdapter);
    this.outputFormatter = options.outputFormatter;
    this.debug = options.debug || false;
    
    // Set default system instructions
    this.context.setSystemInstructions(this.getDefaultSystemInstructions());
  }
  
  /**
   * Process a natural language input from the user
   */
  async processInput(input: string, sessionState: SessionState): Promise<void> {
    try {
      // Add user message to conversation history
      this.context.addUserMessage(input);
      
      // Update file context if we have a Lix file open
      if (sessionState.activeLixManager?.isOpen()) {
        await this.updateFileContext(sessionState);
      }
      
      // Handle the input based on whether we have an active Lix file
      if (sessionState.activeLixManager?.isOpen()) {
        // We have a Lix file open, so we can directly work with it
        const lix = sessionState.activeLixManager.getLixObject();
        if (lix) {
          // First, try with direct JavaScript code execution
          await this.handleLixRequest(input, lix);
        } else {
          // Handle with general response
          await this.generateGeneralResponse(input);
        }
      } else {
        // No Lix file is open, provide guidance
        const response = await this.generateGeneralResponse(
          input,
          "I don't have a Lix file open, so I can't access any file or change data. You can use /open or /new commands to work with a Lix file."
        );
        this.context.addAssistantMessage(response);
        this.outputFormatter.formatMessage(response);
      }
    } catch (error) {
      this.outputFormatter.formatError(
        `Error processing your request: ${error instanceof Error ? error.message : String(error)}`
      );
      
      if (this.debug && error instanceof Error) {
        console.error(chalk.gray(error.stack));
      }
    }
  }
  
  /**
   * Determine if the user input is requesting a change
   */
  private async isChangeRequest(input: string): Promise<boolean> {
    // First, use a simple heuristic for obvious cases
    const changeVerbs = [
      'change', 'update', 'modify', 'set', 'add', 'create', 'insert', 
      'delete', 'remove', 'rename', 'edit'
    ];
    
    // Check if any of the change verbs appear in the input
    for (const verb of changeVerbs) {
      // Word boundaries to prevent partial matches
      const regex = new RegExp(`\\b${verb}\\b`, 'i');
      if (regex.test(input)) {
        return true;
      }
    }
    
    // For more complex or ambiguous requests, use the LLM to classify
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an AI assistant that determines whether a user request is asking for a change to a file or just querying information.
        
Instructions:
1. Analyze the user's request to determine their intent.
2. If the request is asking to modify, update, create, delete, or otherwise change any file, respond with exactly "CHANGE".
3. If the request is just asking for information, explanation, or retrieving data without changes, respond with exactly "QUERY".
4. Only respond with one of these two words: "CHANGE" or "QUERY", with no explanation or additional text.`
      },
      {
        role: 'user',
        content: `Classify this request: "${input}"`
      }
    ];
    
    const response = await this.llmAdapter.generate(messages, { temperature: 0.2 });
    const classification = response.message.trim().toUpperCase();
    
    return classification === "CHANGE";
  }
  
  /**
   * Handle a query request (retrieve information)
   */
  private async handleQuery(input: string, sessionState: SessionState): Promise<void> {
    // If we have an active Lix file, try to answer with SQL
    if (sessionState.activeLixManager) {
      const schema = sessionState.activeLixManager.getDatabaseSchema();
      
      // Use the SQL orchestrator to generate and run a query
      const queryResult = await this.sqlOrchestrator.generateAndExecuteQuery(
        input,
        schema,
        async (query) => {
          if (this.debug) {
            console.log(chalk.gray('Generated SQL query:'), query);
          }
          return sessionState.activeLixManager!.executeQuery(query);
        }
      );
      
      if (queryResult.success) {
        // Format the results with the LLM to create a natural language response
        const response = await this.sqlOrchestrator.formatQueryResults(
          input, 
          queryResult.data, 
          queryResult.sql!
        );
        
        // Add to conversation history and output to user
        this.context.addAssistantMessage(response);
        this.outputFormatter.formatMessage(response);
      } else {
        // SQL generation/execution failed, fall back to general response
        const response = await this.generateGeneralResponse(
          input, 
          `I tried to retrieve that information from the database but encountered an error: ${queryResult.error}. Let me try to answer your question more generally.`
        );
        
        this.context.addAssistantMessage(response);
        this.outputFormatter.formatMessage(response);
      }
    } else {
      // No Lix file open, generate a general response
      const response = await this.generateGeneralResponse(
        input,
        "I don't have a Lix file open, so I can't access any file or change data. You can use /open or /new commands to work with a Lix file."
      );
      
      this.context.addAssistantMessage(response);
      this.outputFormatter.formatMessage(response);
    }
  }
  
  /**
   * Handle a change request (modify content)
   */
  private async handleChangeRequest(input: string, sessionState: SessionState): Promise<void> {
    if (!sessionState.activeLixManager) {
      const response = "You need to open a Lix file first using /open or /new before making changes.";
      this.context.addAssistantMessage(response);
      this.outputFormatter.formatMessage(response);
      return;
    }
    
    // 1. Get the current state of the file
    const filePaths = await sessionState.activeLixManager.getTrackedFilePaths();
    
    if (filePaths.length === 0) {
      const response = "There are no files tracked in this Lix file yet. You'll need to add a file first.";
      this.context.addAssistantMessage(response);
      this.outputFormatter.formatMessage(response);
      return;
    }
    
    // 2. Use LLM to determine which file to modify
    const targetFilePath = await this.determineTargetFile(input, filePaths);
    
    // 3. Get current content of the target file
    const currentContent = await sessionState.activeLixManager.getFileContent(targetFilePath);
    
    if (!currentContent) {
      const response = `Cannot get content for file: ${targetFilePath}`;
      this.context.addAssistantMessage(response);
      this.outputFormatter.formatMessage(response);
      return;
    }
    
    // 4. Generate the modified content
    const modifiedContent = await this.generateModifiedContent(
      input,
      targetFilePath,
      currentContent
    );
    
    // 5. Validate the changes
    const isValid = validateContent(targetFilePath, modifiedContent);
    
    if (!isValid) {
      // If validation fails, try to salvage the changes with LLM assistance
      this.outputFormatter.formatMessage("The proposed changes have validation issues. Attempting to fix...");
      
      const fixedContent = await this.fixInvalidContent(targetFilePath, modifiedContent, currentContent);
      
      // Check if the fix worked
      if (!validateContent(targetFilePath, fixedContent)) {
        const response = "I couldn't generate valid changes. Please try with a more specific instruction.";
        this.context.addAssistantMessage(response);
        this.outputFormatter.formatMessage(response);
        return;
      }
      
      // Continue with the fixed content
      this.outputFormatter.formatMessage("Validation issues fixed.");
      this.showPendingChanges(currentContent, fixedContent, targetFilePath, sessionState);
    } else {
      // Continue with the valid content
      this.showPendingChanges(currentContent, modifiedContent, targetFilePath, sessionState);
    }
  }

  /**
   * Show pending changes and ask for confirmation
   */
  private async showPendingChanges(
    currentContent: string,
    newContent: string,
    filePath: string,
    sessionState: SessionState
  ): Promise<void> {
    // Calculate diff to highlight changes
    const changes = diff.diffLines(currentContent, newContent);
    
    // Summarize the changes for better user understanding
    const changeSummary = await this.summarizeChanges(filePath, changes);
    
    // Display summary and diff
    this.outputFormatter.formatMessage(`Proposed changes to ${filePath}:`);
    this.outputFormatter.formatMessage(changeSummary);
    this.outputFormatter.formatDiff(currentContent, newContent);
    
    // Skip confirmation if auto-confirm is enabled
    if (!sessionState.autoConfirm) {
      const confirm = readline.question(chalk.yellow('Apply this change? [y/N]: '));
      
      if (!confirm.match(/^y(es)?$/i)) {
        const response = "Change not applied.";
        this.context.addAssistantMessage(response);
        this.outputFormatter.formatMessage(response);
        return;
      }
    }
    
    // 7. Apply the changes
    try {
      if (sessionState.activeLixManager) {
        await sessionState.activeLixManager.updateFileContent(filePath, newContent);
        
        const response = `Successfully updated ${filePath.includes('json') ? 'JSON file' : filePath}.`;
        this.context.addAssistantMessage(response);
        this.outputFormatter.formatMessage(response);
      } else {
        throw new Error("No active Lix manager");
      }
    } catch (error) {
      const errorMsg = `Failed to apply changes: ${error instanceof Error ? error.message : String(error)}`;
      this.context.addAssistantMessage(errorMsg);
      this.outputFormatter.formatError(errorMsg);
    }
  }
  
  /**
   * Use the LLM to create a brief summary of the changes
   */
  private async summarizeChanges(filePath: string, changes: diff.Change[]): Promise<string> {
    // Prepare a description of the changes for the LLM
    let changesDescription = "";
    
    for (const part of changes) {
      if (part.added) {
        changesDescription += `ADDED: ${part.value.substring(0, 100)}${part.value.length > 100 ? '...' : ''}\n`;
      } else if (part.removed) {
        changesDescription += `REMOVED: ${part.value.substring(0, 100)}${part.value.length > 100 ? '...' : ''}\n`;
      }
    }
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an AI assistant that summarizes file changes.
        
Instructions:
1. Given the description of additions and removals in a file, provide a brief, clear summary of what changed.
2. Focus on the purpose or effect of the changes, not just the literal differences.
3. Keep your summary concise (1-3 sentences).
4. Be specific but avoid technical jargon unless necessary.`
      },
      {
        role: 'user',
        content: `Summarize these changes to ${filePath}:\n\n${changesDescription}`
      }
    ];
    
    const response = await this.llmAdapter.generate(messages, { temperature: 0.3 });
    return response.message;
  }
  
  /**
   * Determine which file to target for a change
   */
  private async determineTargetFile(input: string, filePaths: string[]): Promise<string> {
    // If there's only one file, use that
    if (filePaths.length === 1) {
      return filePaths[0];
    }
    
    // Otherwise, ask the LLM which file the user is likely referring to
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an AI assistant that helps determine which file a user's request is referring to.
        
Available files:
${filePaths.join('\n')}

Instructions:
1. Analyze the user's request and determine which file they're most likely referring to.
2. Output ONLY the file path, with no explanation or commentary.
3. If no specific file can be determined, choose the most likely file based on the request.`
      },
      {
        role: 'user',
        content: `Based on this request, which file should be modified? Request: "${input}"`
      }
    ];
    
    const response = await this.llmAdapter.generate(messages, { temperature: 0.2 });
    
    // Clean up the response to ensure we get just a file path
    const filePath = response.message.trim();
    
    // Verify the file path is one of the available paths
    if (filePaths.includes(filePath)) {
      return filePath;
    }
    
    // If not found, default to the first file
    return filePaths[0];
  }
  
  /**
   * Generate modified content based on user instruction
   */
  private async generateModifiedContent(
    instruction: string,
    filePath: string,
    currentContent: string
  ): Promise<string> {
    const fileType = filePath.split('.').pop()?.toLowerCase() || '';
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an AI assistant that helps modify file content based on user instructions.
        
Instructions:
1. You will be provided with the current content of a ${fileType} file and a user's request to modify it.
2. Generate the complete new version of the file with the requested changes applied.
3. Output ONLY the modified file content, with no explanation or commentary.
4. Preserve the original format and structure as much as possible.
5. Make minimal changes - only modify what's necessary to fulfill the user's request.
6. For ${fileType} files, ensure your output is valid and properly formatted.`
      },
      {
        role: 'user',
        content: `I need to modify the file "${filePath}" according to this instruction: "${instruction}"
        
Current file content:

\`\`\`${fileType}
${currentContent}
\`\`\`

Please provide the complete updated file content.`
      }
    ];
    
    const response = await this.llmAdapter.generate(messages, { temperature: 0.3 });
    
    // Clean up to extract just the file content
    return this.extractContentFromResponse(response.message);
  }
  
  /**
   * If content validation fails, try to fix it
   */
  private async fixInvalidContent(
    filePath: string,
    invalidContent: string,
    originalContent: string
  ): Promise<string> {
    const fileType = filePath.split('.').pop()?.toLowerCase() || '';
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an AI assistant that fixes invalid file content.
        
Instructions:
1. You will be provided with invalid ${fileType} content that needs fixing.
2. Fix any syntax or formatting errors in the content.
3. Output ONLY the fixed content, with no explanation or commentary.
4. Ensure your output is valid ${fileType} format.
5. Make minimal changes - only fix what's broken.`
      },
      {
        role: 'user',
        content: `The following ${fileType} content is invalid and needs to be fixed.
        
Original valid content:
\`\`\`${fileType}
${originalContent}
\`\`\`

Invalid content that needs fixing:
\`\`\`${fileType}
${invalidContent}
\`\`\`

Please provide the fixed content.`
      }
    ];
    
    const response = await this.llmAdapter.generate(messages, { temperature: 0.3 });
    
    // Clean up to extract just the file content
    return this.extractContentFromResponse(response.message);
  }
  
  /**
   * Extract content from the LLM's response
   */
  private extractContentFromResponse(responseText: string): string {
    // Look for content in code blocks
    const contentBlockRegex = /```(?:\w*)?\s*([\s\S]*?)\s*```/;
    const match = responseText.match(contentBlockRegex);
    
    if (match && match[1]) {
      return match[1];
    }
    
    // No code block, use the entire response
    return responseText.trim();
  }
  
  /**
   * Generate a general response when SQL is not available or fails
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
   * Update file context in the conversation
   */
  /**
   * Handle a request using the Lix object directly
   */
  private async handleLixRequest(input: string, lix: Lix): Promise<void> {
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
        this.outputFormatter.formatMessage(response);
        return;
      }
      
      // Second attempt: Try SQL query if JS execution failed
      // Get database schema dynamically
      let dbSchema = '';
      try {
        // Query the database schema
        const tables = await lix.db.introspection.getTables();
        dbSchema = `Database Schema:\n`;
        
        for (const table of tables) {
          dbSchema += `Table: ${table.name}\n`;
          const columns = await lix.db.introspection.getTableColumns(table.name);
          
          for (const column of columns) {
            dbSchema += `- ${column.name} (${column.dataType})\n`;
          }
          dbSchema += '\n';
        }
      } catch (error) {
        dbSchema = 'Could not retrieve database schema. ';
      }
      
      // Try with SQL execution
      const sqlExecuteQuery = async (query: string) => {
        return await lix.db.executeQuery(query);
      };
      
      const sqlResult = await this.sqlOrchestrator.generateAndExecuteQuery(
        input,
        sqlExecuteQuery,
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
        this.outputFormatter.formatMessage(response);
        return;
      }
      
      // Both JavaScript and SQL approaches failed, use general response
      const fallbackContext = `I tried to execute your request but encountered technical issues:
      ${codeResult.error ? `- JavaScript execution: ${codeResult.error}` : ''}
      ${sqlResult.error ? `- SQL execution: ${sqlResult.error}` : ''}
      
      Let me try to help you in a different way.`;
      
      const response = await this.generateGeneralResponse(input, fallbackContext);
      this.context.addAssistantMessage(response);
      this.outputFormatter.formatMessage(response);
    } catch (error) {
      const errorMsg = `Failed to process your request: ${error instanceof Error ? error.message : String(error)}`;
      this.context.addAssistantMessage(errorMsg);
      this.outputFormatter.formatError(errorMsg);
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
        const tables = await lix.db.introspection.getTables();
        schemaInfo = 'Database Schema:\n';
        
        for (const table of tables) {
          schemaInfo += `Table: ${table.name}\n`;
        }
      } catch (error) {
        schemaInfo = 'Could not retrieve database schema. ';
      }
    }
    
    let fileContext = `Current Lix file: ${filePath || 'in-memory'}\n`;
    fileContext += schemaInfo;
    
    this.context.setFileContext(fileContext);
  }
  
  /**
   * Get default system instructions
   */
  private getDefaultSystemInstructions(): string {
    return `You are an AI assistant for the Lix change control system.
    
Your capabilities:
- Answer questions about data stored in Lix files
- Dynamically explore and understand the Lix database schema
- Execute SQL queries directly to retrieve and manipulate data
- Execute JavaScript code using the Lix SDK to perform operations
- Help users work with the full Lix API through natural language requests

When users ask about data or changes, you'll interpret their request and:
1. Generate and execute JavaScript code against the Lix API
2. Generate and execute SQL queries against the Lix database
3. Provide natural language explanations of the results

You can handle any request related to Lix files, including:
- Exploring file contents and change history
- Querying structured data (CSV, JSON)
- Modifying data and tracking changes
- Advanced operations like filtering, aggregation, and transformation

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