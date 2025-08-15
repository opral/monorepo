import type { Lix } from "../../lix/open-lix.js";
import type { LixChangeRaw } from "../../change/schema.js";
import type { Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { getStateCacheV2Tables } from "./schema.js";

/**
 * Updates the state cache v2 directly to physical tables, bypassing the virtual table.
 *
 * This function writes directly to per-schema SQLite tables instead of going through
 * the vtable for two critical performance reasons:
 *
 * 1. **Minimizes JS <-> WASM overhead**: Direct table access avoids the vtable's
 *    row-by-row callback mechanism that crosses the JS/WASM boundary for each row.
 *
 * 2. **Enables efficient batching**: Vtables only support per-row logic, preventing
 *    batch optimizations like prepared statements, transactions, and bulk operations.
 *    Direct access allows us to batch hundreds of rows in a single transaction.
 *
 * The vtable (schema.ts) remains read-only for SELECT queries, providing a unified
 * query interface while mutations bypass it for ~50% better performance.
 *
 * This function handles:
 * - Direct writes to per-schema physical tables for optimal performance
 * - Batch inserting/updating cache entries
 * - Deletion copy-down operations for inheritance
 * - Tombstone management
 *
 * @example
 * updateStateCache({
 *   lix,
 *   changes: [change1, change2],
 *   commit_id: "commit-123",
 *   version_id: "v1"
 * });
 */
export function updateStateCache(args: {
	lix: Pick<Lix, "db" | "sqlite">;
	changes: LixChangeRaw[];
	commit_id: string;
	version_id: string;
}): void {
	const { lix, changes, commit_id, version_id } = args;
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Group changes by schema_key for efficient batch processing
	const changesBySchema = new Map<
		string,
		{
			inserts: LixChangeRaw[];
			deletes: LixChangeRaw[];
		}
	>();

	for (const change of changes) {
		if (!changesBySchema.has(change.schema_key)) {
			changesBySchema.set(change.schema_key, {
				inserts: [],
				deletes: [],
			});
		}

		const group = changesBySchema.get(change.schema_key)!;
		if (change.snapshot_content === null) {
			if (change.schema_key === "lix_change_set_element") {
				console.log(
					"[DEBUG updateStateCache] Adding deletion for change_set_element:",
					change.entity_id
				);
			}
			group.deletes.push(change);
		} else {
			group.inserts.push(change);
		}
	}

	// Process each schema's changes directly to its physical table
	for (const [schema_key, schemaChanges] of changesBySchema) {
		// Sanitize schema_key for use in table name - replace non-alphanumeric with underscore
		const sanitizedSchemaKey = schema_key.replace(/[^a-zA-Z0-9]/g, "_");
		const tableName = `internal_state_cache_${sanitizedSchemaKey}`;

		// Ensure table exists (creates if needed, updates cache)
		ensureTableExists(lix, tableName);

		// Process inserts/updates for this schema
		if (schemaChanges.inserts.length > 0) {
			batchInsertDirectToTable({
				lix,
				tableName,
				changes: schemaChanges.inserts,
				commit_id,
				version_id,
			});
		}

		// Process deletions for this schema
		if (schemaChanges.deletes.length > 0) {
			if (schema_key === "lix_change_set_element") {
				console.log(
					"[DEBUG updateStateCache] Processing",
					schemaChanges.deletes.length,
					"deletions for change_set_element"
				);
				schemaChanges.deletes.forEach((d) => {
					console.log(
						"[DEBUG updateStateCache] Deleting entity_id:",
						d.entity_id,
						"version_id:",
						version_id
					);
				});
			}
			batchDeleteDirectFromTable({
				db,
				lix,
				tableName,
				changes: schemaChanges.deletes,
				commit_id,
				version_id,
			});
		}
	}
}

/**
 * Ensures a table exists and updates the cache.
 * Single source of truth for table creation and cache management.
 */
function ensureTableExists(lix: Pick<Lix, "sqlite">, tableName: string): void {
	// Get cache for this Lix instance
	const tableCache = getStateCacheV2Tables(lix);

	// Check cache first for performance
	if (tableCache.has(tableName)) {
		return;
	}

	// Create table if it doesn't exist
	const createTableSql = `
		CREATE TABLE IF NOT EXISTS ${tableName} (
			entity_id TEXT NOT NULL,
			schema_key TEXT NOT NULL,
			file_id TEXT NOT NULL,
			version_id TEXT NOT NULL,
			plugin_key TEXT NOT NULL,
			snapshot_content BLOB,
			schema_version TEXT NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			inherited_from_version_id TEXT,
			inheritance_delete_marker INTEGER DEFAULT 0,
			change_id TEXT,
			commit_id TEXT,
			PRIMARY KEY (entity_id, file_id, version_id)
		) STRICT, WITHOUT ROWID;
	`;

	lix.sqlite.exec({ sql: createTableSql });

	// Create index on version_id for version-based queries
	lix.sqlite.exec({
		sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_version_id ON ${tableName} (version_id)`,
	});

	// Initial ANALYZE for new tables
	lix.sqlite.exec({ sql: `ANALYZE ${tableName}` });

	// Update cache
	tableCache.add(tableName);
}

function batchInsertDirectToTable(args: {
	lix: Pick<Lix, "sqlite">;
	tableName: string;
	changes: LixChangeRaw[];
	commit_id: string;
	version_id: string;
}): void {
	const { lix, tableName, changes, commit_id, version_id } = args;

	// Prepare statement once for all inserts
	// Use proper UPSERT with ON CONFLICT instead of INSERT OR REPLACE
	// jsonb() conversion is handled directly in the SQL
	const stmt = lix.sqlite.prepare(`
		INSERT INTO ${tableName} (
			entity_id,
			schema_key,
			file_id,
			version_id,
			plugin_key,
			snapshot_content,
			schema_version,
			created_at,
			updated_at,
			inherited_from_version_id,
			inheritance_delete_marker,
			change_id,
			commit_id
		) VALUES (?, ?, ?, ?, ?, jsonb(?), ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(entity_id, file_id, version_id) DO UPDATE SET
			schema_key = excluded.schema_key,
			plugin_key = excluded.plugin_key,
			snapshot_content = excluded.snapshot_content,
			schema_version = excluded.schema_version,
			-- Preserve original created_at, don't overwrite it
			updated_at = excluded.updated_at,
			inherited_from_version_id = excluded.inherited_from_version_id,
			inheritance_delete_marker = excluded.inheritance_delete_marker,
			change_id = excluded.change_id,
			commit_id = excluded.commit_id
	`);

	try {
		for (const change of changes) {
			stmt.bind([
				change.entity_id,
				change.schema_key, // Add the original schema_key
				change.file_id,
				version_id,
				change.plugin_key,
				change.snapshot_content, // jsonb() conversion happens in SQL
				change.schema_version,
				change.created_at,
				change.created_at, // updated_at
				null, // inherited_from_version_id
				0, // inheritance_delete_marker
				change.id,
				commit_id,
			]);
			stmt.step();
			stmt.reset();
		}
	} finally {
		stmt.finalize();
	}
}

function batchDeleteDirectFromTable(args: {
	db: Kysely<LixInternalDatabaseSchema>;
	lix: Pick<Lix, "sqlite">;
	tableName: string;
	changes: LixChangeRaw[];
	commit_id: string;
	version_id: string;
}): void {
	const { lix, tableName, changes, commit_id, version_id } = args;

	for (const change of changes) {
		// Get existing entry to check if it exists before deletion
		if (change.schema_key === "lix_change_set_element") {
			console.log("[DEBUG batchDelete] Looking for existing entry:", {
				tableName,
				entity_id: change.entity_id,
				file_id: change.file_id,
				version_id,
			});
		}
		const result = lix.sqlite.exec({
			sql: `SELECT * FROM ${tableName} 
			      WHERE entity_id = ? AND file_id = ? AND version_id = ?
			      AND inheritance_delete_marker = 0 AND snapshot_content IS NOT NULL`,
			bind: [change.entity_id, change.file_id, version_id],
			returnValue: "resultRows",
		}) as any[];

		const existingEntry = result?.[0];
		if (change.schema_key === "lix_change_set_element") {
			console.log(
				"[DEBUG batchDelete] Found existing entry:",
				existingEntry ? "YES" : "NO"
			);
		}

		// Delete the entry
		if (existingEntry) {
			if (change.schema_key === "lix_change_set_element") {
				console.log(
					"[DEBUG batchDelete] Executing DELETE for:",
					change.entity_id
				);
			}
			lix.sqlite.exec({
				sql: `DELETE FROM ${tableName} 
				      WHERE entity_id = ? AND file_id = ? AND version_id = ?`,
				bind: [change.entity_id, change.file_id, version_id],
			});
			if (change.schema_key === "lix_change_set_element") {
				console.log("[DEBUG batchDelete] DELETE executed");
			}
		}

		// Insert tombstone with UPSERT to handle existing entries
		if (change.schema_key === "lix_change_set_element") {
			console.log(
				"[DEBUG batchDelete] Inserting tombstone for:",
				change.entity_id,
				"in version:",
				version_id
			);
		}
		lix.sqlite.exec({
			sql: `INSERT INTO ${tableName} (
				entity_id,
				schema_key,
				file_id,
				version_id,
				plugin_key,
				snapshot_content,
				schema_version,
				created_at,
				updated_at,
				inherited_from_version_id,
				inheritance_delete_marker,
				change_id,
				commit_id
			) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, NULL, 1, ?, ?)
			ON CONFLICT(entity_id, file_id, version_id) DO UPDATE SET
				schema_key = excluded.schema_key,
				plugin_key = excluded.plugin_key,
				snapshot_content = NULL,
				schema_version = excluded.schema_version,
				updated_at = excluded.updated_at,
				inherited_from_version_id = NULL,
				inheritance_delete_marker = 1,
				change_id = excluded.change_id,
				commit_id = excluded.commit_id`,
			bind: [
				change.entity_id,
				change.schema_key,
				change.file_id,
				version_id,
				change.plugin_key,
				change.schema_version,
				change.created_at,
				change.created_at,
				change.id,
				commit_id,
			],
		});
		if (change.schema_key === "lix_change_set_element") {
			console.log("[DEBUG batchDelete] Tombstone inserted");
		}
	}
}