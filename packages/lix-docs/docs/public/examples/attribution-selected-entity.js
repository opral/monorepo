/**
 * Attribution Example: Find out who authored a change
 * 
 * This example shows how to query attribution for a specific entity
 * that a user has selected in your application.
 */

import { openLix, InMemoryStorage } from '@lix-js/sdk';

async function demonstrateSelectedEntityAttribution() {
  // Create a new lix file in memory
  const lix = await openLix({ storage: new InMemoryStorage() });
  
  // Add user accounts
  await lix.db.insertInto('account').values([
    { id: 'user1', name: 'Alice Johnson' },
    { id: 'user2', name: 'Bob Smith' }
  ]).execute();
  
  // Create some entities (like CSV cells)
  await lix.db.insertInto('state').values([
    {
      entity_id: '0-jsa9j3',
      schema_key: 'csv_cell',
      file_id: 'doc_456',
      plugin_key: 'csv',
      snapshot_content: JSON.stringify({ value: 'John Doe', column: 'Name', row: 1 }),
      schema_version: '1.0.0'
    },
    {
      entity_id: '0-abc123',
      schema_key: 'csv_cell',
      file_id: 'doc_456',
      plugin_key: 'csv',
      snapshot_content: JSON.stringify({ value: 'Engineer', column: 'Position', row: 1 }),
      schema_version: '1.0.0'
    }
  ]).execute();
  
  // Update the first entity to create change history
  await lix.db.updateTable('state')
    .set('snapshot_content', JSON.stringify({ value: 'Jane Doe', column: 'Name', row: 1 }))
    .where('entity_id', '=', '0-jsa9j3')
    .execute();
  
  // Assume that `selectedEntity` is the entity the user has selected in your application
  const selectedEntity = {
    entity_id: "0-jsa9j3",
    schema_key: "csv_cell",
    file_id: "doc_456",
  };
  
  console.log('Selected Entity:', selectedEntity);
  
  // Query the history for the selected entity
  const entityHistory = await lix.db
    .selectFrom("state")
    .innerJoin("change_author", "state.change_id", "change_author.change_id")
    .innerJoin("account", "change_author.account_id", "account.id")
    .where("state.entity_id", "=", selectedEntity.entity_id)
    .where("state.schema_key", "=", selectedEntity.schema_key)
    .where("state.file_id", "=", selectedEntity.file_id)
    .orderBy("state.created_at", "desc")
    .select(['account.name', 'state.created_at', 'state.snapshot_content'])
    .executeTakeFirst();
  
  if (entityHistory) {
    console.log(
      `Entity ${selectedEntity.entity_id} was last modified by ${entityHistory.name} at ${entityHistory.created_at}`
    );
    console.log('Current content:', JSON.parse(entityHistory.snapshot_content));
  } else {
    console.log(`No attribution history found for entity ${selectedEntity.entity_id}`);
    console.log('This is expected in this demo - change tracking needs proper setup');
  }
  
  // Alternative: Query directly from internal_change table
  const directHistory = await lix.db
    .selectFrom('internal_change')
    .innerJoin('change_author', 'internal_change.id', 'change_author.change_id')
    .innerJoin('account', 'change_author.account_id', 'account.id')
    .where('internal_change.entity_id', '=', selectedEntity.entity_id)
    .where('internal_change.schema_key', '=', selectedEntity.schema_key)
    .where('internal_change.file_id', '=', selectedEntity.file_id)
    .orderBy('internal_change.created_at', 'desc')
    .select(['account.name', 'internal_change.created_at', 'internal_change.schema_key'])
    .executeTakeFirst();
  
  console.log('Direct change history:', directHistory || 'No change history found');
  
  return {
    selectedEntity,
    entityHistory,
    directHistory
  };
}

// Run the demonstration
demonstrateSelectedEntityAttribution().then(result => {
  console.log('Final Result:', result);
}).catch(error => {
  console.error('Error:', error);
});