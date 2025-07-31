import { sql, type Kysely } from "kysely";
import { executeSync } from "../../database/execute-sync.js";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import type { LixChangeRaw } from "../../change/schema.js";
import type { Lix } from "../../lix/open-lix.js";

/**
 * Updates untracked state with inheritance support.
 *
 * This function handles all untracked entity operations (insert, update, delete)
 * while maintaining inheritance behavior similar to tracked entities but completely
 * isolated from the change control cache system.
 *
 * Inheritance Logic:
 * - Direct entities: Stored with inherited_from_version_id: null
 * - Inherited entities: Visible through parent version queries
 * - Deletions: 
 *   - Direct entities: Remove from untracked table
 *   - Inherited entities: Create tombstone with inheritance_delete_marker: 1
 *
 * @param args - Update parameters
 * @param args.lix - Lix instance with sqlite and db
 * @param args.change - Change object containing entity information
 * @param args.version_id - Version ID to update
 */
export function updateUntrackedState(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	change: LixChangeRaw;
	version_id: string;
}): void {
	const intDb = args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Handle deletions (null snapshot_content)
	if (args.change.snapshot_content === null) {
		// Check if entity exists directly in this version's untracked table
		const existingEntity = executeSync({
			lix: args.lix,
			query: intDb
				.selectFrom("internal_state_all_untracked")
				.selectAll()
				.where("entity_id", "=", args.change.entity_id)
				.where("schema_key", "=", args.change.schema_key)
				.where("file_id", "=", args.change.file_id)
				.where("version_id", "=", args.version_id)
				.limit(1),
		})[0];

		if (existingEntity) {
			// Direct entity exists - delete it from the untracked table
			executeSync({
				lix: args.lix,
				query: intDb
					.deleteFrom("internal_state_all_untracked")
					.where("entity_id", "=", args.change.entity_id)
					.where("schema_key", "=", args.change.schema_key)
					.where("file_id", "=", args.change.file_id)
					.where("version_id", "=", args.version_id),
			});
		} else {
			// No direct entity - this is an inherited entity deletion
			// Create a tombstone to block inheritance
			executeSync({
				lix: args.lix,
				query: intDb
					.insertInto("internal_state_all_untracked")
					.values({
						entity_id: args.change.entity_id,
						schema_key: args.change.schema_key,
						file_id: args.change.file_id,
						version_id: args.version_id,
						plugin_key: args.change.plugin_key,
						snapshot_content: null, // Proper NULL for BLOB column
						schema_version: args.change.schema_version,
						created_at: args.change.created_at,
						updated_at: args.change.created_at,
						inherited_from_version_id: null,
						inheritance_delete_marker: 1, // Mark as tombstone
					})
					.onConflict((oc) =>
						oc
							.columns(["entity_id", "schema_key", "file_id", "version_id"])
							.doUpdateSet({
								snapshot_content: null,
								updated_at: args.change.created_at,
								inheritance_delete_marker: 1,
								plugin_key: args.change.plugin_key,
								schema_version: args.change.schema_version,
							})
					),
			});
		}
	} else {
		// Non-null snapshot_content - normal insert/update
		executeSync({
			lix: args.lix,
			query: intDb
				.insertInto("internal_state_all_untracked")
				.values({
					entity_id: args.change.entity_id,
					schema_key: args.change.schema_key,
					file_id: args.change.file_id,
					version_id: args.version_id,
					plugin_key: args.change.plugin_key,
					snapshot_content: sql`jsonb(${args.change.snapshot_content})`,
					schema_version: args.change.schema_version,
					created_at: args.change.created_at,
					updated_at: args.change.created_at,
					inherited_from_version_id: null, // Direct entry, not inherited
					inheritance_delete_marker: 0, // Normal entry, not a tombstone
				})
				.onConflict((oc) =>
					oc
						.columns(["entity_id", "schema_key", "file_id", "version_id"])
						.doUpdateSet({
							plugin_key: args.change.plugin_key,
							snapshot_content: sql`jsonb(${args.change.snapshot_content})`,
							schema_version: args.change.schema_version,
							updated_at: args.change.created_at,
							inheritance_delete_marker: 0, // Reset tombstone flag if updating
						})
				),
		});
	}
}