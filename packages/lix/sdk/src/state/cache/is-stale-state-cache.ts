import { sql } from "kysely";
import type { LixEngine } from "../../engine/boot.js";
import { internalQueryBuilder } from "../../engine/internal-query-builder.js";

const CACHE_STALE_KEY = "lix_state_cache_stale";
const CACHE_SCHEMA_KEY = "lix_key_value";

const staleStateCache = new WeakMap<any, boolean>();
const hookListeners = new WeakSet<object>();

/**
 * Memoize the stale flag for a given SQLite connection.
 */
export function setStaleStateCacheMemo(args: {
	engine: Pick<LixEngine, "runtimeCacheRef">;
	value: boolean;
}): void {
	staleStateCache.set(args.engine.runtimeCacheRef as object, args.value);
}

/**
 * Remove the cached stale flag so the next read re-queries SQLite.
 */
export function invalidateStaleStateCacheMemo(args: {
	engine: Pick<LixEngine, "runtimeCacheRef">;
}): void {
	staleStateCache.delete(args.engine.runtimeCacheRef as object);
}

function readStaleFlag(
	engine: Pick<LixEngine, "executeQuerySync" | "runtimeCacheRef">
): boolean {
	const [row] = engine.executeQuerySync(
		internalQueryBuilder
			.selectFrom("internal_state_reader")
			.where("entity_id", "=", CACHE_STALE_KEY)
			.where("schema_key", "=", CACHE_SCHEMA_KEY)
			.where("version_id", "=", "global")
			.where("snapshot_content", "is not", null)
			.select(sql`json_extract(snapshot_content, '$.value')`.as("value"))
			.compile()
	).rows;

	if (!row) {
		return true;
	}

	return row.value == true;
}

/**
 * Determine whether the state cache needs to be repopulated.
 *
 * The result is cached per SQLite connection and automatically invalidated
 * whenever the `lix_state_cache_stale` key changes via `onStateCommit`.
 *
 * @example
 * const stale = isStaleStateCache({ engine: lix.engine! });
 */
export function isStaleStateCache(args: {
	engine: Pick<LixEngine, "executeQuerySync" | "hooks" | "runtimeCacheRef">;
}): boolean {
	const { engine } = args;

	if (!hookListeners.has(args.engine.hooks)) {
		hookListeners.add(args.engine.hooks);
		engine.hooks.onStateCommit(({ changes }) => {
			for (const change of changes) {
				if (
					change.entity_id === CACHE_STALE_KEY &&
					change.schema_key === CACHE_SCHEMA_KEY
				) {
					invalidateStaleStateCacheMemo({ engine });
					break;
				}
			}
		});
	}

	const cacheTarget = args.engine.runtimeCacheRef as object;
	if (staleStateCache.has(cacheTarget)) {
		return staleStateCache.get(cacheTarget)!;
	}

	const result = readStaleFlag(args.engine);
	setStaleStateCacheMemo({ engine, value: result });
	return result;
}
