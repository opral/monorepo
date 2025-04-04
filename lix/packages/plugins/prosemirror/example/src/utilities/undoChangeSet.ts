import { lix } from "../state";
import type { ChangeSet } from "@lix-js/sdk";
import { applyChanges, changeInVersion, fileQueueSettled } from "@lix-js/sdk";
import { selectActiveVersion } from "../queries";
import { createCheckpointV2 } from "./createCheckpoint";

/**
 * Undoes a specific change set by restoring to the state without that change set
 * and creates a checkpoint with an "undo" comment
 * @param changeSetId The ID of the change set to undo
 */
export async function undoChangeSet(
	changeSetId: ChangeSet["id"],
): Promise<void> {
	try {
		// Get the current version
		const currentVersion = await selectActiveVersion();
		if (!currentVersion) {
			throw new Error("No current version found");
		}

		// Get all change sets in the current version
		const allChangeSets = await lix.db
			.selectFrom("change_set")
			.innerJoin("change", "change.entity_id", "change_set.id")
			.where("change.schema_key", "=", "lix_change_set_table")
			.where(changeInVersion(currentVersion))
			.selectAll("change_set")
			.select("change.created_at as change_created_at")
			.execute();

		// Filter out the change set to be undone
		const remainingChangeSets = allChangeSets.filter(
			(cs) => cs.id !== changeSetId,
		);

		// Get all the change set IDs
		const changeSetIds = remainingChangeSets.map((cs) => cs.id);

		// The union of all leaf changes in the remaining change sets
		// is the state to be applied.
		const changes = await lix.db
			.selectFrom("change_set_element")
			.innerJoin("change", "change_set_element.change_id", "change.id")
			.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
			.innerJoin("file", "change.file_id", "file.id")
			.where("change_set_element.change_set_id", "in", changeSetIds)
			.where("file.path", "=", "/prosemirror.json")
			.selectAll("change")
			.select("snapshot.content")
			.execute();

		// Apply the changes to update the document
		// Use skipFileQueue=false to ensure changes are detected
		await applyChanges({
			lix,
			changes,
			skipFileQueue: false,
		});

		// await changes to be created
		await fileQueueSettled({ lix });

		// Create a checkpoint with an "undo" comment
		await createCheckpointV2("Undo changes");

		await lix.db
			.updateTable("key_value")
			.where("key", "=", "expandedChangeSetId")
			.set({ value: JSON.stringify(null) })
			.execute();

		console.log(`Change set undone: ${changeSetId}`);
	} catch (error) {
		console.error("Error undoing change set:", error);
		throw error;
	}
}
