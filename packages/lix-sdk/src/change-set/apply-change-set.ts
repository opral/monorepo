import { jsonArrayFrom } from "kysely/helpers/sqlite";
import type { Lix } from "../lix/index.js";
import { applyOwnChanges } from "../own-change-control/apply-own-change.js";
import type { ChangeSet } from "./database-schema.js";

/**
 */
export async function applyChangeSet(args: {
	lix: Lix;
	changeSet: Pick<ChangeSet, "id">;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Select distinct file_ids associated with the change set
		// and aggregate their corresponding changes into a JSON array.
		const changesGroupedByFile = await trx
			.selectFrom("change as c")
			.innerJoin("change_set_element as cse", "cse.change_id", "c.id")
			.where("cse.change_set_id", "=", args.changeSet.id)
			.select((eb) => [
				"c.file_id",
				jsonArrayFrom(
					eb
						.selectFrom("change as sub_c")
						.innerJoin(
							"change_set_element as sub_cse",
							"sub_cse.change_id",
							"sub_c.id"
						)
						.whereRef("sub_c.file_id", "=", "c.file_id") // Correlate with outer file_id
						.where("sub_cse.change_set_id", "=", args.changeSet.id) // Filter by change set
						.select([
							"sub_c.id",
							"sub_c.entity_id",
							"sub_c.schema_key",
							"sub_c.file_id",
							"sub_c.snapshot_id",
							"sub_c.plugin_key",
							"sub_c.created_at",
						])
				).as("changes"),
			])
			.distinct()
			.execute();

		// Plugin changes depend on lix changes like the file
		// data for example. Therefore, the lix changes need
		// to be applied first.
		const lixOwn = changesGroupedByFile.find(
			(g) => g.file_id === "lix_own_change_control"
		) ?? { changes: [] };

		await applyOwnChanges({
			lix: { ...args.lix, db: trx },
			changes: lixOwn.changes,
		});

		const plugins = await args.lix.plugin.getAll();

		// Iterate over files and apply plugin changes
		for (const { file_id, changes } of changesGroupedByFile) {
			const file = await trx
				.selectFrom("file")
				.where("id", "=", file_id)
				.selectAll()
				.executeTakeFirst();

			// lix own change control deleted the file
			// no plugin needs to apply changes
			if (file === undefined) {
				continue;
			} else if (file.data.byteLength === 0) {
				// @ts-expect-error - the plugin will handle undefined file.data
				delete file.data;
			}

			const groupByPlugin = Object.groupBy(changes, (c) => c.plugin_key);

			for (const [pluginKey, changes] of Object.entries(groupByPlugin)) {
				if (changes === undefined) {
					continue;
				}
				const plugin = plugins.find((plugin) => plugin.key === pluginKey);
				if (!plugin) {
					throw new Error(`Plugin with key ${pluginKey} not found`);
				} else if (!plugin.applyChanges) {
					throw new Error(
						`Plugin with key ${pluginKey} does not support applying changes`
					);
				}
				const { fileData } = await plugin.applyChanges({
					lix: { ...args.lix, db: trx },
					file,
					changes,
				});

				await trx
					.updateTable("file")
					.set({ data: fileData })
					.where("id", "=", file_id)
					.execute();
			}
		}
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
