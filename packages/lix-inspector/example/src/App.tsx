import React, { useState, useEffect, useRef } from 'react';
import { type Lix } from '@lix-js/sdk';
import { LixInspectorComponent } from '@lix-js/inspector';

// Type for autocomplete suggestions
interface Suggestion {
  text: string;
  description?: string;
  type: 'property' | 'method' | 'object';
}

const App: React.FC = () => {
  const [lix, setLix] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'changes' | 'snapshots' | 'versions' | 'version_changes'>('changes');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([
    '[System] Interactive Lix Inspector Console',
    '[System] Type "help" for available commands',
    '[System] You can use "lix" to access the Lix object directly'
  ]);
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleHistory, setConsoleHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Initialize mock Lix instance
  useEffect(() => {
    // Create initial mock data
    const mockData = {
      changes: [
        { 
          id: 'change1', 
          parent_id: null, 
          snapshot_id: 'snapshot1',
          entity_id: 'entity1',
          field: 'name',
          value: JSON.stringify('Initial value'),
          metadata: JSON.stringify({ author: 'user1', timestamp: Date.now() - 2000 }),
        },
        { 
          id: 'change2', 
          parent_id: 'change1', 
          snapshot_id: 'snapshot2',
          entity_id: 'entity1',
          field: 'name',
          value: JSON.stringify('Updated value'),
          metadata: JSON.stringify({ author: 'user2', timestamp: Date.now() - 1000 }),
        },
        { 
          id: 'change3', 
          parent_id: 'change2', 
          snapshot_id: 'snapshot3',
          entity_id: 'entity1',
          field: 'description',
          value: JSON.stringify('New field added'),
          metadata: JSON.stringify({ author: 'user1', timestamp: Date.now() }),
        }
      ],
      snapshots: [
        {
          id: 'snapshot1',
          content: JSON.stringify({ name: 'Initial value' }),
          hash: 'hash1',
        },
        {
          id: 'snapshot2',
          content: JSON.stringify({ name: 'Updated value' }),
          hash: 'hash2',
        },
        {
          id: 'snapshot3',
          content: JSON.stringify({ name: 'Updated value', description: 'New field added' }),
          hash: 'hash3',
        }
      ],
      versions: [
        { id: 'version1', name: 'main' }
      ],
      version_changes: [
        { version_id: 'version1', change_id: 'change1' },
        { version_id: 'version1', change_id: 'change2' },
        { version_id: 'version1', change_id: 'change3' },
      ]
    };
    
    // Create a mock Lix object with a console-friendly interface
    const mockLix = {
      // Expose data directly
      data: mockData,
      
      // Helper methods
      addChange(parentId: string, field: string, value: any) {
        const timestamp = Date.now();
        const changeId = `change-${timestamp}`;
        const snapshotId = `snapshot-${timestamp}`;
        
        const newChange = {
          id: changeId,
          parent_id: parentId,
          snapshot_id: snapshotId,
          entity_id: 'entity1',
          field: field,
          value: JSON.stringify(value),
          metadata: JSON.stringify({ author: 'console', timestamp }),
        };
        
        mockData.changes.push(newChange);
        mockData.snapshots.push({
          id: snapshotId,
          content: JSON.stringify({ [field]: value }),
          hash: `hash-${changeId}`
        });
        mockData.version_changes.push({
          version_id: 'version1',
          change_id: changeId
        });
        
        return { changeId, snapshotId };
      },
      
      createBranch(name: string) {
        const newVersionId = `version-${Date.now()}`;
        mockData.versions.push({ id: newVersionId, name });
        
        // Copy changes to new version
        mockData.changes.forEach(change => {
          mockData.version_changes.push({
            version_id: newVersionId,
            change_id: change.id
          });
        });
        
        return newVersionId;
      },
      
      getLatestChange() {
        return mockData.changes[mockData.changes.length - 1];
      },
      
      getChangeCount() {
        return mockData.changes.length;
      },
      
      getSnapshotCount() {
        return mockData.snapshots.length;
      },
      
      getVersionCount() {
        return mockData.versions.length;
      },
      
      // Database mock for LixInspector
      db: {
        selectFrom: (table: string) => ({
          select: () => ({
            execute: async () => {
              if (table === 'change') return mockData.changes;
              if (table === 'snapshot') return mockData.snapshots;
              if (table === 'version') return mockData.versions;
              if (table === 'version_change') return mockData.version_changes;
              return [];
            },
            where: () => ({
              execute: async () => {
                if (table === 'change') return mockData.changes;
                if (table === 'snapshot') return mockData.snapshots;
                if (table === 'version') return mockData.versions;
                if (table === 'version_change') return mockData.version_changes;
                return [];
              }
            })
          }),
          execute: async () => {
            if (table === 'change') return mockData.changes;
            if (table === 'snapshot') return mockData.snapshots;
            if (table === 'version') return mockData.versions;
            if (table === 'version_change') return mockData.version_changes;
            return [];
          }
        })
      }
    };
    
    setLix(mockLix);
    setLoading(false);
    
    // Make lix available in the global scope for console access
    (window as any).lix = mockLix;
  }, []);

  // Console functions
  const addConsoleMessage = (output: string) => {
    setConsoleOutput(prev => [...prev, output]);
    
    // Scroll to bottom of console
    setTimeout(() => {
      if (consoleRef.current) {
        consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
      }
    }, 10);
  };

  const handleConsoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consoleInput.trim()) return;
    
    // Add the command to history
    setConsoleHistory(prev => [...prev, consoleInput]);
    setHistoryIndex(-1);
    
    // Add the command to console
    addConsoleMessage(`> ${consoleInput}`);
    
    // Clear suggestions
    setShowSuggestions(false);
    
    // Execute the command using Function constructor
    try {
      // Special case for help command
      if (consoleInput.trim().toLowerCase() === 'help') {
        addConsoleMessage('Available commands:');
        addConsoleMessage('  lix - Access the Lix object directly');
        addConsoleMessage('  lix.data - View the raw data tables');
        addConsoleMessage('  lix.data.changes - Access the changes array');
        addConsoleMessage('  lix.data.snapshots - Access the snapshots array');
        addConsoleMessage('  lix.data.versions - Access the versions array');
        addConsoleMessage('  lix.data.version_changes - Access the version_changes array');
        addConsoleMessage('  lix.addChange(parentId, field, value) - Add a new change');
        addConsoleMessage('  lix.createBranch(name) - Create a new branch');
        addConsoleMessage('  lix.getLatestChange() - Get the most recent change');
        addConsoleMessage('  lix.getChangeCount() - Get the total number of changes');
        addConsoleMessage('  lix.getSnapshotCount() - Get the total number of snapshots');
        addConsoleMessage('  lix.getVersionCount() - Get the total number of versions');
        addConsoleMessage('  clear() - Clear the console');
        return;
      }
      
      // Special case for clear command
      if (consoleInput.trim().toLowerCase() === 'clear()') {
        setConsoleOutput([]);
        return;
      }

      // Execute the code
      const result = Function('"use strict";', 'lix', `return (${consoleInput})`)(lix);
      
      // Display the result
      addConsoleMessage(formatResult(result));
      
      // If data is updated, force a re-render
      if (consoleInput.includes('addChange') || consoleInput.includes('createBranch')) {
        setLix({...lix});
      }
    } catch (error) {
      addConsoleMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Clear input
    setConsoleInput('');
  };
  
  // Format the result for display
  const formatResult = (result: any): string => {
    if (result === undefined) {
      return 'undefined';
    }
    
    if (result === null) {
      return 'null';
    }
    
    if (typeof result === 'object') {
      try {
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return '[Object]';
      }
    }
    
    return String(result);
  };
  
  // Generate suggestions based on input
  const generateSuggestions = (input: string): Suggestion[] => {
    if (!input.includes('.')) {
      // Top-level objects
      if (input === 'lix') {
        return [
          { text: 'lix.data', description: 'Access data tables', type: 'object' },
          { text: 'lix.addChange', description: '(parentId, field, value) - Add new change', type: 'method' },
          { text: 'lix.createBranch', description: '(name) - Create new branch', type: 'method' },
          { text: 'lix.getLatestChange', description: '() - Get most recent change', type: 'method' },
          { text: 'lix.getChangeCount', description: '() - Get total changes', type: 'method' },
          { text: 'lix.getSnapshotCount', description: '() - Get total snapshots', type: 'method' },
          { text: 'lix.getVersionCount', description: '() - Get total versions', type: 'method' },
          { text: 'lix.db', description: 'Database interface', type: 'object' },
        ];
      }
      return [];
    }
    
    // Get object path
    const parts = input.split('.');
    const lastPart = parts[parts.length - 1];
    const parentPath = parts.slice(0, parts.length - 1).join('.');
    
    // Lix data tables
    if (parentPath === 'lix.data') {
      return [
        { text: 'lix.data.changes', description: 'Changes array', type: 'property' },
        { text: 'lix.data.snapshots', description: 'Snapshots array', type: 'property' },
        { text: 'lix.data.versions', description: 'Versions array', type: 'property' },
        { text: 'lix.data.version_changes', description: 'Version changes array', type: 'property' },
      ].filter(s => s.text.includes(input));
    }
    
    // Lix db methods
    if (parentPath === 'lix.db') {
      return [
        { text: 'lix.db.selectFrom', description: '(table) - Query a database table', type: 'method' },
      ].filter(s => s.text.includes(input));
    }
    
    return [];
  };
  
  // Handle input changes for autocomplete
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setConsoleInput(value);
    
    // Generate suggestions
    if (value.includes('lix')) {
      const newSuggestions = generateSuggestions(value);
      setSuggestions(newSuggestions);
      setSelectedSuggestion(0);
      setShowSuggestions(newSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // History navigation with up/down arrows
    if (e.key === 'ArrowUp' && !showSuggestions) {
      e.preventDefault();
      
      if (historyIndex < consoleHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setConsoleInput(consoleHistory[consoleHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown' && !showSuggestions) {
      e.preventDefault();
      
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setConsoleInput(consoleHistory[consoleHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setConsoleInput('');
      }
    }
    
    // Suggestion navigation
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        if (suggestions.length > 0) {
          // Complete with selected suggestion
          setConsoleInput(suggestions[selectedSuggestion].text);
          setShowSuggestions(false);
        }
        
        // If Enter was pressed and not Tab, submit the form if selection was applied
        if (e.key === 'Enter' && !e.shiftKey) {
          setTimeout(() => {
            if (inputRef.current) {
              const form = inputRef.current.closest('form');
              if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
            }
          }, 0);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleConsoleSubmit(e);
    }
  };
  
  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [consoleInput]);

  // Focus input on tab clicks
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="wireframe-box p-4">
        <h1>Lix Inspector Console</h1>
        <p>Loading mock data...</p>
      </div>
    );
  }
  
  return (
    <div className="wireframe-box p-4 flex flex-col" style={{ height: '100vh' }}>
      <header className="flex items-center justify-between mb-4">
        <h1>Lix Inspector Console</h1>
        <div className="flex gap-2">
          <a 
            href="/prosemirror" 
            className="wireframe-btn wireframe-btn-primary"
            style={{ textDecoration: 'none', display: 'inline-block', padding: '8px 16px' }}
          >
            ProseMirror Example
          </a>
        </div>
      </header>
      
      <div className="flex gap-4" style={{ flexGrow: 1 }}>
        {/* Database View */}
        <div className="wireframe-box flex flex-col" style={{ width: '50%' }}>
          <div className="flex mb-4 border-b">
            <button 
              className={`px-4 py-2 ${activeTab === 'changes' ? 'bg-blue-500 text-white' : ''}`}
              onClick={() => setActiveTab('changes')}
            >
              changes
            </button>
            <button 
              className={`px-4 py-2 ${activeTab === 'snapshots' ? 'bg-blue-500 text-white' : ''}`}
              onClick={() => setActiveTab('snapshots')}
            >
              snapshots
            </button>
            <button 
              className={`px-4 py-2 ${activeTab === 'versions' ? 'bg-blue-500 text-white' : ''}`}
              onClick={() => setActiveTab('versions')}
            >
              versions
            </button>
            <button 
              className={`px-4 py-2 ${activeTab === 'version_changes' ? 'bg-blue-500 text-white' : ''}`}
              onClick={() => setActiveTab('version_changes')}
            >
              version_changes
            </button>
          </div>
          
          <div style={{ overflow: 'auto', flexGrow: 1, padding: '8px' }}>
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(lix.data[activeTab], null, 2)}
            </pre>
          </div>
        </div>
        
        {/* Console */}
        <div className="wireframe-box p-4 flex flex-col" style={{ width: '50%' }}>
          <div 
            ref={consoleRef}
            style={{ 
              flexGrow: 1,
              overflowY: 'auto', 
              fontFamily: 'monospace',
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              padding: '8px',
              marginBottom: '10px',
              borderRadius: '4px'
            }}
          >
            {consoleOutput.map((line, index) => (
              <div key={index} style={{ whiteSpace: 'pre-wrap', marginBottom: '4px' }}>
                {line}
              </div>
            ))}
          </div>
          
          <form onSubmit={handleConsoleSubmit}>
            <div className="flex" style={{ position: 'relative' }}>
              <div style={{ 
                position: 'absolute', 
                left: '8px', 
                top: '8px', 
                fontFamily: 'monospace', 
                color: '#d4d4d4' 
              }}>
                &gt;
              </div>
              <textarea
                ref={inputRef}
                value={consoleInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                style={{ 
                  flex: '1',
                  backgroundColor: '#1e1e1e',
                  color: '#d4d4d4',
                  fontFamily: 'monospace',
                  outline: 'none',
                  resize: 'none',
                  minHeight: '60px',
                  paddingLeft: '24px',
                  paddingTop: '8px',
                  paddingRight: '8px',
                  paddingBottom: '8px',
                  borderRadius: '4px'
                }}
                placeholder="Type JavaScript expression to evaluate"
              />
              
              {/* Autocomplete suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  ref={suggestionRef}
                  style={{
                    position: 'absolute',
                    top: '60px',
                    left: 0,
                    right: 0,
                    backgroundColor: '#252525',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    zIndex: 10,
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}
                >
                  {suggestions.map((suggestion, index) => (
                    <div 
                      key={suggestion.text}
                      style={{
                        padding: '6px 12px',
                        cursor: 'pointer',
                        backgroundColor: index === selectedSuggestion ? '#0e639c' : 'transparent',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                      onClick={() => {
                        setConsoleInput(suggestion.text);
                        setShowSuggestions(false);
                        inputRef.current?.focus();
                      }}
                      onMouseEnter={() => setSelectedSuggestion(index)}
                    >
                      <span style={{ color: getTypeColor(suggestion.type) }}>
                        {suggestion.text}
                      </span>
                      {suggestion.description && (
                        <span style={{ color: '#888', fontSize: '0.9em', marginLeft: '8px' }}>
                          {suggestion.description}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-between mt-2">
              <span style={{ fontSize: '0.8rem', color: '#666' }}>
                Use Tab to complete, Enter to execute, Shift+Enter for new line
              </span>
              <button 
                type="submit" 
                className="wireframe-btn wireframe-btn-primary"
              >
                Execute
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Helper to get color for suggestion types
function getTypeColor(type: string): string {
  switch (type) {
    case 'property':
      return '#9cdcfe';  // Light blue
    case 'method':
      return '#dcdcaa';  // Yellow
    case 'object':
      return '#4ec9b0';  // Teal
    default:
      return '#d4d4d4';  // Default light gray
  }
}

export default App;