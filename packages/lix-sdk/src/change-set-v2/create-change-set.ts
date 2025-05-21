import { nanoid } from "../database/nano-id.js";
import type { Lix } from "../lix/open-lix.js";
import type { ChangeSet, ChangeSetElement } from "./schema.js";

export async function createChangeSet(args: {
	lix: Pick<Lix, "db">;
	id?: string;
	elements?: Pick<
		ChangeSetElement,
		"change_id" | "entity_id" | "schema_key" | "file_id"
	>[];
	// labels?: Pick<Label, "id">[];
	/** Parent change sets that this change set will be a child of */
	parents?: Pick<ChangeSet, "id">[];
}): Promise<ChangeSet> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const csId = args.id ?? nanoid();
		await trx
			.insertInto("change_set")
			.values({
				id: csId,
			})
			.executeTakeFirstOrThrow();

		if (args.elements && args.elements.length > 0) {
			// Insert elements linking change set to changes
			await trx
				.insertInto("change_set_element")
				.values(
					args.elements.map((element) => ({
						change_set_id: csId,
						...element,
					}))
				)
				.execute();
		}

		// Add labels if provided
		// if (args.labels && args.labels.length > 0) {
		// 	await trx
		// 		.insertInto("change_set_label")
		// 		.values(
		// 			args.labels.map((label) => ({
		// 				label_id: label.id,
		// 				change_set_id: changeSet.id,
		// 			}))
		// 		)
		// 		.execute();
		// }

		// Add parent-child relationships if parents are provided
		for (const parent of args.parents ?? []) {
			await trx
				.insertInto("change_set_edge")
				.values({
					parent_id: parent.id,
					child_id: csId,
				})
				.onConflict((oc) => oc.doNothing())
				.execute();
		}

		const changeSet = await trx
			.selectFrom("change_set")
			.selectAll()
			.where("id", "=", csId)
			.executeTakeFirstOrThrow();

		return changeSet;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
