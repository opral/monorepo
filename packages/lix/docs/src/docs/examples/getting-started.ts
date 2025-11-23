export default async function runExample(console: any) {
  console.log("SECTION START 'opening-lix'");

  const { openLix } = await import("@lix-js/sdk");
  const { plugin: jsonPlugin } = await import("@lix-js/plugin-json");

  const lix = await openLix({
    providePlugins: [jsonPlugin],
  });

  console.log("SECTION END 'opening-lix'");

  console.log("SECTION START 'inserting-file'");

  const json = {
    name: "Peter",
    age: 50,
  };

  await lix.db
    .insertInto("file")
    .values({
      path: "/example.json",
      data: new TextEncoder().encode(JSON.stringify(json)),
    })
    .execute();

  const fileAfterInsert = await lix.db
    .selectFrom("file")
    .select(["path", "data"])
    .executeTakeFirstOrThrow();

  console.log("File after insert:", [
    {
      ...fileAfterInsert,
      data: JSON.parse(new TextDecoder().decode(fileAfterInsert.data)),
    },
  ]);

  console.log("SECTION END 'inserting-file'");

  console.log("SECTION START 'updating-file'");

  // we update the user's age to 51
  await lix.db
    .updateTable("file")
    .where("path", "=", "/example.json")
    .set({
      data: new TextEncoder().encode(
        JSON.stringify({ name: "Peter", age: 51 }),
      ),
    })
    .execute();

  const fileAfterChange = await lix.db
    .selectFrom("file")
    .where("path", "=", "/example.json")
    .select([
      "path",
      "data",
      // TODO https://github.com/opral/lix-sdk/issues/348 expose change set id
      // "lixcol_change_set_id",
    ])
    .executeTakeFirstOrThrow();

  console.log("File after change:", [
    {
      ...fileAfterChange,
      data: JSON.parse(new TextDecoder().decode(fileAfterChange.data)),
    },
  ]);

  console.log("SECTION END 'updating-file'");

  console.log("SECTION START 'querying-file-history'");

  const activeVersion = await lix.db
    .selectFrom("active_version")
    .innerJoin("version", "active_version.version_id", "version.id")
    .select("version.commit_id")
    .executeTakeFirstOrThrow();

  // Query file history from the current commit
  const fileHistory = await lix.db
    .selectFrom("file_history")
    .where("path", "=", "/example.json")
    .where("lixcol_root_commit_id", "=", activeVersion.commit_id)
    .orderBy("lixcol_depth", "asc")
    .select(["path", "data", "lixcol_depth"])
    .execute();

  console.log(
    "File history:",
    fileHistory.map((f) => ({
      ...f,
      data: JSON.parse(new TextDecoder().decode(f.data)),
    })),
  );

  console.log("SECTION END 'querying-file-history'");
}

// outcomment for running in node
// runExample(console);
