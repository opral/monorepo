import { test, expect } from "vitest";
import { isStaleStateCache } from "./is-stale-state-cache.js";
import { clearStateCache } from "./clear-state-cache.js";
import { openLix } from "../../lix/open-lix.js";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import type { Kysely } from "kysely";

test("cache is stale after cache clear", async () => {
	const lix = await openLix({});
	const internalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Insert some data to ensure cache is populated
	await lix.db
		.insertInto("key_value")
		.values({
			key: "test_key",
			value: "test_value",
		})
		.execute();

	const cache = await internalDb
		.selectFrom("internal_state_cache")
		.selectAll()
		.execute();

	expect(cache.length).toBeGreaterThan(0);

	// Clear the cache
	clearStateCache({
		engine: lix.engine!,
		timestamp: undefined,
	});

	// Cache should be stale after clearing
	const result = isStaleStateCache({
		engine: lix.engine!,
	});

	expect(result).toBe(true);
});
