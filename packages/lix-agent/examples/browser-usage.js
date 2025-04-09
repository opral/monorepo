/**
 * Example of using the Lix Agent in a browser environment
 */

// Import the Lix SDK and Agent
import { openLixInMemory, newLixFile } from '@lix-js/sdk';
import { createLixAgent } from '@lix-js/agent';

// Example function to initialize the agent
async function initializeLixAgent() {
  try {
    // Create a new Lix file in memory
    const blob = await newLixFile();
    const lix = await openLixInMemory({ blob });
    
    // Get the API key from the input field
    const apiKey = document.getElementById('api-key').value;
    if (!apiKey) {
      throw new Error('API key is required');
    }
    
    // Get the selected provider
    const provider = document.querySelector('input[name="provider"]:checked').value;
    
    // Create the agent
    const agent = createLixAgent({
      lix,
      apiKey,
      provider, // 'openai' or 'anthropic'
      model: provider === 'openai' ? 'gpt-4' : 'claude-3-haiku-20240307',
      debug: true,
      
      // Callback function to receive messages from the agent
      onMessage: (message, type) => {
        console.log(`[${type}]`, message);
        
        const outputElement = document.getElementById('output');
        
        // Create a new output entry
        const entry = document.createElement('div');
        entry.className = `message ${type}`;
        
        // Add timestamp
        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date().toLocaleTimeString();
        entry.appendChild(timestamp);
        
        // Add message content
        const content = document.createElement('div');
        content.className = 'content';
        
        // Simple markdown-like formatting
        const formattedMessage = message
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
          .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic
          .replace(/`(.*?)`/g, '<code>$1</code>')            // Inline code
          .replace(/\n/g, '<br />');                         // Line breaks
        
        content.innerHTML = formattedMessage;
        entry.appendChild(content);
        
        // Add to output
        outputElement.appendChild(entry);
        
        // Scroll to bottom
        outputElement.scrollTop = outputElement.scrollHeight;
      }
    });
    
    return agent;
  } catch (error) {
    console.error('Failed to initialize agent:', error);
    document.getElementById('error-message').textContent = error.message;
    document.getElementById('error-container').style.display = 'block';
    throw error;
  }
}

// Example usage
async function main() {
  let agent = null;
  
  // Set up initialization form
  document.getElementById('init-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      // Show loading state
      document.getElementById('init-loading').style.display = 'block';
      document.getElementById('error-container').style.display = 'none';
      
      // Initialize the agent
      agent = await initializeLixAgent();
      
      // Hide initialization form and show chat interface
      document.getElementById('initialization').style.display = 'none';
      document.getElementById('chat-interface').style.display = 'block';
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      document.getElementById('init-loading').style.display = 'none';
    }
  });
  
  // Set up chat form
  document.getElementById('prompt-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!agent) {
      alert('Agent not initialized. Please initialize first.');
      return;
    }
    
    const promptInput = document.getElementById('prompt-input');
    const prompt = promptInput.value.trim();
    
    if (!prompt) return;
    
    // Add user message to the output
    const outputElement = document.getElementById('output');
    const userEntry = document.createElement('div');
    userEntry.className = 'message user';
    userEntry.innerHTML = `
      <div class="timestamp">${new Date().toLocaleTimeString()}</div>
      <div class="content">${prompt.replace(/\n/g, '<br />')}</div>
    `;
    outputElement.appendChild(userEntry);
    outputElement.scrollTop = outputElement.scrollHeight;
    
    // Clear input
    promptInput.value = '';
    
    // Show loading indicator
    document.getElementById('chat-loading').style.display = 'inline-block';
    
    try {
      // Send prompt to the agent
      await agent.prompt(prompt);
    } catch (error) {
      console.error('Error:', error);
      
      // Add error message to output
      const errorEntry = document.createElement('div');
      errorEntry.className = 'message error';
      errorEntry.innerHTML = `
        <div class="timestamp">${new Date().toLocaleTimeString()}</div>
        <div class="content">Error: ${error.message}</div>
      `;
      outputElement.appendChild(errorEntry);
      outputElement.scrollTop = outputElement.scrollHeight;
    } finally {
      // Hide loading indicator
      document.getElementById('chat-loading').style.display = 'none';
    }
  });
}

// Run the example when the DOM is ready
document.addEventListener('DOMContentLoaded', main);