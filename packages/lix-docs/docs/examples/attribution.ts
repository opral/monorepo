import { openLix } from "@lix-js/sdk";

// Helper function to match entities
function entityIs(entity: any) {
  return (eb: any) => 
    eb.and([
      eb("entity_id", "=", entity.entity_id),
      eb("schema_key", "=", entity.schema_key),
      eb("file_id", "=", entity.file_id)
    ]);
}

export default async function runExample(console: any, sharedLix?: any) {
  const lix = sharedLix || await openLix({});

  // SECTION-START "entity-attribution"
  // Assume that `selectedEntity` is the entity the user has selected in your application
  const selectedEntity = {
    entity_id: "example-entity",
    schema_key: "json_property",
    file_id: "/example.json",
  };

  // For demonstration, we'll query an actual entity from the database
  const actualEntity = await lix.db
    .selectFrom("state")
    .selectAll()
    .limit(1)
    .executeTakeFirst();

  if (actualEntity) {
    // Query the change information for this entity
    console.log(
      `Entity ${actualEntity.entity_id} was last modified at ${actualEntity.updated_at}`
    );
    console.log(`Change ID: ${actualEntity.change_id}`);
    console.log(`Entity type: ${actualEntity.schema_key}`);
  } else {
    console.log("No entities found in the database");
  }
  // SECTION-END "entity-attribution"

  // SECTION-START "file-attribution"
  // In this example, we'll use the example.json file from the getting-started example
  const fileEntity = await lix.db
    .selectFrom("file")
    .where("path", "=", "/example.json")
    .selectAll()
    .executeTakeFirst();

  if (fileEntity) {
    console.log(
      `File ${fileEntity.path} was last modified at ${fileEntity.lixcol_updated_at}`
    );
    console.log(`File change ID: ${fileEntity.lixcol_change_id}`);
  } else {
    console.log("File /example.json not found - run getting-started example first");
  }
  // SECTION-END "file-attribution"
}

// Uncomment for running in node
runExample(console);