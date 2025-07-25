export default async function runExample(console: any) {
  console.log("SECTION START 'setup'");

  const { openLix } = await import("@lix-js/sdk");
  const { plugin: jsonPlugin } = await import("@lix-js/plugin-json");

  const lix = await openLix({
    providePlugins: [jsonPlugin],
  });

  console.log("SECTION END 'setup'");

  console.log("SECTION START 'auto-commits'");

  // 1. Query the active version
  const activeVersion = await lix.db
    .selectFrom("active_version")
    .innerJoin("version", "version.id", "active_version.version_id")
    .selectAll("version")
    .executeTakeFirstOrThrow();

  // 2. Log the version's commit
  console.log("Before insert - Version commit_id:", activeVersion.commit_id);

  // 3. Insert a file
  await lix.db
    .insertInto("file")
    .values({
      path: "/config.json",
      data: new TextEncoder().encode('{"theme": "dark"}'),
    })
    .execute();

  // 4. Query the version after the insert
  const versionAfterInsert = await lix.db
    .selectFrom("active_version")
    .innerJoin("version", "version.id", "active_version.version_id")
    .selectAll("version")
    .executeTakeFirstOrThrow();

  // 5. Log the version's (new) commit
  console.log("After insert - Version commit_id:", versionAfterInsert.commit_id);
  console.log("Did the commit_id change?", activeVersion.commit_id !== versionAfterInsert.commit_id ? "Yes" : "No");

  console.log("SECTION END 'auto-commits'");
}

// Uncomment for running in node
// runExample(console);