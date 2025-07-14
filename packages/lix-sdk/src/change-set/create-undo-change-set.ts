import type { Lix } from "../lix/index.js";
import type { LixChangeSet } from "./schema.js";
import { createChangeSet } from "./create-change-set.js";
import type { LixLabel } from "../label/schema.js";
import type { NewLixChange } from "../change/schema.js";
import { v7 } from "uuid";

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
	changeSet: Pick<LixChangeSet, "id">;
	labels?: Pick<LixLabel, "id">[];
}): Promise<LixChangeSet> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Check for multiple parents (not supported yet)
		const parents = await trx
			.selectFrom("change_set_edge_all")
			.where("lixcol_version_id", "=", "global")
			.where("child_id", "=", args.changeSet.id)
			.select("parent_id")
			.execute();

		if (parents.length > 1) {
			throw new Error(
				"Cannot undo change sets with multiple parents (merge scenarios not yet supported)"
			);
		}

		// Get all changes in the target change set (direct changes only, non-recursive)
		const targetChanges = await trx
			.selectFrom("change")
			.innerJoin(
				"change_set_element_all",
				"change_set_element_all.change_id",
				"change.id"
			)
			.where("change_set_element_all.lixcol_version_id", "=", "global")
			.where("change_set_element_all.change_set_id", "=", args.changeSet.id)
			.selectAll("change")
			.execute();

		const undoChanges: Array<NewLixChange> = [];

		for (const change of targetChanges) {
			if (parents.length === 0) {
				// No parent = this was the first change set, undo = delete everything
				undoChanges.push({
					id: v7(),
					entity_id: change.entity_id,
					file_id: change.file_id,
					plugin_key: change.plugin_key,
					schema_key: change.schema_key,
					schema_version: change.schema_version,
					snapshot_content: null, // Mark as deletion
				});
			} else {
				// Find the previous state in the parent change set
				const parentChangeSet = parents[0]!.parent_id;

				const previousChange = await trx
					.selectFrom("change")
					.innerJoin(
						"change_set_element",
						"change_set_element.change_id",
						"change.id"
					)
					.where("change_set_element.change_set_id", "=", parentChangeSet)
					.where("change_set_element.entity_id", "=", change.entity_id)
					.where("change_set_element.file_id", "=", change.file_id)
					.where("change_set_element.schema_key", "=", change.schema_key)
					.selectAll("change")
					.executeTakeFirst();

				if (previousChange) {
					// Restore to previous state
					undoChanges.push({
						id: v7(),
						entity_id: change.entity_id,
						file_id: change.file_id,
						plugin_key: change.plugin_key,
						schema_key: change.schema_key,
						schema_version: change.schema_version,
						snapshot_content: previousChange.snapshot_content, // Restore previous snapshot
					});
				} else {
					// Entity didn't exist before, so delete it
					undoChanges.push({
						id: v7(),
						entity_id: change.entity_id,
						file_id: change.file_id,
						plugin_key: change.plugin_key,
						schema_key: change.schema_key,
						schema_version: change.schema_version,
						snapshot_content: null, // Mark as deletion
					});
				}
			}
		}

		// Insert the undo changes
		const createdUndoChanges =
			undoChanges.length > 0
				? await trx
						.insertInto("change")
						.values(undoChanges)
						.returningAll()
						.execute()
				: [];

		// Create the undo change set
		const undoChangeSet = await createChangeSet({
			lix: { ...args.lix, db: trx },
			labels: args.labels,
			lixcol_version_id: "global",
			elements: createdUndoChanges.map((change) => ({
				change_id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				file_id: change.file_id,
			})),
		});

		return undoChangeSet;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
