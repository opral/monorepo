import type { Change, ChangeSet, Label } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

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
 */
export async function createChangeSet(args: {
	lix: Pick<Lix, "db">;
	changes: Pick<Change, "id">[];
	labels?: Pick<Label, "id">[];
}): Promise<ChangeSet> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const changeSet = await trx
			.insertInto("change_set")
			.defaultValues()
			.returningAll()
			.executeTakeFirstOrThrow();

		if (args.changes.length > 0) {
			await trx
				.insertInto("change_set_element")
				.values(
					args.changes.map((change) => ({
						change_id: change.id,
						change_set_id: changeSet.id,
					}))
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

		return changeSet;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
