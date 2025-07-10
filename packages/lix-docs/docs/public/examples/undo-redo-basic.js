import { openLix, undo, redo } from "@lix-js/sdk";

async function demonstrateUndoRedo() {
  const lix = await openLix({});

  console.log("Demonstrating basic undo/redo operations");

  // Basic undo operation
  await undo({ lix });
  console.log("Performed undo operation");

  // Undo with a specific number of steps
  await undo({ lix, steps: 3 });
  console.log("Performed undo with 3 steps");

  // Basic redo operation
  await redo({ lix });
  console.log("Performed redo operation");

  // You can also redo multiple steps
  try {
    await redo({ lix, steps: 2 });
    console.log("Performed redo with 2 steps");
  } catch (error) {
    console.log("Redo failed:", error.message);
  }
}

// Run the demonstration
demonstrateUndoRedo().catch(console.error);