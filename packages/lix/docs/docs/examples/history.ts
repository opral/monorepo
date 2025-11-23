import { openLix } from "@lix-js/sdk";

export default async function runExample(console: any) {
  const lix = await openLix({});

  console.log("SECTION START 'file-history'");
  // Get the current change set from the active version
  const activeVersion = await lix.db
    .selectFrom("active_version")
    .innerJoin("version", "active_version.version_id", "version.id")
    .innerJoin("commit", "version.commit_id", "commit.id")
    .select("commit.change_set_id")
    .executeTakeFirstOrThrow();

  // Get all files in the current version
  const currentFiles = await lix.db.selectFrom("file").selectAll().execute();

  console.log("Files in current version:");
  currentFiles.forEach((file) => {
    console.log(`- ${file.path} (updated: ${file.lixcol_updated_at})`);
  });

  // For demonstration, show the file history concept using the example.json file
  const exampleFile = await lix.db
    .selectFrom("file")
    .where("path", "=", "/example.json")
    .selectAll()
    .executeTakeFirst();

  if (exampleFile) {
    console.log("\nFile history for /example.json:");
    console.log(
      JSON.stringify(
        {
          path: exampleFile.path,
          current_data: JSON.parse(new TextDecoder().decode(exampleFile.data)),
          change_id: exampleFile.lixcol_change_id,
          updated_at: exampleFile.lixcol_updated_at,
        },
        null,
        2,
      ),
    );
  }

  console.log("SECTION END 'file-history'");

  console.log("SECTION START 'entity-history'");
  // Get all entities in the current state to demonstrate entity history
  const allEntities = await lix.db.selectFrom("state").selectAll().execute();

  console.log("\nEntity history (current state):");
  allEntities.forEach((entity) => {
    console.log(`- ${entity.entity_id} (${entity.schema_key})`);
    console.log(`  Created: ${entity.created_at}`);
    console.log(`  Updated: ${entity.updated_at}`);
    console.log(`  Change ID: ${entity.change_id}`);
  });

  console.log("SECTION END 'entity-history'");

  console.log("SECTION START 'version-specific-history'");
  // Get version information to show version-specific history
  const allVersions = await lix.db.selectFrom("version").selectAll().execute();

  console.log("\nVersion-specific history:");
  for (const version of allVersions) {
    console.log(`- Version: ${version.name} (ID: ${version.id})`);
    console.log(`  Created: ${version.lixcol_created_at}`);
    console.log(`  Hidden: ${version.hidden ? "Yes" : "No"}`);
  }

  console.log("SECTION END 'version-specific-history'");

  console.log("SECTION START 'history-data-model'");
  // Example of the change set graph concept
  console.log("History Data Model Example:");
  console.log("Imagine config.json changes over time:");
  console.log(
    "CS1: { setting: 'A' } -> CS2: { setting: 'B' } -> CS3: { setting: 'C' } -> CS4: { setting: 'D' }",
  );

  // Query history from CS3's perspective would show:
  const mockHistoryFromCS3 = [
    {
      data: { setting: "C" },
      lixcol_change_set_id: "CS3",
      lixcol_root_commit_id: "CS3",
      lixcol_depth: 0,
    },
    {
      data: { setting: "B" },
      lixcol_change_set_id: "CS2",
      lixcol_root_commit_id: "CS3",
      lixcol_depth: 1,
    },
    {
      data: { setting: "A" },
      lixcol_change_set_id: "CS1",
      lixcol_root_commit_id: "CS3",
      lixcol_depth: 2,
    },
  ];

  console.log("History from CS3 perspective:");
  console.log(JSON.stringify(mockHistoryFromCS3, null, 2));
  console.log(
    "Notice: CS4 is not included because it comes after CS3 in the graph",
  );

  console.log("SECTION END 'history-data-model'");
}

// Uncomment for running in node
// runExample(console);
