import type { Lix } from "../../lix/open-lix.js";
import type { LixChangeRaw } from "../../change/schema.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { executeSync } from "../../database/execute-sync.js";

/**
 * Updates the state cache v2 with the given changes.
 * 
 * This function handles:
 * - Batch inserting/updating cache entries based on changes
 * - Deletion copy-down operations for inheritance
 * - Tombstone management
 * 
 * @example
 * updateStateCacheV2({
 *   lix,
 *   changes: [change1, change2],
 *   commit_id: "commit-123",
 *   version_id: "v1"
 * });
 */
export function updateStateCacheV2(args: {
	lix: Pick<Lix, "db" | "sqlite">;
	changes: LixChangeRaw[];
	commit_id: string;
	version_id: string;
}): void {
	const { lix, changes, commit_id, version_id } = args;
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Separate changes into insertions/updates and deletions
	const insertOrUpdateChanges: LixChangeRaw[] = [];
	const deletionChanges: LixChangeRaw[] = [];

	for (const change of changes) {
		if (change.snapshot_content === null) {
			deletionChanges.push(change);
		} else {
			insertOrUpdateChanges.push(change);
		}
	}

	// Process all insertions/updates as a batch
	if (insertOrUpdateChanges.length > 0) {
		batchInsertOrUpdate({
			db,
			lix,
			changes: insertOrUpdateChanges,
			commit_id,
			version_id,
		});
	}

	// Process deletions with batching where possible
	if (deletionChanges.length > 0) {
		batchHandleDeletions({
			db,
			lix,
			changes: deletionChanges,
			commit_id,
			version_id,
		});
	}
}

function batchInsertOrUpdate(args: {
	db: Kysely<LixInternalDatabaseSchema>;
	lix: Pick<Lix, "sqlite">;
	changes: LixChangeRaw[];
	commit_id: string;
	version_id: string;
}): void {
	const { db, lix, changes, commit_id, version_id } = args;

	// Prepare all values for batch insert
	const values = changes.map(change => ({
		entity_id: change.entity_id,
		schema_key: change.schema_key,
		file_id: change.file_id,
		version_id: version_id,
		plugin_key: change.plugin_key,
		snapshot_content: sql`jsonb(${change.snapshot_content})` as any,
		schema_version: change.schema_version,
		created_at: change.created_at,
		updated_at: change.created_at,
		inherited_from_version_id: null,
		inheritance_delete_marker: 0,
		change_id: change.id,
		commit_id: commit_id,
	}));

	// Use the vtable to batch insert/update
	// The vtable will handle creating physical tables and performing INSERT OR REPLACE
	executeSync({
		lix,
		query: db
			.insertInto("internal_state_cache_v2")
			.values(values),
	});
}

function batchHandleDeletions(args: {
	db: Kysely<LixInternalDatabaseSchema>;
	lix: Pick<Lix, "sqlite">;
	changes: LixChangeRaw[];
	commit_id: string;
	version_id: string;
}): void {
	const { db, lix, changes, commit_id, version_id } = args;

	// Step 1: Get direct child versions once
	const childVersions = executeSync({
		lix,
		query: db
			.selectFrom("version")
			.select("id")
			.where("inherits_from_version_id", "=", version_id),
	});

	// Batch collections for operations
	const entriesToCopyDown: Array<any> = [];
	const tombstonesToInsert: Array<any> = [];
	const deletionsToPerform: Array<{
		entity_id: string;
		schema_key: string;
		file_id: string;
	}> = [];

	// Process each deletion change
	for (const change of changes) {
		// Get the current cache entry that's being deleted (if it exists)
		const existingEntries = executeSync({
			lix,
			query: db
				.selectFrom("internal_state_cache_v2")
				.selectAll()
				.where("entity_id", "=", change.entity_id)
				.where("schema_key", "=", change.schema_key)
				.where("file_id", "=", change.file_id)
				.where("version_id", "=", version_id)
				.where("inheritance_delete_marker", "=", 0)
				.where("snapshot_content", "is not", null),
		});
		const existingEntry = existingEntries[0];

		// If there are child versions and an existing entry, prepare copy-down
		if (childVersions.length > 0 && existingEntry) {
			for (const childVersion of childVersions) {
				// Check if child already has this entry
				const childHasEntryResult = executeSync({
					lix,
					query: db
						.selectFrom("internal_state_cache_v2")
						.select("entity_id")
						.where("entity_id", "=", change.entity_id)
						.where("schema_key", "=", change.schema_key)
						.where("file_id", "=", change.file_id)
						.where("version_id", "=", childVersion.id),
				});
				const childHasEntry = childHasEntryResult[0];

				if (!childHasEntry) {
					entriesToCopyDown.push({
						entity_id: existingEntry.entity_id,
						schema_key: existingEntry.schema_key,
						file_id: existingEntry.file_id,
						version_id: childVersion.id,
						plugin_key: existingEntry.plugin_key,
						snapshot_content: existingEntry.snapshot_content,
						schema_version: existingEntry.schema_version,
						created_at: existingEntry.created_at,
						updated_at: existingEntry.updated_at,
						inherited_from_version_id: version_id,
						inheritance_delete_marker: 0,
						change_id: existingEntry.change_id,
						commit_id: existingEntry.commit_id, // Preserve original commit_id
					});
				}
			}
		}

		// Prepare deletion if entry exists
		if (existingEntry) {
			deletionsToPerform.push({
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				file_id: change.file_id,
			});
		}

		// Prepare tombstone
		tombstonesToInsert.push({
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
			version_id: version_id,
			plugin_key: change.plugin_key,
			snapshot_content: null,
			schema_version: change.schema_version,
			created_at: change.created_at,
			updated_at: change.created_at,
			inherited_from_version_id: null,
			inheritance_delete_marker: 1,
			change_id: change.id,
			commit_id: commit_id,
		});
	}

	// Batch insert copy-down entries
	if (entriesToCopyDown.length > 0) {
		executeSync({
			lix,
			query: db
				.insertInto("internal_state_cache_v2")
				.values(entriesToCopyDown),
		});
	}

	// Batch delete existing entries
	for (const deletion of deletionsToPerform) {
		executeSync({
			lix,
			query: db
				.deleteFrom("internal_state_cache_v2")
				.where("entity_id", "=", deletion.entity_id)
				.where("schema_key", "=", deletion.schema_key)
				.where("file_id", "=", deletion.file_id)
				.where("version_id", "=", version_id),
		});
	}

	// Batch insert tombstones
	if (tombstonesToInsert.length > 0) {
		executeSync({
			lix,
			query: db
				.insertInto("internal_state_cache_v2")
				.values(tombstonesToInsert),
		});
	}
}