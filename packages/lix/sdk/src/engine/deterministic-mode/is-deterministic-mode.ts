import type { LixEngine } from "../boot.js";
import { sql } from "kysely";
import { internalQueryBuilder } from "../internal-query-builder.js";
import { withRuntimeCache } from "../with-runtime-cache.js";

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

	// TODO account for active version
	// Need to query from underlying state to avoid recursion
	const [row] = withRuntimeCache(
		engine,
		internalQueryBuilder
			.selectFrom("internal_state_reader")
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
