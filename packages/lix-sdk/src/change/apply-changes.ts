import { CompiledQuery } from "kysely";
import { withSkipChangeQueue } from "../change-queue/with-skip-change-queue.js";
import type { Change } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import { applyOwnEntityChanges } from "../own-entity-change-control/apply-own-entity-change.js";

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
	lix: Pick<Lix, "db" | "plugin">;
	changes: Change[];
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const groupByFile = Object.groupBy(
			args.changes,
			(change) => change.file_id
		);

		// Lix own changes need to be applied first.
		//
		// Plugin changes depend on lix changes like the file
		// data for example. Therefore, the lix changes need
		// to be applied first.
		const lixOwnChanges = groupByFile["null"] ?? [];
		delete groupByFile["null"];

		const plugins = await args.lix.plugin.getAll();

		// TODO make detection of which plugin to use easier
		// https://linear.app/opral/issue/LIXDK-104/add-detectedchangeschema
		for (const [fileId, changes] of [
			// applying lix own changes first
			["null", lixOwnChanges] as [string, Change[]],
			...Object.entries(groupByFile),
		]) {
			if (changes === undefined || changes.length === 0) {
				continue;
			}
			// Skip own entity changes which have a file id 'null' and
			// plugin key 'lix_own_entity' as they are not associated with a file
			if (fileId === "null" && changes[0]?.plugin_key === "lix_own_entity") {
				await applyOwnEntityChanges({ lix: { ...args.lix, db: trx }, changes });
				continue;
			}

			const groupByPlugin = Object.groupBy(changes, (c) => c.plugin_key);

			// Applying lix own changes first ensures that the file
			// exists when querying the file here.
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
						`Plugin with key ${pluginKey} does not support applying changes`
					);
				}
				const { fileData } = await plugin.applyChanges({
					lix: { ...args.lix, db: trx },
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
