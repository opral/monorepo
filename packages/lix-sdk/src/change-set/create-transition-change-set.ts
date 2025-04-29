import type { Lix } from "../lix/index.js";
import type { ChangeSet } from "./database-schema.js";
import { createChangeSet } from "./create-change-set.js";
import { changeSetElementIsLeafOf } from "../query-filter/change-set-element-is-leaf-of.js";
import { changeSetElementInAncestryOf } from "../query-filter/change-set-element-in-ancestry-of.js";

/**
 * Creates a change set that enables a transition from a source state
 * (defined by `sourceChangeSet`) to a target state (defined by `targetChangeSet`).
 *
 * Applying the returned change set to the source state will result in a state
 * that matches the target state.
 *
 * - switch between state (switching versions, checkpoints, etc.)
 * - restore old state (applying the transition set on top of current state)
 */
export async function createTransitionChangeSet(args: {
	lix: Lix;
	sourceChangeSet: Pick<ChangeSet, "id">;
	targetChangeSet: Pick<ChangeSet, "id">;
}): Promise<ChangeSet> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		console.log(
			`createTransitionChangeSet: Source=${args.sourceChangeSet.id}, Target=${args.targetChangeSet.id}`
		);

		// 1. Find leaf changes defining the state AT the *target* change set
		const leafChangesToApply = await trx
			.selectFrom("change")
			.innerJoin(
				"change_set_element",
				"change_set_element.change_id",
				"change.id"
			)
			.where(changeSetElementInAncestryOf([args.targetChangeSet]))
			.where(changeSetElementIsLeafOf([args.targetChangeSet]))
			.select([
				"change.id",
				"change.entity_id",
				"change.schema_key",
				"change.file_id",
			])
			.distinct()
			.execute();

		console.log(
			` >> Found ${leafChangesToApply.length} leaf changes to apply from target.`
		);

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
			.where(changeSetElementInAncestryOf([{ id: args.sourceChangeSet.id }]))
			.where(changeSetElementIsLeafOf([{ id: args.sourceChangeSet.id }]))
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
							.where(changeSetElementInAncestryOf([args.targetChangeSet]))
							.where(changeSetElementIsLeafOf([args.targetChangeSet]))
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
							.where(changeSetElementInAncestryOf([args.targetChangeSet]))
							.where(changeSetElementIsLeafOf([args.targetChangeSet]))
							.select("restored_entity_check.id")
					)
				)
			)
			.select([
				"change.id",
				"change.entity_id",
				"change.plugin_key",
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
							leafEntitiesToDelete
								.filter((c) => {
									// deleting accounts and versions when switching is
									// not desired. a version should be able to jump to a
									// different version and the accounts are not affected
									const isInternalProtected =
										c.plugin_key === "lix_own_change_control" &&
										(c.schema_key === "lix_account_table" ||
											c.schema_key === "lix_version_table");
									return !isInternalProtected;
								})
								.map((c) => ({
									schema_key: c.schema_key,
									plugin_key: c.plugin_key,
									entity_id: c.entity_id,
									file_id: c.file_id,
									// delete change
									snapshot_id: "no-content",
								}))
						)
						.returning(["id", "entity_id", "schema_key", "file_id"])
						.execute()
				: [];

		const combinedChanges = [...leafChangesToApply, ...deleteChanges];

		if (combinedChanges.length === 0) {
			// Handle case where source and target are identical or transition is empty
			console.log(
				"No changes needed for transition. Creating empty change set."
			);
		}

		const transitionChangeSet = await createChangeSet({
			lix: { ...args.lix, db: trx },
			elements: combinedChanges.map((change) => ({
				change_id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				file_id: change.file_id,
			})),
		});

		return transitionChangeSet;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
