import type { CompiledQuery } from "kysely";
import type { LixEngine } from "./boot.js";
import {
	determineSchemaKeys,
	extractLiteralFilters,
} from "../observe/determine-schema-keys.js";
import type { StateCommitChange } from "../hooks/create-hooks.js";

const runtimeCaches = new WeakMap<object, Map<string, CacheEntry>>();

type EngineForCache = Pick<
	LixEngine,
	"executeSync" | "hooks" | "runtimeCacheRef"
>;

type ExecuteResult = ReturnType<EngineForCache["executeSync"]>;

type CacheEntry = {
	key: string;
	result: ExecuteResult;
	unsubscribe: () => void;
	dependencies: CacheDependencies;
};

type CacheDependencies = {
	schemaKeys: string[];
	versionIds: string[];
	entityIds: string[];
};

const BIGINT_SAFE_SERIALIZER = (_key: string, value: unknown) =>
	typeof value === "bigint" ? value.toString() : value;

function serialiseParameters(
	parameters: Readonly<unknown[]> | undefined
): string {
	if (!parameters || parameters.length === 0) return "[]";
	try {
		return JSON.stringify(parameters, BIGINT_SAFE_SERIALIZER);
	} catch {
		// Fall back to stringifying via String() to avoid runtime crashes
		return `[${parameters.map(String).join(",")}]`;
	}
}

function getCacheContainer(engine: EngineForCache): Map<string, CacheEntry> {
	let cache = runtimeCaches.get(engine.runtimeCacheRef);
	if (!cache) {
		cache = new Map();
		runtimeCaches.set(engine.runtimeCacheRef, cache);
	}
	return cache;
}

function buildCacheKey(compiled: CompiledQuery<any>): string {
	const paramsKey = serialiseParameters(compiled.parameters as any);
	return `${compiled.sql}\u0000${paramsKey}`;
}

function computeDependencies(compiled: CompiledQuery<any>): CacheDependencies {
	const schemaKeys = determineSchemaKeys(compiled) ?? [];
	const filters = extractLiteralFilters(compiled);

	return {
		schemaKeys: Array.from(
			new Set([...(filters.schemaKeys ?? []), ...schemaKeys])
		),
		versionIds: filters.versionIds ?? [],
		entityIds: filters.entityIds ?? [],
	};
}

function shouldInvalidate(
	changes: StateCommitChange[] | undefined,
	dependencies: CacheDependencies
): boolean {
	if (!changes || changes.length === 0) {
		return true;
	}

	const { schemaKeys, versionIds, entityIds } = dependencies;

	// No dependency information => be conservative and invalidate
	if (
		schemaKeys.length === 0 &&
		versionIds.length === 0 &&
		entityIds.length === 0
	) {
		return true;
	}

	for (const change of changes) {
		const schemaKey = change.schema_key;
		const entityId = change.entity_id;
		const changeVersionId =
			change.version_id ?? (change as any).lixcol_version_id;

		if (schemaKeys.length > 0) {
			if (!schemaKey) {
				return true;
			}
			if (!schemaKeys.includes(schemaKey)) {
				continue;
			}
		}

		if (entityIds.length > 0) {
			if (!entityId) {
				return true;
			}
			if (!entityIds.includes(entityId)) {
				continue;
			}
		}

		if (versionIds.length > 0) {
			if (!changeVersionId) {
				return true;
			}
			if (!versionIds.includes(changeVersionId)) {
				continue;
			}
		}

		return true;
	}

	return false;
}

function attachInvalidation(
	engine: EngineForCache,
	cache: Map<string, CacheEntry>,
	entry: CacheEntry
): void {
	let released = false;
	let unsubscribeHook: () => void = () => {};

	const teardown = () => {
		if (released) return;
		released = true;
		unsubscribeHook();
		cache.delete(entry.key);
	};

	unsubscribeHook = engine.hooks.onStateCommit(({ changes }) => {
		if (shouldInvalidate(changes, entry.dependencies)) {
			teardown();
		}
	});

	entry.unsubscribe = teardown;
}

/**
 * Executes an internal compiled query once per engine instance and serves future callers from cache.
 *
 * Uses `engine.runtimeCacheRef` as a stable WeakMap key, subscribes to `onStateCommit`, and
 * invalidates cached results when relevant entities, schema keys, or version IDs change.
 *
 * @example
 * ```ts
 * const [config] = withRuntimeCache(
 *   engine,
 *   internalQueryBuilder
 *     .selectFrom("internal_state_vtable")
 *     .where("entity_id", "=", "lix_deterministic_mode")
 *     .where("schema_key", "=", "lix_key_value")
 *     .select(sql`json_extract(snapshot_content, '$.value.enabled')`.as("enabled"))
 *     .limit(1)
 *     .compile()
 * ).rows;
 * ```
 */
export function withRuntimeCache(
	engine: EngineForCache,
	compiled: CompiledQuery<any>
): ExecuteResult {
	const cache = getCacheContainer(engine);
	const key = buildCacheKey(compiled);

	const existing = cache.get(key);
	if (existing) {
		return existing.result;
	}

	const result = engine.executeSync({
		sql: compiled.sql,
		parameters: (compiled.parameters as Readonly<unknown[]>) ?? [],
	});

	const dependencies = computeDependencies(compiled);
	const cacheEntry: CacheEntry = {
		key,
		result,
		unsubscribe: () => {
			/* replaced below */
		},
		dependencies,
	};

	attachInvalidation(engine, cache, cacheEntry);
	cache.set(key, cacheEntry);

	return result;
}
