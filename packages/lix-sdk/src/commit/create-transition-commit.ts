import type { Lix } from "../lix/index.js";
import type { LixCommit } from "./schema.js";
import { changeSetElementIsLeafOf } from "../query-filter/change-set-element-is-leaf-of.js";
import { changeSetElementInAncestryOf } from "../query-filter/change-set-element-in-ancestry-of.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { uuidV7 } from "../deterministic/uuid-v7.js";

/**
 * Creates a commit that enables a transition from a source state
 * (defined by `sourceCommit`) to a target state (defined by `targetCommit`).
 *
 * Applying the returned commit to the source state will result in a state
 * that matches the target state.
 *
 * - switch between state (switching versions, checkpoints, etc.)
 * - restore old state (applying the transition commit on top of current state)
 */
export async function createTransitionCommit(args: {
	lix: Lix;
	sourceCommit: Pick<LixCommit, "id">;
	targetCommit: Pick<LixCommit, "id">;
}): Promise<LixCommit> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// 1. Find leaf changes defining the state AT the *target* change set
		const leafChangesToApply = await trx
			.selectFrom("change")
			.innerJoin(
				"change_set_element",
				"change_set_element.change_id",
				"change.id"
			)
			.where(changeSetElementInAncestryOf([args.targetCommit]))
			.where(changeSetElementIsLeafOf([args.targetCommit]))
			.select([
				"change.id",
				"change.entity_id",
				"change.schema_key",
				"change.file_id",
			])
			.distinct()
			.execute();

		// 2. Find leaf changes that are present in the *source* state but NOT in the *target* state,
		//    AND whose entity is not being restored by a different change in the target state.
		const leafEntitiesToDelete = await trx
			.selectFrom("change")
			.innerJoin(
				"change_set_element",
				"change_set_element.change_id",
				"change.id"
			)
			// Condition A: The change must be a leaf in the *source* state
			.where(changeSetElementInAncestryOf([args.sourceCommit]))
			.where(changeSetElementIsLeafOf([args.sourceCommit]))
			// Condition B: The change must NOT be a leaf in the *target* state
			.where(({ not, exists, selectFrom }) =>
				not(
					exists(
						selectFrom("change as target_leaf_check")
							.innerJoin(
								"change_set_element as target_cs_elem",
								"target_cs_elem.change_id",
								"target_leaf_check.id"
							)
							.whereRef("target_leaf_check.id", "=", "change.id")
							// *** Swapped target and source here relative to previous version ***
							.where(changeSetElementInAncestryOf([args.targetCommit]))
							.where(changeSetElementIsLeafOf([args.targetCommit]))
							.select("target_leaf_check.id")
					)
				)
			)
			// Condition C: No other change for the *same entity* is a leaf in the *target* state
			.where(({ not, exists, selectFrom }) =>
				not(
					exists(
						selectFrom("change as restored_entity_check")
							.innerJoin(
								"change_set_element as restored_cs_elem",
								"restored_cs_elem.change_id",
								"restored_entity_check.id"
							)
							.whereRef(
								"restored_entity_check.entity_id",
								"=",
								"change.entity_id"
							)
							// Check if any change for this entity is a leaf AT THE TARGET change set
							// *** Swapped target and source here relative to previous version ***
							.where(changeSetElementInAncestryOf([args.targetCommit]))
							.where(changeSetElementIsLeafOf([args.targetCommit]))
							.select("restored_entity_check.id")
					)
				)
			)
			.select([
				"change.id",
				"change.entity_id",
				"change.plugin_key",
				"change.schema_version",
				"change.schema_key",
				"change.file_id",
			])
			.distinct()
			.execute();

		const deleteChanges =
			leafEntitiesToDelete.length > 0
				? await trx
						.insertInto("change")
						.values(
							leafEntitiesToDelete.map((c) => ({
								schema_key: c.schema_key,
								schema_version: c.schema_version,
								plugin_key: c.plugin_key,
								entity_id: c.entity_id,
								file_id: c.file_id,
								snapshot_content: null, // Deletion
							}))
						)
						.returning(["id", "entity_id", "schema_key", "file_id"])
						.execute()
				: [];

		const combinedChanges = [...leafChangesToApply, ...deleteChanges];

		if (combinedChanges.length === 0) {
			throw new Error("No changes to apply in the transition commit.");
		}

		const transitionChangeSet = await createChangeSet({
			lix: { ...args.lix, db: trx },
			elements: combinedChanges.map((change) => ({
				change_id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				file_id: change.file_id,
			})),
			lixcol_version_id: "global",
		});

		// Create a commit for the transition change set
		const commitId = uuidV7({ lix: args.lix });

		// Insert the commit
		await trx
			.insertInto("commit_all")
			.values({
				id: commitId,
				change_set_id: transitionChangeSet.id,
				lixcol_version_id: "global",
			})
			.execute();

		// Create commit edges to both source and target commits
		await trx
			.insertInto("commit_edge_all")
			.values([
				{
					parent_id: args.sourceCommit.id,
					child_id: commitId,
					lixcol_version_id: "global",
				},
				{
					parent_id: args.targetCommit.id,
					child_id: commitId,
					lixcol_version_id: "global",
				},
			])
			.execute();

		// Return the commit
		const commit = await trx
			.selectFrom("commit")
			.where("id", "=", commitId)
			.selectAll()
			.executeTakeFirstOrThrow();

		return commit;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
