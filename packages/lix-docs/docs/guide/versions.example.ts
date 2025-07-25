export default async function runExample(console: any) {
  console.log("SECTION START 'opening-lix'");

  const { openLix, createVersion, switchVersion, createCheckpoint, ebEntity } = await import("@lix-js/sdk");
  const { plugin: jsonPlugin } = await import("@lix-js/plugin-json");

  const lix = await openLix({
    providePlugins: [jsonPlugin],
  });

  console.log("SECTION END 'opening-lix'");

  console.log("SECTION START 'crud-operations'");

  // CREATE a new version
  const featureVersion = await createVersion({
    lix,
    name: "feature-notifications",
  });

  console.log("Created version:", featureVersion.name);

  // READ the active version
  const activeVersion = await lix.db
    .selectFrom("active_version")
    .innerJoin("version", "version.id", "active_version.version_id")
    .selectAll("version")
    .executeTakeFirstOrThrow();

  console.log("Active version:", activeVersion.name);

  // UPDATE - switch to a different version
  await switchVersion({
    lix,
    to: featureVersion,
  });

  const newActiveVersion = await lix.db
    .selectFrom("active_version")
    .innerJoin("version", "version.id", "active_version.version_id")
    .select("version.name")
    .executeTakeFirstOrThrow();

  console.log("Switched to version:", newActiveVersion.name);

  // LIST all versions
  const versions = await lix.db
    .selectFrom("version")
    .where("hidden", "=", false)
    .select(["id", "name", "commit_id"])
    .execute();

  console.log("All versions:", versions.map(v => v.name));

  console.log("SECTION END 'crud-operations'");

  console.log("SECTION START 'auto-commits'");

  // Switch back to main
  const mainVersion = await lix.db
    .selectFrom("version")
    .where("name", "=", "main")
    .selectAll()
    .executeTakeFirstOrThrow();

  await switchVersion({ lix, to: mainVersion });

  // Insert some data - this creates an auto-commit
  await lix.db.insertInto("file").values({ 
    path: "/config.json",
    data: new TextEncoder().encode('{"theme": "dark"}')
  }).execute();

  // Query the state to see the commit_id
  const state = await lix.db
    .selectFrom("state")
    .where("schema_key", "=", "lix_file_descriptor")
    .select(["entity_id", "commit_id"])
    .executeTakeFirst();

  console.log("State commit_id:", state?.commit_id);
  console.log("Working commit_id:", mainVersion.working_commit_id);
  console.log("Are they the same?", state?.commit_id === mainVersion.working_commit_id ? "Yes" : "No");

  console.log("SECTION END 'auto-commits'");

  console.log("SECTION START 'checkpoints'");

  // Get commit count before checkpoint
  const commitsBefore = await lix.db
    .selectFrom("commit")
    .select("id")
    .execute();

  console.log("Commits before checkpoint:", commitsBefore.length);

  // Create a checkpoint
  const checkpoint = await createCheckpoint({ lix });
  console.log("Created checkpoint:", checkpoint.id);

  // Check if the commit has the checkpoint label
  // Using the ebEntity helper to check for labels
  const hasCheckpointLabel = await lix.db
    .selectFrom("commit")
    .where("id", "=", checkpoint.id)
    .where(ebEntity("commit").hasLabel({ name: "checkpoint" }))
    .select("id")
    .executeTakeFirst();

  console.log("Checkpoint has label:", hasCheckpointLabel ? "Yes" : "No");

  // Version now points to this checkpoint
  const versionAfterCheckpoint = await lix.db
    .selectFrom("version")
    .where("name", "=", "main")
    .select(["commit_id"])
    .executeTakeFirstOrThrow();

  console.log("Version commit_id updated:", versionAfterCheckpoint.commit_id === checkpoint.id ? "Yes" : "No");

  console.log("SECTION END 'checkpoints'");

  console.log("SECTION START 'working-across-versions'");

  // In main version
  await switchVersion({ lix, to: mainVersion });
  await lix.db.insertInto("file").values({
    path: "/app-config.json",
    data: new TextEncoder().encode('{"theme": "light", "language": "en"}')
  }).execute();

  // Create and switch to feature version
  const darkModeVersion = await createVersion({ lix, name: "dark-mode" });
  await switchVersion({ lix, to: darkModeVersion });

  // Check if file exists in feature version (should inherit from main)
  const existsInFeature = await lix.db.selectFrom("file")
    .where("path", "=", "/app-config.json")
    .select(["data"])
    .executeTakeFirst();

  if (existsInFeature) {
    // Update in feature version
    await lix.db.updateTable("file")
      .set({ data: new TextEncoder().encode('{"theme": "dark", "language": "en"}') })
      .where("path", "=", "/app-config.json")
      .execute();

    const featureFile = await lix.db.selectFrom("file")
      .where("path", "=", "/app-config.json")
      .select(["data"])
      .executeTakeFirstOrThrow();

    console.log("Feature version file:", JSON.parse(new TextDecoder().decode(featureFile.data)));
  } else {
    console.log("File not inherited in feature version");
  }

  // Switch back to main - still has light theme
  await switchVersion({ lix, to: mainVersion });
  const mainFile = await lix.db.selectFrom("file")
    .where("path", "=", "/app-config.json")
    .select(["data"])
    .executeTakeFirst();

  console.log("Main version file:", JSON.parse(new TextDecoder().decode(mainFile!.data)));

  console.log("SECTION END 'working-across-versions'");

  console.log("SECTION START 'version-inheritance'");

  // Create a parent version
  const parentVersion = await createVersion({
    lix,
    name: "parent-version"
  });

  await switchVersion({ lix, to: parentVersion });

  // Add data in parent
  await lix.db.insertInto("file").values({
    path: "/shared-config.json",
    data: new TextEncoder().encode('{"api": "https://api.example.com", "timeout": 5000}')
  }).execute();

  // Create checkpoint in parent
  await createCheckpoint({ lix });

  // Create child version that inherits from parent
  const childVersion = await createVersion({
    lix,
    name: "child-version",
    commit_id: parentVersion.commit_id
  });

  // Note: The child version automatically has inherits_from_version_id set
  const childVersionData = await lix.db
    .selectFrom("version")
    .where("id", "=", childVersion.id)
    .select(["inherits_from_version_id"])
    .executeTakeFirstOrThrow();

  console.log("Child inherits from:", childVersionData.inherits_from_version_id);

  // Switch to child - can see parent's data
  await switchVersion({ lix, to: childVersion });
  const inheritedFile = await lix.db.selectFrom("file")
    .where("path", "=", "/shared-config.json")
    .select(["data"])
    .executeTakeFirst();

  console.log("Child sees parent's file:", inheritedFile ? "Yes" : "No");

  console.log("SECTION END 'version-inheritance'");

  console.log("SECTION START 'feature-branch-workflow'");

  // 1. Set up main version with base data
  const main = await lix.db.selectFrom("version")
    .where("name", "=", "main")
    .selectAll()
    .executeTakeFirstOrThrow();

  await switchVersion({ lix, to: main });

  await lix.db.insertInto("file").values({
    path: "/app.json",
    data: new TextEncoder().encode(JSON.stringify({
      name: "My App",
      version: "1.0.0",
      features: ["login"]
    }, null, 2))
  }).execute();

  // Create checkpoint to mark stable state
  await createCheckpoint({ lix });

  // 2. Create feature branch
  const notificationsFeature = await createVersion({
    lix,
    name: "notifications-feature",
    commit_id: main.commit_id
  });

  await switchVersion({ lix, to: notificationsFeature });

  // 3. Make changes in feature branch
  await lix.db.updateTable("file")
    .set({
      data: new TextEncoder().encode(JSON.stringify({
        name: "My App",
        version: "1.0.0",
        features: ["login", "notifications", "push-alerts"]
      }, null, 2))
    })
    .where("path", "=", "/app.json")
    .execute();

  const featureAppFile = await lix.db.selectFrom("file")
    .where("path", "=", "/app.json")
    .select(["data"])
    .executeTakeFirst();

  if (featureAppFile) {
    console.log("Feature branch app.json:", JSON.parse(new TextDecoder().decode(featureAppFile.data)));
  }

  // 4. Main version is unaffected
  await switchVersion({ lix, to: main });
  const mainAppFile = await lix.db.selectFrom("file")
    .where("path", "=", "/app.json")
    .select(["data"])
    .executeTakeFirst();

  if (mainAppFile) {
    console.log("Main branch app.json (unchanged):", JSON.parse(new TextDecoder().decode(mainAppFile.data)));
  }

  console.log("SECTION END 'feature-branch-workflow'");
}

// Uncomment for running in node
// runExample(console);