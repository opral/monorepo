import React, { useState } from 'react';
import { Change } from '@lix-js/sdk';
import { createCheckpoint } from '../utilities/createCheckpoint';
import { lix, checkpoints as stateCheckpoints } from '../state';

interface CheckpointsProps {
  changes: Array<Change & { content: any }>;
}

// Extend the Change type to include an optional metadata property
interface ExtendedChange extends Change {
  content: any;
  metadata?: string | Record<string, any>;
}

// Format time for display in user's local timezone
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  
  // Format with date and time in user's locale
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

// Get a summary preview from a change or checkpoint
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

// Get a summary preview from a checkpoint
const getCheckpointPreview = (changes: Array<Change & { content: any }>): string => {
  if (!changes || changes.length === 0) return "Empty checkpoint";
  
  // Get the first change with content
  const changeWithContent = changes.find(c => c.content);
  if (changeWithContent) {
    return getContentPreview(changeWithContent as ExtendedChange);
  }
  
  return `Checkpoint with ${changes.length} changes`;
};

const Checkpoints: React.FC<CheckpointsProps> = ({ changes }) => {
  // State for selected checkpoint
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string | null>(null);
  const [isCreatingCheckpoint, setIsCreatingCheckpoint] = useState(false);

  // Handler for creating a checkpoint
  const handleCreateCheckpoint = async () => {
    if (isCreatingCheckpoint || changes.length === 0) return;
    
    try {
      setIsCreatingCheckpoint(true);
      
      // Get the latest change IDs to include in the checkpoint
      const changeIds = changes.map(change => ({ id: change.id }));
      
      // Create the checkpoint
      await createCheckpoint(lix, changeIds);
    } catch (error) {
      console.error('Failed to create checkpoint:', error);
    } finally {
      setIsCreatingCheckpoint(false);
    }
  };

  return (
    <div className="checkpoints-container">
      <div className="checkpoints-header">
        <h3>History</h3>
        <button 
          className="create-checkpoint-button"
          onClick={handleCreateCheckpoint}
          disabled={isCreatingCheckpoint || changes.length === 0}
        >
          {isCreatingCheckpoint ? 'Creating...' : 'Create Checkpoint'}
        </button>
      </div>
      
      <div className="checkpoints-list">
        {stateCheckpoints.length > 0 ? (
          stateCheckpoints.map((checkpoint) => {
            const isSelected = checkpoint.id === selectedCheckpointId;
            
            return (
              <div 
                key={`checkpoint-${checkpoint.id}`} 
                className={`checkpoint-item ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedCheckpointId(checkpoint.id)}
              >
                <div className="checkpoint-timestamp">
                  <strong>{formatTime(checkpoint.created_at)}</strong>
                </div>
                <div className="checkpoint-preview">
                  {getCheckpointPreview(checkpoint.changes)}
                </div>
                <div className="checkpoint-changes-count">
                  {checkpoint.changes.length} changes
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
