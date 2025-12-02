export default async function runExample(console: any) {
  console.log("SECTION START 'opening-lix'");

  const { InMemoryEnvironment, openLix } = await import("@lix-js/sdk");
  const { plugin: jsonPlugin } = await import("@lix-js/plugin-json");

  const lix = await openLix({
    environment: new InMemoryEnvironment(),
    providePlugins: [jsonPlugin],
  });

  console.log("SECTION END 'opening-lix'");

  console.log("SECTION START 'inserting-file'");

  const config = {
    theme: "light",
    notifications: true,
    language: "en",
  };

  await lix.db
    .insertInto("file")
    .values({
      path: "/config.json",
      data: new TextEncoder().encode(JSON.stringify(config, null, 2)),
    })
    .execute();

  console.log("SECTION END 'inserting-file'");

  console.log("SECTION START 'updating-file'");

  // Update the config: change theme to dark
  await lix.db
    .updateTable("file")
    .where("path", "=", "/config.json")
    .set({
      data: new TextEncoder().encode(
        JSON.stringify(
          { theme: "dark", notifications: true, language: "en" },
          null,
          2,
        ),
      ),
    })
    .execute();

  console.log("SECTION END 'updating-file'");

  console.log("SECTION START 'querying-file-history'");

  // Get the active version's commit_id
  const activeVersionCommitId = lix.db
    .selectFrom("active_version")
    .innerJoin("version", "active_version.version_id", "version.id")
    .select("version.commit_id");

  // Query file history from the active version
  const history = await lix.db
    .selectFrom("file_history")
    .where("path", "=", "/config.json")
    .where("lixcol_root_commit_id", "=", activeVersionCommitId)
    .select(["path", "data", "lixcol_depth"])
    .orderBy("lixcol_depth", "asc")
    .execute();

  for (const row of history) {
    console.log(`Depth ${row.lixcol_depth}:`, {
      path: row.path,
      data: JSON.parse(new TextDecoder().decode(row.data)),
    });
  }

  console.log("SECTION END 'querying-file-history'");
}

// outcomment for running in node
// runExample(console);
