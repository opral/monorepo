import type { Lix } from "../lix/index.js";
import type { ChangeSet } from "./schema.js";
import { changeSetElementInAncestryOf } from "../query-filter/change-set-element-in-ancestry-of.js";
import { changeSetElementIsLeafOf } from "../query-filter/change-set-element-is-leaf-of.js";

/**
 * Applies a change set to the lix.
 */
export async function applyChangeSet(args: {
	lix: Lix;
	changeSet: Pick<ChangeSet, "id">;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Select changes associated with the specified change set (recursive by default)
		const query = trx
			.selectFrom("change")
			.innerJoin(
				"change_set_element",
				"change_set_element.change_id",
				"change.id"
			)
			.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
			.where(changeSetElementInAncestryOf([args.changeSet]))
			.where(changeSetElementIsLeafOf([args.changeSet]))
			.select([
				"change.id",
				"change.entity_id",
				"change.schema_key",
				"change.file_id",
				"change.plugin_key",
				"change.snapshot_id",
				"change.created_at",
				"snapshot.content as snapshot_content",
			]);

		const changesResult = await query.execute();

		// Group changes by file_id for processing
		const changesGroupedByFile = Object.groupBy(
			changesResult,
			(c) => c.file_id
		);

		const plugins = await args.lix.plugin.getAll();

		// Iterate over files and apply plugin changes
		for (const [file_id, changes] of Object.entries(changesGroupedByFile)) {
			// Skip if no changes for this file
			if (!changes || changes.length === 0) {
				continue;
			}

			// Get the file data
			const file = await trx
				.selectFrom("file")
				.where("id", "=", file_id)
				.selectAll()
				.executeTakeFirstOrThrow();

			const groupByPlugin = Object.groupBy(changes, (c) => c.plugin_key);

			for (const [pluginKey, pluginChanges] of Object.entries(groupByPlugin)) {
				if (!pluginChanges || pluginChanges.length === 0) {
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

				const { fileData } = plugin.applyChanges({
					changes: pluginChanges,
					file,
				});

				const resultingFile = {
					...file,
					data: fileData,
				};

				await trx
					.updateTable("file")
					.set(resultingFile)
					.where("id", "=", resultingFile.id)
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
