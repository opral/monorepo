import { openLix } from "@lix-js/sdk";

async function demonstrateEntityHistory() {
  const lix = await openLix({});

  // Get the current change set from the active version
  const activeVersion = await lix.db
    .selectFrom("active_version")
    .innerJoin("version", "active_version.version_id", "version.id")
    .select("version.change_set_id")
    .executeTakeFirstOrThrow();

  console.log("Active version change set:", activeVersion.change_set_id);

  // Query entity history from the current change set
  const entityHistory = await lix.db
    .selectFrom("state_history")
    .where("entity_id", "=", "para_123")
    .where("root_change_set_id", "=", activeVersion.change_set_id)
    .orderBy("depth", "asc")
    .execute();

  console.log("Entity history for para_123:");
  console.log(entityHistory);

  // Show progression of changes
  entityHistory.forEach((state, index) => {
    console.log(`Version ${index + 1} (depth ${state.depth}):`, state.snapshot_content);
  });
}

// Run the demonstration
demonstrateEntityHistory().catch(console.error);