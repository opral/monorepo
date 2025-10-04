import { bench } from "vitest";
import { openLix } from "../lix/open-lix.js";

const NUM_ROWS = 100;

bench("select entities from single version", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("state_all")
		.values(
			Array.from({ length: NUM_ROWS }, (_, i) => ({
				entity_id: `entity_${i}`,
				version_id: "global",
				snapshot_content: {
					id: `entity_${i}`,
					value: `test_data_${i}`,
					metadata: { index: i, type: "benchmark" },
				},
				schema_key: "benchmark_entity",
				file_id: `mock_file`,
				plugin_key: "benchmark_plugin",
				schema_version: "1.0",
			}))
		)
		.execute();

	// Benchmark: Select all entities from this version
	await lix.db
		.selectFrom("state_all")
		.where("version_id", "=", "global")
		.selectAll()
		.execute();
});

bench.todo("select single entity by entity_id");

bench.todo("select entities by schema_key filter");

bench.todo("select entities by file_id filter");

bench.todo("select entities with multiple filters (entity_id + schema_key)");

bench("insert single state record", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: `mutation_entity`,
			version_id: "global",
			snapshot_content: {
				id: `mutation_entity`,
				value: `test_data`,
				metadata: { type: "mutation_benchmark" },
			},
			schema_key: "mutation_benchmark_entity",
			file_id: `mutation_file`,
			plugin_key: "benchmark_plugin",
			schema_version: "1.0",
		})
		.execute();
});

bench.todo("insert batch of 100 state records");

bench.todo("update existing state record");

bench.todo("delete single state record");

bench.todo("mixed mutations (insert + update + delete)");

bench.todo("cache miss performance - full table scan");

bench.todo("cache hit performance - filtered query");
