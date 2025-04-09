import type { Lix } from "../lix/index.js";
import { applyOwnChanges } from "../own-change-control/apply-own-change.js";
import type { ChangeSet } from "./database-schema.js";
import type { GraphTraversalMode } from "../database/graph-traversal-mode.js";
import { changeSetElementInAncestryOf } from "../query-filter/change-set-element-in-ancestry-of.js";
import { changeSetElementIsLeafOf } from "../query-filter/change-set-element-is-leaf-of.js";
import type { VersionV2 } from "../version-v2/database-schema.js";
/**
 * Applies a change set to the lix.
 */
export async function applyChangeSet(args: {
	lix: Lix;
	changeSet: Pick<ChangeSet, "id">;
	version?: Pick<VersionV2, "id" | "change_set_id">;
	/**
	 * The {@link GraphTraversalMode} for applying the change set.
	 *
	 * @default "recursive"
	 */
	mode?: GraphTraversalMode;
}): Promise<void> {
	const mode = args.mode ?? { type: "recursive" };

	const executeInTransaction = async (trx: Lix["db"]) => {
		const version =
			args.version ??
			(await trx
				.selectFrom("active_version")
				.innerJoin("version_v2", "version_v2.id", "active_version.version_id")
				.selectAll("version_v2")
				.executeTakeFirstOrThrow());

		//* NOTE: the creationd and handling of parent relationships
		//* depends on the appliance of the change set to the version.
		//*
		//* if the version already has changes c1:e1 and the proposed
		//* change set has changes c1:e1 and c2:e2, the diff is c2:e2.
		//* only storing the diff as new change set can be a future optimzation.
		// update the version to point to the new change set
		await trx
			.updateTable("version_v2")
			.set({ change_set_id: args.changeSet.id })
			.where("id", "=", version.id)
			.execute();

		// add a parent relationship
		if (version.change_set_id !== args.changeSet.id) {
			await trx
				.insertInto("change_set_edge")
				.values({
					parent_id: version.change_set_id,
					child_id: args.changeSet.id,
				})
				.onConflict((oc) => oc.doNothing())
				.execute();
		}

		// Select changes associated with the specified change set
		let query = trx
			.selectFrom("change")
			.innerJoin(
				"change_set_element",
				"change_set_element.change_id",
				"change.id"
			);

		if (mode.type === "direct") {
			// In direct mode, we only want changes directly in this change set
			query = query.where(
				"change_set_element.change_set_id",
				"=",
				args.changeSet.id
			);
		} else {
			// In recursive mode, we want leaf changes in the ancestry
			query = query
				.where(changeSetElementInAncestryOf([args.changeSet]))
				.where(changeSetElementIsLeafOf([args.changeSet]));
		}

		const changesResult = await query.selectAll().execute();

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
					changes,
					file,
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
