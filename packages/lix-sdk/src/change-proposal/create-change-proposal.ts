// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import type { LixChangeSet } from "../change-set/schema.js";
import type { Lix } from "../lix/open-lix.js";
import type { ChangeProposal } from "./database-schema.js";
import { createChangeSet } from "../change-set/create-change-set.js";

/**
 * Creates a change proposal that represents the symmetric difference
 * between the source and target change sets.
 *
 * The symmetric difference contains changes that are in either the source
 * or target change set, but not in both.
 */
export async function createChangeProposal(args: {
	lix: Lix;
	sourceChangeSet: Pick<LixChangeSet, "id">;
	targetChangeSet: Pick<LixChangeSet, "id">;
}): Promise<ChangeProposal> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Compute symmetric difference of change_ids between the two change sets (inline stub)
		const symmetricDifferenceChanges = await trx
			.selectFrom("change_set_element")
			.where((eb) =>
				eb.or([
					eb("change_set_element.change_id", "in", (sub) =>
						sub
							.selectFrom("change_set_element as A")
							.leftJoin("change_set_element as B", (join) =>
								join
									.onRef("A.change_id", "=", "B.change_id")
									.on("B.change_set_id", "=", args.targetChangeSet.id)
							)
							.where("A.change_set_id", "=", args.sourceChangeSet.id)
							.where("B.change_id", "is", null)
							.select("A.change_id")
					),
					eb("change_set_element.change_id", "in", (sub) =>
						sub
							.selectFrom("change_set_element as B")
							.leftJoin("change_set_element as A", (join) =>
								join
									.onRef("B.change_id", "=", "A.change_id")
									.on("A.change_set_id", "=", args.sourceChangeSet.id)
							)
							.where("B.change_set_id", "=", args.targetChangeSet.id)
							.where("A.change_id", "is", null)
							.select("B.change_id")
					),
				])
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
