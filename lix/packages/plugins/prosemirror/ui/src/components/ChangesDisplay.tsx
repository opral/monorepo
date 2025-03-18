import React, { useState } from 'react';
import { Change } from '@lix-js/sdk';

interface ChangesDisplayProps {
  changes: Array<Change & { content: any }>;
}

// Extend the Change type to include an optional metadata property
interface ExtendedChange extends Change {
  content: any;
  metadata?: string | Record<string, any>;
}

const ChangesDisplay: React.FC<ChangesDisplayProps> = ({ changes }) => {
  // State for filter settings
  const [showCheckpoints, setShowCheckpoints] = useState(true);
  
  // Function to determine if a change is a checkpoint
  // For now, we'll consider changes with metadata.checkpoint = true as checkpoints
  // or changes with metadata.type = 'checkpoint'
  const isCheckpoint = (change: ExtendedChange): boolean => {
    if (!change.metadata) return false;
    
    try {
      const metadata = typeof change.metadata === 'string' 
        ? JSON.parse(change.metadata) 
        : change.metadata;
        
      return metadata.checkpoint === true || metadata.type === 'checkpoint';
    } catch (e) {
      return false;
    }
  };
  
  // Filter changes based on current filter settings
  const filteredChanges = changes.filter(change => {
    if (!showCheckpoints && isCheckpoint(change as ExtendedChange)) {
      return false;
    }
    return true;
  });

  // Function to get a readable content preview
  const getContentPreview = (change: ExtendedChange): string => {
    if (!change.content) return "Content deleted";
    
    if (typeof change.content === "object") {
      // For text nodes, show the text content
      if (change.content.text) {
        return change.content.text.substring(0, 60) + 
               (change.content.text.length > 60 ? "..." : "");
      }
      
      // For paragraph nodes, extract content from their children
      if (change.content.content && Array.isArray(change.content.content)) {
        const textNodes = change.content.content
          .filter((node: any) => node.type === "text" && node.text)
          .map((node: any) => node.text);

        if (textNodes.length > 0) {
          const combinedText = textNodes.join(" ");
          return combinedText.substring(0, 60) + 
                 (combinedText.length > 60 ? "..." : "");
        }
      }
      
      // For other node types
      return `${change.content.type || "Unknown"} node`;
    }
    
    return "Unknown content";
  };

  return (
    <div className="changes-container">
      <h3>Change Graph {filteredChanges.length > 0 ? `(${filteredChanges.length} changes)` : ""}</h3>
      
      <div className="filter-controls">
        <label className="filter-checkbox">
          <input 
            type="checkbox" 
            checked={showCheckpoints} 
            onChange={() => setShowCheckpoints(!showCheckpoints)}
          />
          Checkpoints
        </label>
      </div>
      
      <div className="change-graph">
        {filteredChanges.length > 0 ? (
          filteredChanges.map((change, index, array) => {
            const extendedChange = change as ExtendedChange;
            const isCheckpointChange = isCheckpoint(extendedChange);
            
            return (
              <div key={`change-${change.id}`} className="change-group">
                <div className="graph-node">
                  <div className={`graph-dot ${isCheckpointChange ? 'checkpoint-dot' : ''}`}></div>
                  {index < array.length - 1 && <div className="graph-line"></div>}
                </div>
                
                <div className="change-content-wrapper">
                  <div className="change-timestamp">
                    <strong>{new Date(change.created_at).toLocaleString()}</strong>
                    {isCheckpointChange && <span className="checkpoint-badge">Checkpoint</span>}
                  </div>

                  <div className="change-item-container">
                    {/* For simplicity, we'll consider all changes as "Added" since we don't have
                        a reliable way to determine if it's a modification without additional metadata */}
                    <div className={`change-item change-${!change.content ? "deleted" : "added"} ${isCheckpointChange ? 'checkpoint-item' : ''}`}>
                      <div className="change-header">
                        <span className="change-type">{!change.content ? "Deleted" : "Added"}</span>
                        <span className="change-node-type">{change.content?.type || "Unknown"}</span>
                      </div>
                      <div className="change-content">
                        <span className="change-preview">{getContentPreview(extendedChange)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-graph">
            <div className="change-content-wrapper">
              <p className="empty-message">No changes detected yet. Start editing to see changes.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangesDisplay;