import type { Label } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import type { ChangeSet, ChangeSetElementTable } from "./database-schema.js";

/**
 * Creates a change set with the given elements, optionally within an open transaction.
 *
 * @example
 *   ```ts
 *   const elements = await lix.db.selectFrom("change_set_element").selectAll().execute();
 *   const changeSet = await createChangeSet({ db: lix.db, elements });
 *   ```
 *
 * @example
 *   ```ts
 *   // Create a change set with labels
 *   const labels = await lix.db.selectFrom("label").selectAll().execute();
 *   const changeSet = await createChangeSet({
 *     lix,
 *     elements: [],
 *     labels
 *   });
 *   ```
 *
 * @example
 *   ```ts
 *   // Create a change set with parent change sets
 *   const parentChangeSet = await createChangeSet({ lix, elements: [] });
 *   const childChangeSet = await createChangeSet({
 *     lix,
 *     elements: [],
 *     parents: [parentChangeSet]
 *   });
 *   ```
 */
export async function createChangeSet(args: {
	lix: Pick<Lix, "db">;
	id?: string;
	/**
	 * If true, all elements of the change set will be immutable after creation.
	 *
	 * Immutable change set elements is required to create change set edges (the graph).
	 *
	 * WARNING: The SQL schema defaults to false to allow crating change sets
	 * and inserting elements. For ease of use, the `createChangeSet()` utility
	 * defaults to true because in the majority of cases change set elements should be immutable.
	 *
	 * @default true
	 */
	immutableElements?: boolean;
	elements?: Pick<
		ChangeSetElementTable,
		"change_id" | "entity_id" | "schema_key" | "file_id"
	>[];
	labels?: Pick<Label, "id">[];
	/** Parent change sets that this change set will be a child of */
	parents?: Pick<ChangeSet, "id">[];
}): Promise<ChangeSet> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const changeSet = await trx
			.insertInto("change_set")
			.values({
				id: args.id,
				// needs to be false when creating the change set to insert elements
				immutable_elements: false,
			})
			.returningAll()
			.executeTakeFirstOrThrow();

		if (args.elements && args.elements.length > 0) {
			// Insert elements linking change set to changes
			await trx
				.insertInto("change_set_element")
				.values(
					args.elements.map((element) => ({
						change_set_id: changeSet.id,
						...element,
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

		const updatedCs = await trx
			.updateTable("change_set")
			.set({ immutable_elements: args.immutableElements ?? true })
			.where("id", "=", changeSet.id)
			.returningAll()
			.executeTakeFirstOrThrow();

		// Add parent-child relationships if parents are provided
		for (const parent of args.parents ?? []) {
			await trx
				.insertInto("change_set_edge")
				.values({
					parent_id: parent.id,
					child_id: changeSet.id,
				})
				.onConflict((oc) => oc.doNothing())
				.execute();
		}

		return updatedCs;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
