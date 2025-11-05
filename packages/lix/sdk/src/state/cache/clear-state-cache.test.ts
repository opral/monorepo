import { test, expect } from "vitest";
import { clearStateCache } from "./clear-state-cache.js";
import { isStaleStateCache } from "./is-stale-state-cache.js";
import { markStateCacheAsFresh } from "./mark-state-cache-as-stale.js";
import { openLix } from "../../lix/open-lix.js";

test("clearStateCache deletes all cache entries", async () => {
	const lix = await openLix({});
	// Insert some data to populate cache
	await lix.db
		.insertInto("key_value")
		.values({
			key: "test_key",
			value: "test_value",
		})
		.execute();

	const readPhysicalKeyValueCache = () => {
		return lix.engine!.executeSync({
			sql: `SELECT entity_id FROM lix_internal_state_cache_v1_lix_key_value`,
		});
	};

	// Verify cache has entries in the physical schema table
	const cacheBeforeClear = readPhysicalKeyValueCache();
	expect(cacheBeforeClear.rows.length).toBeGreaterThan(0);

	// Ensure the stale flag is false and cached before we clear it
	markStateCacheAsFresh({ engine: lix.engine! });
	expect(isStaleStateCache({ engine: lix.engine! })).toBe(false);

	// Clear the cache
	clearStateCache({ engine: lix.engine! });

	// Verify cache is empty
	const cacheAfterClear = readPhysicalKeyValueCache();
	expect(cacheAfterClear.rows.length).toBe(0);

	// Verify the cache is marked as stale
	const isStale = isStaleStateCache({
		engine: lix.engine!,
	});
	expect(isStale).toBe(true);
});
