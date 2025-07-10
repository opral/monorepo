import { openLix } from "@lix-js/sdk";

async function demonstrateVersionSpecificHistory() {
  const lix = await openLix({});

  // Get a specific version's change set
  const version = await lix.db
    .selectFrom("version")
    .where("name", "=", "feature-branch")
    .select("change_set_id")
    .executeTakeFirstOrThrow();

  console.log("Feature branch change set:", version.change_set_id);

  // Query file history from that version's perspective
  const versionFileHistory = await lix.db
    .selectFrom("file_history")
    .where("path", "=", "/config.json")
    .where("lixcol_root_change_set_id", "=", version.change_set_id)
    .orderBy("lixcol_depth", "asc")
    .execute();

  console.log("File history for /config.json from feature-branch perspective:");
  console.log(versionFileHistory);

  // Show the complete history timeline
  versionFileHistory.forEach((entry) => {
    console.log(`Depth ${entry.lixcol_depth}: Change set ${entry.lixcol_change_set_id}`);
    console.log(`  Content: ${entry.data}`);
  });
}

// Run the demonstration
demonstrateVersionSpecificHistory().catch(console.error);