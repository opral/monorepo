import { openLix, restore, selectCheckpoints, createCheckpoint } from "@lix-js/sdk";

async function demonstrateCheckpointRestore() {
  const lix = await openLix({});

  // First, create a checkpoint for demonstration
  try {
    const checkpoint = await createCheckpoint({ 
      lix, 
      name: "Before major changes",
      description: "Safe point before implementing new feature"
    });
    console.log("Created checkpoint:", checkpoint);
  } catch (error) {
    console.log("Checkpoint creation failed:", error.message);
  }

  // Later, you can easily find and restore to that checkpoint
  const checkpoints = await selectCheckpoints({ lix }).execute();
  
  console.log("Available checkpoints:", checkpoints);

  if (checkpoints.length > 0) {
    await restore({ lix, to: checkpoints[0].id });
    console.log(`Restored to checkpoint: ${checkpoints[0].name}`);
  } else {
    console.log("No checkpoints available for restore");
  }
}

// Run the demonstration
demonstrateCheckpointRestore().catch(console.error);