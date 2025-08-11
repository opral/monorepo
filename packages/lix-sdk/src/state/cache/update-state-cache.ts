import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { executeSync } from "../../database/execute-sync.js";
import type { LixChangeRaw } from "../../change/schema.js";
import type { Lix } from "../../lix/open-lix.js";

/**
 * Updates cache entries with new commit_id for specific entities that were changed.
 * Processes multiple changes in batch for better performance.
 *
 * This function is the centralized entry point for all cache updates to ensure
 * consistency and proper handling of duplicate entries (inherited vs direct).
 *
 * @param args - Update parameters
 * @param args.lix - Lix instance with sqlite and db
 * @param args.changes - Array of change objects containing entity information
 * @param args.commit_id - New commit ID to set
 * @param args.version_id - Version ID to update
 */
export function updateStateCache(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	changes: LixChangeRaw[];
	commit_id: string;
	version_id: string;
}): void {
	if (args.changes.length === 0) return;

	const intDb = args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Separate changes into deletions and non-deletions for batch processing
	const deletions = args.changes.filter((c) => c.snapshot_content === null);
	const nonDeletions = args.changes.filter((c) => c.snapshot_content !== null);

	// -------------------------------
	// Upsert non-deletions in batch
	// -------------------------------
	if (nonDeletions.length > 0) {
		const values = nonDeletions.map((change) => ({
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
			version_id: args.version_id,
			plugin_key: change.plugin_key,
			// Keep using the existing jsonb(...) wrapper used elsewhere in the codebase
			snapshot_content: sql`jsonb(${change.snapshot_content})` as any,
			schema_version: change.schema_version,
			created_at: change.created_at,
			updated_at: change.created_at,
			inherited_from_version_id: null as string | null, // Direct entry, not inherited
			inheritance_delete_marker: 0,
			change_id: change.id,
			commit_id: args.commit_id,
		}));

		executeSync({
			lix: args.lix,
			query: intDb
				.insertInto("internal_state_cache")
				.values(values)
				.onConflict((oc) =>
					oc
						.columns(["entity_id", "schema_key", "file_id", "version_id"])
						.doUpdateSet({
							plugin_key: sql`excluded.plugin_key`,
							snapshot_content: sql`excluded.snapshot_content`,
							schema_version: sql`excluded.schema_version`,
							updated_at: sql`excluded.updated_at`,
							inheritance_delete_marker: sql`excluded.inheritance_delete_marker`,
							change_id: sql`excluded.change_id`,
							commit_id: sql`excluded.commit_id`,
						})
				),
		});
	}

	// -----------------------------------------
	// Handle deletions: copy-down + tombstones
	// -----------------------------------------
	if (deletions.length > 0) {
		// A) Perform the entire "copy-down" operation in a single, set-based query.
		// This query finds the relevant source rows and generates all required
		// child entries directly in the database, avoiding JS loops.
		executeSync({
			lix: args.lix,
			query: intDb
				.with("children", (db) =>
					db
						.selectFrom("internal_resolved_state_all")
						.select(sql<string>`json_extract(snapshot_content, '$.id')`.as("id"))
						.where("schema_key", "=", "lix_version")
						.where(
							sql`json_extract(snapshot_content, '$.inherits_from_version_id')`,
							"=",
							args.version_id
						)
				)
				.insertInto("internal_state_cache")
				.columns([
					"entity_id", "schema_key", "file_id", "version_id", "plugin_key",
					"snapshot_content", "schema_version", "created_at", "updated_at",
					"inherited_from_version_id", "inheritance_delete_marker",
					"change_id", "commit_id"
				])
				.expression((eb) =>
					eb
						.selectFrom("internal_state_cache as src")
						.innerJoin("children", (join) => join.on(sql`1`, "=", sql`1`)) // CROSS JOIN via always-true condition
						.select([
							"src.entity_id", "src.schema_key", "src.file_id",
							"children.id as version_id", // Set child's version ID
							"src.plugin_key", "src.snapshot_content", "src.schema_version",
							"src.created_at", "src.updated_at",
							sql`null`.as("inherited_from_version_id"),
							sql`0`.as("inheritance_delete_marker"),
							"src.change_id",
							sql`${args.commit_id}`.as("commit_id"), // Stamp with current commit
						])
						.where("src.version_id", "=", args.version_id)
						.where("src.inheritance_delete_marker", "=", 0)
						.where("src.snapshot_content", "is not", null)
						.where((where_eb) => where_eb.or(
							deletions.map((d) => where_eb.and([
								where_eb("src.entity_id", "=", d.entity_id),
								where_eb("src.schema_key", "=", d.schema_key),
								where_eb("src.file_id", "=", d.file_id),
							]))
						))
				)
				.onConflict((oc) => 
					oc.columns(["entity_id", "schema_key", "file_id", "version_id"])
						.doUpdateSet({
							// Define update rules for conflicts
							plugin_key: sql`excluded.plugin_key`,
							snapshot_content: sql`excluded.snapshot_content`,
							schema_version: sql`excluded.schema_version`,
							updated_at: sql`excluded.updated_at`,
							change_id: sql`excluded.change_id`,
							commit_id: sql`excluded.commit_id`,
						})
				),
		})

		// B) Upsert tombstones in the deleting version (blocks inheritance below)
		const tombstoneValues = deletions.map((change) => ({
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
			version_id: args.version_id,
			plugin_key: change.plugin_key,
			snapshot_content: null as string | null, // Always null for deletions
			schema_version: change.schema_version,
			created_at: change.created_at,
			updated_at: change.created_at,
			inherited_from_version_id: null as string | null,
			inheritance_delete_marker: 1, // mark as tombstone
			change_id: change.id,
			commit_id: args.commit_id,
		}));

		executeSync({
			lix: args.lix,
			query: intDb
				.insertInto("internal_state_cache")
				.values(tombstoneValues)
				.onConflict((oc) =>
					oc
						.columns(["entity_id", "schema_key", "file_id", "version_id"])
						.doUpdateSet({
							plugin_key: sql`excluded.plugin_key`,
							snapshot_content: sql`excluded.snapshot_content`,
							schema_version: sql`excluded.schema_version`,
							updated_at: sql`excluded.updated_at`,
							inheritance_delete_marker: sql`excluded.inheritance_delete_marker`,
							change_id: sql`excluded.change_id`,
							commit_id: sql`excluded.commit_id`,
						})
				),
		});

		// Note: We intentionally skip any hot-path tombstone cleanup here.
		// A periodic GC can safely remove unneeded tombstones if desired.
	}
}
