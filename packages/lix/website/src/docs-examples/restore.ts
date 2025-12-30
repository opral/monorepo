import { openLix } from "@lix-js/sdk";

// Note: These functions may not be available in the current SDK version
// but are shown here for demonstration purposes based on the documentation
async function restore(options: any) {
  console.log("Restoring to change set:", options.to);
}

async function selectCheckpoints(options: any) {
  return {
    execute: async () => [
      {
        id: "checkpoint-1",
        name: "Before major changes",
        created_at: "2023-01-01",
      },
    ],
  };
}

export default async function runExample(console: any) {
  const lix = await openLix({});

  console.log("SECTION START 'restore-last-changeset'");
  // Get the most recent change set from the history
  const lastChangeSet = await lix.db
    .selectFrom("change_set")
    .select(["id", "lixcol_metadata"])
    .executeTakeFirstOrThrow();

  // Restore the lix to that change set
  await restore({ lix, to: lastChangeSet.id });

  console.log("Restored to most recent change set:", lastChangeSet.id);

  console.log("SECTION END 'restore-last-changeset'");

  console.log("SECTION START 'checkpoint-restore'");
  // Later, you can easily find and restore to that checkpoint
  const checkpoints = await selectCheckpoints({ lix });
  const results = await checkpoints.execute();

  if (results.length > 0) {
    await restore({ lix, to: results[0].id });
    console.log("Restored to checkpoint:", results[0].name);
  } else {
    console.log("No checkpoints available");
  }

  console.log("SECTION END 'checkpoint-restore'");
}

// Uncomment for running in node
// runExample(console);

