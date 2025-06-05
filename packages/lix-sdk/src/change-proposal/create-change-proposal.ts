// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import type { ChangeSet } from "../change-set/database-schema.js";
import type { Lix } from "../lix/open-lix.js";
import type { ChangeProposal } from "./database-schema.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { changeSetElementInSymmetricDifference } from "../query-filter/change-set-element-in-symmetric-difference.js";

/**
 * Creates a change proposal that represents the symmetric difference
 * between the source and target change sets.
 *
 * The symmetric difference contains changes that are in either the source
 * or target change set, but not in both.
 */
export async function createChangeProposal(args: {
	lix: Lix;
	sourceChangeSet: Pick<ChangeSet, "id">;
	targetChangeSet: Pick<ChangeSet, "id">;
}): Promise<ChangeProposal> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Get the changes that are in the symmetric difference between the two change sets
		const symmetricDifferenceChanges = await trx
			.selectFrom("change_set_element")
			.where(
				changeSetElementInSymmetricDifference(
					args.sourceChangeSet,
					args.targetChangeSet
				)
			)
			.select(["change_id as id", "entity_id", "schema_key", "file_id"])
			.execute();

		if (symmetricDifferenceChanges.length === 0) {
			throw new Error(
				"No changes in symmetric difference between source and target change sets."
			);
		}

		// Create a new change set with the symmetric difference changes
		const newChangeSet = await createChangeSet({
			lix: { ...args.lix, db: trx },
			elements: symmetricDifferenceChanges.map((change) => ({
				change_id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				file_id: change.file_id,
			})),
		});

		// Create the change proposal
		const result = await trx
			.insertInto("change_proposal")
			.values({
				change_set_id: newChangeSet.id,
				source_change_set_id: args.sourceChangeSet.id,
				target_change_set_id: args.targetChangeSet.id,
			})
			.returningAll()
			.executeTakeFirstOrThrow();

		return result;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
