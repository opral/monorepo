import type { LixEngine } from "../../engine/boot.js";
import {
	createSchemaCacheTable,
	schemaKeyToCacheTableName,
} from "./create-schema-cache-table.js";

export type InternalStateCache = InternalStateCacheTable;

// Type definition for the cache v2 virtual table
export type InternalStateCacheTable = {
	entity_id: string;
	schema_key: string;
	file_id: string;
	version_id: string;
	plugin_key: string;
	snapshot_content: string | null; // BLOB stored as string/JSON
	schema_version: string;
	created_at: string;
	updated_at: string;
	inherited_from_version_id: string | null;
	is_tombstone: number; // 0 or 1
	change_id: string | null;
	commit_id: string | null;
};

// Cache of physical tables scoped to each Lix instance
// Using WeakMap ensures proper cleanup when Lix instances are garbage collected
const stateCacheV2TablesMap = new WeakMap<object, Set<string>>();

// Export a getter function to access the cache for a specific Lix instance
export function getStateCacheV2Tables(args: {
	engine: Pick<LixEngine, "runtimeCacheRef">;
}): Set<string> {
	let cache = stateCacheV2TablesMap.get(args.engine.runtimeCacheRef);
	if (!cache) {
		cache = new Set<string>();
		stateCacheV2TablesMap.set(args.engine.runtimeCacheRef, cache);
	}
	return cache;
}

export function applyStateCacheV2Schema(args: {
	engine: Pick<LixEngine, "sqlite" | "executeSync" | "runtimeCacheRef">;
}): void {
	const { sqlite } = args.engine;

	// Get or create cache for this Lix instance
	const tableCache = getStateCacheV2Tables({ engine: args.engine });

	// Initialize cache with existing tables on startup
	const existingTables = sqlite.exec({
		sql: `SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'lix_internal_state_cache_v1_%'`,
		returnValue: "resultRows",
	}) as any[];

	if (existingTables) {
		for (const row of existingTables) {
			tableCache.add(row[0] as string);
		}
	}

	// Ensure descriptor cache table exists for inheritance rewrites
	const descriptorTable = schemaKeyToCacheTableName("lix_version_descriptor");
	if (!tableCache.has(descriptorTable)) {
		createSchemaCacheTable({
			engine: args.engine,
			tableName: descriptorTable,
		});
		tableCache.add(descriptorTable);
	}
}
