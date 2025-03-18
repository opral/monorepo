import React from 'react';
import { toBlob } from '@lix-js/sdk';

interface LixDebugPanelProps {
  lix: any;
  currentDoc: any;
}

const LixDebugPanel: React.FC<LixDebugPanelProps> = ({ lix, currentDoc }) => {
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

  const handlePrintChangeCounts = async () => {
    try {
      // Get change counts from the database
      const changeCounts = await lix.db
        .selectFrom('change')
        .innerJoin('file', 'change.file_id', 'file.id')
        .where('file.path', '=', '/prosemirror.json')
        .select(lix.db.fn.count('change.id').as('count'))
        .executeTakeFirst();
      
      console.log('Change counts:', changeCounts);
      alert(`Total changes for /prosemirror.json: ${changeCounts?.count || 0}`);
    } catch (error) {
      console.error('Error counting changes:', error);
    }
  };

  return (
    <div className="debug-section" style={{ marginTop: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Debug Tools</h3>
        <div>
          <button 
            onClick={handleDownloadLixDb}
            style={{ 
              backgroundColor: "#4a90e2", 
              color: "white", 
              border: "none", 
              borderRadius: "4px", 
              padding: "5px 10px",
              marginRight: "10px",
              cursor: "pointer"
            }}
          >
            Download Lix Blob
          </button>
          <button 
            onClick={handlePrintChangeCounts}
            style={{ 
              backgroundColor: "#9c27b0", 
              color: "white", 
              border: "none", 
              borderRadius: "4px", 
              padding: "5px 10px",
              cursor: "pointer"
            }}
          >
            Count Changes
          </button>
        </div>
      </div>

      <h4 style={{ marginTop: "15px" }}>Current Document AST</h4>
      <pre
        style={{
          backgroundColor: "#f5f5f5",
          padding: "10px",
          borderRadius: "4px",
          maxHeight: "200px",
          overflow: "auto",
          color: "#333",
        }}
      >
        {JSON.stringify(currentDoc, null, 2)}
      </pre>
    </div>
  );
};

export default LixDebugPanel;