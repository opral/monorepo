import type { Lix } from "../lix/index.js";
import type { ChangeSet } from "./schema.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";

/**
 * Applies a change set to the lix.
 */
export async function applyChangeSet(args: {
	lix: Lix;
	changeSet: Pick<ChangeSet, "id">;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Get the current version
		const version = await trx
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		// Update the version to point to the new change set
		await trx
			.updateTable("version")
			.set({ change_set_id: args.changeSet.id })
			.where("id", "=", version.id)
			.execute();

		// Add a parent relationship (create the edge in the change set graph)
		if (version.change_set_id !== args.changeSet.id) {
			// Check if edge already exists to avoid conflict
			const existingEdge = await trx
				.selectFrom("change_set_edge_all")
				.where("parent_id", "=", version.change_set_id)
				.where("child_id", "=", args.changeSet.id)
				.where("lixcol_version_id", "=", "global")
				.selectAll()
				.executeTakeFirst();

			if (!existingEdge) {
				await trx
					.insertInto("change_set_edge_all")
					.values({
						parent_id: version.change_set_id,
						child_id: args.changeSet.id,
						lixcol_version_id: "global",
					})
					.execute();
			}
		}

		// Query for changes in the provided change set (direct mode only)
		const changesResult = await trx
			.selectFrom("change")
			.innerJoin(
				"change_set_element_all",
				"change_set_element_all.change_id",
				"change.id"
			)
			.where("change_set_element_all.change_set_id", "=", args.changeSet.id)
			.where("change_set_element_all.lixcol_version_id", "=", "global")
			.selectAll("change")
			.select(sql`${version.id}`.as("version_id"))
			.execute();

		// Write-through cache: populate internal_state_cache for all applied changes
		for (const change of changesResult) {
			const cacheKey = {
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				file_id: change.file_id,
				version_id: version.id,
			};

			if (change.snapshot_content === null) {
				// deletion – remove from cache
				await (trx as unknown as Kysely<LixInternalDatabaseSchema>)
					.deleteFrom("internal_state_cache")
					.where("entity_id", "=", cacheKey.entity_id)
					.where("schema_key", "=", cacheKey.schema_key)
					.where("file_id", "=", cacheKey.file_id)
					.where("version_id", "=", version.id)
					.execute();
			} else {
				// insertion/update – upsert into cache
				await (trx as unknown as Kysely<LixInternalDatabaseSchema>)
					.insertInto("internal_state_cache")
					.values({
						...cacheKey,
						plugin_key: change.plugin_key,
						inheritance_delete_marker: change.snapshot_content === null ? 1 : 0,
						snapshot_content: JSON.stringify(change.snapshot_content),
						schema_version: change.schema_version,
						created_at: change.created_at,
						updated_at: change.created_at,
						change_id: change.id,
					})
					.onConflict((oc) =>
						oc
							.columns(["entity_id", "schema_key", "file_id", "version_id"])
							.doUpdateSet({
								plugin_key: change.plugin_key,
								snapshot_content: sql`excluded.snapshot_content`,
								schema_version: change.schema_version,
								updated_at: change.created_at,
							})
					)
					.execute();
			}
		}

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
		}
	};

	return args.lix.db.isTransaction
		? executeInTransaction(args.lix.db)
		: args.lix.db.transaction().execute(executeInTransaction);
}
