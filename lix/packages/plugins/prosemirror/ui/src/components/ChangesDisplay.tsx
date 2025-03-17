import React from 'react';
import { Change } from '@lix-js/sdk';

interface ChangesDisplayProps {
  changes: Array<Change & { content: any }>;
}

const ChangesDisplay: React.FC<ChangesDisplayProps> = ({ changes }) => {
  if (!changes || changes.length === 0) {
    return (
      <div className="changes-empty">
        <p>No changes detected yet.</p>
      </div>
    );
  }

  // Group changes by timestamp
  const groupedChanges = changes.reduce((acc: Record<string, Array<Change & { content: any }>>, change) => {
    const timestamp = new Date(change.created_at).toLocaleString();
    if (!acc[timestamp]) {
      acc[timestamp] = [];
    }
    acc[timestamp].push(change);
    return acc;
  }, {});

  return (
    <div className="changes-container">
      <h3>Document History ({changes.length} changes)</h3>
      
      {Object.entries(groupedChanges).map(([timestamp, changeGroup], groupIndex) => (
        <div key={`group-${groupIndex}`} className="change-group">
          <div className="change-timestamp">
            <strong>{timestamp}</strong> - {changeGroup.length} change{changeGroup.length > 1 ? 's' : ''}
          </div>
          
          <ul className="change-list">
            {changeGroup.map((change, changeIndex) => {
              // Extract the entity type from the entity_id (assuming format like "paragraph-123456")
              const entityType = change.entity_id?.split('-')[0] || 'unknown';
              
              // Determine change type
              let changeType = "Modified";
              if (!change.content) {
                changeType = "Deleted";
              } else if (change.created_at === change.first_seen_at) {
                changeType = "Added";
              }

              // Get a preview of the content
              let contentPreview = "No content";
              if (change.content && typeof change.content === 'object') {
                // For text nodes, show the text content
                if (change.content.text) {
                  contentPreview = change.content.text.substring(0, 40) + 
                    (change.content.text.length > 40 ? '...' : '');
                } 
                // For paragraph nodes, try to extract content from their children
                else if (change.content.content && Array.isArray(change.content.content)) {
                  const textNodes = change.content.content
                    .filter(node => node.type === 'text' && node.text)
                    .map(node => node.text);
                  
                  if (textNodes.length > 0) {
                    const combinedText = textNodes.join(' ');
                    contentPreview = combinedText.substring(0, 40) + 
                      (combinedText.length > 40 ? '...' : '');
                  } else {
                    contentPreview = `${entityType} (empty)`;
                  }
                } else {
                  contentPreview = `${entityType} ${changeType}`;
                }
              }

              return (
                <li key={`change-${change.id}`} className={`change-item change-${changeType.toLowerCase()}`}>
                  <div className="change-header">
                    <span className="change-type">{changeType}</span>
                    <span className="change-entity">{entityType}</span>
                    <span className="change-id">{change.entity_id}</span>
                  </div>
                  <div className="change-content">
                    <span className="change-preview">{contentPreview}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default ChangesDisplay;