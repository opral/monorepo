import { test, expect } from "vitest";
import { clearStateCache } from "./clear-state-cache.js";
import { isStaleStateCache } from "./is-stale-state-cache.js";
import { markStateCacheAsFresh } from "./mark-state-cache-as-stale.js";
import { openLix } from "../../lix/open-lix.js";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import type { Kysely } from "kysely";

test("clearStateCache deletes all cache entries", async () => {
	const lix = await openLix({});
	const internalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Insert some data to populate cache
	await lix.db
		.insertInto("key_value")
		.values({
			key: "test_key",
			value: "test_value",
		})
		.execute();

	// Verify cache has entries
	const cacheBeforeClear = await internalDb
		.selectFrom("internal_state_cache")
		.selectAll()
		.execute();

	expect(cacheBeforeClear.length).toBeGreaterThan(0);

	// Ensure the stale flag is false and cached before we clear it
	markStateCacheAsFresh({ engine: lix.engine! });
	expect(isStaleStateCache({ engine: lix.engine! })).toBe(false);

	// Clear the cache
	clearStateCache({ engine: lix.engine! });

	// Verify cache is empty
	const cacheAfterClear = await internalDb
		.selectFrom("internal_state_cache")
		.selectAll()
		.execute();

	expect(cacheAfterClear.length).toBe(0);

	// Verify the cache is marked as stale
	const isStale = isStaleStateCache({
		engine: lix.engine!,
	});
	expect(isStale).toBe(true);
});
