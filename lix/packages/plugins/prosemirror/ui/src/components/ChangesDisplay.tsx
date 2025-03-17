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
}

const ChangesDisplay: React.FC<ChangesDisplayProps> = ({ changes, previousDoc }) => {
  // Function to find a node by ID in a document
  const findNodeById = (doc: any, id: string): any => {
    if (!doc || !doc.content) return null;
    
    // Check if this is the node we're looking for
    if (doc._id === id) return doc;
    
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
    
    if (node.content && node.content.length) {
      // For text-containing nodes, show some content
      const hasText = node.content.some((child: any) => 
        child.type === 'text' && child.text
      );
      
      if (hasText) {
        const textContent = node.content
          .filter((child: any) => child.type === 'text')
          .map((child: any) => child.text)
          .join('');
        
        const preview = textContent.length > 30 
          ? textContent.substring(0, 30) + '...' 
          : textContent;
        
        description += `: "${preview}"`;
      }
    }
    
    // For nodes with attributes, show them
    if (node.attrs) {
      const attrString = Object.entries(node.attrs)
        .filter(([key]) => key !== '_id') // Don't show _id as it's internal
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(', ');
      
      if (attrString) {
        description += ` [${attrString}]`;
      }
    }
    
    return description;
  };

  return (
    <div className="changes-container">
      <h3>Detected Changes ({changes.length})</h3>
      
      {changes.length === 0 && (
        <p>No changes detected yet. Try editing the document.</p>
      )}
      
      {changes.map((change, index) => {
        const changeType = getChangeType(change);
        const changeClass = `change-item change-${changeType}`;
        
        return (
          <div key={index} className={changeClass}>
            <strong>{changeType.toUpperCase()}: </strong>
            <span>{change.entity_id}</span>
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