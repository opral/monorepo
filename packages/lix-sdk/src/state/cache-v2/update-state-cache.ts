import type { Lix } from "../../lix/open-lix.js";
import type { LixChangeRaw } from "../../change/schema.js";
import type { Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { executeSync } from "../../database/execute-sync.js";
import { stateCacheV2Tables } from "./schema.js";

/**
 * Updates the state cache v2 with the given changes.
 * 
 * This function handles:
 * - Direct writes to per-schema physical tables for optimal performance
 * - Batch inserting/updating cache entries
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
	
	// Always check for existing tables to ensure cache is up to date
	// This is needed because different Lix instances may have created tables
	const existingTables = lix.sqlite.exec({
		sql: `SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'internal_state_cache_%'`,
		returnValue: "resultRows",
	}) as any[];
	
	if (existingTables) {
		for (const row of existingTables) {
			stateCacheV2Tables.add(row[0] as string);
		}
	}

	// Group changes by schema_key for efficient batch processing
	const changesBySchema = new Map<string, {
		inserts: LixChangeRaw[];
		deletes: LixChangeRaw[];
	}>();

	for (const change of changes) {
		if (!changesBySchema.has(change.schema_key)) {
			changesBySchema.set(change.schema_key, {
				inserts: [],
				deletes: [],
			});
		}
		
		const group = changesBySchema.get(change.schema_key)!;
		if (change.snapshot_content === null) {
			group.deletes.push(change);
		} else {
			group.inserts.push(change);
		}
	}

	// Process each schema's changes directly to its physical table
	for (const [schema_key, schemaChanges] of changesBySchema) {
		const tableName = `internal_state_cache_${schema_key}`;
		
		// Check if table exists (cache may be stale)
		if (!stateCacheV2Tables.has(tableName)) {
			// Double-check in database
			const tableExists = lix.sqlite.exec({
				sql: `SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?`,
				bind: [tableName],
				returnValue: "resultRows",
			}) as any[];
			
			if (!tableExists || tableExists.length === 0) {
				// Create the physical table
				createPhysicalTable(lix, tableName);
			}
			stateCacheV2Tables.add(tableName);
		}

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

function createPhysicalTable(lix: Pick<Lix, "sqlite">, tableName: string): void {
	const createTableSql = `
		CREATE TABLE IF NOT EXISTS ${tableName} (
			entity_id TEXT NOT NULL,
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
	
	// Create index
	lix.sqlite.exec({
		sql: `CREATE INDEX IF NOT EXISTS idx_${tableName}_version_id ON ${tableName} (version_id)`,
	});
	
	// Initial ANALYZE
	lix.sqlite.exec({ sql: `ANALYZE ${tableName}` });
}

function batchInsertDirectToTable(args: {
	lix: Pick<Lix, "sqlite">;
	tableName: string;
	changes: LixChangeRaw[];
	commit_id: string;
	version_id: string;
}): void {
	const { lix, tableName, changes, commit_id, version_id } = args;
	
	// Ensure table exists before preparing statement
	const tableExists = lix.sqlite.exec({
		sql: `SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?`,
		bind: [tableName],
		returnValue: "resultRows",
	}) as any[];
	
	if (!tableExists || tableExists.length === 0) {
		createPhysicalTable(lix, tableName);
	}
	
	// Use a transaction for better performance
	lix.sqlite.exec({ sql: "BEGIN IMMEDIATE" });
	
	try {
		// Prepare statement once for all inserts
		const stmt = lix.sqlite.prepare(`
			INSERT OR REPLACE INTO ${tableName} (
				entity_id,
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
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);
		
		for (const change of changes) {
			// Convert snapshot_content to proper JSON blob
			const jsonBlob = change.snapshot_content ? 
				lix.sqlite.exec({
					sql: `SELECT jsonb(?)`,
					bind: [change.snapshot_content],
					returnValue: "resultRows"
				})?.[0]?.[0] : null;
			
			stmt.bind([
				change.entity_id,
				change.file_id,
				version_id,
				change.plugin_key,
				jsonBlob,
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
		
		stmt.finalize();
		lix.sqlite.exec({ sql: "COMMIT" });
	} catch (err) {
		lix.sqlite.exec({ sql: "ROLLBACK" });
		throw err;
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
	const { db, lix, tableName, changes, commit_id, version_id } = args;
	
	// Get child versions for copy-down operations
	const childVersions = executeSync({
		lix,
		query: db
			.selectFrom("version")
			.select("id")
			.where("inherits_from_version_id", "=", version_id),
	});

	lix.sqlite.exec({ sql: "BEGIN IMMEDIATE" });
	
	try {
		for (const change of changes) {
			// Get existing entry
			const result = lix.sqlite.exec({
				sql: `SELECT * FROM ${tableName} 
				      WHERE entity_id = ? AND file_id = ? AND version_id = ?
				      AND inheritance_delete_marker = 0 AND snapshot_content IS NOT NULL`,
				bind: [change.entity_id, change.file_id, version_id],
				returnValue: "resultRows",
			}) as any[];
			
			const existingEntry = result?.[0];
			
			// Copy down to children if needed
			if (existingEntry && childVersions.length > 0) {
				const copyStmt = lix.sqlite.prepare(`
					INSERT OR IGNORE INTO ${tableName} (
						entity_id,
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
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				`);
				
				for (const childVersion of childVersions) {
					copyStmt.bind([
						existingEntry[0], // entity_id
						existingEntry[1], // file_id
						childVersion.id,
						existingEntry[3], // plugin_key
						existingEntry[4], // snapshot_content
						existingEntry[5], // schema_version
						existingEntry[6], // created_at
						existingEntry[7], // updated_at
						version_id, // inherited_from_version_id
						0, // inheritance_delete_marker
						existingEntry[10], // change_id
						existingEntry[11], // commit_id (preserve original)
					]);
					copyStmt.step();
					copyStmt.reset();
				}
				
				copyStmt.finalize();
			}
			
			// Delete the entry
			if (existingEntry) {
				lix.sqlite.exec({
					sql: `DELETE FROM ${tableName} 
					      WHERE entity_id = ? AND file_id = ? AND version_id = ?`,
					bind: [change.entity_id, change.file_id, version_id],
				});
			}
			
			// Insert tombstone
			lix.sqlite.exec({
				sql: `INSERT INTO ${tableName} (
					entity_id,
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
				) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, NULL, 1, ?, ?)`,
				bind: [
					change.entity_id,
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
		}
		
		lix.sqlite.exec({ sql: "COMMIT" });
	} catch (err) {
		lix.sqlite.exec({ sql: "ROLLBACK" });
		throw err;
	}
}