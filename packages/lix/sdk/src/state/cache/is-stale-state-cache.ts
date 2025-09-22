import { sql, type Kysely } from "kysely";
import { executeSync } from "../../database/execute-sync.js";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import type { LixEngine } from "../../engine/boot.js";
import type { SqliteWasmDatabase } from "../../database/sqlite-wasm/index.js";

const CACHE_STALE_KEY = "lix_state_cache_stale";
const CACHE_SCHEMA_KEY = "lix_key_value";

const staleStateCache = new WeakMap<SqliteWasmDatabase, boolean>();
const hookListeners = new WeakSet<object>();

/**
 * Memoize the stale flag for a given SQLite connection.
 */
export function setStaleStateCacheMemo(args: {
	engine: Pick<LixEngine, "sqlite">;
	value: boolean;
}): void {
	const sqlite = args.engine.sqlite as SqliteWasmDatabase;
	staleStateCache.set(sqlite, args.value);
}

/**
 * Remove the cached stale flag so the next read re-queries SQLite.
 */
export function invalidateStaleStateCacheMemo(args: {
	engine: Pick<LixEngine, "sqlite">;
}): void {
	const sqlite = args.engine.sqlite as SqliteWasmDatabase;
	staleStateCache.delete(sqlite);
}

function readStaleFlag(engine: Pick<LixEngine, "sqlite" | "db">): boolean {
	const res = executeSync({
		engine,
		query: (engine.db as unknown as Kysely<LixInternalDatabaseSchema>)
			.selectFrom("internal_resolved_state_all")
			.where("entity_id", "=", CACHE_STALE_KEY)
			.where("schema_key", "=", CACHE_SCHEMA_KEY)
			.where("version_id", "=", "global")
			.where("snapshot_content", "is not", null)
			.select(sql`json_extract(snapshot_content, '$.value')`.as("value")),
	});

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
 * const stale = isStaleStateCache({ engine: lix.engine! });
 */
export function isStaleStateCache(args: {
	engine: Pick<LixEngine, "sqlite" | "db" | "hooks">;
}): boolean {
	const { engine } = args;
	const sqlite = engine.sqlite as SqliteWasmDatabase;

	const hooks = engine.hooks as unknown as object | undefined;
	if (hooks && !hookListeners.has(hooks) && engine.hooks) {
		hookListeners.add(hooks);
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

	if (staleStateCache.has(sqlite)) {
		return staleStateCache.get(sqlite)!;
	}

	const result = readStaleFlag(engine);
	setStaleStateCacheMemo({ engine, value: result });
	return result;
}
