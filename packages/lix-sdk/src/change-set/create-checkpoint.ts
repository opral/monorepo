import { nanoid } from "../database/nano-id.js";
import type { Lix } from "../lix/open-lix.js";

/**
 * Converts the current working change set into a checkpoint.
 *
 * The working change set becomes immutable and receives the
 * `checkpoint` label. A fresh empty working change set is created so
 * that new changes can continue to accumulate.
 *
 * @example
 * ```ts
 * const { id } = await createCheckpoint({ lix })
 * ```
 */

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
			.selectFrom("change_set_element_all")
			.where("change_set_id", "=", workingChangeSetId)
			.where("lixcol_version_id", "=", "global")
			.selectAll()
			.execute();

		if (workingElements.length === 0) {
			throw new Error(
				"No changes in working change set to create a checkpoint for."
			);
		}

		// 1. Add ancestry edge from parent to working change set (working becomes checkpoint)
		await trx
			.insertInto("change_set_edge_all")
			.values({
				parent_id: parentChangeSetId,
				child_id: workingChangeSetId,
				lixcol_version_id: "global",
			})
			.execute();

		// 2. Create new empty working change set for continued work
		const newWorkingChangeSetId = nanoid();
		await trx
			.insertInto("change_set_all")
			.values({
				id: newWorkingChangeSetId,
				lixcol_version_id: "global",
			})
			.execute();

		// 3. Get checkpoint label and assign it to the checkpoint change set
		const checkpointLabel = await trx
			.selectFrom("label")
			.where("name", "=", "checkpoint")
			.select("id")
			.executeTakeFirstOrThrow();

		await trx
			.insertInto("change_set_label_all")
			.values({
				change_set_id: workingChangeSetId,
				label_id: checkpointLabel.id,
				lixcol_version_id: "global",
			})
			.execute();

		await trx
			.updateTable("version")
			.where("id", "=", activeVersion.id)
			.set({
				change_set_id: workingChangeSetId, // becomes checkpoint
				working_change_set_id: newWorkingChangeSetId,
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
