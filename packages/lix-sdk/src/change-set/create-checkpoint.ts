import { nanoid } from "../database/nano-id.js";
import type { Lix } from "../lix/open-lix.js";

export async function createCheckpoint(args: { lix: Lix }): Promise<{
	id: string;
}> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Get current active version
		const activeVersion = await trx
				.selectFrom("active_version")
				.innerJoin("version", "version.id", "active_version.version_id")
				.selectAll("version")
				.executeTakeFirstOrThrow();

			const workingChangeSetId = activeVersion.working_change_set_id;
			// Use the current change_set_id as parent - this represents the latest changes
			const parentChangeSetId = activeVersion.change_set_id;

			// Check if there are any working change set elements to checkpoint
			const workingElements = await trx
				.selectFrom("change_set_element")
				.where("change_set_id", "=", workingChangeSetId)
				.selectAll()
				.execute();

			if (workingElements.length === 0) {
				throw new Error(
					"No changes in working change set to create a checkpoint for."
				);
			}

			// 1. Add ancestry edge from parent to working change set (working becomes checkpoint)
			await trx
				.insertInto("change_set_edge")
				.values({
					parent_id: parentChangeSetId,
					child_id: workingChangeSetId,
					version_id: "global",
				})
				.execute();

			// 2. Create new empty working change set for continued work
			const newWorkingChangeSetId = nanoid();
			await trx
				.insertInto("change_set")
				.values({
					id: newWorkingChangeSetId,
					version_id: "global",
				})
				.execute();

			// 3. Get checkpoint label and assign it to the checkpoint change set
			const checkpointLabel = await trx
				.selectFrom("label")
				.where("name", "=", "checkpoint")
				.select("id")
				.executeTakeFirstOrThrow();

			await trx
				.insertInto("change_set_label")
				.values({
					change_set_id: workingChangeSetId,
					label_id: checkpointLabel.id,
					version_id: "global",
				})
				.execute();

			// 4. Update version in two steps to ensure proper mutation handler behavior
			// First, update change_set_id (this should skip mutation handler logic)
			await trx
				.updateTable("version")
				.where("id", "=", activeVersion.id)
				.set({
					change_set_id: workingChangeSetId, // Working becomes checkpoint
				})
				.execute();

			// Then, update working_change_set_id (this should also skip mutation handler logic)
			await trx
				.updateTable("version")
				.where("id", "=", activeVersion.id)
				.set({
					working_change_set_id: newWorkingChangeSetId, // New empty working
				})
				.execute();

			return {
				id: workingChangeSetId,
			};
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
