import React from 'react';

// Change types from the prosemirror plugin
interface Change {
  entity_id: string;
  schema: {
    key: string;
    type: string;
  };
  snapshot?: any;
}

interface ChangesDisplayProps {
  changes: Change[];
  previousDoc: any;
  onRollbackChange?: (change: Change) => void;
}

const ChangesDisplay: React.FC<ChangesDisplayProps> = ({ changes, previousDoc, onRollbackChange }) => {
  // Function to find a node by ID in a document
  const findNodeById = (doc: any, id: string): any => {
    if (!doc || typeof doc !== 'object') return null;
    
    // Check if this is the node we're looking for
    if (doc.attrs?._id === id) return doc;
    
    // If no content, return null
    if (!Array.isArray(doc.content)) return null;
    
    // Recursively search through content
    for (const node of doc.content) {
      const found = findNodeById(node, id);
      if (found) return found;
    }
    
    return null;
  };

  // Determine change type (add, update, delete)
  const getChangeType = (change: Change): 'add' | 'update' | 'delete' => {
    if (!change.snapshot) return 'delete';
    
    const nodeInPreviousDoc = findNodeById(previousDoc, change.entity_id);
    return nodeInPreviousDoc ? 'update' : 'add';
  };

  // Get a simplified description of the node
  const getNodeDescription = (node: any): string => {
    if (!node) return 'Unknown node';
    
    let description = `${node.type}`;
    
    // Extract text content from node
    const extractText = (n: any): string => {
      if (!n) return '';
      
      // Direct text node
      if (n.type === 'text' && n.text) {
        return n.text;
      }
      
      // Node with content
      if (Array.isArray(n.content)) {
        return n.content.map(extractText).join('');
      }
      
      return '';
    };
    
    // Get text content
    const textContent = extractText(node);
    if (textContent) {
      const preview = textContent.length > 30 
        ? textContent.substring(0, 30) + '...' 
        : textContent;
      
      description += `: "${preview}"`;
    }
    
    // Show attributes except for _id
    if (node.attrs) {
      const validAttrs = Object.entries(node.attrs)
        .filter(([key]) => key !== '_id') // Don't show _id as it's internal
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(', ');
      
      if (validAttrs) {
        description += ` [${validAttrs}]`;
      }
    }
    
    return description;
  };

  return (
    <div className="changes-container">
      {changes.length === 0 && (
        <p>No changes detected yet. Take a snapshot and make some edits!</p>
      )}
      
      {changes.map((change, index) => {
        const changeType = getChangeType(change);
        const changeClass = `change-item change-${changeType}`;
        
        return (
          <div key={index} className={changeClass}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{changeType.toUpperCase()}: </strong>
                <span>{change.entity_id}</span>
              </div>
              
              {onRollbackChange && (
                <button 
                  onClick={() => onRollbackChange(change)}
                  style={{ 
                    fontSize: '12px', 
                    padding: '2px 6px',
                    backgroundColor: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Rollback
                </button>
              )}
            </div>
            
            {changeType !== 'delete' && change.snapshot && (
              <div>
                <small>{getNodeDescription(change.snapshot)}</small>
              </div>
            )}
            {changeType === 'delete' && (
              <div>
                <small>Node deleted</small>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ChangesDisplay;