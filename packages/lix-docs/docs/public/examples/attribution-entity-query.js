import { openLix } from "@lix-js/sdk";

// Helper function to match entities
function entityIs(entity) {
  return (eb) => 
    eb.and([
      eb("entity_id", "=", entity.entity_id),
      eb("schema_key", "=", entity.schema_key),
      eb("file_id", "=", entity.file_id)
    ]);
}

async function demonstrateEntityAttribution() {
  const lix = await openLix({});

  // Assume that `selectedEntity` is the entity the user has selected in your application
  const selectedEntity = {
    entity_id: "0-jsa9j3",
    schema_key: "csv_cell",
    file_id: "doc_456",
  };

  // Query the history for the selected entity
  const entityHistory = await lix.db
    .selectFrom("state")
    .innerJoin("change_author", "file.lixcol_change_id", "change_author.id")
    .innerJoin("account", "change_author.account_id", "account.id")
    .where(entityIs(selectedEntity))
    .orderBy("created_at", "desc")
    .selectAll()
    .executeTakeFirst();

  console.log(
    `Entity ${selectedEntity.entity_id} was last modified by ${entityHistory[0]?.name} at ${entityHistory[0]?.created_at}`
  );
}

// Run the demonstration
demonstrateEntityAttribution().catch(console.error);