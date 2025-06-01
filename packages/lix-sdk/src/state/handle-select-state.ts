import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";

/**
 * Handle selecting state using cache-first approach.
 * This function implements the cache-miss → materialize → fast re-query pattern.
 * 
 * @param sqlite - SQLite database instance
 * @param db - Kysely database instance
 * @param entity_id - Entity ID to select
 * @param schema_key - Schema key to select
 * @param file_id - File ID to select
 * @param version_id - Version ID to select
 * @returns JSON string of the state or null if not found
 */
export function handleSelectState(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>,
	entity_id: string,
	schema_key: string,
	file_id: string,
	version_id: string
): string | null {
	// Try cache first
	const cacheResult = sqlite.exec({
		sql: `SELECT * FROM internal_state_cache 
			  WHERE entity_id = ? AND schema_key = ? AND file_id = ? AND version_id = ?`,
		bind: [entity_id, schema_key, file_id, version_id],
		returnValue: "resultRows"
	});

	if (cacheResult && cacheResult.length > 0) {
		// Cache hit - return cached result
		const row = cacheResult[0];
		return JSON.stringify({
			entity_id: row[0],
			schema_key: row[1],
			file_id: row[2],
			plugin_key: row[4],
			snapshot_content: row[5],
			schema_version: row[6],
			version_id: row[3],
			created_at: row[7],
			updated_at: row[8]
		});
	}

	// Cache miss - run expensive query and populate cache
	const stateResult = sqlite.exec({
		sql: `SELECT * FROM state 
			  WHERE entity_id = ? AND schema_key = ? AND file_id = ? AND version_id = ?`,
		bind: [entity_id, schema_key, file_id, version_id],
		returnValue: "resultRows"
	});

	if (stateResult && stateResult.length > 0) {
		const row = stateResult[0];
		
		// Populate cache
		sqlite.exec({
			sql: `INSERT OR REPLACE INTO internal_state_cache 
				  (entity_id, schema_key, file_id, version_id, plugin_key, snapshot_content, schema_version, created_at, updated_at)
				  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			bind: [
				row[0], // entity_id
				row[1], // schema_key
				row[2], // file_id
				row[6], // version_id
				row[3], // plugin_key
				typeof row[4] === "string" ? row[4] : JSON.stringify(row[4]), // snapshot_content
				row[5], // schema_version
				row[7], // created_at
				row[8], // updated_at
			]
		});

		// Return the result
		return JSON.stringify({
			entity_id: row[0],
			schema_key: row[1],
			file_id: row[2],
			plugin_key: row[3],
			snapshot_content: row[4],
			schema_version: row[5],
			version_id: row[6],
			created_at: row[7],
			updated_at: row[8]
		});
	}

	return null;
}