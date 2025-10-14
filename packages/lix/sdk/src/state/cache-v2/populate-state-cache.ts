import type { LixEngine } from "../../engine/boot.js";
import type { MaterializedState as MaterializedChange } from "../vtable/generate-commit.js";
import { updateStateCacheV2 } from "./update-state-cache.js";
import {
	getStateCacheV2Tables,
	getStateCacheV2Columns,
	clearStateCacheV2Columns,
} from "./schema.js";

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
 *
 * @example
 * populateStateCacheV2({ engine: lix.engine! });
 */
export function populateStateCacheV2(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "executeSync" | "runtimeCacheRef" | "hooks"
	>;
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
				FROM lix_internal_materialization_version_ancestry
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
			sql: `SELECT version_id FROM lix_internal_materialization_version_tips`,
			returnValue: "resultRows",
			rowMode: "array",
		}) as [string][];
		versionsToPopulate = tipRows.map((row) => row[0]);
	}

	if (versionsToPopulate.length === 0) {
		return;
	}

	// Clear existing cache entries for the versions being populated
	const existingTables = sqlite.exec({
		sql: `SELECT name FROM sqlite_schema 
		      WHERE type='table' 
		      AND name LIKE 'lix_internal_state_cache_v2_%'`,
		returnValue: "resultRows",
	}) as any[];

	const tableCache = getStateCacheV2Tables({ engine: args.engine });

	const placeholders = versionsToPopulate.map(() => "?").join(",");
	for (const row of existingTables ?? []) {
		const tableName = row?.[0] as string;
		if (!tableName) continue;

		const columns = getStateCacheV2Columns({
			engine: args.engine,
			tableName,
		});
		if (!columns.has("version_id")) {
			sqlite.exec({ sql: `DROP TABLE ${tableName}` });
			clearStateCacheV2Columns({ engine: args.engine, tableName });
			tableCache.delete(tableName);
			continue;
		}

		tableCache.add(tableName);
		sqlite.exec({
			sql: `DELETE FROM ${tableName} WHERE version_id IN (${placeholders})`,
			bind: versionsToPopulate,
		});
	}

	// Query materialized state to get changes for all required versions
	const selectPlaceholders = versionsToPopulate.map(() => "?").join(",");
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
		FROM lix_internal_state_materializer m
		WHERE m.version_id IN (${selectPlaceholders})
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

	const materializedChanges = results.map((row) => {
		const changeId =
			row.change_id ??
			`${row.schema_key}:${row.entity_id}:${row.version_id}:materializer`;
		const commitId =
			row.commit_id ??
			row.change_id ??
			`${row.version_id}:${row.entity_id}:materializer`;

		return {
			id: changeId,
			entity_id: row.entity_id,
			schema_key: row.schema_key,
			schema_version: row.schema_version,
			file_id: row.file_id,
			plugin_key: row.plugin_key,
			snapshot_content: row.snapshot_content,
			created_at: row.created_at,
			metadata: null,
			version_id: row.version_id,
			commit_id: commitId,
			lixcol_version_id: row.version_id,
			lixcol_commit_id: commitId,
			inherited_from_version_id: row.inherited_from_version_id,
		} as MaterializedPopulateChange;
	});

	updateStateCacheV2({
		engine: {
			executeSync: args.engine.executeSync,
			runtimeCacheRef: args.engine.runtimeCacheRef,
			hooks: args.engine.hooks,
			sqlite: args.engine.sqlite,
		},
		changes: materializedChanges,
	});
}

type MaterializedPopulateChange = MaterializedChange & {
	inherited_from_version_id?: string | null;
};
