import { test, expect } from "vitest";
import { clearStateCacheV2 } from "./clear-state-cache.js";
import { isStaleStateCacheV2 } from "./is-stale-state-cache.js";
import { markStateCacheAsFreshV2 } from "./mark-state-cache-as-stale.js";
import { openLix } from "../../lix/open-lix.js";

test("clearStateCacheV2 deletes all cache entries", async () => {
	const lix = await openLix({});
	// Insert some data to populate cache
	await lix.db
		.insertInto("key_value")
		.values({
			key: "test_key",
			value: "test_value",
		})
		.execute();

	// Verify cache has entries in v2 tables
	const cacheTables = lix.engine!.sqlite.exec({
		sql: `SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'lix_internal_state_cache_v2_%'`,
		returnValue: "resultRows",
	}) as Array<[string]>;

	expect(cacheTables.length).toBeGreaterThan(0);

	for (const [tableName] of cacheTables) {
		const before = lix.engine!.sqlite.exec({
			sql: `SELECT COUNT(*) AS cnt FROM ${tableName}`,
			returnValue: "resultRows",
			rowMode: "object",
		}) as Array<{ cnt: number }>;
		expect(Number(before?.[0]?.cnt ?? 0)).toBeGreaterThan(0);
	}

	// Ensure the stale flag is false and cached before we clear it
	markStateCacheAsFreshV2({ engine: lix.engine! });
	expect(isStaleStateCacheV2({ engine: lix.engine! })).toBe(false);

	// Clear the cache
	clearStateCacheV2({ engine: lix.engine! });

	// Verify cache is empty
	for (const [tableName] of cacheTables) {
		const after = lix.engine!.sqlite.exec({
			sql: `SELECT COUNT(*) AS cnt FROM ${tableName}`,
			returnValue: "resultRows",
			rowMode: "object",
		}) as Array<{ cnt: number }>;
		expect(Number(after?.[0]?.cnt ?? 0)).toBe(0);
	}

	// Verify the cache is marked as stale
	const isStale = isStaleStateCacheV2({
		engine: lix.engine!,
	});
	expect(isStale).toBe(true);
});
