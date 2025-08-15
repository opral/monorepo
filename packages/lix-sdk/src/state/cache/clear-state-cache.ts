import type { Lix } from "../../lix/open-lix.js";
import { markStateCacheAsStale } from "./mark-state-cache-as-stale.js";

/**
 * Clears all state cache tables.
 *
 * This function:
 * 1. Marks the cache as stale to prevent repopulation during delete
 * 2. Finds ALL per-schema physical tables (not just cached ones)
 * 3. Deletes all entries from each table
 *
 * @example
 * clearStateCache({ lix });
 */
export function clearStateCache(args: {
	lix: Pick<Lix, "sqlite">;
	timestamp?: string;
}): void {
	// Mark the cache as stale first to prevent repopulation during delete
		markStateCacheAsStale({ lix: args.lix as Lix, timestamp: args.timestamp });

	// Find ALL physical cache tables in the database (not just cached ones)
	// This ensures we clear tables even if they weren't in our cache
	// Exclude the v2 virtual table itself
	const existingTables = args.lix.sqlite.exec({
		sql: `SELECT name FROM sqlite_schema 
		      WHERE type='table' 
		      AND name LIKE 'internal_state_cache_%' 
		      AND name != 'internal_state_cache'
		      AND name != 'internal_state_cache'`,
		returnValue: "resultRows",
	}) as any[];

	// Delete all entries from each physical table
	if (existingTables) {
		for (const row of existingTables) {
			const tableName = row[0] as string;
			// Skip virtual tables (shouldn't happen with our query, but be safe)
			if (tableName === "internal_state_cache") continue;

			args.lix.sqlite.exec({
				sql: `DELETE FROM ${tableName}`,
				returnValue: "resultRows",
			});
		}
	}
}
