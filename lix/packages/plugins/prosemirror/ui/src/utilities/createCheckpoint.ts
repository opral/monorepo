import { Lix, Change } from "@lix-js/sdk";

/**
 * Creates a checkpoint with the specified entity changes
 * 
 * An entity change is uniquely identified by:
 * - change.id
 * - change.schema_key
 * - change.plugin_key
 */
export const createCheckpoint = async (
  lix: Lix,
  changeIds: Pick<Change, "id">[]
) => {
  const changeSet = await lix.db.transaction().execute(async (trx) => {
    // Create a new change set
    const newChangeSet = await trx
      .insertInto("change_set")
      .defaultValues()
      .returning("id")
      .executeTakeFirstOrThrow();

    // Get the checkpoint label ID (or create it if it doesn't exist)
    let checkpointLabel = await trx
      .selectFrom("label")
      .where("name", "=", "checkpoint")
      .select("id")
      .executeTakeFirst();

    // If the checkpoint label doesn't exist, create it
    if (!checkpointLabel) {
      checkpointLabel = await trx
        .insertInto("label")
        .values({
          name: "checkpoint",
        })
        .returning("id")
        .executeTakeFirstOrThrow();
    }

    // Tag the change set as a checkpoint
    await trx
      .insertInto("change_set_label")
      .values({
        change_set_id: newChangeSet.id,
        label_id: checkpointLabel.id,
      })
      .execute();

    // Get unique entity changes (using compound key of id, schema_key, plugin_key)
    // and add them to the change set
    for (const changeId of changeIds) {
      // Find the entity change for this change ID
      const entityChange = await trx
        .selectFrom("change")
        .where("id", "=", changeId.id)
        .selectAll()
        .executeTakeFirst();

      if (entityChange) {
        await trx
          .insertInto("change_set_element")
          .values({
            change_set_id: newChangeSet.id,
            change_id: entityChange.id,
          })
          .onConflict((oc) => oc.doNothing())
          .execute();
      }
    }

    return newChangeSet;
  });

  return changeSet;
};