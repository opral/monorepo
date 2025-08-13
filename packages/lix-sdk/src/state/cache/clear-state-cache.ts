import type { Lix } from "../../lix/open-lix.js";
import { clearStateCacheV2 } from "../cache-v2/clear-state-cache.js";
import { markStateCacheAsStale } from "./mark-state-cache-as-stale.js";

/**
 * Clears the internal state cache.
 *
 * NOTE: This now delegates to the v2 cache implementation for better performance.
 */
export function clearStateCache(args: { lix: Lix }): void {
	markStateCacheAsStale({ lix: args.lix });
	// Delegate to v2 implementation
	clearStateCacheV2(args);
}
