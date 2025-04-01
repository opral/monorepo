import type { Lix } from "../lix/index.js";
import { applyOwnChanges } from "../own-change-control/apply-own-change.js";
import type { ChangeSet } from "./database-schema.js";
import { changeIsLeafOfChangeSet } from "../query-filter/change-is-leaf-of-change-set.js";

/**
 * The modes for applying change sets.
 *
 * Is an object for future extensibility like
 * `{ type: "recursive", depth: number }`.
 */
type ApplyChangeSetMode = { type: "direct" } | { type: "recursive", depth?: number };

/**
 * Applies a change set to the lix.
 */
export async function applyChangeSet(args: {
	lix: Lix;
	changeSet: Pick<ChangeSet, "id">;
	/**
	 * The mode for applying the change set.
	 *
	 * @default "recursive"
	 */
	mode?: ApplyChangeSetMode;
}): Promise<void> {
	const mode = args.mode ?? { type: "recursive" };

	const executeInTransaction = async (trx: Lix["db"]) => {
		// Select changes associated with leaf change sets in the ancestry of the specified change set
		const changesResult = await trx
			.selectFrom("change")
			.innerJoin(
				"change_set_element",
				"change_set_element.change_id",
				"change.id"
			)
			.where(
				changeIsLeafOfChangeSet(args.changeSet, {
					depth: mode.type === "direct" ? 0 : mode.depth,
				})
			)
			.selectAll("change")
			.execute();

		// Group changes by file_id for processing
		const changesGroupedByFile = Object.groupBy(
			changesResult,
			(c) => c.file_id
		);

		// Plugin changes depend on lix changes like the file
		// data for example. Therefore, the lix changes need
		// to be applied first.
		const lixOwnChanges = changesGroupedByFile["lix_own_change_control"] ?? [];

		await applyOwnChanges({
			lix: { ...args.lix, db: trx },
			changes: lixOwnChanges,
		});

		const plugins = await args.lix.plugin.getAll();

		// Iterate over files and apply plugin changes
		for (const [file_id, changes] of Object.entries(changesGroupedByFile)) {
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

			const groupByPlugin = Object.groupBy(changes ?? [], (c) => c.plugin_key);

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
