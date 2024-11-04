import type { Change } from "../database/schema.js";
import type { Lix } from "../open/openLix.js";
import { changeIsLeafChange } from "../query-utilities/change-is-leaf-change.js";

/**
 * Applies the given changes to the lix.
 *
 * - filters out non-leaf changes
 * - calls the responsible plugin to apply the changes
 */
export async function applyChanges(args: {
	lix: Lix;
	changes: Change[];
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// in case the caller has not grouped the changes by leaf changes
		const leafChanges = await groupByLeafChanges({
			lix: { db: trx },
			changes: args.changes,
		});

		const groupByFile = Object.groupBy(leafChanges, (change) => change.file_id);

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
				await trx
					.updateTable("file")
					.set({ data: fileData })
					.where("id", "=", fileId)
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

/**
 * Groups the given changes by leaf changes.
 *
 * Grouping by leaf changes is useful a given
 * set of changes might or might not contain
 * changes in the same entity graph.
 *
 * Imagine applying a set of changes to a lix.
 * Only leaf changes of the given set of changes
 * should be applied. Hence, grouping by leaf
 * changes is a required step before applying.
 *
 * @example
 *   ```ts
 *   const leafChanges = await groupByLeafChanges({ lix, changes });
 *   ```
 *
 */
async function groupByLeafChanges(args: {
	lix: Pick<Lix, "db">;
	changes: Change[];
}): Promise<Change[]> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		return await trx
			.selectFrom("change")
			.selectAll()
			.where(
				"id",
				"in",
				args.changes.map((change) => change.id),
			)
			.where(changeIsLeafChange())
			.execute();
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
