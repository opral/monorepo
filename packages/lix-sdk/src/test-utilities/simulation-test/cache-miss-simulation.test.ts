import { test, expect } from "vitest";
import { simulationTest } from "./simulation-test.js";
import { openLix } from "../../lix/open-lix.js";
import type { Kysely } from "kysely";
import { sql } from "kysely";
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
					// lixcol_version_id: "global",
				},
			],
		});

		const logLevels = await lix.db
			.selectFrom("key_value")
			.where("key", "=", "lix_log_levels")
			.selectAll()
			.execute();

		console.log("Log levels:", logLevels);
		
		// Also check key_value_all to see if it's in global
		const logLevelsAll = await lix.db
			.selectFrom("key_value_all")
			.where("key", "=", "lix_log_levels")
			.selectAll()
			.execute();
		console.log("Log levels in key_value_all:", logLevelsAll);

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

		console.log("About to execute SELECT query on key_value");

		// Debug: Check if lix_log_levels exists in changes
		const logLevelsInChanges = await (
			lix.db as unknown as Kysely<LixInternalDatabaseSchema>
		)
			.selectFrom("change")
			.where("entity_id", "=", "lix_log_levels")
			.where("schema_key", "=", "lix_key_value")
			.selectAll()
			.execute();

		console.log("lix_log_levels in changes:", logLevelsInChanges.length);
		if (logLevelsInChanges.length > 0) {
			console.log("First change:", logLevelsInChanges[0]);
			
			// Check if this change is in any change set
			const changeSetElements = await (
				lix.db as unknown as Kysely<LixInternalDatabaseSchema>
			)
				.selectFrom("change_set_element")
				.where("change_id", "=", logLevelsInChanges[0]!.id)
				.selectAll()
				.execute();
			
			console.log("Change set elements for log levels:", changeSetElements);
		} else {
			console.log("[TRACE] No changes found for lix_log_levels!");
			
			// Let's check if it exists in state_all
			const stateAllLogLevels = await lix.db
				.selectFrom("state_all")
				.where("entity_id", "=", "lix_log_levels")
				.where("schema_key", "=", "lix_key_value")
				.selectAll()
				.execute();
			console.log("[TRACE] lix_log_levels in state_all:", stateAllLogLevels);
			
			// Check internal_state_all_untracked
			const untrackedLogLevels = await (
				lix.db as unknown as Kysely<LixInternalDatabaseSchema>
			)
				.selectFrom("internal_state_all_untracked")
				.where("entity_id", "=", "lix_log_levels")
				.selectAll()
				.execute();
			console.log("[TRACE] lix_log_levels in internal_state_all_untracked:", untrackedLogLevels);
		}

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

		const logLevelsAfter = await lix.db
			.selectFrom("key_value")
			.where("key", "=", "lix_log_levels")
			.selectAll()
			.execute();

		console.log("Log levels after query:", logLevelsAfter);
		
		// Check total cache size
		const totalCacheSize = await (
			lix.db as unknown as Kysely<LixInternalDatabaseSchema>
		)
			.selectFrom("internal_state_cache")
			.select(eb => eb.fn.countAll().as("count"))
			.executeTakeFirst();
		
		console.log("Total cache size after query:", totalCacheSize?.count);

		// Check what's in the cache after repopulation
		const cacheAfterQuery = await (
			lix.db as unknown as Kysely<LixInternalDatabaseSchema>
		)
			.selectFrom("internal_state_cache")
			.where("schema_key", "=", "lix_key_value")
			.where(
				sql`json_extract(snapshot_content, '$.key')`,
				"=",
				"lix_log_levels"
			)
			.selectAll()
			.execute();

		console.log("Cache after query (lix_log_levels):", cacheAfterQuery);

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
