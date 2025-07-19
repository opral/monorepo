import type { Lix } from "../../lix/open-lix.js";
import { markStateCacheAsStale } from "./mark-state-cache-as-stale.js";

/**
 * Clears the internal state cache.
 */
export function clearStateCache(args: { lix: Lix }): void {
	// Mark the cache as stale first to prevent repopulation during delete
	markStateCacheAsStale({ lix: args.lix });

	// Delete all entries from the cache
	args.lix.sqlite.exec({
		sql: `DELETE FROM internal_state_cache`,
		returnValue: "resultRows",
	});
}
