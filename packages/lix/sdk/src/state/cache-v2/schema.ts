import type { LixEngine } from "../../engine/boot.js";
import {
	createSchemaCacheTableV2,
	schemaKeyToCacheTableNameV2,
} from "./create-schema-cache-table.js";
import { LixVersionDescriptorSchema } from "../../version/schema-definition.js";

const tableCacheMap = new WeakMap<object, Set<string>>();
const columnCacheMap = new WeakMap<object, Map<string, Set<string>>>();
const tableMetadataMap = new WeakMap<
	object,
	Map<string, { schemaKey: string; schemaVersion: string }>
>();

function getTableCache(args: {
	engine: Pick<LixEngine, "runtimeCacheRef">;
}): Set<string> {
	let cache = tableCacheMap.get(args.engine.runtimeCacheRef);
	if (!cache) {
		cache = new Set<string>();
		tableCacheMap.set(args.engine.runtimeCacheRef, cache);
	}
	return cache;
}

function getColumnCache(args: {
	engine: Pick<LixEngine, "runtimeCacheRef">;
}): Map<string, Set<string>> {
	let cache = columnCacheMap.get(args.engine.runtimeCacheRef);
	if (!cache) {
		cache = new Map<string, Set<string>>();
		columnCacheMap.set(args.engine.runtimeCacheRef, cache);
	}
	return cache;
}

function getTableMetadataCache(args: {
	engine: Pick<LixEngine, "runtimeCacheRef">;
}): Map<string, { schemaKey: string; schemaVersion: string }> {
	let cache = tableMetadataMap.get(args.engine.runtimeCacheRef);
	if (!cache) {
		cache = new Map();
		tableMetadataMap.set(args.engine.runtimeCacheRef, cache);
	}
	return cache;
}

export function getStateCacheV2Tables(args: {
	engine: Pick<LixEngine, "runtimeCacheRef">;
}): Set<string> {
	return getTableCache(args);
}

export function getStateCacheV2Columns(args: {
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef">;
	tableName: string;
}): Set<string> {
	const columnCache = getColumnCache({ engine: args.engine });
	let columns = columnCache.get(args.tableName);
	if (!columns) {
		columns = fetchTableColumns(args);
		columnCache.set(args.tableName, columns);
	}
	return columns;
}

export function clearStateCacheV2Columns(args: {
	engine: Pick<LixEngine, "runtimeCacheRef">;
	tableName: string;
}): void {
	const columnCache = getColumnCache({ engine: args.engine });
	columnCache.delete(args.tableName);
}

export function registerStateCacheV2TableMetadata(args: {
	engine: Pick<LixEngine, "runtimeCacheRef">;
	tableName: string;
	schemaKey: string;
	schemaVersion: string;
}): void {
	const metadataCache = getTableMetadataCache({ engine: args.engine });
	metadataCache.set(args.tableName, {
		schemaKey: args.schemaKey,
		schemaVersion: args.schemaVersion,
	});
}

export function getStateCacheV2TableMetadata(args: {
	engine: Pick<LixEngine, "runtimeCacheRef">;
	tableName: string;
}): { schemaKey: string; schemaVersion: string } | undefined {
	const metadataCache = getTableMetadataCache({ engine: args.engine });
	return metadataCache.get(args.tableName);
}

export function clearStateCacheV2TableMetadata(args: {
	engine: Pick<LixEngine, "runtimeCacheRef">;
	tableName: string;
}): void {
	const metadataCache = getTableMetadataCache({ engine: args.engine });
	metadataCache.delete(args.tableName);
}

function fetchTableColumns(args: {
	engine: Pick<LixEngine, "executeSync">;
	tableName: string;
}): Set<string> {
	const result = args.engine.executeSync({
		sql: `PRAGMA table_info(${args.tableName})`,
	});
	const rows = Array.isArray(result?.rows) ? result.rows : [];
	const columns = new Set<string>();
	for (const row of rows as Array<{ name?: unknown }>) {
		if (typeof row?.name === "string") {
			columns.add(row.name);
		}
	}
	return columns;
}

/**
 * Registers existing normalized cache tables and ensures descriptor state cache exists.
 *
 * This warms the in-memory table cache so subsequent lookups avoid redundant PRAGMA
 * calls and guarantees that inheritance rewrites can rely on the descriptor cache table.
 *
 * @example
 * applyStateCacheV2Schema({ engine });
 */
export function applyStateCacheV2Schema(args: {
	engine: Pick<LixEngine, "sqlite" | "executeSync" | "runtimeCacheRef">;
}): void {
	const { sqlite } = args.engine;

	const tableCache = getStateCacheV2Tables({ engine: args.engine });

	const existingTables = sqlite.exec({
		sql: `SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'lix_internal_state_cache_v2_%'`,
		returnValue: "resultRows",
		rowMode: "array",
	}) as Array<[string]> | undefined;

	if (Array.isArray(existingTables)) {
		for (const row of existingTables) {
			const tableName = row?.[0];
			if (typeof tableName === "string") {
				tableCache.add(tableName);
			}
		}
	}

	const descriptorSchema = LixVersionDescriptorSchema;
	const descriptorTable = schemaKeyToCacheTableNameV2(
		descriptorSchema["x-lix-key"],
		descriptorSchema["x-lix-version"]
	);

	if (!tableCache.has(descriptorTable)) {
		createSchemaCacheTableV2({
			engine: args.engine,
			schema: descriptorSchema,
		});
	}

	tableCache.add(descriptorTable);
	registerStateCacheV2TableMetadata({
		engine: args.engine,
		tableName: descriptorTable,
		schemaKey: descriptorSchema["x-lix-key"],
		schemaVersion: descriptorSchema["x-lix-version"],
	});
}
