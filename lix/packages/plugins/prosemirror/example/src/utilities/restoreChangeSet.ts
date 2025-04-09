import { lix } from "../state";
import type { ChangeSet } from "@lix-js/sdk";
import { applyChanges, changeInVersion, fileQueueSettled } from "@lix-js/sdk";
import { selectActiveVersion } from "../queries";

/**
 * Restores the document to the state it was in at the given change set
 * and creates a checkpoint with a "Restore" comment
 * @param changeSetId The ID of the change set to restore to
 */
export async function restoreChangeSet(
	changeSetId: ChangeSet["id"],
): Promise<void> {
	try {
		// Get the current version
		const currentVersion = await selectActiveVersion();
		if (!currentVersion) {
			throw new Error("No current version found");
		}

		const changeSet = await lix.db
			.selectFrom("change_set")
			.where("change_set.id", "=", changeSetId)
			.innerJoin("change", "change.entity_id", "change_set.id")
			.where("change.schema_key", "=", "lix_change_set_table")
			.selectAll("change_set")
			.select("change.created_at as change_created_at")
			.executeTakeFirstOrThrow();

		// Get all change sets up to and including the selected change set
		const remainingChangeSets = await lix.db
			.selectFrom("change_set")
			.innerJoin("change", "change.entity_id", "change_set.id")
			.where("change.schema_key", "=", "lix_change_set_table")
			.where("change.created_at", "<", changeSet.change_created_at)
			.where(changeInVersion(currentVersion))
			.selectAll("change_set")
			.execute();

		// Include the target change set if it's not already in the list
		if (!remainingChangeSets.some((cs) => cs.id === changeSetId)) {
			remainingChangeSets.push(changeSet);
		}

		// Get all the change set IDs
		const changeSetIds = remainingChangeSets.map((cs) => cs.id);

		// The union of all leaf changes in the change sets
		// is the state to be applied.
		const changes = await lix.db
			.selectFrom("change_set_element")
			.innerJoin("change", "change_set_element.change_id", "change.id")
			.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
			.innerJoin("file", "change.file_id", "file.id")
			.where("change_set_element.change_set_id", "in", changeSetIds)
			.where("file.path", "=", "/prosemirror.json")
			// .where(changeIsLeaf())
			.selectAll("change")
			.select("snapshot.content")
			.execute();

		// Apply the changes to update the document
		// Use skipFileQueue=false to ensure changes are detected
		// This is important for the UI to update properly
		await applyChanges({
			lix,
			changes,
			skipFileQueue: false,
		});

		// Wait for changes to be created
		await fileQueueSettled({ lix });

		// Create a checkpoint with a "Restore" comment
		// await createCheckpointV2("Restore changes");

		// // Reset the expanded change set
		// await lix.db
		// 	.updateTable("key_value")
		// 	.where("key", "=", "expandedChangeSetId")
		// 	.set({ value: JSON.stringify(null) })
		// 	.execute();

		console.log(`Document restored to version: ${changeSetId}`);
	} catch (error) {
		console.error("Error restoring version:", error);
		throw error;
	}
}
