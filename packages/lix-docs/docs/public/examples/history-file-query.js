import { openLix } from "@lix-js/sdk";

async function demonstrateFileHistory() {
  const lix = await openLix({});

  // Get the current change set from the active version
  const activeVersion = await lix.db
    .selectFrom("active_version")
    .innerJoin("version", "active_version.version_id", "version.id")
    .select("version.change_set_id")
    .executeTakeFirstOrThrow();

  console.log("Active version change set:", activeVersion.change_set_id);

  // Query file history from the current change set
  const fileHistory = await lix.db
    .selectFrom("file_history")
    .where("path", "=", "/README.md")
    .where("lixcol_root_change_set_id", "=", activeVersion.change_set_id)
    .orderBy("lixcol_depth", "asc")
    .execute();

  console.log("File history for /README.md:");
  console.log(fileHistory);

  // Example output structure:
  // [
  //   {
  //     "id": "file-id",
  //     "path": "/README.md",
  //     "data": "# Updated README",
  //     "lixcol_change_set_id": "change-set-id-3",
  //     "lixcol_root_change_set_id": "change-set-id-3",
  //     "lixcol_depth": 0
  //   },
  //   {
  //     "id": "file-id",
  //     "path": "/README.md",
  //     "data": "# Initial README",
  //     "lixcol_change_set_id": "change-set-id-1",
  //     "lixcol_root_change_set_id": "change-set-id-3",
  //     "lixcol_depth": 2
  //   }
  // ]
}

// Run the demonstration
demonstrateFileHistory().catch(console.error);