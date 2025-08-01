import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export interface PopulateStateCacheOptions {
	version_id?: string; // Optional - if not provided, all active versions are populated
	entity_id?: string; // Optional
	schema_key?: string; // Optional
	file_id?: string; // Optional
}

export function populateStateCache(
	sqlite: SqliteWasmDatabase,
	options: PopulateStateCacheOptions = {}
): void {
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

	// Delete existing cache entries that match the criteria
	if (
		options.version_id ||
		options.entity_id ||
		options.schema_key ||
		options.file_id
	) {
		// Build delete conditions - only for specific filters, not for the EXISTS clause
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
		if (options.schema_key) {
			deleteConditions.push("schema_key = ?");
			deleteParams.push(options.schema_key);
		}
		if (options.file_id) {
			deleteConditions.push("file_id = ?");
			deleteParams.push(options.file_id);
		}

		if (deleteConditions.length > 0) {
			sqlite.exec({
				sql: `DELETE FROM internal_state_cache WHERE ${deleteConditions.join(" AND ")}`,
				bind: deleteParams,
			});
		}
	} else {
		// No specific filters - clear entire cache (populate all active versions)
		sqlite.exec(`DELETE FROM internal_state_cache`);
	}

	// Populate cache from the materializer view for the specified version
	// IMPORTANT: Only copy direct entries (inherited_from_version_id IS NULL)
	// Inherited state should not be stored in the cache - inheritance is handled
	// by the resolved state view at query time
	const insertSql = `
		INSERT INTO internal_state_cache (
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
		)
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
			m.inherited_from_version_id,
			0 as inheritance_delete_marker, -- No deletion markers from materializer
			m.change_id,
			m.commit_id
		FROM internal_state_materializer m
		WHERE ${whereConditions.join(" AND ")}
		  AND m.inherited_from_version_id IS NULL  -- Only direct entries, no inherited state
	`;

	sqlite.exec({
		sql: insertSql,
		bind: bindParams,
	});
}
