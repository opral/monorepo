import { openLix, selectActiveVersion, createVersion, switchVersion, mergeVersion } from "@lix-js/sdk";

async function demonstrateVersionMerging() {
  const lix = await openLix({});

  // Get the current active version (assume this is main)
  const mainVersion = await selectActiveVersion({ lix })
    .executeTakeFirstOrThrow();

  console.log("Main version:", mainVersion);

  // Create a feature branch
  const featureVersion = await createVersion({ 
    lix, 
    from: mainVersion,
    name: "feature-branch",
    description: "Feature branch for new functionality"
  });

  console.log("Created feature version:", featureVersion);

  // Switch to feature branch for development
  await switchVersion({ lix, to: featureVersion });
  console.log("Switched to feature branch for development");

  // Simulate some work being done...
  console.log("... doing some work on the feature branch ...");

  // Switch back to main for merging
  await switchVersion({ lix, to: mainVersion });
  console.log("Switched back to main branch");

  // Merge the feature branch into main
  await mergeVersion({ 
    lix, 
    source: featureVersion, 
    target: mainVersion 
  });

  console.log(`Merged ${featureVersion.name} into ${mainVersion.name}`);
}

// Run the demonstration
demonstrateVersionMerging().catch(console.error);