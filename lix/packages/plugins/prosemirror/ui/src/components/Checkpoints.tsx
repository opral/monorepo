import React, { useState } from 'react';
import { Change } from '@lix-js/sdk';

interface CheckpointsProps {
  changes: Array<Change & { content: any }>;
}

// Extend the Change type to include an optional metadata property
interface ExtendedChange extends Change {
  content: any;
  metadata?: string | Record<string, any>;
}

const Checkpoints: React.FC<CheckpointsProps> = ({ changes }) => {
  // State for selected checkpoint
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string | null>(null);
  
  // Function to determine if a change is a checkpoint
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
  
  // Filter changes to only show checkpoints
  const checkpoints = changes.filter(change => isCheckpoint(change as ExtendedChange));

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
    <div className="checkpoints-container">
      <div className="checkpoints-header">
        <h3>History</h3>
        <button className="create-checkpoint-button">
          Create Checkpoint
        </button>
      </div>
      
      <div className="checkpoints-list">
        {checkpoints.length > 0 ? (
          checkpoints.map((checkpoint) => {
            const extendedCheckpoint = checkpoint as ExtendedChange;
            const isSelected = checkpoint.id === selectedCheckpointId;
            
            return (
              <div 
                key={`checkpoint-${checkpoint.id}`} 
                className={`checkpoint-item ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedCheckpointId(checkpoint.id)}
              >
                <div className="checkpoint-timestamp">
                  <strong>{new Date(checkpoint.created_at).toLocaleString()}</strong>
                </div>
                <div className="checkpoint-preview">
                  {getContentPreview(extendedCheckpoint)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-checkpoints">
            <p>No checkpoints available. Create your first checkpoint to save a version of your document.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkpoints;
