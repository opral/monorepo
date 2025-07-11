import { openLix } from "@lix-js/sdk";

// Note: These functions may not be available in the current SDK version
// but are shown here for demonstration purposes based on the documentation
async function undo(options: any) {
  const steps = options.steps || 1;
  console.log(`Performing undo operation (${steps} step${steps > 1 ? 's' : ''})`);
}

async function redo(options: any) {
  const steps = options.steps || 1;
  console.log(`Performing redo operation (${steps} step${steps > 1 ? 's' : ''})`);
}

export default async function runExample(console: any) {
  const lix = await openLix({});

  // SECTION-START "basic-undo-redo"
  // Basic undo operation
  await undo({ lix });
  console.log("Performed undo operation");

  // Undo with a specific number of steps
  await undo({ lix, steps: 3 });
  console.log("Performed undo with 3 steps");

  // Basic redo operation
  await redo({ lix });
  console.log("Performed redo operation");
  // SECTION-END "basic-undo-redo"
}

// Uncomment for running in node
runExample(console);