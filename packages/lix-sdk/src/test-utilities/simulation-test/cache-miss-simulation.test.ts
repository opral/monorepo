import { test, expect } from "vitest";
import { simulationTest } from "./simulation-test.js";
import { openLix } from "../../lix/open-lix.js";

test("cache miss simulation test discovery", () => {});

simulationTest(
	"cache miss simulation clears cache before every select",
	async ({ initialLix }) => {
		const lix = await openLix({ blob: initialLix });

		// Insert test data
		await lix.db
			.insertInto("key_value")
			.values([
				{ key: "test_1", value: "value_1" },
				{ key: "test_2", value: "value_2" },
				{ key: "test_3", value: "value_3" },
			])
			.execute();

		// Cache should have data from the inserts
		const cacheResult = lix.sqlite.exec({
			sql: "SELECT COUNT(*) as count FROM internal_state_cache",
			returnValue: "resultRows",
		})[0] as any;
		const cacheCountBeforeSelect = cacheResult[0];
		expect(cacheCountBeforeSelect).toBeGreaterThan(0);

		// Perform selects
		await lix.db
			.selectFrom("key_value")
			.where("key", "=", "test_1")
			.selectAll()
			.executeTakeFirst();

		await lix.db
			.selectFrom("key_value")
			.where("key", "=", "test_2")
			.selectAll()
			.executeTakeFirst();

		// After selects, cache should have been cleared and rebuilt
		const cacheResultAfter = lix.sqlite.exec({
			sql: "SELECT COUNT(*) as count FROM internal_state_cache",
			returnValue: "resultRows",
		})[0] as any;
		const cacheCountAfterSelect = cacheResultAfter[0];

		// Cache shouldn't grow indefinitely - it's cleared before each select
		expect(cacheCountAfterSelect).toBeLessThanOrEqual(
			cacheCountBeforeSelect + 10
		);
	},
	{
		simulations: ["cache-miss"], // Only run with cache miss simulation
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
		simulations: ["cache-miss"], // Only run with cache miss simulation
	}
);
