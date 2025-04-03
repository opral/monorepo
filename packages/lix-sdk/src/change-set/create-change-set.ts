import type { Change, Label } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import type { ChangeSet } from "./database-schema.js";

/**
 * Creates a change set with the given changes, optionally within an open transaction.
 *
 * @example
 *   ```ts
 *   const changes = await lix.db.selectFrom("change").selectAll().execute();
 *   const changeSet = await createChangeSet({ db: lix.db, changes });
 *   ```
 *
 * @example
 *   ```ts
 *   // Create a change set with labels
 *   const labels = await lix.db.selectFrom("label").selectAll().execute();
 *   const changeSet = await createChangeSet({
 *     lix,
 *     changes: [],
 *     labels
 *   });
 *   ```
 * 
 * @example
 *   ```ts
 *   // Create a change set with parent change sets
 *   const parentChangeSet = await createChangeSet({ lix, changes: [] });
 *   const childChangeSet = await createChangeSet({
 *     lix,
 *     changes: [],
 *     parents: [parentChangeSet]
 *   });
 *   ```
 */
export async function createChangeSet(args: {
	lix: Pick<Lix, "db">;
	id?: string;
	changes?: Pick<Change, "id" | "entity_id" | "schema_key" | "file_id">[];
	labels?: Pick<Label, "id">[];
	/** Parent change sets that this change set will be a child of */
	parents?: Pick<ChangeSet, "id">[];
}): Promise<ChangeSet> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		let query = trx.insertInto("change_set");

		if (args.id) {
			query = query.values({ id: args.id });
		} else {
			query = query.defaultValues();
		}

		const changeSet = await query.returningAll().executeTakeFirstOrThrow();

		if (args.changes && args.changes.length > 0) {
			// Insert elements linking change set to changes
			await trx
				.insertInto("change_set_element")
				.values(
					args.changes.map((change) => {
						return {
							change_set_id: changeSet.id,
							change_id: change.id,
							entity_id: change.entity_id,
							schema_key: change.schema_key,
							file_id: change.file_id,
						};
					})
				)
				.execute();
		}

		// Add labels if provided
		if (args.labels && args.labels.length > 0) {
			await trx
				.insertInto("change_set_label")
				.values(
					args.labels.map((label) => ({
						label_id: label.id,
						change_set_id: changeSet.id,
					}))
				)
				.execute();
		}

		// Add parent-child relationships if parents are provided
		if (args.parents && args.parents.length > 0) {
			await trx
				.insertInto("change_set_edge")
				.values(
					args.parents.map((parent) => ({
						parent_id: parent.id,
						child_id: changeSet.id,
					}))
				)
				.execute();
		}

		return changeSet;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
