import type { Lix } from "../lix/index.js";
import type { LixChangeSet } from "./schema-definition.js";
import { updateStateCache } from "../state/cache/update-state-cache.js";
import { clearFileDataCache } from "../filesystem/file/cache/clear-file-data-cache.js";

/**
 * Applies a change set to the lix.
 */
export async function applyChangeSet(args: {
	lix: Lix;
	changeSet: Pick<LixChangeSet, "id">;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Get the current version
		const version = await trx
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		// Skip change control for this transaction
		// This allows us to apply changes without triggering change control logic
		// This is necessary because we are applying a change set directly
		// and we don't want to create a new change set for this operation
		await trx
			.insertInto("key_value_by_version")
			.values({
				key: "lix_skip_file_handlers",
				value: true,
				lixcol_untracked: true,
				lixcol_version_id: version.id,
			})
			.execute();

		// Update the version to point to the new commit
		await trx
			.updateTable("version")
			.set({ commit_id: version.commit_id })
			.where("id", "=", version.id)
			.execute();

		// Query for changes in the provided change set (direct mode only)
		const changesResult = await trx
			.selectFrom("change")
			.innerJoin(
				"change_set_element_by_version",
				"change_set_element_by_version.change_id",
				"change.id"
			)
			.where(
				"change_set_element_by_version.change_set_id",
				"=",
				args.changeSet.id
			)
			.where("change_set_element_by_version.lixcol_version_id", "=", "global")
			.selectAll("change")
			.execute();

		// Write-through cache: populate lix_internal_state_cache for all applied changes
		const changesForCache = changesResult.map((change) => ({
			...change,
			snapshot_content: change.snapshot_content
				? JSON.stringify(change.snapshot_content)
				: null,
			metadata: change.metadata ? JSON.stringify(change.metadata) : null,
		}));

		updateStateCache({
			engine: args.lix.engine!,
			changes: changesForCache,
			version_id: version.id,
			commit_id: version.commit_id,
		});

		// Group changes by file_id for processing
		const changesGroupedByFile = Object.groupBy(
			changesResult,
			(c) => c.file_id
		);
		const plugins = await args.lix.plugin.getAll();

		// Apply changes file by file
		for (const [file_id, changes] of Object.entries(changesGroupedByFile)) {
			if (!changes?.length) continue;

			// Handle lix own entity changes separately (no file operations needed)
			if (file_id === "lix") {
				// Lix's own entity changes don't need plugin processing
				// They are applied directly through the state/view system
				continue;
			}

			// Skip plugin processing for lix own file changes (file metadata changes)
			// These are handled by the database triggers and don't need plugin processing
			const hasLixOwnEntityChanges = changes.some(
				(c) => c.plugin_key === "lix_own_entity"
			);
			if (hasLixOwnEntityChanges) {
				continue;
			}

			// Check if this file has deletion changes
			const hasFileDeletion = changes.some(
				(c) => c.snapshot_content === null && c.schema_key === "lix_file"
			);
			if (hasFileDeletion) {
				// File is being deleted - bypass plugin processing and delete the file
				await trx.deleteFrom("file").where("id", "=", file_id).execute();
				continue;
			}

			// Clear file cache before fetching to ensure we get fresh data
			// This is important because the file may have been updated by previous operations
			// and we need the current state for plugin processing
			clearFileDataCache({
				engine: args.lix.engine!,
				fileId: file_id,
				versionId: version.id,
			});

			const file = await trx
				.selectFrom("file")
				.where("id", "=", file_id)
				.selectAll()
				.executeTakeFirstOrThrow();

			const groupByPlugin = Object.groupBy(changes, (c) => c.plugin_key);

			for (const [pluginKey, pluginChanges] of Object.entries(groupByPlugin)) {
				if (!pluginChanges?.length) continue;

				const plugin = plugins.find((p) => p.key === pluginKey);
				if (!plugin) {
					throw new Error(`Plugin with key ${pluginKey} not found`);
				}
				if (!plugin.applyChanges) {
					throw new Error(
						`Plugin with key ${pluginKey} does not support applying changes`
					);
				}

				const { fileData } = plugin.applyChanges({
					changes: pluginChanges,
					file,
				});

				await trx
					.updateTable("file")
					.set({ data: fileData })
					.where("id", "=", file.id)
					.execute();
			}

			// After processing all plugins, emit file change event
			await trx
				.deleteFrom("key_value_by_version")
				.where("lixcol_version_id", "=", version.id)
				.where("key", "=", "lix_skip_file_handlers")
				.execute();
		}
	};

	return args.lix.db.isTransaction
		? executeInTransaction(args.lix.db)
		: args.lix.db.transaction().execute(executeInTransaction);
}
