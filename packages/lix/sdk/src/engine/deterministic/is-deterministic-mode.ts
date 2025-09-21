import type { LixEngine } from "../boot.js";
import { executeSync } from "../../database/execute-sync.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import type { SqliteWasmDatabase } from "../../database/sqlite/index.js";

const deterministicModeCache = new WeakMap<SqliteWasmDatabase, boolean>();

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
	engine: Pick<LixEngine, "sqlite" | "db" | "hooks">;
}): boolean {
	const engine = args.engine;
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
					deterministicModeCache.delete(engine.sqlite);
					break;
				}
			}
		});
	}

	// Check cache first
	if (deterministicModeCache.has(engine.sqlite)) {
		return deterministicModeCache.get(engine.sqlite)!;
	}

	// TODO account for active version
	// Need to query from underlying state to avoid recursion
	const [row] = executeSync({
		engine: engine,
		query: (engine.db as unknown as Kysely<LixInternalDatabaseSchema>)
			.selectFrom("internal_resolved_state_all")
			.where("entity_id", "=", "lix_deterministic_mode")
			.where("schema_key", "=", "lix_key_value")
			.where("snapshot_content", "is not", null)
			.select(
				sql`json_extract(snapshot_content, '$.value.enabled')`.as("enabled")
			),
	});

	const result = row?.enabled == true;

	// Cache the result
	deterministicModeCache.set(engine.sqlite, result);

	return result;
}
