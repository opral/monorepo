import { openLix, createCheckpoint } from "@lix-js/sdk";
import { plugin as jsonPlugin } from "@lix-js/plugin-json";

export default async function runExample(console: any) {
  const lix = await openLix({ providePlugins: [jsonPlugin] });

  // Create a file and make several changes
  await lix.db
    .insertInto("file")
    .values({
      path: "/config.json",
      data: new TextEncoder().encode(JSON.stringify({ setting: "A" })),
    })
    .execute();

  const checkpoint1 = await createCheckpoint({ lix });

  await lix.db
    .updateTable("file")
    .where("path", "=", "/config.json")
    .set({
      data: new TextEncoder().encode(JSON.stringify({ setting: "B" })),
    })
    .execute();

  const checkpoint2 = await createCheckpoint({ lix });

  await lix.db
    .updateTable("file")
    .where("path", "=", "/config.json")
    .set({
      data: new TextEncoder().encode(JSON.stringify({ setting: "C" })),
    })
    .execute();

  const checkpoint3 = await createCheckpoint({ lix });

  console.log("SECTION START 'file-history'");

  // Query file state at each checkpoint to show history
  const history = [];
  for (const checkpoint of [checkpoint3, checkpoint2, checkpoint1]) {
    const state = await lix.db
      .selectFrom("file_history")
      .where("path", "=", "/config.json")
      .where("lixcol_root_commit_id", "=", checkpoint.id)
      .where("lixcol_depth", "=", 0)
      .select(["data"])
      .executeTakeFirstOrThrow();

    history.push({
      checkpoint: checkpoint.id,
      data: JSON.parse(new TextDecoder().decode(state.data))
    });
  }

  console.log("File history:", history);

  console.log("SECTION END 'file-history'");

  console.log("SECTION START 'entity-history'");

  // Create a key-value pair to demonstrate entity-level history
  await lix.db
    .insertInto("key_value")
    .values({ key: "app_version", value: "1.0.0" })
    .execute();

  await createCheckpoint({ lix });

  await lix.db
    .updateTable("key_value")
    .where("key", "=", "app_version")
    .set({ value: "1.1.0" })
    .execute();

  const checkpoint4 = await createCheckpoint({ lix });

  // Query history for the key-value entity from checkpoint 4
  const entityHistory = await lix.db
    .selectFrom("state_history")
    .where("entity_id", "=", "app_version")
    .where("schema_key", "=", "lix_key_value")
    .where("root_commit_id", "=", checkpoint4.id)
    .orderBy("depth", "asc")
    .select(["snapshot_content", "depth"])
    .execute();

  console.log("Entity history for app_version:",
    entityHistory.map(h => ({
      value: h.snapshot_content.value,
      depth: h.depth
    }))
  );

  console.log("SECTION END 'entity-history'");

  console.log("SECTION START 'checkpoint-history'");

  // Query file state at a specific checkpoint
  const stateAtCheckpoint2 = await lix.db
    .selectFrom("file_history")
    .where("path", "=", "/config.json")
    .where("lixcol_root_commit_id", "=", checkpoint2.id)
    .where("lixcol_depth", "=", 0)
    .select(["data"])
    .executeTakeFirstOrThrow();

  console.log("State at checkpoint 2:",
    JSON.parse(new TextDecoder().decode(stateAtCheckpoint2.data))
  );

  console.log("SECTION END 'checkpoint-history'");
}

// Uncomment for running in node
// runExample(console);
