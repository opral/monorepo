import { jsonArrayFrom } from "kysely/helpers/sqlite";
import type { Lix } from "../lix/index.js";
import { applyOwnChanges } from "../own-change-control/apply-own-change.js";
import type { ChangeSet } from "./database-schema.js";
import type { Kysely } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";

/**
 * The modes for applying change sets.
 *
 * Is an object for future extensibility like
 * `{ type: "recursive", depth: number }`.
 */
type ApplyChangeSetMode = { type: "direct" } | { type: "recursive" };

/**
 * Applies a change set to the lix.
 */
export async function applyChangeSet(args: {
	lix: Lix;
	changeSet: Pick<ChangeSet, "id">;
	/**
	 * The mode for applying the change set.
	 *
	 * Defaults to `{ type: "recursive" }`.
	 */
	mode?: ApplyChangeSetMode;
}): Promise<void> {
	const mode = args.mode ?? { type: "recursive" };

	const executeInTransaction = async (trx: Lix["db"]) => {
		// Select distinct file_ids associated with the change set
		// and aggregate their corresponding changes into a JSON array.
		const changesGroupedByFile = await (
			mode.type === "direct"
				? selectChangesDirectMode
				: selectChangesRecursiveMode
		)(trx, args.changeSet);

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

async function selectChangesDirectMode(
	trx: Kysely<LixDatabaseSchema>,
	changeSet: ChangeSet
) {
	return await trx
		.selectFrom("change as c")
		.innerJoin("change_set_element as cse", "cse.change_id", "c.id")
		.where("cse.change_set_id", "=", changeSet.id)
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
					.where("sub_cse.change_set_id", "=", changeSet.id) // Filter by change set
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
}

async function selectChangesRecursiveMode(
	trx: Kysely<LixDatabaseSchema>,
	changeSet: ChangeSet
) {
	// Define the CTE to get the target change set and all its ancestors
	return await trx
		.withRecursive("ancestors_cte(id)", (cteBuilder) =>
			cteBuilder
				// Base case: Start with the target change set ID
				.selectFrom("change_set")
				.select("id")
				.where("id", "=", changeSet.id)
				.unionAll(
					// Recursive step: Find parents
					cteBuilder
						.selectFrom("change_set_edge as edge")
						.innerJoin("ancestors_cte", "ancestors_cte.id", "edge.child_id")
						.select("edge.parent_id as id")
				)
		)
		// Main query: Select changes grouped by file_id, filtered by the CTE
		.selectFrom("change as c")
		.innerJoin("change_set_element as cse", "cse.change_id", "c.id")
		// Ensure we only process files related to the ancestor change sets
		.where("cse.change_set_id", "in", (eb) =>
			eb.selectFrom("ancestors_cte").select("id")
		)
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
					// Filter changes to belong to one of the ancestor change sets
					.where("sub_cse.change_set_id", "in", (subEb) =>
						subEb.selectFrom("ancestors_cte").select("id")
					)
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
}