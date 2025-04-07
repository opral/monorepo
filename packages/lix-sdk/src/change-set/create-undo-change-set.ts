import type { Lix } from "../lix/index.js";
import type { ChangeSet } from "./database-schema.js";
import { createChangeSet } from "./create-change-set.js";
import { changeSetIsDescendantOf } from "../query-filter/change-set-is-descendant-of.js";
import { changeSetIsAncestorOf } from "../query-filter/change-set-is-ancestor-of.js";

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
		// Get all changes in the target change set
		const targetChanges = await trx
			.selectFrom("change")
			.innerJoin(
				"change_set_element",
				"change_set_element.change_id",
				"change.id"
			)
			.where("change_set_element.change_set_id", "=", args.changeSet.id)
			// exclude own change control changes that interfere with history
			// todo this needs better handling/testing
			.where("change.schema_key", "not in", [
				"lix_change_set_table",
				"lix_change_set_edge_table",
				"lix_change_author_table",
			])
			.selectAll("change")
			.execute();

		const undoChanges: Array<{
			entity_id: string;
			file_id: string;
			plugin_key: string;
			schema_key: string;
			snapshot_id: string;
		}> = [];

		for (const change of targetChanges) {
			const descendantChange = await trx
				.selectFrom("change_set_element")
				.innerJoin(
					"change_set",
					"change_set.id",
					"change_set_element.change_set_id"
				)
				.innerJoin("change", "change.id", "change_set_element.change_id")
				.where(changeSetIsDescendantOf({ id: args.changeSet.id }))
				.where("change_set_element.entity_id", "=", change.entity_id)
				.where("change_set_element.file_id", "=", change.file_id)
				.where("change_set_element.schema_key", "=", change.schema_key)
				.where("change_set_element.change_id", "!=", change.id)
				.selectAll("change")
				.executeTakeFirst();

			if (descendantChange) {
				// the change was already overwritten, so we can skip it
				continue;
			}

			const ancestorChange = await trx
				.selectFrom("change_set_element")
				.innerJoin(
					"change_set",
					"change_set.id",
					"change_set_element.change_set_id"
				)
				.innerJoin("change", "change.id", "change_set_element.change_id")
				.where(changeSetIsAncestorOf({ id: args.changeSet.id }))
				.where("change_set_element.entity_id", "=", change.entity_id)
				.where("change_set_element.file_id", "=", change.file_id)
				.where("change_set_element.schema_key", "=", change.schema_key)
				.where("change.id", "!=", change.id)
				.selectAll("change")
				.executeTakeFirst();

			if (ancestorChange === undefined) {
				// the entity needs to be deleted, as it has been created by the target change set
				undoChanges.push({
					entity_id: change.entity_id,
					file_id: change.file_id,
					plugin_key: change.plugin_key,
					schema_key: change.schema_key,
					snapshot_id: "no-content",
				});
			} else {
				undoChanges.push(ancestorChange);
			}
		}

		// if (undoChanges.length === 0) {
		// 	return;
		// }

		const changes = await trx
			.insertInto("change")
			.values(undoChanges)
			// if the change is an ancestor change and already exists, do nothing
			.onConflict((oc) =>
				// need to update something to make the on conflict return the change
				oc.doUpdateSet((eb) => ({ id: eb.ref("excluded.id") }))
			)
			.returningAll()
			.execute();

		// Create the change set linking to these changes
		const undoChangeSet = await createChangeSet({
			lix: { ...args.lix, db: trx },
			changes,
		});

		return undoChangeSet;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
