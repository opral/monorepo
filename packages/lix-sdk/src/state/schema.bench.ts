import { bench } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "../version/create-version.js";

bench(
	"select entities from single version",
	async () => {
		const lix = await openLix({});

		await lix.db
			.insertInto("state_all")
			.values(
				Array.from({ length: 100 }, (_, i) => ({
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
	},
	{ iterations: 1, warmupIterations: 0 }
);

bench(
	"select all entities from single version - bypass vtable",
	async () => {
		const lix = await openLix({});

		// Create a version with test data
		const version = await createVersion({
			lix,
			id: "bench_version_2",
			name: "Benchmark Version 2",
		});

		await lix.db
			.insertInto("state_all")
			.values(
				Array.from({ length: 10 }, (_, i) => ({
					entity_id: `entity_${i}`,
					version_id: version.id,
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

		// First run EXPLAIN QUERY PLAN to understand how SQLite executes this query
		const explainResult = lix.sqlite.exec({
			sql: `EXPLAIN QUERY PLAN SELECT * FROM internal_resolved_state_all WHERE version_id = ?`,
			bind: [version.id],
			returnValue: "resultRows",
		});

		console.log("EXPLAIN QUERY PLAN for internal_resolved_state_all:");
		if (explainResult) {
			explainResult.forEach((row: any) => {
				console.log(`  ${row[0]} | ${row[1]} | ${row[2]} | ${row[3]}`);
			});
		}

		// Benchmark: Select directly from internal_resolved_state_all (bypasses vtable)
		const start = Date.now();
		const results = await lix.db
			.selectFrom("internal_resolved_state_all" as any)
			.where("version_id", "=", version.id)
			.selectAll()
			.execute();
		const queryTime = Date.now() - start;

		console.log(
			`Direct query time: ${queryTime}ms, rows returned: ${results.length}`
		);
	},
	{ iterations: 1, warmupIterations: 0 }
);

bench.todo("select single entity by entity_id");

bench.todo("select entities by schema_key filter");

bench.todo("select entities by file_id filter");

bench.todo("select entities with multiple filters (entity_id + schema_key)");

bench(
	"insert single state record",
	async () => {
		const lix = await openLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

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
	},
	{ iterations: 1, warmupIterations: 0 }
);

bench.todo("insert batch of 100 state records");

bench.todo("update existing state record");

bench.todo("delete single state record");

bench.todo("mixed mutations (insert + update + delete)");

bench.todo("cache miss performance - full table scan");

bench.todo("cache hit performance - filtered query");
