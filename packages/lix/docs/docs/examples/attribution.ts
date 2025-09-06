import { openLix } from "@lix-js/sdk";

export default async function runExample(console: any, sharedLix?: any) {
  const lix = sharedLix || (await openLix({}));

  console.log("SECTION START 'entity-attribution'");

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
      `Entity ${actualEntity.entity_id} was last modified at ${actualEntity.updated_at}`,
    );
    console.log(`Change ID: ${actualEntity.change_id}`);
    console.log(`Entity type: ${actualEntity.schema_key}`);
  } else {
    console.log("No entities found in the database");
  }

  console.log("SECTION END 'entity-attribution'");

  console.log("SECTION START 'file-attribution'");

  const fileEntity = await lix.db
    .selectFrom("file")
    .where("path", "=", "/example.json")
    .selectAll()
    .executeTakeFirst();

  if (fileEntity) {
    console.log(
      `File ${fileEntity.path} was last modified at ${fileEntity.lixcol_updated_at}`,
    );
    console.log(`File change ID: ${fileEntity.lixcol_change_id}`);
  } else {
    console.log(
      "File /example.json not found - run getting-started example first",
    );
  }

  console.log("SECTION END 'file-attribution'");
}

// Uncomment for running in node
// runExample(console);
