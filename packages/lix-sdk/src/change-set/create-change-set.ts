import { nanoid } from "../database/nano-id.js";
import type { Lix } from "../lix/open-lix.js";
import type { ChangeSet, NewChangeSetElement } from "./schema.js";
import type { Label } from "../label/schema.js";

export async function createChangeSet(args: {
	lix: Pick<Lix, "db">;
	id?: string;
	elements?: Omit<NewChangeSetElement, "change_set_id">[];
	labels?: Pick<Label, "id">[];
	/** Parent change sets that this change set will be a child of */
	parents?: Pick<ChangeSet, "id">[];
	/** Version ID where the change set should be stored. Defaults to active version */
	lixcol_version_id?: string;
}): Promise<ChangeSet & { lixcol_version_id: string }> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const csId = args.id ?? nanoid();

		// Use _all view if version_id is specified, otherwise use regular view
		if (args.lixcol_version_id) {
			await trx
				.insertInto("change_set_all")
				.values({
					id: csId,
					lixcol_version_id: args.lixcol_version_id,
				})
				.executeTakeFirstOrThrow();
		} else {
			await trx
				.insertInto("change_set")
				.values({
					id: csId,
				})
				.executeTakeFirstOrThrow();
		}

		if (args.elements && args.elements.length > 0) {
			// Insert elements linking change set to changes
			if (args.lixcol_version_id) {
				await trx
					.insertInto("change_set_element_all")
					.values(
						args.elements.map((element) => ({
							change_set_id: csId,
							lixcol_version_id: args.lixcol_version_id,
							...element,
						}))
					)
					.execute();
			} else {
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
		}

		// Add labels if provided
		if (args.labels && args.labels.length > 0) {
			if (args.lixcol_version_id) {
				await trx
					.insertInto("change_set_label_all")
					.values(
						args.labels.map((label) => ({
							lixcol_version_id: args.lixcol_version_id,
							label_id: label.id,
							change_set_id: csId,
						}))
					)
					.execute();
			} else {
				await trx
					.insertInto("change_set_label")
					.values(
						args.labels.map((label) => ({
							label_id: label.id,
							change_set_id: csId,
						}))
					)
					.execute();
			}
		}

		// Add parent-child relationships if parents are provided
		for (const parent of args.parents ?? []) {
			if (args.lixcol_version_id) {
				await trx
					.insertInto("change_set_edge_all")
					.values({
						parent_id: parent.id,
						child_id: csId,
						lixcol_version_id: args.lixcol_version_id,
					})
					.execute();
			} else {
				await trx
					.insertInto("change_set_edge")
					.values({
						parent_id: parent.id,
						child_id: csId,
					})
					.execute();
			}
		}

		const changeSet = await trx
			.selectFrom("change_set_all")
			.selectAll()
			.where("id", "=", csId)
			.where(
				"lixcol_version_id",
				"=",
				args.lixcol_version_id ??
					trx.selectFrom("active_version").select("version_id")
			)
			.executeTakeFirstOrThrow();

		return changeSet;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
