import React, { useState } from 'react';
import { Change } from '@lix-js/sdk';
import { createCheckpoint } from '../utilities/createCheckpoint';
import { toUserTime } from "../utilities/timeUtils";
import { lix, checkpoints as stateCheckpoints } from '../state';

interface CheckpointsProps {
  changes: Array<Change & { content: any }>;
}

// Extend the Change type to include an optional metadata property
interface ExtendedChange extends Change {
	content: any;
	metadata?: string | Record<string, any>;
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
		<div
			className="checkpoints-container"
			style={{ border: "1px solid #ddd", borderRadius: "4px" }}
		>
			<div
				className="checkpoints-header"
				style={{
					padding: "10px",
					borderBottom: "1px solid #ddd",
					background: "#f9f9f9",
				}}
			>
				<h3 style={{ margin: "0 0 10px 0" }}>History</h3>
				<button
					style={{
						padding: "5px 10px",
						background: "#f9f9f9",
						border: "1px solid #ddd",
						borderRadius: "4px",
						cursor:
							isCreatingCheckpoint || changes.length === 0
								? "not-allowed"
								: "pointer",
						opacity: isCreatingCheckpoint || changes.length === 0 ? 0.6 : 1,
					}}
					onClick={handleCreateCheckpoint}
					disabled={isCreatingCheckpoint || changes.length === 0}
				>
					{isCreatingCheckpoint ? "Creating..." : "Create Checkpoint"}
				</button>
			</div>

			<div
				className="checkpoints-list"
				style={{ maxHeight: "400px", overflow: "auto" }}
			>
				{stateCheckpoints.length > 0 ? (
					stateCheckpoints.map((checkpoint) => {
						const isSelected = checkpoint.id === selectedCheckpointId;

						return (
							<div
								key={`checkpoint-${checkpoint.id}`}
								style={{
									padding: "10px",
									borderBottom: "1px solid #eee",
									background: isSelected ? "#f5f5f5" : "white",
									cursor: "pointer",
								}}
								onClick={() => setSelectedCheckpointId(checkpoint.id)}
							>
								<div style={{ fontWeight: "normal", marginBottom: "3px" }}>
									{toUserTime(checkpoint.created_at)}
								</div>
								<div style={{ marginBottom: "3px", fontSize: "0.9em" }}>
									{getCheckpointPreview(checkpoint.changes)}
								</div>
								<div style={{ fontSize: "0.8em", color: "#666" }}>
									{checkpoint.changes.length} changes
								</div>
							</div>
						);
					})
				) : (
					<div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
						<p>
							No checkpoints available. Create your first checkpoint to save a
							version of your document.
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default Checkpoints;
