import React, { useState, useEffect, useRef } from 'react';
import { openLix, newLixFile } from '@lix-js/sdk';
import { LixInspectorComponent } from '../src/index.js';
import type { Lix } from '@lix-js/sdk';

/**
 * This example demonstrates how to integrate Lix Inspector with a ProseMirror editor
 * The inspector uses the auto-attach feature to create a draggable mini-view in the corner
 */
const ProseMirrorExample: React.FC = () => {
  const [lix, setLix] = useState<Lix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string>("This is a ProseMirror document.");
  
  // Reference to the editor container
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Mock ProseMirror editor state and functions
  const [mockPMState, setMockPMState] = useState({
    version: 1,
    docSize: content.length,
    lastModified: Date.now(),
    selection: { from: 0, to: 0 },
  });
  
  // Auto-refresh interval ID
  const refreshTimerRef = useRef<number | null>(null);
  
  // Initialize Lix
  useEffect(() => {
    async function initLix() {
      try {
        setLoading(true);
        
        // Create a new Lix file for the document
        const file = await newLixFile({
          path: 'prosemirror-document.json',
        });
        
        // Open the file
        const newLix = await openLix({
          database: file.database,
        });
        
        // Create initial state in Lix
        await newLix.db.transaction().execute(async (trx) => {
          // Add some mock data that a real ProseMirror plugin would track
          await trx.insertInto('entity').values({
            id: 'doc-root',
            type: 'document',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).execute();
          
          // Add an initial change
          await trx.insertInto('change').values({
            id: 'change-1',
            parent_id: null,
            entity_id: 'doc-root',
            field: 'content',
            value: JSON.stringify(content),
            metadata: JSON.stringify({ 
              timestamp: Date.now(), 
              user: 'example-user', 
              version: 1
            }),
            created_at: new Date().toISOString(),
          }).execute();
          
          // Create initial version
          await trx.insertInto('version').values({
            id: 'version-main',
            name: 'main',
            created_at: new Date().toISOString(),
          }).execute();
          
          // Associate change with version
          await trx.insertInto('version_change').values({
            version_id: 'version-main',
            change_id: 'change-1',
          }).execute();
        });
        
        setLix(newLix);
        setLoading(false);
        
        // Setup refresh timer to simulate real-time changes
        refreshTimerRef.current = window.setInterval(() => {
          simMockProseMirrorChange();
        }, 5000);
      } catch (err) {
        console.error('Error initializing Lix:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }
    
    initLix();
    
    // Cleanup timer on unmount
    return () => {
      if (refreshTimerRef.current) {
        window.clearInterval(refreshTimerRef.current);
      }
    };
  }, []);
  
  // Simulate a ProseMirror change and track it in Lix
  const simMockProseMirrorChange = async () => {
    if (!lix) return;
    
    try {
      // Generate a mock change to the document
      const words = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing'];
      const randomWord = words[Math.floor(Math.random() * words.length)];
      
      // Update the content
      const newContent = content + " " + randomWord;
      setContent(newContent);
      
      // Update mock ProseMirror state
      setMockPMState(state => ({
        ...state,
        version: state.version + 1,
        docSize: newContent.length,
        lastModified: Date.now(),
        selection: { from: newContent.length, to: newContent.length },
      }));
      
      // Record the change in Lix
      // In a real implementation, this would be done by the ProseMirror plugin
      const lastChange = await lix.db
        .selectFrom('change')
        .selectAll()
        .orderBy('created_at', 'desc')
        .limit(1)
        .executeTakeFirst();
      
      if (lastChange) {
        // Create a new change
        const changeId = `change-${Date.now()}`;
        
        await lix.db.insertInto('change').values({
          id: changeId,
          parent_id: lastChange.id,
          entity_id: 'doc-root',
          field: 'content',
          value: JSON.stringify(newContent),
          metadata: JSON.stringify({ 
            timestamp: Date.now(),
            user: 'example-user',
            version: mockPMState.version + 1
          }),
          created_at: new Date().toISOString(),
        }).execute();
        
        // Associate with version
        await lix.db.insertInto('version_change').values({
          version_id: 'version-main',
          change_id: changeId,
        }).execute();
        
        // Add edge to connect changes
        await lix.db.insertInto('change_edge').values({
          parent_id: lastChange.id,
          child_id: changeId,
        }).execute();
      }
    } catch (err) {
      console.error('Error updating document:', err);
    }
  };
  
  // Handle user input (simplified ProseMirror interaction)
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Update mock PM state
    setMockPMState(state => ({
      ...state,
      version: state.version + 1,
      docSize: newContent.length,
      lastModified: Date.now(),
      selection: { 
        from: e.target.selectionStart || newContent.length,
        to: e.target.selectionEnd || newContent.length
      },
    }));
    
    // Record the change in Lix (in a real app this would be debounced)
    if (lix) {
      // Implementation would go here - omitted for brevity
      // This would be handled by the ProseMirror plugin
    }
  };
  
  if (loading) {
    return <div className="wireframe-box p-4">Loading editor...</div>;
  }
  
  if (error) {
    return <div className="wireframe-box p-4 text-red-500">Error: {error}</div>;
  }
  
  return (
    <div className="wireframe-container">
      {/* Editor Header */}
      <header className="wireframe-header">
        <h1>ProseMirror-Inspired Editor with Lix Inspector</h1>
        <div className="wireframe-toolbar">
          <button className="wireframe-btn">Bold</button>
          <button className="wireframe-btn">Italic</button>
          <button className="wireframe-btn">Link</button>
          <span className="wireframe-separator"></span>
          <button className="wireframe-btn">Heading</button>
          <button className="wireframe-btn">List</button>
          <span className="wireframe-separator"></span>
          <button className="wireframe-btn" onClick={() => simMockProseMirrorChange()}>
            Insert Random Word
          </button>
        </div>
      </header>
      
      {/* Editor Content */}
      <div className="wireframe-content-area" ref={editorRef}>
        <div className="wireframe-editor">
          <textarea 
            value={content}
            onChange={handleInputChange}
            className="wireframe-editor-input"
            placeholder="Start typing..."
          />
        </div>
        
        <div className="wireframe-sidebar">
          <div className="wireframe-box p-4 mb-4">
            <h3 className="wireframe-title">Document Info</h3>
            <div className="wireframe-info-item">
              <span>Version:</span>
              <span>{mockPMState.version}</span>
            </div>
            <div className="wireframe-info-item">
              <span>Size:</span>
              <span>{mockPMState.docSize} chars</span>
            </div>
            <div className="wireframe-info-item">
              <span>Last modified:</span>
              <span>{new Date(mockPMState.lastModified).toLocaleTimeString()}</span>
            </div>
            <div className="wireframe-info-item">
              <span>Selection:</span>
              <span>{mockPMState.selection.from}→{mockPMState.selection.to}</span>
            </div>
          </div>
          
          <div className="wireframe-box p-4">
            <h3 className="wireframe-title">Change History</h3>
            <p className="wireframe-note">
              Changes are tracked and can be viewed in the Lix Inspector.
              Click the floating "Lix" button in the corner to access the inspector.
            </p>
          </div>
        </div>
      </div>
      
      {/* Lix Inspector - Auto-attached */}
      {lix && (
        <LixInspectorComponent 
          lix={lix} 
          options={{
            theme: 'light',
            autoRefreshInterval: 1000,
            position: 'bottom-right',
            autoAttach: true,
            maxHistorySize: 50,
          }}
        />
      )}
      
      {/* CSS Styles */}
      <style jsx>{`
        .wireframe-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          display: flex;
          flex-direction: column;
          height: 100vh;
          color: #333;
          background-color: #f5f5f5;
        }
        
        .wireframe-header {
          padding: 16px;
          border-bottom: 1px solid #ddd;
          background-color: white;
        }
        
        .wireframe-header h1 {
          margin: 0 0 16px 0;
          font-size: 1.5rem;
          font-weight: 500;
        }
        
        .wireframe-toolbar {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .wireframe-btn {
          padding: 6px 12px;
          border: 1px solid #ddd;
          background-color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }
        
        .wireframe-btn:hover {
          background-color: #f9f9f9;
        }
        
        .wireframe-separator {
          width: 1px;
          height: 24px;
          background-color: #ddd;
          margin: 0 4px;
        }
        
        .wireframe-content-area {
          display: flex;
          flex-grow: 1;
          overflow: hidden;
        }
        
        .wireframe-editor {
          flex-grow: 1;
          padding: 20px;
          overflow: auto;
          background-color: white;
          border-right: 1px solid #ddd;
        }
        
        .wireframe-editor-input {
          width: 100%;
          height: 100%;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: 'Merriweather', Georgia, serif;
          font-size: 1rem;
          line-height: 1.6;
          resize: none;
          outline: none;
        }
        
        .wireframe-sidebar {
          width: 300px;
          padding: 20px;
          overflow-y: auto;
          background-color: #f9f9f9;
        }
        
        .wireframe-box {
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: white;
        }
        
        .wireframe-title {
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 1rem;
          font-weight: 500;
          color: #333;
        }
        
        .wireframe-info-item {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .wireframe-info-item:last-child {
          border-bottom: none;
        }
        
        .wireframe-note {
          font-size: 0.875rem;
          color: #666;
          margin: 0;
          line-height: 1.5;
        }
        
        .p-4 {
          padding: 16px;
        }
        
        .mb-4 {
          margin-bottom: 16px;
        }
        
        .text-red-500 {
          color: #ef4444;
        }
      `}</style>
    </div>
  );
};

export default ProseMirrorExample;