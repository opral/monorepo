import { test, expect } from "vitest";
import { simulationTest } from "./simulation-test.js";
import { openLix } from "../../lix/open-lix.js";
import { timestamp } from "../../deterministic/timestamp.js";
import { type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";

test("cache miss simulation test discovery", () => {});

// TODO it materializes the version twice
// simulationTest(
// 	"cache miss simulation clears cache before every select",
// 	async ({ openSimulatedLix }) => {
// 		const lix = await openSimulatedLix({
// 			keyValues: [
// 				{
// 					key: "lix_log_levels",
// 					value: ["*"],
// 					lixcol_version_id: "global",
// 				},
// 			],
// 		});

// 		// Insert test data
// 		await lix.db
// 			.insertInto("key_value")
// 			.values([{ key: "test_1", value: "value_1" }])
// 			.execute();

// 		const timestampBefore = timestamp({ lix });

// 		console.log("------\n Running select query \n------");

// 		await lix.db
// 			.selectFrom("key_value")
// 			.where("key", "=", "test_1")
// 			.selectAll()
// 			.execute();

// 		const timestampAfter = timestamp({ lix });

// 		console.log("------\n Query complete \n");

// 		const cacheMissAfter = await lix.db
// 			.selectFrom("log_all")
// 			.where("key", "=", "lix_state_cache_miss")
// 			.where("lixcol_created_at", ">", timestampBefore)
// 			.where("lixcol_created_at", "<", timestampAfter)
// 			.orderBy("lixcol_created_at", "asc")
// 			.selectAll()
// 			.execute();

// 		console.log(cacheMissAfter);

// 		// Check for duplicate versions in cache
// 		const versionsInCache = await (
// 			lix.db as unknown as Kysely<LixInternalDatabaseSchema>
// 		)
// 			.selectFrom("internal_state_cache")
// 			// .where("schema_key", "=", "lix_version")
// 			.select(["entity_id", "version_id", "snapshot_content"])
// 			.execute();

// 		console.log("Versions in cache:", versionsInCache);

// 		// Debug materialization
// 		const leafSnapshots = lix.sqlite.exec({
// 			sql: `SELECT * FROM internal_materialization_leaf_snapshots 
// 			      WHERE entity_id = 'global' AND schema_key = 'lix_version'`,
// 			returnValue: "resultRows",
// 			columnNames: [
// 				"entity_id",
// 				"schema_key",
// 				"file_id",
// 				"plugin_key",
// 				"snapshot_content",
// 				"schema_version",
// 				"version_id",
// 				"created_at",
// 				"change_id",
// 				"change_set_id",
// 			],
// 		});

// 		console.log("Leaf snapshots for global version:", leafSnapshots);

// 		const changeSetElements = lix.sqlite.exec({
// 			sql: `SELECT * FROM internal_materialization_cse 
// 			      WHERE target_entity_id = 'global' AND target_schema_key = 'lix_version'`,
// 			returnValue: "resultRows",
// 			columnNames: [
// 				"target_entity_id",
// 				"target_file_id",
// 				"target_schema_key",
// 				"target_change_id",
// 				"cse_origin_change_set_id",
// 				"version_id",
// 			],
// 		});

// 		console.log("Change set elements for global version:", changeSetElements);

// 		const lineage = lix.sqlite.exec({
// 			sql: `SELECT * FROM internal_materialization_lineage WHERE version_id = 'global'`,
// 			returnValue: "resultRows",
// 			columnNames: ["id", "version_id"],
// 		});

// 		console.log("Lineage for global version:", lineage);

// 		const roots = lix.sqlite.exec({
// 			sql: `SELECT * FROM internal_materialization_version_roots`,
// 			returnValue: "resultRows",
// 			columnNames: ["tip_change_set_id", "version_id"],
// 		});

// 		console.log("Version roots:", roots);

// 		const allChanges = lix.sqlite.exec({
// 			sql: `SELECT * FROM internal_materialization_all_changes 
// 			      WHERE entity_id = 'global' AND schema_key = 'lix_version'`,
// 			returnValue: "resultRows",
// 			columnNames: [
// 				"id",
// 				"entity_id",
// 				"schema_key",
// 				"file_id",
// 				"plugin_key",
// 				"schema_version",
// 				"created_at",
// 				"snapshot_content",
// 			],
// 		});

// 		console.log("All changes for global version:", allChanges);

// 		const versions = await lix.db.selectFrom("version").selectAll().execute();

// 		console.log("Versions in database:", versions);

// 		// Check final materialized state
// 		const finalState = lix.sqlite.exec({
// 			sql: `WITH prioritized_entities AS (
// 				SELECT *,
// 					ROW_NUMBER() OVER (
// 						PARTITION BY entity_id, schema_key, file_id, visible_in_version
// 						ORDER BY CASE WHEN inherited_from_version_id IS NULL THEN 1 ELSE 2 END,
// 								(
// 									SELECT depth
// 									FROM internal_materialization_cs_depth
// 									WHERE internal_materialization_cs_depth.id = change_set_id
// 									  AND internal_materialization_cs_depth.version_id = visible_in_version
// 								) DESC,
// 								change_id DESC
// 					) AS rn
// 				FROM internal_materialization_all_entities
// 				WHERE snapshot_content IS NOT NULL
// 			)
// 			SELECT entity_id, version_id, visible_in_version, change_id, change_set_id, rn
// 			FROM prioritized_entities
// 			WHERE entity_id = 'global' AND schema_key = 'lix_version'`,
// 			returnValue: "resultRows",
// 			columnNames: [
// 				"entity_id",
// 				"version_id",
// 				"visible_in_version",
// 				"change_id",
// 				"change_set_id",
// 				"rn",
// 			],
// 		});

// 		console.log("Final prioritized state:", finalState);

// 		// We should have at least 1 cache miss from our select query
// 		expect(cacheMissAfter.length).toBeGreaterThanOrEqual(1);
// 	},
// 	{
// 		onlyRun: ["normal", "cache-miss"],
// 	}
// );

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
