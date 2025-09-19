import { test, expect } from "vitest";
import { isStaleStateCache } from "./is-stale-state-cache.js";
import { clearStateCache } from "./clear-state-cache.js";
import {
	markStateCacheAsFresh,
	markStateCacheAsStale,
} from "./mark-state-cache-as-stale.js";
import { openLix } from "../../lix/open-lix.js";

test("cache is stale after cache clear", async () => {
	const lix = await openLix({});

	// Start with a known fresh flag and warm the cached value
	markStateCacheAsStale({ engine: lix.engine! });
	markStateCacheAsFresh({ engine: lix.engine! });
	await Promise.resolve();
	expect(isStaleStateCache({ engine: lix.engine! })).toBe(false);

	// Clearing should flip the flag back to stale and invalidate the memoized result
	clearStateCache({ engine: lix.engine! });
	await Promise.resolve();
	expect(isStaleStateCache({ engine: lix.engine! })).toBe(true);
});

test("cached stale flag invalidates when the key toggles", async () => {
	const lix = await openLix({});

	markStateCacheAsStale({ engine: lix.engine! });
	await Promise.resolve();
	expect(isStaleStateCache({ engine: lix.engine! })).toBe(true);

	markStateCacheAsFresh({ engine: lix.engine! });
	await Promise.resolve();
	expect(isStaleStateCache({ engine: lix.engine! })).toBe(false);

	markStateCacheAsStale({ engine: lix.engine! });
	await Promise.resolve();
	expect(isStaleStateCache({ engine: lix.engine! })).toBe(true);
});
