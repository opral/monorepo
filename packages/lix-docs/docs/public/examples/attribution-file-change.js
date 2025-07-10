/**
 * Attribution Example: File change attribution
 * 
 * This example shows how to query attribution for file-level changes
 * to see who last modified a specific file.
 */

import { openLix, InMemoryStorage } from '@lix-js/sdk';

async function demonstrateFileChangeAttribution() {
  // Create a new lix file in memory
  const lix = await openLix({ storage: new InMemoryStorage() });
  
  // Add user accounts
  await lix.db.insertInto('account').values([
    { id: 'dev1', name: 'Sarah Wilson' },
    { id: 'dev2', name: 'Mike Chen' }
  ]).execute();
  
  // Create file entities
  await lix.db.insertInto('state').values([
    {
      entity_id: 'file-1',
      schema_key: 'file',
      file_id: '/example.json',
      plugin_key: 'core',
      snapshot_content: JSON.stringify({ 
        path: '/example.json',
        content: '{"name": "example", "version": "1.0.0"}',
        size: 45
      }),
      schema_version: '1.0.0'
    },
    {
      entity_id: 'file-2',
      schema_key: 'file',
      file_id: '/config.json',
      plugin_key: 'core',
      snapshot_content: JSON.stringify({ 
        path: '/config.json',
        content: '{"debug": true, "port": 3000}',
        size: 32
      }),
      schema_version: '1.0.0'
    }
  ]).execute();
  
  // Update the example.json file to create change history
  await lix.db.updateTable('state')
    .set('snapshot_content', JSON.stringify({ 
      path: '/example.json',
      content: '{"name": "example", "version": "2.0.0"}',
      size: 45
    }))
    .where('file_id', '=', '/example.json')
    .execute();
  
  console.log('Querying file change attribution...');
  
  // Query file change attribution
  const fileChangeAuthor = await lix.db
    .selectFrom("state")
    .innerJoin("change_author", "state.change_id", "change_author.change_id")
    .innerJoin("account", "change_author.account_id", "account.id")
    .where("state.file_id", "=", "/example.json")
    .orderBy("state.created_at", "desc")
    .select(['account.name', 'state.created_at', 'state.file_id', 'state.snapshot_content'])
    .executeTakeFirst();
  
  if (fileChangeAuthor) {
    console.log(
      `${fileChangeAuthor.file_id} was last modified by ${fileChangeAuthor.name} at ${fileChangeAuthor.created_at}`
    );
    const fileContent = JSON.parse(fileChangeAuthor.snapshot_content);
    console.log('Current file content:', fileContent);
  } else {
    console.log('No file change attribution found');
    console.log('This is expected in this demo - change tracking needs proper setup');
  }
  
  // Alternative: Query directly from internal_change table
  const directFileHistory = await lix.db
    .selectFrom('internal_change')
    .innerJoin('change_author', 'internal_change.id', 'change_author.change_id')
    .innerJoin('account', 'change_author.account_id', 'account.id')
    .where('internal_change.file_id', '=', '/example.json')
    .orderBy('internal_change.created_at', 'desc')
    .select(['account.name', 'internal_change.created_at', 'internal_change.file_id'])
    .executeTakeFirst();
  
  console.log('Direct file change history:', directFileHistory || 'No change history found');
  
  // Show all files in the system
  const allFiles = await lix.db
    .selectFrom('state')
    .where('schema_key', '=', 'file')
    .select(['entity_id', 'file_id', 'created_at'])
    .execute();
  
  console.log('All files in system:');
  allFiles.forEach(file => {
    console.log(`- ${file.file_id} (${file.entity_id}) created at ${file.created_at}`);
  });
  
  return {
    fileChangeAuthor,
    directFileHistory,
    allFiles
  };
}

// Run the demonstration
demonstrateFileChangeAttribution().then(result => {
  console.log('Final Result:', result);
}).catch(error => {
  console.error('Error:', error);
});