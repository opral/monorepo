import type { LixEngine } from "../boot.js";
import { sql } from "kysely";
import { internalQueryBuilder } from "../internal-query-builder.js";

const deterministicModeCache = new WeakMap<object, boolean>();

// Track which hooks instances have a listener registered
// Using hooks object identity is stable, unlike ad-hoc { sqlite, db, hooks } wrappers
const hookListenersRegistered = new WeakSet<object>();

/**
 * Checks if deterministic mode is enabled by querying the key_value table.
 *
 * Returns true if the enabled property in the JSON object is true.
 * Returns false for any other value or if the key doesn't exist.
 *
 * Results are cached per lix instance to avoid repeated database queries.
 * Cache is automatically invalidated when lix_deterministic_mode changes.
 *
 * @param args - Object containing the lix instance with sqlite connection
 * @returns true if deterministic mode is enabled, false otherwise
 */
export function isDeterministicModeSync(args: {
	engine: Pick<LixEngine, "executeQuerySync" | "hooks" | "runtimeCacheRef">;
}): boolean {
	const engine = args.engine;
	const cacheRef = engine.runtimeCacheRef;
	// Register hook listener for cache invalidation (only once per hooks instance)
	const key = engine.hooks as unknown as object;
	if (!hookListenersRegistered.has(key) && engine.hooks) {
		hookListenersRegistered.add(key);

		engine.hooks.onStateCommit(({ changes }) => {
			// Check if any change affects lix_deterministic_mode
			for (const change of changes) {
				if (
					change.entity_id === "lix_deterministic_mode" &&
					change.schema_key === "lix_key_value"
				) {
					// Invalidate cache when deterministic mode changes
					deterministicModeCache.delete(cacheRef);
					break;
				}
			}
		});
	}

	// Check cache first
	if (deterministicModeCache.has(cacheRef)) {
		return deterministicModeCache.get(cacheRef)!;
	}

	// TODO account for active version
	// Need to query from underlying state to avoid recursion
	const [row] = engine.executeQuerySync(
		internalQueryBuilder
			.selectFrom("internal_state_reader")
			.where("entity_id", "=", "lix_deterministic_mode")
			.where("schema_key", "=", "lix_key_value")
			.where("snapshot_content", "is not", null)
			.select(
				sql`json_extract(snapshot_content, '$.value.enabled')`.as("enabled")
			)
			.compile()
	).rows;

	const result = row?.enabled == true;

	// Cache the result
	deterministicModeCache.set(cacheRef, result);

	return result;
}
