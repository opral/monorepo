import { bench, describe } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { updateStateCache } from "./update-state-cache.js";
import { getTimestampSync } from "../../runtime/deterministic/timestamp.js";
import type { LixChangeRaw } from "../../change/schema.js";

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
	const schemas = [
		"lix_file",
		"lix_change",
		"lix_discussion",
		"lix_comment",
		"lix_account",
	];

	bench("Standard batch - 1000 records", async () => {
		const lix = await openLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
				},
			],
		});

		const ts = getTimestampSync({ lix });
		const changes = generateChanges(1000, schemas, ts);

		updateStateCache({
			lix,
			changes,
			commit_id: "commit-standard",
			version_id: "v1",
		});
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

		const ts = getTimestampSync({ lix });
		const changes = generateChanges(1000, schemas, ts);

		updateStateCache({
			lix,
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

			const ts = getTimestampSync({ lix });

			// Pre-populate with 100K rows across 5 schemas (20K per schema)
			// Process in 10K batches to avoid memory issues
			for (let i = 0; i < 10; i++) {
				const warmupChanges = generateChanges(10000, schemas, ts, {
					prefix: `warmup-${i}`,
				});
				updateStateCache({
					lix,
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

			updateStateCache({
				lix,
				changes,
				commit_id: "commit-warm",
				version_id: "v1",
			});
		}
	);
});
