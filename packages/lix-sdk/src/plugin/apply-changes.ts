import { withSkipChangeQueue } from "../change-queue/with-skip-change-queue.js";
import type { Change } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

/**
 * Applies the given changes to the lix.
 *
 * Calls the `applyChanges` method of the corresponding plugin for each change.
 * **Carefull**, the changes are not validated before applying them. It is up to
 * the caller to ensure that the changes are valid. Usually, only the leaf changes
 * of a given version should be applied.
 *
 * @example
 *   ```ts
 *   const changes = await lix.db.selectFrom("change")
 *      .where(changeIsLeafInVersion(currentVersion))
 *      .selectAll()
 *      .execute();
 *
 *   await applyChanges({ lix, changes });
 *   ```
 */
export async function applyChanges(args: {
	lix: Lix;
	changes: Change[];
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const groupByFile = Object.groupBy(
			args.changes,
			(change) => change.file_id,
		);

		const plugins = await args.lix.plugin.getAll();

		// TODO make detection of which plugin to use easier
		// https://linear.app/opral/issue/LIXDK-104/add-detectedchangeschema
		for (const [fileId, changes] of Object.entries(groupByFile)) {
			if (changes === undefined) {
				continue;
			}

			const groupByPlugin = Object.groupBy(changes, (c) => c.plugin_key);

			// TODO assumes that a file exists which is not necessarily true
			const file = await trx
				.selectFrom("file")
				.where("id", "=", fileId)
				.selectAll()
				.executeTakeFirstOrThrow();

			for (const [pluginKey, changes] of Object.entries(groupByPlugin)) {
				if (changes === undefined) {
					continue;
				}
				const plugin = plugins.find((plugin) => plugin.key === pluginKey);
				if (!plugin) {
					throw new Error(`Plugin with key ${pluginKey} not found`);
				} else if (!plugin.applyChanges) {
					throw new Error(
						`Plugin with key ${pluginKey} does not support applying changes`,
					);
				}
				const { fileData } = await plugin.applyChanges({
					lix: args.lix,
					file,
					changes,
				});

				await withSkipChangeQueue(trx, async (trx) => {
					await trx
						.updateTable("file")
						.set({ data: fileData })
						.where("id", "=", fileId)
						.execute();
				});
			}
		}
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
