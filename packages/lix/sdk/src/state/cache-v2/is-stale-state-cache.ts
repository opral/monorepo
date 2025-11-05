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
export function setStaleStateCacheMemoV2(args: {
	engine: Pick<LixEngine, "executeSync">;
	value: boolean;
}): void {
	staleStateCache.set(args.engine.executeSync, args.value);
}

/**
 * Remove the cached stale flag so the next read re-queries SQLite.
 */
export function invalidateStaleStateCacheMemoV2(args: {
	engine: Pick<LixEngine, "executeSync">;
}): void {
	staleStateCache.delete(args.engine.executeSync);
}

function readStaleFlag(engine: Pick<LixEngine, "executeSync">): boolean {
	const res = engine.executeSync(
		internalQueryBuilder
			.selectFrom("lix_internal_state_vtable")
			.where("entity_id", "=", CACHE_STALE_KEY)
			.where("schema_key", "=", CACHE_SCHEMA_KEY)
			.where("version_id", "=", "global")
			.where("snapshot_content", "is not", null)
			.select(sql`json_extract(snapshot_content, '$.value')`.as("value"))
			.compile()
	).rows;

	if (!res || res.length === 0) {
		return true;
	}

	return res[0]?.value == true;
}

/**
 * Determine whether the state cache needs to be repopulated.
 *
 * The result is cached per SQLite connection and automatically invalidated
 * whenever the `lix_state_cache_stale` key changes via `onStateCommit`.
 *
 * @example
 * const stale = isStaleStateCacheV2({ engine: lix.engine! });
 */
export function isStaleStateCacheV2(args: {
	engine: Pick<LixEngine, "executeSync" | "hooks">;
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
					invalidateStaleStateCacheMemoV2({ engine });
					break;
				}
			}
		});
	}

	if (staleStateCache.has(args.engine.executeSync)) {
		return staleStateCache.get(args.engine.executeSync)!;
	}

	const result = readStaleFlag(args.engine);
	setStaleStateCacheMemoV2({ engine, value: result });
	return result;
}
