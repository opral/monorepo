import React from 'react';
import { Change } from '@lix-js/sdk';

interface ChangesDisplayProps {
  changes: Array<Change & { content: any }>;
}

const ChangesDisplay: React.FC<ChangesDisplayProps> = ({ changes }) => {
  // Function to get a readable content preview
  const getContentPreview = (change: Change & { content: any }): string => {
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
      <h3>Change Graph {changes.length > 0 ? `(${changes.length} changes)` : ""}</h3>
      
      <div className="change-graph">
        {changes.length > 0 ? (
          changes.map((change, index, array) => (
            <div key={`change-${change.id}`} className="change-group">
              <div className="graph-node">
                <div className="graph-dot"></div>
                {index < array.length - 1 && <div className="graph-line"></div>}
              </div>
              
              <div className="change-content-wrapper">
                <div className="change-timestamp">
                  <strong>{new Date(change.created_at).toLocaleString()}</strong>
                </div>

                <div className="change-item-container">
                  {/* For simplicity, we'll consider all changes as "Added" since we don't have
                      a reliable way to determine if it's a modification without additional metadata */}
                  <div className={`change-item change-${!change.content ? "deleted" : "added"}`}>
                    <div className="change-header">
                      <span className="change-type">{!change.content ? "Deleted" : "Added"}</span>
                      <span className="change-node-type">{change.content?.type || "Unknown"}</span>
                    </div>
                    <div className="change-content">
                      <span className="change-preview">{getContentPreview(change)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
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