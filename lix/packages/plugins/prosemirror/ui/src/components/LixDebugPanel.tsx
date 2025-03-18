import React from 'react';
import { toBlob } from '@lix-js/sdk';
import { Change } from '@lix-js/sdk';

interface LixDebugPanelProps {
  lix: any;
  currentDoc: any;
  changes: Array<Change & { content: any }>;
}

const LixDebugPanel: React.FC<LixDebugPanelProps> = ({ lix, currentDoc, changes }) => {
  const handleDownloadLixDb = async () => {
    try {
      // Get the Lix database blob using the correct API
      const blob = await toBlob({ lix });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lix-prosemirror-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.lix`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    } catch (error) {
      console.error("Error downloading Lix database:", error);
      alert("Error downloading Lix database: " + (error as Error).message);
    }
  };

  // Function to get a readable content preview for changes
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
    <div className="debug-section" style={{ marginTop: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Debug Tools</h3>
        <div>
          <button 
            onClick={handleDownloadLixDb}
            style={{ 
              backgroundColor: "#f5f5f5", 
              color: "#333", 
              border: "1px solid #ccc", 
              borderRadius: "4px", 
              padding: "5px 10px",
              cursor: "pointer"
            }}
          >
            Download Lix Blob
          </button>
        </div>
      </div>

      <div className="debug-content" style={{ display: "flex", gap: "20px", marginTop: "15px" }}>
        {/* Current Document AST */}
        <div className="debug-panel" style={{ flex: 1 }}>
          <h4>Current Document AST</h4>
          <pre
            style={{
              backgroundColor: "#f5f5f5",
              padding: "10px",
              borderRadius: "4px",
              height: "400px",
              overflow: "auto",
              color: "#333",
            }}
          >
            {JSON.stringify(currentDoc, null, 2)}
          </pre>
        </div>

        {/* All Changes */}
        <div className="debug-panel" style={{ flex: 1 }}>
          <h4>All Changes {changes.length > 0 ? `(${changes.length})` : ""}</h4>
          <div 
            className="change-graph"
            style={{
              backgroundColor: "#f5f5f5",
              padding: "10px",
              borderRadius: "4px",
              height: "400px",
              overflow: "auto",
              color: "#333",
            }}
          >
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
                <p className="empty-message">No changes detected yet. Start editing to see changes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LixDebugPanel;