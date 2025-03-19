import { lix } from "./state";
import { Change } from "@lix-js/sdk";

/**
 * Selects the current prosemirror document from the lix database
 */
export async function selectProsemirrorDocument() {
  const file = await lix.db
    .selectFrom("file")
    .where("path", "=", "/prosemirror.json")
    .selectAll()
    .executeTakeFirst();

  if (file?.data) {
    try {
      return JSON.parse(new TextDecoder().decode(file.data));
    } catch (err) {
      console.error("Error parsing document:", err);
      return null;
    }
  }

  return null;
}

/**
 * Selects all changes related to the prosemirror document
 */
export async function selectChanges() {
  return lix.db
    .selectFrom("change")
    .innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
    .innerJoin("file", "change.file_id", "file.id")
    .where("file.path", "=", "/prosemirror.json")
    .selectAll("change")
    .select("snapshot.content")
    .orderBy("change.created_at", "desc")
    .execute();
}

/**
 * Selects all checkpoints with their associated changes
 */
export async function selectCheckpoints() {
  try {
    // 1. Get all change sets with checkpoint label
    const checkpointSets = await lix.db
      .selectFrom("change_set")
      .innerJoin(
        "change_set_label",
        "change_set.id",
        "change_set_label.change_set_id",
      )
      .innerJoin("label", "change_set_label.label_id", "label.id")
      .where("label.name", "=", "checkpoint")
      .select("change_set.id")
      .execute();

    // 2. For each checkpoint set, get its entity changes, discussion, and creation time
    const checkpointResults = await Promise.all(
      checkpointSets.map(async (set) => {
        // Get changes for this checkpoint
        const setChanges = await lix.db
          .selectFrom("change")
          .innerJoin(
            "change_set_element",
            "change.id",
            "change_set_element.change_id",
          )
          .innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
          .where("change_set_element.change_set_id", "=", set.id)
          .selectAll("change")
          .select("snapshot.content")
          .orderBy("change.created_at", "desc")
          .execute();

        // Get any discussions associated with this change set
        let message;
        try {
          const discussion = await lix.db
            .selectFrom("discussion")
            .where("change_set_id", "=", set.id)
            .select("id")
            .executeTakeFirst();

          if (discussion) {
            const comment = await lix.db
              .selectFrom("comment")
              .where("discussion_id", "=", discussion.id)
              .select("content")
              .limit(1)
              .executeTakeFirst();

            if (comment) {
              message = comment.content;
            }
          }
        } catch (error) {
          console.log("Error selecting discussion for checkpoint:", error);
        }

        // Use the newest change timestamp as the checkpoint creation time
        const timestamp =
          setChanges.length > 0
            ? setChanges[0].created_at
            : new Date().toISOString();

        return {
          id: set.id,
          created_at: timestamp,
          changes: setChanges as Array<Change & { content: any }>,
          message,
        };
      }),
    );

    // Sort checkpoints by their derived timestamps (newest first)
    return checkpointResults.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  } catch (error) {
    console.error("Error selecting checkpoints:", error);
    return [];
  }
}