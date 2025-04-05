import type { Lix } from "../lix/index.js";
import type { ChangeSet } from "./database-schema.js";
import { createChangeSet } from "./create-change-set.js";
import { changeSetElementIsLeafOf } from "../query-filter/change-set-element-is-leaf-of.js";
import { changeSetElementInAncestryOf } from "../query-filter/change-set-element-in-ancestry-of.js";

/**
 * Creates a "reverse" change set that undoes the changes made by the specified change set.
 *
 * @example
 *   ```ts
 *   const undoChangeSet = await createUndoChangeSet({
 *     lix,
 *     changeSet: targetChangeSet
 *   });
 *
 *   await applyChangeSet({
 *     lix,
 *     changeSet: undoChangeSet
 *   });
 *   ```
 *
 * @returns The newly created change set that contains the undo operations
 */
export async function createUndoChangeSet(args: {
	lix: Lix;
	changeSet: Pick<ChangeSet, "id">;
}): Promise<ChangeSet> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// 1. Get all changes in the target change set
		const targetChanges = await trx
			.selectFrom("change")
			.innerJoin(
				"change_set_element",
				"change_set_element.change_id",
				"change.id"
			)
			.where("change_set_element.change_set_id", "=", args.changeSet.id)
			.selectAll("change")
			.execute();

		// 2. For each change, create an inverse operation
		const undoChanges: Array<{
			entity_id: string;
			file_id: string;
			plugin_key: string;
			schema_key: string;
			snapshot_id: string;
		}> = [];

		for (const change of targetChanges) {
			if (change.plugin_key === "lix_own_change_control") {
				// Skip own change control changes to avoid meta-operations
				continue;
			}

			if (change.snapshot_id === "no-content") {
				// This was a delete operation, so we need to find the previous state to restore
				// by looking at the state in the parent change sets.
				const parentChangeSets = await trx
					.selectFrom("change_set_edge")
					.where("child_id", "=", args.changeSet.id)
					.select(["parent_id as id"])
					.execute();

				if (parentChangeSets.length > 0) {
					// Find the leaf change for this specific entity in the parent graph
					const previousChange = await trx
						.selectFrom("change")
						.innerJoin(
							"change_set_element",
							"change_set_element.change_id",
							"change.id"
						)
						// Ensure the change is within the ancestry of *any* parent
						.where(changeSetElementInAncestryOf(parentChangeSets))
						// Ensure it's a leaf relative to the combined parent state
						.where(changeSetElementIsLeafOf(parentChangeSets))
						// Filter for the specific entity we're undoing the delete for
						.where("change.entity_id", "=", change.entity_id)
						.where("change.schema_key", "=", change.schema_key)
						.where("change.file_id", "=", change.file_id)
						// The previous state must have content
						.where("change.snapshot_id", "!=", "no-content")
						.selectAll("change")
						.distinct()
						.executeTakeFirst();

					if (previousChange) {
						// We found a previous state, so restore it
						undoChanges.push({
							entity_id: previousChange.entity_id,
							file_id: previousChange.file_id,
							plugin_key: previousChange.plugin_key,
							schema_key: previousChange.schema_key,
							snapshot_id: previousChange.snapshot_id,
						});
					}
					// Else: If no previous change found in parents, the entity truly didn't exist before this delete.
					// So the 'undo' is effectively nothing for this specific change.
				}
				// Else: If there are no parents (initial change set?), a delete can't be undone meaningfully
				// in this context, as there's no prior state.
			} else {
				// This was a create or update operation, so create a delete operation
				undoChanges.push({
					entity_id: change.entity_id,
					file_id: change.file_id,
					plugin_key: change.plugin_key,
					schema_key: change.schema_key,
					snapshot_id: "no-content", // Mark as delete
				});
			}
		}

		// 3. Create and return the undo change set
		// First, insert the undo changes into the change table
		const insertedChanges =
			undoChanges.length > 0
				? await trx
						.insertInto("change")
						.values(undoChanges)
						.returningAll()
						.execute()
				: [];

		// Create the change set linking to these changes
		const undoChangeSet = await createChangeSet({
			lix: { ...args.lix, db: trx },
			changes: insertedChanges,
		});

		return undoChangeSet;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
