import { ChatMessage, LLMAdapter } from './llm.js';

/**
 * Simple token estimator (characters / 4)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export class ConversationContext {
  private messages: ChatMessage[] = [];
  private llmAdapter: LLMAdapter;
  private systemInstructions: string = '';
  private fileContext: string = '';
  private maxTokenBuffer: number = 1000; // Buffer to leave room for model response
  
  constructor(llmAdapter: LLMAdapter) {
    this.llmAdapter = llmAdapter;
  }
  
  /**
   * Set the system instructions that should always be included
   */
  setSystemInstructions(instructions: string): void {
    this.systemInstructions = instructions;
  }
  
  /**
   * Set context about open files and their purpose
   */
  setFileContext(context: string): void {
    this.fileContext = context;
  }
  
  /**
   * Add a user message to the conversation
   */
  addUserMessage(content: string): void {
    this.messages.push({ role: 'user', content });
    this.ensureContextFits();
  }
  
  /**
   * Add an assistant message to the conversation
   */
  addAssistantMessage(content: string): void {
    this.messages.push({ role: 'assistant', content });
    this.ensureContextFits();
  }
  
  /**
   * Get all messages for the next LLM call, including system context
   */
  getMessages(): ChatMessage[] {
    // Combine system instructions and file context
    const systemContent = [
      this.systemInstructions,
      this.fileContext ? `Current files: ${this.fileContext}` : ''
    ].filter(Boolean).join('\n\n');
    
    return [
      { role: 'system', content: systemContent },
      ...this.messages
    ];
  }
  
  /**
   * Get raw conversation history (for testing/debugging)
   */
  getRawMessages(): ChatMessage[] {
    return [...this.messages];
  }
  
  /**
   * Clear all conversation history
   */
  clearConversation(): void {
    this.messages = [];
  }
  
  /**
   * Ensure the context fits within the model's context window
   */
  private ensureContextFits(): void {
    const maxContextTokens = this.llmAdapter.maxContextTokens - this.maxTokenBuffer;
    
    // Estimate current token usage
    let totalTokens = this.estimateCurrentTokens();
    
    // If we're over the limit, summarize older parts of the conversation
    if (totalTokens > maxContextTokens) {
      this.summarizeOldestMessages(totalTokens - maxContextTokens);
    }
  }
  
  /**
   * Estimate the total tokens in the current conversation
   */
  private estimateCurrentTokens(): number {
    // Estimate system instruction tokens
    const systemTokens = estimateTokens(this.systemInstructions);
    const fileContextTokens = estimateTokens(this.fileContext);
    
    // Add up all message tokens
    const messageTokens = this.messages.reduce(
      (total, msg) => total + estimateTokens(msg.content),
      0
    );
    
    return systemTokens + fileContextTokens + messageTokens;
  }
  
  /**
   * Summarize oldest messages to reduce token count
   */
  private summarizeOldestMessages(tokensToReduce: number): void {
    // We need at least 4 messages (2 exchanges) to summarize something
    if (this.messages.length < 4) {
      // If we don't have enough to summarize, just drop the oldest
      if (this.messages.length > 0) {
        this.messages.shift();
      }
      return;
    }
    
    // Collect the oldest 2-3 exchanges (4-6 messages)
    const numToSummarize = Math.min(6, Math.floor(this.messages.length / 2) * 2);
    const messagesToSummarize = this.messages.slice(0, numToSummarize);
    
    // Create a summary from those messages
    // In a full implementation, we would use the LLM itself to create this summary
    // Note: Updated to use real summarization with LLM
    this.createSummaryWithLLM(messagesToSummarize).then(summary => {
      // Replace the summarized messages with our summary
      this.messages.splice(0, numToSummarize, {
        role: 'system',
        content: summary
      });
    }).catch(error => {
      // If summarization fails, fall back to simple summarization
      const fallbackSummary = `Previous conversation summary: ${messagesToSummarize
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content.substring(0, 50) + '...')
        .join(', ')}`;
      
      this.messages.splice(0, numToSummarize, {
        role: 'system',
        content: fallbackSummary
      });
    });
  }
  
  /**
   * Use the LLM to create a proper summary of conversation segments
   */
  private async createSummaryWithLLM(messages: ChatMessage[]): Promise<string> {
    // Format the messages for the summarization prompt
    const conversationText = messages.map(msg => {
      const role = msg.role === 'user' ? 'User' : 
                  msg.role === 'assistant' ? 'Assistant' : 'System';
      return `${role}: ${msg.content}`;
    }).join('\n\n');
    
    const summaryMessages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an AI assistant that creates concise summaries of conversations. 
        
Instructions:
1. Summarize the conversation in 1-2 sentences.
2. Focus on key points, decisions, information shared, or actions taken.
3. Be factual and objective.
4. Start with "Previously in the conversation: "`
      },
      {
        role: 'user',
        content: `Summarize this conversation segment:\n\n${conversationText}`
      }
    ];
    
    try {
      const response = await this.llmAdapter.generate(summaryMessages, { temperature: 0.3 });
      return response.message;
    } catch (error) {
      // If the LLM call fails, create a simple summary
      return `Previously in the conversation: The user asked about ${messages
        .filter(msg => msg.role === 'user')
        .map(msg => `"${msg.content.substring(0, 30)}..."`)}`;
    }
  }
}