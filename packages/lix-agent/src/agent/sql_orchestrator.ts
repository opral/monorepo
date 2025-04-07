import { sql } from 'kysely';
import { LLMAdapter, ChatMessage } from './llm.js';

export interface SQLQueryResult {
  success: boolean;
  data?: any;
  error?: string;
  sql?: string;
}

export class SQLOrchestrator {
  private llmAdapter: LLMAdapter;
  private maxRetries: number = 2;
  
  constructor(llmAdapter: LLMAdapter) {
    this.llmAdapter = llmAdapter;
  }
  
  /**
   * Generate and execute an SQL query based on a natural language question
   */
  async generateAndExecuteQuery(
    question: string, 
    schema: string, 
    executeQuery: (query: string) => Promise<any>
  ): Promise<SQLQueryResult> {
    let attempts = 0;
    let lastError: string | undefined;
    let generatedSQL: string | undefined;
    
    while (attempts <= this.maxRetries) {
      try {
        // Generate SQL based on the question and schema
        generatedSQL = await this.generateSQL(question, schema, lastError);
        
        // Validate query is SELECT only for safety
        if (!this.isSelectQuery(generatedSQL)) {
          return {
            success: false,
            error: 'For safety, only SELECT queries are allowed in query mode.',
            sql: generatedSQL
          };
        }
        
        // Execute the query
        const result = await executeQuery(generatedSQL);
        
        // Query succeeded, return results
        return {
          success: true,
          data: result,
          sql: generatedSQL
        };
      } catch (error) {
        // Save the error message for refinement
        lastError = error instanceof Error ? error.message : String(error);
        attempts++;
        
        // If we've reached max retries, return failure
        if (attempts > this.maxRetries) {
          return {
            success: false,
            error: lastError,
            sql: generatedSQL
          };
        }
      }
    }
    
    // This should never be reached due to the return inside the loop
    return {
      success: false,
      error: 'Failed to generate or execute SQL query after multiple attempts.'
    };
  }
  
  /**
   * Generate an SQL query using the LLM
   */
  private async generateSQL(
    question: string, 
    schema: string, 
    previousError?: string
  ): Promise<string> {
    // Build the prompt
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an AI assistant that converts natural language questions into SQLite SQL queries.
        
Database Schema:
${schema}

Instructions:
1. Only generate SQL queries, with no explanation or commentary.
2. Only use SELECT queries to ensure data safety.
3. Use proper SQL syntax compatible with SQLite.
4. Use quotes for string literals and table/column names that are keywords.
5. Limit results to 100 rows by default for large queries.`
      },
      {
        role: 'user',
        content: `Generate an SQL query for the following question: ${question}`
      }
    ];
    
    // If there was an error in a previous attempt, add it for refinement
    if (previousError) {
      messages.push({
        role: 'assistant',
        content: 'SELECT ...' // Placeholder for the previous query
      });
      
      messages.push({
        role: 'user',
        content: `The query failed with error: "${previousError}". Please fix the SQL query and try again.`
      });
    }
    
    // Generate the SQL with lower temperature for more deterministic results
    const response = await this.llmAdapter.generate(messages, { temperature: 0.2 });
    
    // Clean up the response - extract just the SQL query
    return this.extractSQLFromResponse(response.message);
  }
  
  /**
   * Extract just the SQL from the LLM's response
   */
  private extractSQLFromResponse(responseText: string): string {
    // Look for SQL code blocks
    const sqlBlockRegex = /```(?:sql)?\s*([\s\S]*?)\s*```/i;
    const match = responseText.match(sqlBlockRegex);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // No code block, just return the whole response (cleaning as needed)
    return responseText.trim()
      .replace(/^```/gm, '')
      .replace(/```$/gm, '')
      .replace(/^sql$/im, '')
      .trim();
  }
  
  /**
   * Check if a query is a SELECT query for safety
   */
  private isSelectQuery(query: string): boolean {
    // Normalize the query for checking
    const normalizedQuery = query.trim().toUpperCase();
    
    // Check if it starts with SELECT
    return normalizedQuery.startsWith('SELECT');
  }
  
  /**
   * Format SQL query results into natural language with the LLM
   */
  async formatQueryResults(question: string, results: any, sql: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an AI assistant that explains SQL query results in natural language.
        
Given an SQL query and its results, explain the answer to the user's question in a clear, concise way.
Include relevant numbers or specific data points from the results, but keep your response brief.`
      },
      {
        role: 'user',
        content: `
User question: ${question}

SQL query used:
${sql}

Query results:
${JSON.stringify(results, null, 2)}

Please explain these results in a clear, natural way that directly answers the user's question.`
      }
    ];
    
    const response = await this.llmAdapter.generate(messages);
    return response.message;
  }
}