import type { LixChangeRaw } from "../../change/schema.js";
import type { Lix } from "../../lix/open-lix.js";
import { updateStateCacheV2 } from "../cache-v2/update-state-cache.js";

/**
 * Updates cache entries with new commit_id for specific entities that were changed.
 * Processes multiple changes in batch for better performance.
 *
 * This function is the centralized entry point for all cache updates to ensure
 * consistency and proper handling of duplicate entries (inherited vs direct).
 * 
 * NOTE: This now delegates to the v2 cache implementation for better performance.
 *
 * @param args - Update parameters
 * @param args.lix - Lix instance with sqlite and db
 * @param args.changes - Array of change objects containing entity information
 * @param args.commit_id - New commit ID to set
 * @param args.version_id - Version ID to update
 */
export function updateStateCache(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	changes: LixChangeRaw[];
	commit_id: string;
	version_id: string;
}): void {
	// Delegate to v2 implementation
	updateStateCacheV2(args);
}
