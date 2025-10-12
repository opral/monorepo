import { bench, describe } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { updateStateCacheV2 } from "./update-state-cache.js";
import { getTimestamp } from "../../engine/functions/timestamp.js";
import type { LixChangeRaw } from "../../change/schema-definition.js";

console.log("Preparing updateStateCacheV2 benchmarks...");

/**
 * Regression benchmarks for updateStateCacheV2 performance
 *
 * Key regression tests:
 * - Standard batch (1000 records) - baseline performance
 * - Multi-schema distribution (5 schemas) - tests per-schema table handling
 * - Large batch (10000 records) - tests scalability
 */

// Helper function to generate test changes
function generateChanges(
	count: number,
	schemas: string[],
	ts: string,
	options: {
		prefix?: string;
		deletionRatio?: number; // 0-1, percentage of changes that are deletions
		updateRatio?: number; // 0-1, percentage of non-deletions that are updates to existing entities
	} = {}
): LixChangeRaw[] {
	const { prefix = "entity", deletionRatio = 0, updateRatio = 0 } = options;
	const changes: LixChangeRaw[] = [];

	for (let i = 0; i < count; i++) {
		const schemaIndex = i % schemas.length;
		const isDeleted = Math.random() < deletionRatio;
		const isUpdate = !isDeleted && Math.random() < updateRatio;

		changes.push({
			id: `change-${prefix}-${i}`,
			entity_id: isUpdate ? `${prefix}-${Math.floor(i / 2)}` : `${prefix}-${i}`, // Updates reuse entity IDs
			schema_key: schemas[schemaIndex]!,
			schema_version: "1.0",
			file_id: `file-${i % 100}`,
			plugin_key: "benchmark_plugin",
			snapshot_content: isDeleted
				? null
				: JSON.stringify({
						id: `${prefix}-${i}`,
						name: `Benchmark ${i}`,
						data: `Test data for entity ${i}`,
						timestamp: ts,
						complex_field: {
							nested: {
								value: i * 2,
								array: [1, 2, 3, i],
								metadata: `metadata-${i}`,
							},
						},
					}),
			created_at: ts,
		});
	}

	return changes;
}

describe("updateStateCacheV2 Regression Tests", () => {
	console.log("Preparing updateStateCacheV2 benchmarks...");
	const schemas = [
		"bench_schema_file",
		"bench_schema_change",
		"bench_schema_discussion",
		"bench_schema_comment",
		"bench_schema_account",
	];

	async function registerBenchmarkSchemas(
		lix: Awaited<ReturnType<typeof openLix>>,
		schemaKeys: readonly string[]
	): Promise<void> {
		for (const schemaKey of schemaKeys) {
			const definition = {
				$schema: "http://json-schema.org/draft-07/schema#",
				type: "object",
				additionalProperties: false,
				properties: {
					id: { type: "string" },
					name: { type: "string" },
					data: { type: "string" },
					timestamp: { type: "string" },
					complex_field: {
						type: "object",
						additionalProperties: true,
					},
				},
				required: ["id"],
				"x-lix-key": schemaKey,
				"x-lix-version": "1.0",
				"x-lix-primary-key": ["/id"],
			};

			await lix.db
				.insertInto("stored_schema")
				.values({ value: definition })
				.execute();
		}
	}

	bench("Standard batch - 1000 records", async () => {
		console.log("Starting standard batch benchmark...");
		try {
			const lix = await openLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true, bootstrap: true },
					},
				],
			});

			const ts = await getTimestamp({ lix });
			await registerBenchmarkSchemas(lix, schemas);
			const changes = generateChanges(1000, schemas, ts);

			updateStateCacheV2({
				engine: lix.engine!,
				changes,
				commit_id: "commit-standard",
				version_id: "v1",
			});
		} catch (error) {
			console.error("Error during benchmark:", error);
			throw error;
		}
	});

	bench("Multi-schema - 1000 records across 5 schemas", async () => {
		const lix = await openLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
				},
			],
		});

		const ts = await getTimestamp({ lix });
		await registerBenchmarkSchemas(lix, schemas);
		const changes = generateChanges(1000, schemas, ts);

		updateStateCacheV2({
			engine: lix.engine!,
			changes,
			commit_id: "commit-multi",
			version_id: "v1",
		});
	});

	bench.skip(
		"Warm cache - 1000 records with 100K pre-existing rows",
		async () => {
			const lix = await openLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true, bootstrap: true },
					},
				],
			});

			const ts = await getTimestamp({ lix });
			await registerBenchmarkSchemas(lix, schemas);

			// Pre-populate with 100K rows across 5 schemas (20K per schema)
			// Process in 10K batches to avoid memory issues
			for (let i = 0; i < 10; i++) {
				const warmupChanges = generateChanges(10000, schemas, ts, {
					prefix: `warmup-${i}`,
				});
				updateStateCacheV2({
					engine: lix.engine!,
					changes: warmupChanges,
					commit_id: `warmup-${i}`,
					version_id: "v0",
				});
			}

			// Now benchmark 1000 changes against the warm cache with deep B-trees
			const changes = generateChanges(1000, schemas, ts, {
				prefix: "bench",
				deletionRatio: 0.05,
				updateRatio: 0.15,
			});

			updateStateCacheV2({
				engine: lix.engine!,
				changes,
				commit_id: "commit-warm",
				version_id: "v1",
			});
		}
	);
});
