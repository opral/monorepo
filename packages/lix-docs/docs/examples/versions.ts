import { openLix } from "@lix-js/sdk";

// Note: These functions may not be available in the current SDK version
// but are shown here for demonstration purposes based on the documentation
async function selectActiveVersion(options: any) {
  return {
    executeTakeFirstOrThrow: async () => ({
      id: "version-main",
      name: "main",
      change_set_id: "cs-main"
    })
  };
}

async function createVersion(options: any) {
  console.log("Creating new version from:", options.from.name);
  return { id: "version-feature", name: "feature-branch", change_set_id: "cs-feature" };
}

async function switchVersion(options: any) {
  console.log("Switching to version:", options.to.name);
}

async function mergeVersion(options: any) {
  console.log(`Merging ${options.source.name} into ${options.target.name}`);
}

export default async function runExample(console: any) {
  const lix = await openLix({});

  // SECTION-START "create-switch-version"
  const activeVersion = await lix.db
    .selectFrom("active_version")
    .innerJoin("version", "active_version.version_id", "version.id")
    .select(["version.id", "version.name"])
    .executeTakeFirstOrThrow();

  console.log("Current active version:", activeVersion.name);

  const newVersion = await createVersion({ lix, from: activeVersion });

  console.log("Created new version:", newVersion.name);

  await switchVersion({ lix, to: newVersion });

  console.log("Switched to new version");
  // SECTION-END "create-switch-version"

  // SECTION-START "merge-version"
  // Switch back to main version for merging demonstration
  await switchVersion({ lix, to: activeVersion });

  await mergeVersion({ lix, source: newVersion, target: activeVersion });

  console.log("Merged feature branch into main");
  // SECTION-END "merge-version"
}

// Uncomment for running in node
runExample(console);