import { openLix } from "@lix-js/sdk";
import { plugin as jsonPlugin } from "@lix-js/plugin-json";

export default async function runExample(console: any) {
  // SECTION-START "opening-lix"

  const lix = await openLix({
    providePlugins: [jsonPlugin],
  });

  const user = {
    name: "Peter",
    age: 50,
  };

  // SECTION-END "opening-lix"

  // SECTION-START "inserting-file"

  await lix.db
    .insertInto("file")
    .values({
      path: "/example.json",
      // lix expects the data to be a Uint8Array
      // so we convert the JSON object to a string and then to a Uint8Array
      data: new TextEncoder().encode(JSON.stringify(user)),
    })
    .executeTakeFirstOrThrow();

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

  // SECTION-END "inserting-file"

  // SECTION-START "updating-file"

  // we update the user's age to 51
  await lix.db
    .updateTable("file")
    .where("path", "=", "/example.json")
    .set({
      data: new TextEncoder().encode(JSON.stringify({ ...user, age: 51 })),
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

  // SECTION-END "updating-file"

  // SECTION-START "querying-file-history"

  const activeVersion = await lix.db
    .selectFrom("active_version")
    .innerJoin("version", "active_version.version_id", "version.id")
    .select("version.change_set_id")
    .executeTakeFirstOrThrow();

  // Query file history from the current change set
  const fileHistory = await lix.db
    .selectFrom("file_history")
    .where("path", "=", "/example.json")
    .where("lixcol_root_change_set_id", "=", activeVersion.change_set_id)
    .orderBy("lixcol_depth", "asc")
    .select(["path", "data", "lixcol_depth"])
    .execute();

  console.log(
    "File history:",
    fileHistory.map((f) => ({
      ...f,
      data: JSON.parse(new TextDecoder().decode(f.data)),
    }))
  );

  // SECTION-END "querying-file-history"
}

// outcomment for running in node
// runExample(console);
