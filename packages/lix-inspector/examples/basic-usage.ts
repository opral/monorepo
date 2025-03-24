import { openLix, newLixFile } from '@lix-js/sdk';
import { createLixInspector } from '../src/index.js';

async function example() {
  // Create a new Lix file
  const file = await newLixFile({
    path: 'example.json',
  });
  
  // Open the file
  const lix = await openLix({
    database: file.database,
  });
  
  // Create the inspector
  const inspector = createLixInspector(lix, {
    theme: 'dark',
    autoRefreshInterval: 1000,
  });
  
  // Create a container element (in a real app, this would be part of your DOM)
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '500px';
  document.body.appendChild(container);
  
  // Mount the inspector to the container
  inspector.mount(container);
  
  // Subscribe to events
  inspector.on('change', (changes) => {
    console.log('Changes detected:', changes);
  });
  
  // Create some changes after a delay to demonstrate functionality
  setTimeout(async () => {
    // Create a version
    const version = await lix.db
      .insertInto('version')
      .values({ name: 'main' })
      .returning('id')
      .executeTakeFirstOrThrow();
      
    console.log('Created version:', version);
    
    // Simulate some user actions that would create changes
    // In a real app, this would be done through the Lix API
    
  }, 1000);
  
  // Start tracking changes automatically
  inspector.startTracking();
  
  return {
    lix,
    inspector,
    // Return this to allow cleanup in real usage
    cleanup: () => {
      inspector.unmount();
      document.body.removeChild(container);
    }
  };
}

// In a real browser environment, this would be executed
if (typeof window !== 'undefined') {
  example().catch(console.error);
}

export { example };