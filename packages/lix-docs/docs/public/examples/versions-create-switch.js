import { openLix, selectActiveVersion, createVersion, switchVersion } from "@lix-js/sdk";

async function demonstrateVersionCreationAndSwitching() {
  const lix = await openLix({});

  // Get the current active version
  const activeVersion = await selectActiveVersion({ lix })
    .executeTakeFirstOrThrow();

  console.log("Current active version:", activeVersion);

  // Create a new version from the active version
  const newVersion = await createVersion({ 
    lix, 
    from: activeVersion,
    name: "feature-branch",
    description: "Working on new feature"
  });

  console.log("Created new version:", newVersion);

  // Switch to the new version
  await switchVersion({ lix, to: newVersion });

  console.log(`Switched to version: ${newVersion.name}`);

  // Verify the switch by checking active version again
  const currentActiveVersion = await selectActiveVersion({ lix })
    .executeTakeFirstOrThrow();

  console.log("New active version:", currentActiveVersion);
}

// Run the demonstration
demonstrateVersionCreationAndSwitching().catch(console.error);