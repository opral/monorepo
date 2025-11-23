export default async function runExample(console: any) {
  console.log("SECTION START 'opening-lix'");

  const { openLix, createCheckpoint } = await import("@lix-js/sdk");
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

  const firstCheckpoint = await createCheckpoint({ lix });

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

  const secondCheckpoint = await createCheckpoint({ lix });

  console.log("SECTION END 'updating-file'");

  console.log("SECTION START 'querying-file-history'");

  // Query file history at each checkpoint
  for (const { label, checkpoint } of [
    { label: "Second checkpoint", checkpoint: secondCheckpoint },
    { label: "First checkpoint", checkpoint: firstCheckpoint },
  ]) {
    const fileState = await lix.db
      .selectFrom("file_history")
      .where("path", "=", "/example.json")
      .where("lixcol_depth", "=", 0)
      .where("lixcol_root_commit_id", "=", checkpoint.id)
      .select(["path", "data"])
      .executeTakeFirstOrThrow();

    console.log(`${label}:`, {
      ...fileState,
      data: JSON.parse(new TextDecoder().decode(fileState.data)),
    });
  }

  console.log("SECTION END 'querying-file-history'");
}

// outcomment for running in node
// runExample(console);
