import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixEngine } from "../../engine/boot.js";
import { getStateCacheV2Tables } from "./schema.js";
import { createSchemaCacheTable } from "./create-schema-cache-table.js";

export interface PopulateStateCacheV2Options {
	version_id?: string; // Optional - if not provided, all active versions are populated
}

/**
 * Populates the state cache v2 from the materializer view.
 *
 * This function reads from the materialized state and writes to the per-schema
 * physical cache tables. If a version_id is provided, it also populates the
 * cache for all ancestor versions.
 *
 * @param lix - The Lix instance with sqlite and db
 * @param options - Optional filters for selective population
 */
export function populateStateCache(args: {
	engine: Pick<LixEngine, "sqlite" | "db">;
	options?: PopulateStateCacheV2Options;
}): void {
	const { sqlite } = args.engine;
	const options = args.options ?? {};

	let versionsToPopulate: string[];

	if (options.version_id) {
		// When a specific version is requested, also include all its ancestors
		// This ensures the resolved view can access inherited state
		// Use the materializer's version ancestry view to find all ancestors
		const ancestorRows = sqlite.exec({
			sql: `
				SELECT DISTINCT ancestor_version_id as version_id
				FROM internal_materialization_version_ancestry
				WHERE version_id = ?
			`,
			bind: [options.version_id],
			returnValue: "resultRows",
			rowMode: "array",
		}) as [string][];

		// The ancestry view includes the version itself and all its ancestors
		versionsToPopulate =
			ancestorRows.length > 0
				? ancestorRows.map((row) => row[0])
				: [options.version_id];
	} else {
		// If no version_id specified, populate all active versions (with tips)
		const tipRows = sqlite.exec({
			sql: `SELECT version_id FROM internal_materialization_version_tips`,
			returnValue: "resultRows",
			rowMode: "array",
		}) as [string][];
		versionsToPopulate = tipRows.map((row) => row[0]);
	}

	if (versionsToPopulate.length === 0) {
		return;
	}

	// Clear existing cache entries for the versions being populated
	const tableCache = getStateCacheV2Tables({
		engine: { sqlite: args.engine.sqlite } as any,
	});
	for (const tableName of tableCache) {
		if (tableName === "internal_state_cache") continue;

		const tableExists = sqlite.exec({
			sql: `SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?`,
			bind: [tableName],
			returnValue: "resultRows",
		});

		if (tableExists && tableExists.length > 0) {
			const placeholders = versionsToPopulate.map(() => "?").join(",");
			sqlite.exec({
				sql: `DELETE FROM ${tableName} WHERE version_id IN (${placeholders})`,
				bind: versionsToPopulate,
			});
		}
	}

	// Query materialized state to get changes for all required versions
	const placeholders = versionsToPopulate.map(() => "?").join(",");
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
			m.commit_id,
			m.inherited_from_version_id
		FROM internal_state_materializer m
		WHERE m.version_id IN (${placeholders})
		  AND m.inherited_from_version_id IS NULL
	`;

	const results = sqlite.exec({
		sql: selectSql,
		bind: versionsToPopulate,
		returnValue: "resultRows",
		rowMode: "object",
	}) as any[];

	if (!results || results.length === 0) {
		return;
	}

	// Group results by schema_key for batch processing
	const rowsBySchema = new Map<string, any[]>();

	for (const row of results) {
		if (!rowsBySchema.has(row.schema_key)) {
			rowsBySchema.set(row.schema_key, []);
		}
		rowsBySchema.get(row.schema_key)!.push(row);
	}

	// Process each schema's rows directly to its physical table
	for (const [schema_key, schemaRows] of rowsBySchema) {
		// Sanitize schema_key for use in table name - must match update-state-cache.ts
		const sanitizedSchemaKey = schema_key.replace(/[^a-zA-Z0-9]/g, "_");
		const tableName = `internal_state_cache_${sanitizedSchemaKey}`;

		// Ensure table exists (creates if needed, updates cache)
		ensureTableExists(sqlite, tableName);

		// Batch insert with prepared statement
		const stmt = sqlite.prepare(`
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
				-- Preserve both timestamps exactly as they are from the materializer
				created_at = excluded.created_at,
				updated_at = excluded.updated_at,
				inherited_from_version_id = excluded.inherited_from_version_id,
				inheritance_delete_marker = excluded.inheritance_delete_marker,
				change_id = excluded.change_id,
				commit_id = excluded.commit_id
		`);

		try {
			for (const row of schemaRows) {
				const isDeletion =
					row.snapshot_content === null || row.snapshot_content === undefined;
				stmt.bind([
					row.entity_id,
					row.schema_key,
					row.file_id,
					row.version_id,
					row.plugin_key,
					row.snapshot_content, // jsonb() conversion happens in SQL
					row.schema_version,
					row.created_at, // Preserve original created_at
					row.updated_at, // Preserve original updated_at
					row.inherited_from_version_id,
					isDeletion ? 1 : 0, // inheritance_delete_marker
					row.change_id,
					row.commit_id,
				]);
				stmt.step();
				stmt.reset();
			}
		} finally {
			stmt.finalize();
		}
	}
}

/**
 * Ensures a table exists and updates the cache.
 * Duplicated from update-state-cache.ts to avoid circular dependency.
 */
function ensureTableExists(
	sqlite: SqliteWasmDatabase,
	tableName: string
): void {
	// Use shared creator (idempotent) and update the cache set
	createSchemaCacheTable({ engine: { sqlite } as any, tableName });
	const tableCache = getStateCacheV2Tables({ engine: { sqlite } as any });
	if (!tableCache.has(tableName)) tableCache.add(tableName);
}
