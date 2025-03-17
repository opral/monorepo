import { useState, useEffect } from 'react';
import { openLixInMemory } from '@lix-js/sdk';
import { detectChanges } from '@lix-js/plugin-prosemirror';
import Editor from './components/Editor';
import ChangesDisplay from './components/ChangesDisplay';

function App() {
  const [currentDoc, setCurrentDoc] = useState<any>({ type: 'doc', content: [] });
  const [previousDoc, setPreviousDoc] = useState<any>({ type: 'doc', content: [] });
  const [changes, setChanges] = useState<any[]>([]);
  const [lix, setLix] = useState<any>(null);

  // Initialize Lix on component mount
  useEffect(() => {
    async function initLix() {
      const lixInstance = await openLixInMemory({});
      setLix(lixInstance);
    }
    
    initLix();
  }, []);

  // Handle doc changes from the editor
  const handleDocChange = async (newDoc: any) => {
    if (!lix) return;

    // Save the previous document state
    setPreviousDoc(currentDoc);
    
    // Update current document
    setCurrentDoc(newDoc);

    try {
      // Create files for the before and after states
      const before = {
        id: 'prosemirror-doc',
        path: '/prosemirror.json',
        data: new TextEncoder().encode(JSON.stringify(currentDoc)),
        metadata: null
      };
      
      const after = {
        id: 'prosemirror-doc',
        path: '/prosemirror.json',
        data: new TextEncoder().encode(JSON.stringify(newDoc)),
        metadata: null
      };

      // Detect changes using the ProseMirror plugin
      const detectedChanges = await detectChanges?.({
        lix,
        before,
        after
      });

      if (detectedChanges && detectedChanges.length > 0) {
        // Add detected changes to the current set
        setChanges(prev => [...detectedChanges, ...prev].slice(0, 15)); // Keep latest 15 changes
      }
    } catch (error) {
      console.error('Error detecting changes:', error);
    }
  };

  // Clear all detected changes
  const clearChanges = () => {
    setChanges([]);
  };

  return (
    <div className="app-container">
      <h1>ProseMirror Plugin Demo</h1>
      <p>This demo shows how changes in a ProseMirror editor are detected by the Lix plugin.</p>
      
      <Editor onChange={handleDocChange} />
      
      <div className="changes-section">
        <div className="changes-header">
          <h2>Change Detection</h2>
          <button onClick={clearChanges}>Clear Changes</button>
        </div>
        <ChangesDisplay changes={changes} previousDoc={previousDoc} />
      </div>
    </div>
  );
}

export default App;