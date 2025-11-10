import type { LixEngine } from "../boot.js";
import { sql } from "kysely";
import { internalQueryBuilder } from "../internal-query-builder.js";
import { withRuntimeCache } from "../with-runtime-cache.js";

const deterministicBootRefs = new WeakSet<object>();
const stateViewReadyRefs = new WeakMap<object, boolean>();

/**
 * Tracks whether the state view exists for a given runtime. Guard queries run until the
 * view is observed once, after which we skip the sqlite_schema probe.
 *
 * @param engine - Lix engine with a runtime cache reference and executeSync helper.
 */
function isStateViewReady(
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef">
): boolean {
	if (stateViewReadyRefs.get(engine.runtimeCacheRef) === true) {
		return true;
	}

	const ready =
		engine.executeSync({
			sql: "SELECT 1 FROM sqlite_schema WHERE type = 'view' AND name = 'state' LIMIT 1",
			preprocessMode: "none",
		}).rows.length > 0;

	if (ready) {
		stateViewReadyRefs.set(engine.runtimeCacheRef, true);
	}

	return ready;
}

/**
 * Flag a runtime as being within deterministic engine boot.
 *
 * During boot of the Lix engine we seed key values before the
 * `lix_deterministic_mode` row exists. This flag lets helpers (for example the
 * timestamp UDF) behave deterministically during that window instead of relying
 * on the not-yet-written key.
 */
export function setDeterministicBoot(args: {
	runtimeCacheRef: object;
	value: boolean;
}): void {
	if (args.value) {
		deterministicBootRefs.add(args.runtimeCacheRef);
	} else {
		deterministicBootRefs.delete(args.runtimeCacheRef);
	}
}

/**
 * Return whether deterministic boot has been requested for the current runtime.
 *
 * Used by helpers that must preserve deterministic behaviour before the
 * `lix_deterministic_mode` key is present in the database.
 */
export function isDeterministicBootPending(
	engine: Pick<LixEngine, "runtimeCacheRef">
): boolean {
	return deterministicBootRefs.has(engine.runtimeCacheRef);
}

/**
 * Checks if deterministic mode is enabled by querying the key_value table.
 *
 * Returns true if the enabled property in the JSON object is true.
 * Returns false for any other value or if the key doesn't exist.
 *
 * Results are cached via {@link withRuntimeCache} to avoid repeated database queries and
 * automatically invalidate when `lix_deterministic_mode` changes.
 *
 * @param args - Object containing the lix instance with sqlite connection
 * @returns true if deterministic mode is enabled, false otherwise
 */
export function isDeterministicModeSync(args: {
	engine: Pick<LixEngine, "executeSync" | "hooks" | "runtimeCacheRef">;
}): boolean {
	const engine = args.engine;
	if (isDeterministicBootPending(engine)) {
		return true;
	}

	if (!isStateViewReady(engine)) {
		return false;
	}

	const [row] = withRuntimeCache(
		engine,
		internalQueryBuilder
			.selectFrom("state")
			.where("entity_id", "=", "lix_deterministic_mode")
			.where("schema_key", "=", "lix_key_value")
			.where("snapshot_content", "is not", null)
			.select(
				sql`json_extract(snapshot_content, '$.value.enabled')`.as("enabled")
			)
			.limit(1)
			.compile()
	).rows;

	return row?.enabled == true;
}
