import { nanoid } from "../database/nano-id.js";
import type { Lix } from "../lix/open-lix.js";

export async function createCheckpoint(args: { lix: Lix }): Promise<{
	id: string;
}> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Set skip flag to prevent mutation handler from creating edges/change sets
		await trx
			.insertInto("key_value")
			.values({
				key: "lix_state_mutation_handler_skip_change_set_creation",
				value: "true",
			})
			.execute();

		try {
			// Get current active version
			const activeVersion = await trx
				.selectFrom("active_version")
				.innerJoin("version", "version.id", "active_version.version_id")
				.selectAll("version")
				.executeTakeFirstOrThrow();

			const workingChangeSetId = activeVersion.working_change_set_id;
			// Use the current change_set_id as parent - this represents the latest changes
			const parentChangeSetId = activeVersion.change_set_id;

			// Get current working change set elements (virtually computed)
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

			// 1. Copy working elements to the working change set (solidify virtual elements)
			for (const element of workingElements) {
				await trx
					.insertInto("change_set_element")
					.values({
						change_set_id: workingChangeSetId,
						change_id: element.change_id,
						entity_id: element.entity_id,
						schema_key: element.schema_key,
						file_id: element.file_id,
					})
					.execute();
			}

			// 2. Add ancestry edge to working change set (edge becomes part of checkpoint)
			await trx
				.insertInto("change_set_edge")
				.values({
					parent_id: parentChangeSetId,
					child_id: workingChangeSetId,
				})
				.execute();

			// 3. Create new empty working change set for continued work
			const newWorkingChangeSetId = nanoid();
			await trx
				.insertInto("change_set")
				.values({
					id: newWorkingChangeSetId,
				})
				.execute();

			// 4. Update version (now uses mutation handler to ensure proper change recording)
			await trx
				.updateTable("version")
				.where("id", "=", activeVersion.id)
				.set({
					change_set_id: workingChangeSetId, // Working becomes checkpoint
					working_change_set_id: newWorkingChangeSetId, // New empty working
				})
				.execute();

			return {
				id: workingChangeSetId,
			};
		} finally {
			await trx
				.deleteFrom("key_value")
				.where(
					"key",
					"=",
					"lix_state_mutation_handler_skip_change_set_creation"
				)
				.execute();
		}
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
