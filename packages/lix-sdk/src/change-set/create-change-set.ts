import { nanoId } from "../deterministic/index.js";
import type { Lix } from "../lix/open-lix.js";
import type { LixChangeSet, LixChangeSetElement } from "./schema.js";
import type { LixLabel } from "../label/schema.js";
import type { NewState } from "../entity-views/types.js";

/**
 * Creates a change set and optionally attaches elements and labels.
 *
 * Change sets are the building blocks of versions and checkpoints. This
 * function inserts all provided relations in a single transaction and
 * returns the newly created record.
 *
 * @example
 * ```ts
 * const cs = await createChangeSet({ lix, elements: [{ change_id, entity_id }] })
 * ```
 */

export async function createChangeSet(args: {
	lix: Pick<Lix, "db" | "sqlite">;
	id?: string;
	elements?: Omit<NewState<LixChangeSetElement>, "change_set_id">[];
	labels?: Pick<LixLabel, "id">[];
	/** Version ID where the change set should be stored. Defaults to active version */
	lixcol_version_id?: string;
}): Promise<LixChangeSet & { lixcol_version_id: string }> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const csId = args.id ?? nanoId({ lix: args.lix });

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
