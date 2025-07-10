import { openLix, restore } from "@lix-js/sdk";

async function demonstrateRestoreToLastChangeSet() {
  const lix = await openLix({});

  // Get the most recent change set from the history
  const lastChangeSet = await lix.db
    .selectFrom("change_set")
    .orderBy("created_at", "desc")
    .selectAll()
    .executeTakeFirstOrThrow();

  console.log("Last change set:", lastChangeSet);

  // Restore the repository to that change set
  await restore({ lix, to: lastChangeSet.id });

  console.log(`Restored to change set: ${lastChangeSet.id}`);
}

// Run the demonstration
demonstrateRestoreToLastChangeSet().catch(console.error);