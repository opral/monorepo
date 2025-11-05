import { expect, test, vi } from "vitest";
import {
	simulationTest,
	normalSimulation,
	cacheMissSimulation,
} from "./simulation-test.js";
import { getTimestamp } from "../../engine/functions/timestamp.js";
import * as clearCacheModule from "../../state/cache/clear-state-cache.js";

test("cache miss simulation test discovery", () => {});

simulationTest(
	"cache miss simulation clears cache on first select after commit",
	async ({ openSimulatedLix }) => {
		// Spy on clearStateCache (lazy clear)
		const clearSpy = vi.spyOn(clearCacheModule, "clearStateCache");

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
		clearSpy.mockClear();

		// Insert test data
		await lix.db
			.insertInto("key_value")
			.values([{ key: "test_1", value: "value_1" }])
			.execute();

		// First select query (should trigger one clear lazily)
		await lix.db
			.selectFrom("key_value")
			.where("key", "=", "test_1")
			.selectAll()
			.execute();

		// Second select query (no new commit; should not clear again)
		await lix.db.selectFrom("key_value").selectAll().execute();

		expect(clearSpy).toHaveBeenCalledTimes(1);
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

		// Query state_by_version
		const stateAll = await lix.db
			.selectFrom("state_by_version")
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

		// Get initial logical timestamps (1ms increments in deterministic mode)
		const seq1 = Date.parse(await getTimestamp({ lix }));
		const seq2 = Date.parse(await getTimestamp({ lix }));
		const seq3 = Date.parse(await getTimestamp({ lix }));

		// These should be deterministic across simulations
		expectDeterministic(seq1).toBeDefined();
		expectDeterministic(seq2).toBe(seq1 + 1);
		expectDeterministic(seq3).toBe(seq2 + 1);

		// Get timestamps (which use sequence numbers internally)
		const ts1 = await getTimestamp({ lix });
		const ts2 = await getTimestamp({ lix });

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

		// Get sequence number after operations (via timestamp)
		const seqAfter = Date.parse(await getTimestamp({ lix }));

		// This sequence number should be deterministic across simulations
		expectDeterministic(seqAfter).toBeDefined();
		expectDeterministic(seqAfter).toBeGreaterThan(seq3);
	},
	{
		simulations: [normalSimulation, cacheMissSimulation],
	}
);

simulationTest(
	"cache miss simulation clears even on lix_internal_* tables",
	async ({ openSimulatedLix }) => {
		// Spy on the actual clear export so we observe real calls
		const clearModule = await import("../../state/cache/clear-state-cache.js");
		const spy = vi.spyOn(clearModule, "clearStateCache");

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

		// Make a commit so the simulation marks repopulation as needed
		await lix.db
			.insertInto("key_value")
			.values({ key: "internal-check", value: "v" })
			.execute();

		// Internal query SHOULD trigger clear
		await (lix.db as any)
			.selectFrom("lix_internal_state_vtable")
			.selectAll()
			.limit(1)
			.execute();

		expect(spy).toHaveBeenCalledTimes(1);

		// Non-internal query now has no pending clearance flag; should not call again
		await lix.db.selectFrom("key_value").selectAll().execute();
		expect(spy).toHaveBeenCalledTimes(1);
	},
	{ simulations: [cacheMissSimulation] }
);
