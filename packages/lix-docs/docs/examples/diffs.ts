import { openLix } from "@lix-js/sdk";

// Helper function to match entities
function entityIs(entity: any) {
  return (eb: any) =>
    eb.and([
      eb("entity_id", "=", entity.entity_id),
      eb("schema_key", "=", entity.schema_key),
      eb("file_id", "=", entity.file_id),
    ]);
}

export default async function runExample(console: any) {
  const lix = await openLix({});

  console.log("SECTION START 'plugin-diffs'");
  const plugin = (await lix.plugin.getAll()).find(
    (p: any) => p.key === "csv_plugin"
  );

  if (plugin?.diffUiComponent) {
    // In a real application, you would define the custom element:
    // customElements.define("csv-diff-component", plugin.diffComponent);
    // Then render: <csv-diff-component diffs={changes} />;
    console.log("Plugin diff component available:", !!plugin.diffUiComponent);
  } else {
    console.log("No diff component found for CSV plugin");
  }

  console.log("SECTION END 'plugin-diffs'");

  console.log("SECTION START 'json-file-diff'");
  // 1. Get the current state of a JSON file from the getting-started example
  const currentFile = await lix.db
    .selectFrom("file")
    .where("path", "=", "/example.json")
    .selectAll()
    .executeTakeFirst();

  if (currentFile) {
    const currentData = JSON.parse(new TextDecoder().decode(currentFile.data));
    console.log("Current file data:", currentData);

    // For demo purposes, create a mock previous version
    const previousData = { name: "Peter", age: 50 };

    const afterState = currentData;
    const beforeState = previousData;

    // 2. Compare the two states to generate a diff.
    //
    // This is a simplified example. In a real app,
    // you would likely use a diffing library.
    const diffOutput: string[] = [];
    if (beforeState.name !== afterState.name) {
      diffOutput.push(`- name: ${beforeState.name}`);
      diffOutput.push(`+ name: ${afterState.name}`);
    }
    if (beforeState.age !== afterState.age) {
      diffOutput.push(`- age: ${beforeState.age}`);
      diffOutput.push(`+ age: ${afterState.age}`);
    }

    // 3. The diff can then be displayed in your application.
    console.log("Diff output:");
    console.log(diffOutput.join("\n"));
  } else {
    console.log(
      "File /example.json not found - run getting-started example first"
    );
  }

  console.log("SECTION END 'json-file-diff'");

  console.log("SECTION START 'entity-diff'");
  // Get current entities from the state table to demonstrate entity diffing
  const currentEntities = await lix.db
    .selectFrom("state")
    .selectAll()
    .limit(2)
    .execute();

  if (currentEntities.length >= 2) {
    console.log("Comparing two entities from the current state:");
    console.log(
      `Entity 1: ${currentEntities[0].entity_id} (${currentEntities[0].schema_key})`
    );
    console.log(
      `Entity 2: ${currentEntities[1].entity_id} (${currentEntities[1].schema_key})`
    );

    // Show their content differences
    console.log("Entity 1 content:", currentEntities[0].snapshot_content);
    console.log("Entity 2 content:", currentEntities[1].snapshot_content);
  } else {
    console.log("Not enough entities to compare - need at least 2 entities");
  }

  console.log("SECTION END 'entity-diff'");
}

// Uncomment for running in node
runExample(console);
