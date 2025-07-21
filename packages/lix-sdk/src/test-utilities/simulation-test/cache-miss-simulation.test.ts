import { test, expect } from "vitest";
import { simulationTest } from "./simulation-test.js";
import { timestamp } from "../../deterministic/timestamp.js";

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
		onlyRun: ["cache-miss"],
	}
);

simulationTest(
	"cache miss simulation produces correct query results",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({});

		// Insert data
		await lix.db
			.insertInto("key_value")
			.values([
				{ key: "config_a", value: "a" },
				{ key: "config_b", value: "b" },
				{ key: "config_c", value: "c" },
			])
			.execute();

		// Query state_all - this triggers materialization
		const stateAll = await lix.db
			.selectFrom("state_all")
			.where("schema_key", "=", "lix_key_value")
			.orderBy("entity_id")
			.selectAll()
			.execute();

		// Verify results are correct even with cache clearing
		expect(
			stateAll.filter((s) => s.entity_id.startsWith("config_")).length
		).toBe(3);

		const configA = stateAll.find((s) => s.entity_id === "config_a");
		expect(configA).toBeDefined();
		expect(configA?.snapshot_content?.key).toBe("config_a");
		expect(configA?.snapshot_content?.value).toBe('"a"'); // JSON encoded
	},
	{
		onlyRun: ["cache-miss"], // Only run with cache miss simulation
	}
);
