import type { Lix } from "../lix/index.js";
import type { ChangeSet } from "./database-schema.js";
import { applyChangeSet } from "./apply-change-set.js";
import { createChangeSet } from "./create-change-set.js";
import { changeSetElementIsLeafOf } from "../query-filter/change-set-element-is-leaf-of.js";
import { changeSetElementInAncestryOf } from "../query-filter/change-set-element-in-ancestry-of.js";
import type { VersionV2 } from "../version-v2/database-schema.js";
import type { Change } from "../database/schema.js";

/**
 * Restores the state to the specified change set. 
 * 
 * This function is experimental and may have unexpected behavior.
 * Please provide feedback. Modeling what a user expects as 
 * "restore" with good defaults is tricky. 
 * 
 */
export async function experimentalRestoreChangeSet(args: {
	lix: Lix;
	changeSet: Pick<ChangeSet, "id">;
	version?: Pick<VersionV2, "id">;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const version = args.version
			? await trx
					.selectFrom("version_v2")
					.where("id", "=", args.version.id)
					.select(["id", "change_set_id"])
					.executeTakeFirstOrThrow()
			: await trx
					.selectFrom("active_version")
					.innerJoin("version_v2", "version_v2.id", "active_version.version_id")
					.select(["id", "change_set_id"])
					.executeTakeFirstOrThrow();

		// 1. Find leaf changes defining the state AT the target change set
		const leafChangesToRestore = await trx
			.selectFrom("change")
			.innerJoin(
				"change_set_element",
				"change_set_element.change_id",
				"change.id"
			)
			.where(changeSetElementInAncestryOf([args.changeSet]))
			.where(changeSetElementIsLeafOf([args.changeSet]))
			.selectAll("change")
			.distinct()
			.execute();

		// 2. Find leaf changes that are present in the CURRENT state but NOT in the TARGET state,
		//    AND whose entity is not being restored by a different change in the target state.
		//    These are the changes corresponding to entities that need an explicit delete operation.
		const leafEntitiesToDelete = await trx
			.selectFrom("change")
			.innerJoin(
				"change_set_element",
				"change_set_element.change_id",
				"change.id"
			)
			// Condition A: The change must be a leaf in the *current* version's state
			.where(changeSetElementInAncestryOf([{ id: version.change_set_id }]))
			.where(changeSetElementIsLeafOf([{ id: version.change_set_id }]))
			// Condition B: The change must NOT be a leaf in the *target* state
			.where(({ not, exists, selectFrom }) =>
				not(
					exists(
						selectFrom("change as target_leaf_check")
							.innerJoin(
								"change_set_element as target_leaf_cse",
								"target_leaf_cse.change_id",
								"target_leaf_check.id"
							)
							.whereRef("target_leaf_check.id", "=", "change.id")
							.where(changeSetElementInAncestryOf([args.changeSet]))
							.where(changeSetElementIsLeafOf([args.changeSet]))
							.select("target_leaf_check.id")
					)
				)
			)
			// Condition C: The entity itself must NOT be present in the final restored state
			.where(({ not, exists, selectFrom }) =>
				not(
					exists(
						selectFrom("change as restored_entity_check")
							.innerJoin(
								"change_set_element as restored_entity_cse",
								"restored_entity_cse.change_id",
								"restored_entity_check.id"
							)
							// Match the entity_id from the outer query
							.whereRef(
								"restored_entity_check.entity_id",
								"=",
								"change.entity_id"
							)
							// Check if any change for this entity is a leaf AT THE TARGET change set
							.where(changeSetElementInAncestryOf([args.changeSet])) // Use target change set
							.where(changeSetElementIsLeafOf([args.changeSet])) // Use target change set
							.select("restored_entity_check.id") // Select something small
					)
				)
			)
			// don't delete history which would screw up the state
			// this might not be desired. hence, the function is experimental
			.where("change.plugin_key", "!=", "lix_own_change_control")
			.selectAll("change")
			.distinct()
			.execute();

		const deleteChanges = await trx
			.insertInto("change")
			.values(
				leafEntitiesToDelete.map((c) => ({
					schema_key: c.schema_key,
					plugin_key: c.plugin_key,
					entity_id: c.entity_id,
					file_id: c.file_id,
					// delete change
					snapshot_id: "no-content",
				}))
			)
			.returningAll()
			.execute();

		// Combine the changes needed for the interim set
		const combinedChangesForInterimSet = [
			...leafChangesToRestore,
			...deleteChanges,
		];

		//* OPTIMIZE IN THE FUTURE TO PERFORM THIS IN A SINGLE QUERY *
		// Filter for uniqueness based on entity, schema, and file before creating the interim set
		const uniqueChangesMap = new Map<string, Change>(); // Using Change type for simplicity, works for both restore and delete change shapes
		for (const change of combinedChangesForInterimSet) {
			const key = `${change.entity_id}:${change.schema_key}:${change.file_id}`;
			// If a restore and a delete change conflict for the same entity/schema/file (shouldn't happen anymore), prioritize the restore.
			if (!uniqueChangesMap.has(key) || change.snapshot_id !== "no-content") {
				uniqueChangesMap.set(key, change);
			}
		}
		const finalChangesForInterimSet = Array.from(uniqueChangesMap.values());

		const restoreChangeSet = await createChangeSet({
			lix: { ...args.lix, db: trx },
			elements: finalChangesForInterimSet.map(change => ({
				change_id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				file_id: change.file_id,
			})),
		});

		await applyChangeSet({
			lix: { ...args.lix, db: trx },
			changeSet: restoreChangeSet,
		});
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}