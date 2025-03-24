import React, { useState, useEffect } from 'react';
import { openLix, newLixFile } from '@lix-js/sdk';
import { LixInspectorComponent } from '../src/index.js';
import type { Lix } from '@lix-js/sdk';

const LixInspectorExample: React.FC = () => {
  const [lix, setLix] = useState<Lix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function initLix() {
      try {
        setLoading(true);
        
        // Create a new Lix file
        const file = await newLixFile({
          path: 'example.json',
        });
        
        // Open the file
        const newLix = await openLix({
          database: file.database,
        });
        
        setLix(newLix);
        setLoading(false);
      } catch (err) {
        console.error('Error initializing Lix:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }
    
    initLix();
  }, []);
  
  if (loading) {
    return <div>Loading Lix...</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  if (!lix) {
    return <div>Lix failed to initialize</div>;
  }
  
  return (
    <div className="container">
      <h1>Lix Inspector Example</h1>
      
      <LixInspectorComponent 
        lix={lix} 
        options={{
          theme: 'auto',
          autoRefreshInterval: 2000,
        }}
        style={{ height: '80vh' }}
      />
    </div>
  );
};

export default LixInspectorExample;