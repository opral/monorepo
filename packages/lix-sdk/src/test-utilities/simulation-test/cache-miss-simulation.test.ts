import { expect, test } from "vitest";
import { simulationTest, normalSimulation, cacheMissSimulation } from "./simulation-test.js";
import { timestamp } from "../../deterministic/timestamp.js";
import { nextDeterministicSequenceNumber } from "../../deterministic/sequence.js";
test("cache miss simulation test discovery", () => {});

simulationTest(
	"cache miss simulation clears cache before every select",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
					lixcol_untracked: true,
				},
				{
					key: "lix_log_levels",
					value: ["debug"],
					lixcol_version_id: "global",
					lixcol_untracked: true,
				},
			],
		});

		// Insert test data
		await lix.db
			.insertInto("key_value")
			.values([{ key: "test_1", value: "value_1" }])
			.execute();

		const timeBefore = timestamp({ lix });

		await lix.db
			.selectFrom("key_value")
			.where("key", "=", "test_1")
			.selectAll()
			.execute();

		const cacheMissAfter = await lix.db
			.selectFrom("log")
			.where("key", "=", "lix_state_cache_miss")
			.where("lixcol_created_at", ">", timeBefore)
			.selectAll()
			.execute();

		// greater than one because the entity view key value
		// might fire off subqueries that also trigger cache misses
		expect(cacheMissAfter.length).toBeGreaterThan(1);
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
		const seq1 = nextDeterministicSequenceNumber({ lix });
		const seq2 = nextDeterministicSequenceNumber({ lix });
		const seq3 = nextDeterministicSequenceNumber({ lix });

		// These should be deterministic across simulations
		expectDeterministic(seq1).toBeDefined();
		expectDeterministic(seq2).toBe(seq1 + 1);
		expectDeterministic(seq3).toBe(seq2 + 1);

		// Get timestamps (which use sequence numbers internally)
		const ts1 = timestamp({ lix });
		const ts2 = timestamp({ lix });

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
		const seqAfter = nextDeterministicSequenceNumber({ lix });

		// This sequence number should be deterministic across simulations
		expectDeterministic(seqAfter).toBeDefined();
		expectDeterministic(seqAfter).toBeGreaterThan(seq3);
	},
	{
		simulations: [normalSimulation, cacheMissSimulation],
	}
);
