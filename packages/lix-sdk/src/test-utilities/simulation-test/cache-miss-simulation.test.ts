import { test, expect } from "vitest";
import { simulationTest } from "./simulation-test.js";
import { openLix } from "../../lix/open-lix.js";
import type { Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";

test("cache miss simulation test discovery", () => {});

simulationTest(
	"cache miss simulation clears cache before every select",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_log_levels",
					value: ["*"],
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

		const cacheAfterInsert = await (
			lix.db as unknown as Kysely<LixInternalDatabaseSchema>
		)
			.selectFrom("internal_state_cache")
			.selectAll()
			.execute();

		expect(cacheAfterInsert).toHaveLength(0);

		const cacheMissLogsBefore = await lix.db
			.selectFrom("log")
			.where("key", "=", "lix_state_cache_miss")
			.selectAll()
			.execute();

		expect(cacheMissLogsBefore).toHaveLength(0);

		console.log("About to execute SELECT query on key_value");
		await lix.db
			.selectFrom("key_value")
			.where("key", "=", "test_1")
			.selectAll()
			.execute();
		console.log("SELECT query completed");

		const cacheMissAfter = await lix.db
			.selectFrom("log")
			.where("key", "=", "lix_state_cache_miss")
			.selectAll()
			.execute();

		expect(cacheMissAfter).toHaveLength(1);
	},
	{
		onlyRun: ["cache-miss"],
	}
);

simulationTest(
	"cache miss simulation produces correct query results",
	async ({ initialLix }) => {
		const lix = await openLix({ blob: initialLix });

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
