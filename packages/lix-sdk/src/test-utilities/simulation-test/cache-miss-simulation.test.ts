import { test } from "vitest";
import { simulationTest } from "./simulation-test.js";
import { timestamp } from "../../deterministic/timestamp.js";
import { nextDeterministicSequenceNumber } from "../../deterministic/sequence.js";

test("cache miss simulation test discovery", () => {});

// simulationTest(
// 	"cache miss simulation clears cache before every select",
// 	async ({ openSimulatedLix }) => {
// 		const lix = await openSimulatedLix({
// 			keyValues: [
// 				{
// 					key: "lix_deterministic_mode",
// 					value: { enabled: true },
// 					lixcol_version_id: "global",
// 					lixcol_untracked: true,
// 				},
// 				{
// 					key: "lix_log_levels",
// 					value: ["debug"],
// 					lixcol_version_id: "global",
// 					lixcol_untracked: true,
// 				},
// 			],
// 		});

// 		// Insert test data
// 		await lix.db
// 			.insertInto("key_value")
// 			.values([{ key: "test_1", value: "value_1" }])
// 			.execute();

// 		const timeBefore = timestamp({ lix });

// 		await lix.db
// 			.selectFrom("key_value")
// 			.where("key", "=", "test_1")
// 			.selectAll()
// 			.execute();

// 		const cacheMissAfter = await lix.db
// 			.selectFrom("log")
// 			.where("key", "=", "lix_state_cache_miss")
// 			.where("lixcol_created_at", ">", timeBefore)
// 			.selectAll()
// 			.execute();

// 		// greater than one because the entity view key value
// 		// might fire off subqueries that also trigger cache misses
// 		expect(cacheMissAfter.length).toBeGreaterThan(1);
// 	},
// 	{
// 		onlyRun: ["cache-miss"],
// 	}
// );

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

		// Insert data
		await lix.db
			.insertInto("key_value")
			.values([
				{ key: "config_a", value: "a" },
				{ key: "config_b", value: "b" },
				{ key: "config_c", value: "c" },
			])
			.execute();

		const kvs = await lix.db
			.selectFrom("key_value")
			.where("key", "in", ["config_a", "config_b", "config_c"])
			.selectAll()
			.execute();

		expectDeterministic(kvs);

		// Query state_all - this triggers materialization
		const stateAll = await lix.db
			.selectFrom("state_all")
			.where("schema_key", "=", "lix_key_value")
			.orderBy("entity_id")
			.selectAll()
			.execute();

		expectDeterministic(stateAll).toBeDefined();
	},
	{
		onlyRun: ["normal", "cache-miss"],
	}
);

simulationTest(
	"cache miss simulation maintains deterministic sequence equal to normal simulation",
	async ({ openSimulatedLix, expectDeterministic }) => {
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
		console.log("[TEST] Inserting test_key into key_value");
		await lix.db
			.insertInto("key_value")
			.values({ key: "test_key", value: "test_value" })
			.execute();

		// Check if data was actually inserted
		const rawCheck = lix.sqlite.exec({
			sql: "SELECT * FROM internal_resolved_state_all WHERE entity_id = 'test_key' AND schema_key = 'lix_key_value'",
			returnValue: "resultRows",
		});
		console.log(
			"[TEST] Raw check of internal_resolved_state_all:",
			JSON.stringify(rawCheck, null, 2)
		);

		// Check the active version
		const activeVersion = lix.sqlite.exec({
			sql: "SELECT * FROM active_version",
			returnValue: "resultRows",
		});
		console.log(
			"[TEST] Active version:",
			JSON.stringify(activeVersion, null, 2)
		);

		// Check what's in cache before query
		const cacheCheck = lix.sqlite.exec({
			sql: "SELECT * FROM internal_state_cache WHERE entity_id = 'test_key'",
			returnValue: "resultRows",
		});
		console.log(
			"[TEST] Cache before query:",
			JSON.stringify(cacheCheck, null, 2)
		);

		console.log("[TEST] About to query key_value table");
		const result = await lix.db
			.selectFrom("key_value")
			.where("key", "=", "test_key")
			.selectAll()
			.execute();

		console.log("[TEST] Query result:", JSON.stringify(result, null, 2));

		// Check what's in the underlying tables
		const stateAll = await lix.db
			.selectFrom("state_all")
			.where("schema_key", "=", "lix_key_value")
			.selectAll()
			.execute();

		console.log("[TEST] state_all entries:", JSON.stringify(stateAll, null, 2));

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
		onlyRun: ["normal", "cache-miss"],
	}
);
