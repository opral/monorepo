import type { Lix } from "../../lix/open-lix.js";
import { markStateCacheAsStale } from "../cache/mark-state-cache-as-stale.js";
import { getStateCacheV2Tables } from "./schema.js";

/**
 * Clears all v2 state cache tables.
 * 
 * This function:
 * 1. Marks the cache as stale to prevent repopulation during delete
 * 2. Finds ALL per-schema physical tables (not just cached ones)
 * 3. Deletes all entries from each table
 * 
 * @example
 * clearStateCacheV2({ lix });
 */
export function clearStateCacheV2(args: { lix: Pick<Lix, "sqlite"> }): void {
	// Mark the cache as stale first to prevent repopulation during delete
	markStateCacheAsStale({ lix: args.lix as Lix });

	// Find ALL physical cache tables in the database (not just cached ones)
	// This ensures we clear tables even if they weren't in our cache
	// Exclude the v2 virtual table itself
	const existingTables = args.lix.sqlite.exec({
		sql: `SELECT name FROM sqlite_schema 
		      WHERE type='table' 
		      AND name LIKE 'internal_state_cache_%' 
		      AND name != 'internal_state_cache'
		      AND name != 'internal_state_cache_v2'`,
		returnValue: "resultRows",
	}) as any[];
	
	// Delete all entries from each physical table
	if (existingTables) {
		for (const row of existingTables) {
			const tableName = row[0] as string;
			// Skip virtual tables (shouldn't happen with our query, but be safe)
			if (tableName === 'internal_state_cache_v2') continue;
			
			args.lix.sqlite.exec({
				sql: `DELETE FROM ${tableName}`,
				returnValue: "resultRows",
			});
		}
	}
	
	// Also clear the v1 cache table if it exists (for compatibility during migration)
	args.lix.sqlite.exec({
		sql: `DELETE FROM internal_state_cache WHERE 1=1`,
		returnValue: "resultRows",
	});
}