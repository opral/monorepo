import React, { useState, useRef, useEffect } from 'react';
import { openLixInMemory, newLixFile } from '@lix-js/sdk';
import { createLixAgent } from '@lix-js/agent';

function LixAgentChat() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  
  // Form state
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('openai');
  
  // Agent reference
  const agentRef = useRef(null);
  const outputRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize the Lix Agent
  const initializeAgent = async (e) => {
    e.preventDefault();
    
    if (!apiKey) {
      setError('API key is required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Create a new Lix file in memory
      const blob = await newLixFile();
      const lix = await openLixInMemory({ blob });
      
      // Create the agent
      const agent = createLixAgent({
        lix,
        apiKey,
        provider,
        model: provider === 'openai' ? 'gpt-4' : 'claude-3-haiku-20240307',
        debug: true,
        
        // Callback function to receive messages from the agent
        onMessage: (message, type) => {
          console.log(`[${type}]`, message);
          
          setMessages(prevMessages => [
            ...prevMessages,
            {
              type,
              content: message,
              timestamp: new Date().toLocaleTimeString()
            }
          ]);
        }
      });
      
      agentRef.current = agent;
      setIsInitialized(true);
      
      // Add initial system message
      setMessages([{
        type: 'answer',
        content: 'Lix Agent initialized successfully. You can now ask questions about your Lix file or give instructions.',
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (err) {
      console.error('Failed to initialize agent:', err);
      setError(err.message || 'Failed to initialize the agent');
    } finally {
      setIsLoading(false);
    }
  };

  // Send prompt to the agent
  const sendPrompt = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim() || !agentRef.current) return;
    
    // Add user message
    setMessages(prevMessages => [
      ...prevMessages,
      {
        type: 'user',
        content: prompt,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
    
    setIsLoading(true);
    
    try {
      // Send prompt to the agent
      await agentRef.current.prompt(prompt);
    } catch (err) {
      console.error('Error:', err);
      
      // Add error message
      setMessages(prevMessages => [
        ...prevMessages,
        {
          type: 'error',
          content: `Error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsLoading(false);
      setPrompt('');
    }
  };

  // Format message content with simple markdown-like styling
  const formatMessage = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic
      .replace(/`(.*?)`/g, '<code>$1</code>')            // Inline code
      .replace(/\n/g, '<br />');                         // Line breaks
  };

  return (
    <div className="lix-agent-container">
      <h1>Lix Agent React Demo</h1>
      
      {!isInitialized ? (
        <section className="initialization-section">
          <h2>Initialize Lix Agent</h2>
          <p>Configure the agent with your LLM provider and API key.</p>
          
          {error && (
            <div className="error-container">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          <form onSubmit={initializeAgent}>
            <div className="form-group">
              <label htmlFor="api-key">API Key:</label>
              <input
                type="password"
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your OpenAI or Anthropic API key"
                required
              />
            </div>
            
            <div className="radio-group">
              <label>LLM Provider:</label>
              <div className="radio-options">
                <div className="radio-option">
                  <input
                    type="radio"
                    id="openai"
                    name="provider"
                    value="openai"
                    checked={provider === 'openai'}
                    onChange={() => setProvider('openai')}
                  />
                  <label htmlFor="openai">OpenAI (GPT-4)</label>
                </div>
                <div className="radio-option">
                  <input
                    type="radio"
                    id="anthropic"
                    name="provider"
                    value="anthropic"
                    checked={provider === 'anthropic'}
                    onChange={() => setProvider('anthropic')}
                  />
                  <label htmlFor="anthropic">Anthropic (Claude)</label>
                </div>
              </div>
            </div>
            
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Initializing...' : 'Initialize Agent'}
            </button>
          </form>
        </section>
      ) : (
        <section className="chat-section">
          <h2>Chat with Lix Agent</h2>
          
          <div className="output" ref={outputRef}>
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.type}`}>
                <div className="timestamp">{msg.timestamp}</div>
                <div 
                  className="content"
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
              </div>
            ))}
          </div>
          
          <form onSubmit={sendPrompt}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows="3"
              placeholder="Ask a question or give an instruction..."
              required
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

export default LixAgentChat;

// CSS styles to be included in your application:
/*
.lix-agent-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #0066cc;
  text-align: center;
  margin-bottom: 30px;
}

section {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

input[type="text"],
input[type="password"],
textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 16px;
}

.radio-group {
  margin-bottom: 15px;
}

.radio-options {
  display: flex;
}

.radio-option {
  margin-right: 15px;
  display: flex;
  align-items: center;
}

.radio-option input {
  margin-right: 5px;
}

button {
  background-color: #0066cc;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #0055aa;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-container {
  background-color: #fee;
  color: #d00;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.output {
  height: 400px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 15px;
  background-color: #f9f9f9;
}

.message {
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 4px;
  position: relative;
}

.message .timestamp {
  font-size: 12px;
  color: #999;
  position: absolute;
  top: 5px;
  right: 8px;
}

.message .content {
  margin-top: 5px;
  word-wrap: break-word;
}

.message.user {
  background-color: #e6f2ff;
  margin-left: 40px;
}

.message.answer {
  background-color: #f0f0f0;
  margin-right: 40px;
}

.message.task {
  background-color: #e6ffe6;
  margin-right: 40px;
}

.message.error {
  background-color: #fee;
  margin-right: 40px;
}

code {
  background-color: #eee;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}
*/