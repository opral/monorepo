import { expect, test, vi } from "vitest";
import {
	simulationTest,
	normalSimulation,
	cacheMissSimulation,
} from "./simulation-test.js";
import { getTimestampSync } from "../../runtime/deterministic/timestamp.js";
import { nextSequenceNumberSync } from "../../runtime/deterministic/sequence.js";
import * as clearCacheModule from "../../state/cache/clear-state-cache.js";

test("cache miss simulation test discovery", () => {});

simulationTest(
	"cache miss simulation clears cache before every select",
	async ({ openSimulatedLix }) => {
		// Spy on clearStateCache
		const clearStateCacheSpy = vi.spyOn(clearCacheModule, "clearStateCache");

		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
					lixcol_untracked: true,
				},
			],
		});

		// Reset the spy counter after initialization
		clearStateCacheSpy.mockClear();

		// Insert test data
		await lix.db
			.insertInto("key_value")
			.values([{ key: "test_1", value: "value_1" }])
			.execute();

		// First select query
		await lix.db
			.selectFrom("key_value")
			.where("key", "=", "test_1")
			.selectAll()
			.execute();

		// Second select query
		await lix.db.selectFrom("key_value").selectAll().execute();

		expect(clearStateCacheSpy).toHaveBeenCalledTimes(2);
	},
	{
		simulations: [cacheMissSimulation],
	}
);
simulationTest(
	"cache miss simulation produces correct query results",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
					lixcol_untracked: true,
				},
			],
		});

		// Insert data - this creates changes and change sets
		await lix.db
			.insertInto("key_value")
			.values([
				{ key: "config_a", value: "a" },
				{ key: "config_b", value: "b" },
				{ key: "config_c", value: "c" },
			])
			.execute();

		// Query state_all
		const stateAll = await lix.db
			.selectFrom("state_all")
			.where("schema_key", "=", "lix_key_value")
			.where("entity_id", "!=", "lix_state_cache_stale")
			.orderBy("entity_id")
			.selectAll()
			.execute();

		const allChanges = await lix.db.selectFrom("change").selectAll().execute();

		// expect that the state and all changes are identical
		expectDeterministic(stateAll).toBeDefined();
		expectDeterministic(allChanges).toBeDefined();
	},
	{
		simulations: [normalSimulation, cacheMissSimulation],
	}
);

simulationTest(
	"cache miss simulation maintains deterministic sequence equal to normal simulation",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
					lixcol_untracked: true,
				},
			],
		});

		// Get initial sequence numbers
		const seq1 = nextSequenceNumberSync({ lix });
		const seq2 = nextSequenceNumberSync({ lix });
		const seq3 = nextSequenceNumberSync({ lix });

		// These should be deterministic across simulations
		expectDeterministic(seq1).toBeDefined();
		expectDeterministic(seq2).toBe(seq1 + 1);
		expectDeterministic(seq3).toBe(seq2 + 1);

		// Get timestamps (which use sequence numbers internally)
		const ts1 = getTimestampSync({ lix });
		const ts2 = getTimestampSync({ lix });

		// Timestamps should also be deterministic
		expectDeterministic(ts1).toBeDefined();
		expectDeterministic(ts2).toBeDefined();

		// Perform a query that would trigger cache operations
		await lix.db
			.insertInto("key_value")
			.values({ key: "test_key", value: "test_value" })
			.execute();

		const result = await lix.db
			.selectFrom("key_value")
			.where("key", "=", "test_key")
			.selectAll()
			.execute();

		// The query result should be deterministic
		expectDeterministic(result).toHaveLength(1);
		expectDeterministic(result[0]?.value).toBe("test_value");

		// Get sequence number after operations
		const seqAfter = nextSequenceNumberSync({ lix });

		// This sequence number should be deterministic across simulations
		expectDeterministic(seqAfter).toBeDefined();
		expectDeterministic(seqAfter).toBeGreaterThan(seq3);
	},
	{
		simulations: [normalSimulation, cacheMissSimulation],
	}
);

// We must not clear the cache for internal_* tables.
// Internal views/tables (e.g., internal_resolved_state_all, internal_materialization_*)
// are used by the commit/materializer paths. Clearing the cache before those
// reads can cause stale/missing reads or recursion. This test verifies that
// cache-miss simulation does NOT intercept internal_* queries.
simulationTest(
	"cache miss simulation does not clear cache for internal_* tables",
	async ({ openSimulatedLix }) => {
		// Spy on the actual module export so we observe real calls
		const clearCacheModule = await import(
			"../../state/cache/clear-state-cache.js"
		);
		const spy = vi.spyOn(clearCacheModule, "clearStateCache");

		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
					lixcol_untracked: true,
				},
			],
		});

		spy.mockClear();

		// Internal query should NOT trigger cache clear
		await (lix.db as any)
			.selectFrom("internal_resolved_state_all")
			.selectAll()
			.limit(1)
			.execute();

		expect(spy).toHaveBeenCalledTimes(0);

		// Non-internal query SHOULD trigger cache clear at least once
		await lix.db.selectFrom("key_value").selectAll().execute();
		expect(spy).toHaveBeenCalledTimes(1);
	},
	{ simulations: [cacheMissSimulation] }
);
