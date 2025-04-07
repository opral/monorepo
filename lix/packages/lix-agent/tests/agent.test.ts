import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Agent } from '../src/agent/agent.js';
import { LLMAdapter, ChatMessage } from '../src/agent/llm.js';
import { OutputFormatter } from '../src/output.js';
import { SessionState } from '../src/repl.js';
import { LixManager } from '../src/lix/lixManager.js';

// Mock LLM Adapter for testing
class MockLLMAdapter implements LLMAdapter {
  public messages: ChatMessage[] = [];
  public nextResponse: string = 'Default mock response';
  
  constructor(public readonly name: string = 'mock', public readonly maxContextTokens: number = 4096) {}
  
  async generate(messages: ChatMessage[], options?: any): Promise<{ message: string; raw?: any }> {
    this.messages = messages;
    return { message: this.nextResponse };
  }
}

// Mock Output Formatter for testing
class MockOutputFormatter extends OutputFormatter {
  public messages: string[] = [];
  public errors: string[] = [];
  
  constructor() {
    super('human');
  }
  
  override formatMessage(message: string): void {
    this.messages.push(message);
  }
  
  override formatError(error: string, details?: any): void {
    this.errors.push(error);
  }
}

// Mock LixManager for testing
const createMockLixManager = () => {
  const mockLixManager = new LixManager();
  
  vi.spyOn(mockLixManager, 'getCurrentFilePath').mockReturnValue('/mock/path.lix');
  vi.spyOn(mockLixManager, 'getTrackedFilePaths').mockResolvedValue(['/mock/test.json', '/mock/data.csv']);
  vi.spyOn(mockLixManager, 'getFileContent').mockImplementation(async (path) => {
    if (path === '/mock/test.json') {
      return '{"name": "Test", "version": "1.0.0"}';
    } else if (path === '/mock/data.csv') {
      return 'id,name,value\n1,Item 1,100\n2,Item 2,200';
    }
    return null;
  });
  vi.spyOn(mockLixManager, 'updateFileContent').mockResolvedValue();
  vi.spyOn(mockLixManager, 'getDatabaseSchema').mockReturnValue('Mock Schema');
  vi.spyOn(mockLixManager, 'executeQuery').mockResolvedValue([{ id: 1, name: 'result' }]);
  
  return mockLixManager;
};

describe('Agent', () => {
  let mockLLM: MockLLMAdapter;
  let mockOutput: MockOutputFormatter;
  let agent: Agent;
  let sessionState: SessionState;
  
  beforeEach(() => {
    // Reset the mocks
    mockLLM = new MockLLMAdapter();
    mockOutput = new MockOutputFormatter();
    
    // Create the agent
    agent = new Agent({
      llmAdapter: mockLLM,
      outputFormatter: mockOutput
    });
    
    // Create session state
    sessionState = {
      activeLixManager: createMockLixManager(),
      outputMode: 'human',
      agent,
      debug: false,
      autoConfirm: true
    };
  });
  
  describe('isChangeRequest', () => {
    it('should identify change requests based on verbs', async () => {
      // Test with the private method directly
      const isChangeRequest = (agent as any).isChangeRequest.bind(agent);
      
      // Setup mock to return "CHANGE" 
      mockLLM.nextResponse = 'CHANGE';
      const result1 = await isChangeRequest('update the version to 2.0');
      expect(result1).toBe(true);
      
      // Setup mock to return "QUERY"
      mockLLM.nextResponse = 'QUERY';
      const result2 = await isChangeRequest('what files are tracked?');
      expect(result2).toBe(false);
    });
  });
  
  describe('processInput', () => {
    it('should handle a query request', async () => {
      // Setup mock
      mockLLM.nextResponse = 'There are 2 files tracked.';
      
      // Process a query
      await agent.processInput('How many files are tracked?', sessionState);
      
      // Check that the output was formatted correctly
      expect(mockOutput.messages).toHaveLength(1);
      expect(mockOutput.messages[0]).toBe('There are 2 files tracked.');
    });
    
    it('should handle a change request', async () => {
      // Setup mocks
      mockLLM.nextResponse = 'CHANGE'; // First for classification
      
      // Then mock responses for other steps
      const responses = [
        '/mock/test.json', // file determination
        '{"name": "Test", "version": "2.0.0"}', // modified content
        'Updated version from 1.0.0 to 2.0.0', // change summary
        'Successfully updated JSON file.' // final confirmation
      ];
      
      let responseIndex = 0;
      vi.spyOn(mockLLM, 'generate').mockImplementation(async () => {
        const response = responses[responseIndex] || 'Default';
        responseIndex++;
        return { message: response };
      });
      
      // Process a change request
      await agent.processInput('Update version to 2.0', sessionState);
      
      // Check output
      expect(mockOutput.messages).toContain('Successfully updated JSON file.');
      
      // Verify LixManager was called to update content
      expect(sessionState.activeLixManager?.updateFileContent).toHaveBeenCalled();
    });
    
    it('should handle errors gracefully', async () => {
      // Setup to throw an error
      vi.spyOn(mockLLM, 'generate').mockRejectedValue(new Error('API Error'));
      
      // Process input that will cause an error
      await agent.processInput('This will fail', sessionState);
      
      // Check error was handled
      expect(mockOutput.errors).toHaveLength(1);
      expect(mockOutput.errors[0]).toContain('Error processing your request');
    });
  });
  
  // Test summary generation
  describe('summarizeChanges', () => {
    it('should generate a summary of changes', async () => {
      // Setup mock
      mockLLM.nextResponse = 'Updated version from 1.0.0 to 2.0.0';
      
      // Call the private method directly
      const changes = [
        { added: true, removed: false, value: '"version": "2.0.0"' },
        { added: false, removed: true, value: '"version": "1.0.0"' }
      ];
      
      const result = await (agent as any).summarizeChanges('/mock/test.json', changes);
      
      // Check the result
      expect(result).toBe('Updated version from 1.0.0 to 2.0.0');
    });
  });
});