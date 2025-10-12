import { test, expect } from "vitest";
import { isStaleStateCacheV2 } from "./is-stale-state-cache.js";
import { clearStateCacheV2 } from "./clear-state-cache.js";
import {
	markStateCacheAsFreshV2,
	markStateCacheAsStaleV2,
} from "./mark-state-cache-as-stale.js";
import { openLix } from "../../lix/open-lix.js";

test("cache v2 is stale after cache clear", async () => {
	const lix = await openLix({});

	// Start with a known fresh flag and warm the cached value
	markStateCacheAsStaleV2({ engine: lix.engine! });
	markStateCacheAsFreshV2({ engine: lix.engine! });
	await Promise.resolve();
	expect(isStaleStateCacheV2({ engine: lix.engine! })).toBe(false);

	// Clearing should flip the flag back to stale and invalidate the memoized result
	clearStateCacheV2({ engine: lix.engine! });
	await Promise.resolve();
	expect(isStaleStateCacheV2({ engine: lix.engine! })).toBe(true);
});

test("cached stale flag invalidates when the key toggles", async () => {
	const lix = await openLix({});

	markStateCacheAsStaleV2({ engine: lix.engine! });
	await Promise.resolve();
	expect(isStaleStateCacheV2({ engine: lix.engine! })).toBe(true);

	markStateCacheAsFreshV2({ engine: lix.engine! });
	await Promise.resolve();
	expect(isStaleStateCacheV2({ engine: lix.engine! })).toBe(false);

	markStateCacheAsStaleV2({ engine: lix.engine! });
	await Promise.resolve();
	expect(isStaleStateCacheV2({ engine: lix.engine! })).toBe(true);
});
