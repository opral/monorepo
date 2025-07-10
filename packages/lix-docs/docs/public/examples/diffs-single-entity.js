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

async function demonstrateSingleEntityDiffing() {
  const lix = await openLix({});

  // This example assumes `beforeChangeSetId` and `afterChangeSetId` are known.
  const beforeChangeSetId = "changeset-1";
  const afterChangeSetId = "changeset-2";

  const jsonProperty = {
    entity_id: "name", // ID for the 'name' property
    schema_key: "json_property", // provided by the plugin
    file_id: "json-file-id", // ID of the JSON file
  };

  console.log("Comparing entity between change sets:", beforeChangeSetId, "->", afterChangeSetId);

  // 1. Get the before and after state of a specific JSON property entity
  const entityBefore = await lix.db
    .selectFrom("state_history")
    .where("lixcol_change_set_id", "=", beforeChangeSetId)
    .where(entityIs(jsonProperty))
    .selectAll()
    .executeTakeFirst();

  const entityAfter = await lix.db
    .selectFrom("state_history")
    .where("lixcol_change_set_id", "=", afterChangeSetId)
    .where(entityIs(jsonProperty))
    .selectAll()
    .executeTakeFirst();

  // 2. The returned states can be used to show the change.
  if (entityBefore && entityAfter) {
    console.log(
      `The "name" property changed from "${entityBefore.snapshot_content}" to "${entityAfter.snapshot_content}"`
    );
  } else {
    console.log("Could not find entity states for comparison");
  }

  // Expected output:
  // The "name" property changed from "My Project" to "My Awesome Project"
}

// Run the demonstration
demonstrateSingleEntityDiffing().catch(console.error);