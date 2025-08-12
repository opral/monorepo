import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Lix } from "../../lix/open-lix.js";
import type { LixChangeRaw } from "../../change/schema.js";
import { updateStateCacheV2 } from "./update-state-cache.js";
import { getStateCacheV2Tables } from "./schema.js";

export interface PopulateStateCacheV2Options {
	version_id?: string; // Optional - if not provided, all active versions are populated
	entity_id?: string; // Optional
	schema_key?: string; // Optional
	file_id?: string; // Optional
}

/**
 * Populates the state cache v2 from the materializer view.
 * 
 * This function reads from the materialized state and writes to the per-schema
 * physical cache tables using updateStateCacheV2 for optimal performance.
 * 
 * @param lix - The Lix instance with sqlite and db
 * @param options - Optional filters for selective population
 */
export function populateStateCacheV2(
	lix: Pick<Lix, "sqlite" | "db">,
	options: PopulateStateCacheV2Options = {}
): void {
	const { sqlite } = lix;
	
	// Build WHERE clause based on options
	const whereConditions: string[] = [];
	const bindParams: any[] = [];

	if (options.version_id) {
		whereConditions.push("m.version_id = ?");
		bindParams.push(options.version_id);
	} else {
		// If no version_id specified, only populate active versions (with tips)
		whereConditions.push(`EXISTS (
			SELECT 1 FROM internal_materialization_version_tips vt
			WHERE vt.version_id = m.version_id
		)`);
	}

	if (options.entity_id) {
		whereConditions.push("m.entity_id = ?");
		bindParams.push(options.entity_id);
	}
	if (options.schema_key) {
		whereConditions.push("m.schema_key = ?");
		bindParams.push(options.schema_key);
	}
	if (options.file_id) {
		whereConditions.push("m.file_id = ?");
		bindParams.push(options.file_id);
	}

	// Clear existing cache entries for v2 tables that match the criteria
	const tableCache = getStateCacheV2Tables(lix);
	
	if (options.schema_key) {
		// If schema_key is specified, only clear that specific table
		const tableName = `internal_state_cache_${options.schema_key}`;
		if (tableCache.has(tableName)) {
			const deleteConditions: string[] = [];
			const deleteParams: any[] = [];
			
			if (options.version_id) {
				deleteConditions.push("version_id = ?");
				deleteParams.push(options.version_id);
			}
			if (options.entity_id) {
				deleteConditions.push("entity_id = ?");
				deleteParams.push(options.entity_id);
			}
			if (options.file_id) {
				deleteConditions.push("file_id = ?");
				deleteParams.push(options.file_id);
			}
			
			if (deleteConditions.length > 0) {
				sqlite.exec({
					sql: `DELETE FROM ${tableName} WHERE ${deleteConditions.join(" AND ")}`,
					bind: deleteParams,
				});
			} else {
				// Clear entire table for this schema
				sqlite.exec(`DELETE FROM ${tableName}`);
			}
		}
	} else {
		// Clear all v2 cache tables based on filters
		for (const tableName of tableCache) {
			// Skip the virtual table itself
			if (tableName === "internal_state_cache_v2") continue;
			
			const deleteConditions: string[] = [];
			const deleteParams: any[] = [];
			
			if (options.version_id) {
				deleteConditions.push("version_id = ?");
				deleteParams.push(options.version_id);
			}
			if (options.entity_id) {
				deleteConditions.push("entity_id = ?");
				deleteParams.push(options.entity_id);
			}
			if (options.file_id) {
				deleteConditions.push("file_id = ?");
				deleteParams.push(options.file_id);
			}
			
			if (deleteConditions.length > 0) {
				// Check if table exists before deleting
				const tableExists = sqlite.exec({
					sql: `SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?`,
					bind: [tableName],
					returnValue: "resultRows",
				});
				
				if (tableExists && tableExists.length > 0) {
					sqlite.exec({
						sql: `DELETE FROM ${tableName} WHERE ${deleteConditions.join(" AND ")}`,
						bind: deleteParams,
					});
				}
			} else if (!options.version_id && !options.entity_id && !options.file_id) {
				// Only clear entire tables if no filters specified
				const tableExists = sqlite.exec({
					sql: `SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?`,
					bind: [tableName],
					returnValue: "resultRows",
				});
				
				if (tableExists && tableExists.length > 0) {
					sqlite.exec(`DELETE FROM ${tableName}`);
				}
			}
		}
	}

	// Query materialized state to get changes
	const selectSql = `
		SELECT 
			m.entity_id,
			m.schema_key,
			m.file_id,
			m.version_id,
			m.plugin_key,
			m.snapshot_content,
			m.schema_version,
			m.created_at,
			m.updated_at,
			m.change_id,
			m.commit_id
		FROM internal_state_materializer m
		WHERE ${whereConditions.length > 0 ? whereConditions.join(" AND ") : "1=1"}
		  AND m.inherited_from_version_id IS NULL  -- Only direct entries, no inherited state
	`;

	const results = sqlite.exec({
		sql: selectSql,
		bind: bindParams,
		returnValue: "resultRows",
		rowMode: "object",
	}) as any[];

	if (!results || results.length === 0) {
		return;
	}

	// Group results by version_id and commit_id for batch processing
	const changesByVersionAndCommit = new Map<string, { 
		commit_id: string; 
		changes: LixChangeRaw[] 
	}>();

	for (const row of results) {
		const key = `${row.version_id}:${row.commit_id}`;
		
		if (!changesByVersionAndCommit.has(key)) {
			changesByVersionAndCommit.set(key, {
				commit_id: row.commit_id,
				changes: [],
			});
		}

		// Convert to LixChangeRaw format
		const change: LixChangeRaw = {
			id: row.change_id,
			entity_id: row.entity_id,
			schema_key: row.schema_key,
			schema_version: row.schema_version,
			file_id: row.file_id,
			plugin_key: row.plugin_key,
			snapshot_content: row.snapshot_content,
			created_at: row.created_at,
		};

		changesByVersionAndCommit.get(key)!.changes.push(change);
	}

	// Call updateStateCacheV2 for each version/commit combination
	for (const [key, data] of changesByVersionAndCommit) {
		const [version_id] = key.split(":");
		
		updateStateCacheV2({
			lix,
			changes: data.changes,
			commit_id: data.commit_id,
			version_id: version_id,
		});
	}
}