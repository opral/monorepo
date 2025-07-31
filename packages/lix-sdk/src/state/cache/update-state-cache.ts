import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { executeSync } from "../../database/execute-sync.js";
import type { LixChangeRaw } from "../../change/schema.js";
import type { Lix } from "../../lix/open-lix.js";

/**
 * Updates cache entries with new commit_id for specific entities that were changed.
 *
 * This function is the centralized entry point for all cache updates to ensure
 * consistency and proper handling of duplicate entries (inherited vs direct).
 *
 * @param args - Update parameters
 * @param args.lix - Lix instance with sqlite and db
 * @param args.change - Change object containing entity information
 * @param args.commit_id - New commit ID to set
 * @param args.version_id - Version ID to update
 */
export function updateStateCache(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	change: LixChangeRaw;
	commit_id: string;
	version_id: string;
}): void {
	const intDb = args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>;


	// Handle deletions (null snapshot_content) with cache cleanup
	if (args.change.snapshot_content === null) {
		// First, check if any versions inherit from this version
		const childVersions = executeSync({
			lix: args.lix,
			query: intDb
				.selectFrom("internal_resolved_state_all")
				.select([sql`json_extract(snapshot_content, '$.id')`.as("id")])
				.where("schema_key", "=", "lix_version")
				.where(sql`json_extract(snapshot_content, '$.inherits_from_version_id')`, "=", args.version_id),
		});


		if (childVersions.length > 0) {
			// There are child versions - move the cache entry to each child
			// First, get the current cache entry data (if it exists)
			const currentCacheEntry = executeSync({
				lix: args.lix,
				query: intDb
					.selectFrom("internal_state_cache")
					.selectAll()
					.where("entity_id", "=", args.change.entity_id)
					.where("schema_key", "=", args.change.schema_key)
					.where("file_id", "=", args.change.file_id)
					.where("version_id", "=", args.version_id)
					.limit(1),
			})[0];

			if (currentCacheEntry) {
				// Create cache entries for each child version
				for (const childVersion of childVersions) {
					executeSync({
						lix: args.lix,
						query: intDb
							.insertInto("internal_state_cache")
							.values({
								entity_id: args.change.entity_id,
								schema_key: args.change.schema_key,
								file_id: args.change.file_id,
								version_id: childVersion.id,
								plugin_key: currentCacheEntry.plugin_key,
								snapshot_content: currentCacheEntry.snapshot_content,
								schema_version: currentCacheEntry.schema_version,
								created_at: currentCacheEntry.created_at,
								updated_at: currentCacheEntry.updated_at,
								inherited_from_version_id: null, // Now direct entry in child version
								inheritance_delete_marker: 0,
								change_id: currentCacheEntry.change_id,
								commit_id: currentCacheEntry.commit_id,
							})
							.onConflict((oc) =>
								oc
									.columns(["entity_id", "schema_key", "file_id", "version_id"])
									.doUpdateSet({
										plugin_key: currentCacheEntry.plugin_key,
										snapshot_content: currentCacheEntry.snapshot_content,
										schema_version: currentCacheEntry.schema_version,
										updated_at: currentCacheEntry.updated_at,
										inherited_from_version_id: null, // Now direct entry in child version
										change_id: currentCacheEntry.change_id,
										commit_id: currentCacheEntry.commit_id,
									})
							),
					});
				}

				// Delete the parent cache entry
				executeSync({
					lix: args.lix,
					query: intDb
						.deleteFrom("internal_state_cache")
						.where("entity_id", "=", args.change.entity_id)
						.where("schema_key", "=", args.change.schema_key)
						.where("file_id", "=", args.change.file_id)
						.where("version_id", "=", args.version_id),
				});
			} else {
				// No existing entry to move - create a tombstone anyway since a DELETE was requested
				// This will hide any inherited state from parent versions
				executeSync({
					lix: args.lix,
					query: intDb
						.insertInto("internal_state_cache")
						.values({
							entity_id: args.change.entity_id,
							schema_key: args.change.schema_key,
							file_id: args.change.file_id,
							version_id: args.version_id,
							plugin_key: args.change.plugin_key,
							snapshot_content: args.change.snapshot_content,
							schema_version: args.change.schema_version,
							created_at: args.change.created_at,
							updated_at: args.change.created_at,
							inherited_from_version_id: null,
							inheritance_delete_marker: 1, // Mark as tombstone for null snapshot_content
							change_id: args.change.id,
							commit_id: args.commit_id,
						})
						.onConflict((oc) =>
							oc
								.columns(["entity_id", "schema_key", "file_id", "version_id"])
								.doUpdateSet({
									plugin_key: args.change.plugin_key,
									snapshot_content: args.change.snapshot_content,
									schema_version: args.change.schema_version,
									updated_at: args.change.created_at,
									inheritance_delete_marker: 1, // Mark as tombstone for null snapshot_content
									change_id: args.change.id,
									commit_id: args.commit_id,
								})
						),
				});
			}
		} else {
			// No child versions - check if there's a cache entry to delete
			const existingCacheEntry = executeSync({
				lix: args.lix,
				query: intDb
					.selectFrom("internal_state_cache")
					.selectAll()
					.where("entity_id", "=", args.change.entity_id)
					.where("schema_key", "=", args.change.schema_key)
					.where("file_id", "=", args.change.file_id)
					.where("version_id", "=", args.version_id)
					.limit(1),
			})[0];


			if (existingCacheEntry) {
				// Cache entry exists - check if it's a tombstone or regular entry
				if (existingCacheEntry.inheritance_delete_marker === 1) {
					// It's already a tombstone - just update the commit_id and change_id
					executeSync({
						lix: args.lix,
						query: intDb
							.insertInto("internal_state_cache")
							.values({
								entity_id: args.change.entity_id,
								schema_key: args.change.schema_key,
								file_id: args.change.file_id,
								version_id: args.version_id,
								plugin_key: args.change.plugin_key,
								snapshot_content: args.change.snapshot_content,
								schema_version: args.change.schema_version,
								created_at: args.change.created_at,
								updated_at: args.change.created_at,
								inherited_from_version_id: null,
								inheritance_delete_marker: 1, // Keep as tombstone
								change_id: args.change.id,
								commit_id: args.commit_id,
							})
							.onConflict((oc) =>
								oc
									.columns(["entity_id", "schema_key", "file_id", "version_id"])
									.doUpdateSet({
										plugin_key: args.change.plugin_key,
										snapshot_content: args.change.snapshot_content,
										schema_version: args.change.schema_version,
										updated_at: args.change.created_at,
										inheritance_delete_marker: 1, // Keep as tombstone
										change_id: args.change.id,
										commit_id: args.commit_id,
									})
							),
					});
				} else if (existingCacheEntry.inherited_from_version_id) {
					// It's inherited - replace with tombstone to block inheritance
					executeSync({
						lix: args.lix,
						query: intDb
							.insertInto("internal_state_cache")
							.values({
								entity_id: args.change.entity_id,
								schema_key: args.change.schema_key,
								file_id: args.change.file_id,
								version_id: args.version_id,
								plugin_key: args.change.plugin_key,
								snapshot_content: args.change.snapshot_content,
								schema_version: args.change.schema_version,
								created_at: args.change.created_at,
								updated_at: args.change.created_at,
								inherited_from_version_id: null,
								inheritance_delete_marker: 1, // Mark as tombstone for null snapshot_content
								change_id: args.change.id,
								commit_id: args.commit_id,
							})
							.onConflict((oc) =>
								oc
									.columns(["entity_id", "schema_key", "file_id", "version_id"])
									.doUpdateSet({
										plugin_key: args.change.plugin_key,
										snapshot_content: args.change.snapshot_content,
										schema_version: args.change.schema_version,
										updated_at: args.change.created_at,
										inheritance_delete_marker: 1, // Mark as tombstone for null snapshot_content
										change_id: args.change.id,
										commit_id: args.commit_id,
									})
							),
					});
				} else {
					// It's a direct entry - just delete it completely
					executeSync({
						lix: args.lix,
						query: intDb
							.deleteFrom("internal_state_cache")
							.where("entity_id", "=", args.change.entity_id)
							.where("schema_key", "=", args.change.schema_key)
							.where("file_id", "=", args.change.file_id)
							.where("version_id", "=", args.version_id),
					});
				}
			} else {
				// No existing cache entry - this could be:
				// 1. Deleting an inherited entity (need tombstone)
				// 2. Updating an existing tombstone during commit (preserve tombstone)
				// Use onConflict to handle both cases properly
				executeSync({
					lix: args.lix,
					query: intDb
						.insertInto("internal_state_cache")
						.values({
							entity_id: args.change.entity_id,
							schema_key: args.change.schema_key,
							file_id: args.change.file_id,
							version_id: args.version_id,
							plugin_key: args.change.plugin_key,
							snapshot_content: args.change.snapshot_content,
							schema_version: args.change.schema_version,
							created_at: args.change.created_at,
							updated_at: args.change.created_at,
							inherited_from_version_id: null,
							inheritance_delete_marker: 1, // Mark as tombstone for null snapshot_content
							change_id: args.change.id,
							commit_id: args.commit_id,
						})
						.onConflict((oc) =>
							oc
								.columns(["entity_id", "schema_key", "file_id", "version_id"])
								.doUpdateSet({
									plugin_key: args.change.plugin_key,
									snapshot_content: args.change.snapshot_content,
									schema_version: args.change.schema_version,
									updated_at: args.change.created_at,
									inheritance_delete_marker: 1, // Preserve tombstone marker for deletions
									change_id: args.change.id,
									commit_id: args.commit_id,
								})
						),
				});
			}
		}
	} else {
		// Non-null snapshot_content - normal upsert
		executeSync({
			lix: args.lix,
			query: intDb
				.insertInto("internal_state_cache")
				.values({
					entity_id: args.change.entity_id,
					schema_key: args.change.schema_key,
					file_id: args.change.file_id,
					version_id: args.version_id,
					plugin_key: args.change.plugin_key,
					snapshot_content: args.change.snapshot_content,
					schema_version: args.change.schema_version,
					created_at: args.change.created_at,
					updated_at: args.change.created_at,
					inherited_from_version_id: null, // Direct entry, not inherited
					inheritance_delete_marker: 0,
					change_id: args.change.id,
					commit_id: args.commit_id,
				})
				.onConflict((oc) =>
					oc
						.columns(["entity_id", "schema_key", "file_id", "version_id"])
						.doUpdateSet({
							plugin_key: args.change.plugin_key,
							snapshot_content: args.change.snapshot_content,
							schema_version: args.change.schema_version,
							updated_at: args.change.created_at,
							inheritance_delete_marker: 0, // Reset tombstone flag for non-null content
							change_id: args.change.id,
							commit_id: args.commit_id,
						})
				),
		});
	}
}
