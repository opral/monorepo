import type { LixEngine } from "../../engine/boot.js";
import { markStateCacheAsStaleV2 } from "./mark-state-cache-as-stale.js";

/**
 * Clears all state cache tables.
 *
 * This function:
 * 1. Marks the cache as stale to prevent repopulation during delete
 * 2. Finds ALL per-schema physical tables (not just cached ones)
 * 3. Deletes all entries from each table
 *
 * @example
 * clearStateCacheV2({ engine: lix.engine! });
 */
export function clearStateCacheV2(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "executeSync" | "runtimeCacheRef"
	>;
	timestamp?: string;
}): void {
	// Mark the cache as stale first to prevent repopulation during delete
	markStateCacheAsStaleV2({
		engine: args.engine,
		timestamp: args.timestamp,
	});

	// Find ALL physical cache tables in the database (not just cached ones)
	// This ensures we clear tables even if they weren't in our cache
	// Exclude the v2 virtual table itself
	const existingTables = args.engine.sqlite.exec({
		sql: `SELECT name FROM sqlite_schema 
		      WHERE type='table' 
		      AND name LIKE 'lix_internal_state_cache_%' 
		      AND name != 'lix_internal_state_cache'
		      AND name != 'lix_internal_state_cache'`,
		returnValue: "resultRows",
	}) as any[];

	// Delete all entries from each physical table
	if (existingTables) {
		for (const row of existingTables) {
			const tableName = row[0] as string;
			// Skip virtual tables (shouldn't happen with our query, but be safe)
			if (tableName === "lix_internal_state_cache") continue;

			args.engine.sqlite.exec({
				sql: `DELETE FROM ${tableName}`,
				returnValue: "resultRows",
			});
		}
	}
}
