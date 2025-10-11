import { bench } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "../version/create-version.js";

// Keep sizes moderate to avoid long CI runs while still being meaningful
const ROWS_SIMPLE = 100;
const ENTITIES_LINEAR = 50;
const COMMITS_LINEAR = 5;
const INHERIT_BASE = 50;

bench("materializer: select all from single version", async () => {
	const lix = await openLix({});

	// Seed a single commit containing many entities in the global version
	await lix.db
		.insertInto("state_all")
		.values(
			Array.from({ length: ROWS_SIMPLE }, (_, i) => ({
				entity_id: `bench_entity_${i}`,
				version_id: "global",
				snapshot_content: {
					id: `bench_entity_${i}`,
					v: 1,
				},
				schema_key: "bench_entity",
				file_id: "bench_file",
				plugin_key: "bench_plugin",
				schema_version: "1.0",
			}))
		)
		.execute();

	// Read from the final materializer view
	await lix.db
		.selectFrom("lix_internal_state_materializer" as any)
		.where("version_id", "=", "global")
		.selectAll()
		.execute();
});

bench("materializer: linear history (entities x commits)", async () => {
	const lix = await openLix({});

	// Create an isolated version for this benchmark
	await createVersion({ lix, id: "bench_linear" });

	// Generate a linear chain of commits. Each commit updates all entities.
	for (let c = 0; c < COMMITS_LINEAR; c++) {
		await lix.db
			.insertInto("state_all")
			.values(
				Array.from({ length: ENTITIES_LINEAR }, (_, i) => ({
					entity_id: `lin_entity_${i}`,
					version_id: "bench_linear",
					snapshot_content: { id: `lin_entity_${i}`, rev: c },
					schema_key: "bench_entity",
					file_id: "bench_file",
					plugin_key: "bench_plugin",
					schema_version: "1.0",
				}))
			)
			.execute();
	}

	// Query latest visible state resolved through the full pipeline
	await lix.db
		.selectFrom("lix_internal_state_materializer" as any)
		.where("version_id", "=", "bench_linear")
		.selectAll()
		.execute();
});

bench("materializer: inheritance (global -> A -> B -> C)", async () => {
	const lix = await openLix({});

	// Create a 3-level inheritance chain from global
	const versionA = await createVersion({
		lix,
		id: "bench_A",
		inheritsFrom: { id: "global" },
	});
	const versionB = await createVersion({
		lix,
		id: "bench_B",
		inheritsFrom: versionA,
	});
	const versionC = await createVersion({
		lix,
		id: "bench_C",
		inheritsFrom: versionB,
	});

	// Base data on global
	await lix.db
		.insertInto("state_all")
		.values(
			Array.from({ length: INHERIT_BASE }, (_, i) => ({
				entity_id: `inh_entity_${i}`,
				version_id: "global",
				snapshot_content: { id: `inh_entity_${i}`, src: "global" },
				schema_key: "bench_entity",
				file_id: "bench_file",
				plugin_key: "bench_plugin",
				schema_version: "1.0",
			}))
		)
		.execute();

	// A overrides first 100
	await lix.db
		.insertInto("state_all")
		.values(
			Array.from({ length: 100 }, (_, i) => ({
				entity_id: `inh_entity_${i}`,
				version_id: versionA.id,
				snapshot_content: { id: `inh_entity_${i}`, src: "A" },
				schema_key: "bench_entity",
				file_id: "bench_file",
				plugin_key: "bench_plugin",
				schema_version: "1.0",
			}))
		)
		.execute();

	// C adds 100 new and overrides next 50 from base
	await lix.db
		.insertInto("state_all")
		.values([
			// overrides 100..149
			...Array.from({ length: 50 }, (_, i) => ({
				entity_id: `inh_entity_${100 + i}`,
				version_id: versionC.id,
				snapshot_content: { id: `inh_entity_${100 + i}`, src: "C" },
				schema_key: "bench_entity",
				file_id: "bench_file",
				plugin_key: "bench_plugin",
				schema_version: "1.0",
			})),
			// adds 100 new entities 300..399
			...Array.from({ length: 100 }, (_, i) => ({
				entity_id: `inh_entity_${INHERIT_BASE + i}`,
				version_id: versionC.id,
				snapshot_content: {
					id: `inh_entity_${INHERIT_BASE + i}`,
					src: "C_new",
				},
				schema_key: "bench_entity",
				file_id: "bench_file",
				plugin_key: "bench_plugin",
				schema_version: "1.0",
			})),
		])
		.execute();

	// Query materialized state for C (should include inherited + overrides)
	await lix.db
		.selectFrom("lix_internal_state_materializer" as any)
		.where("version_id", "=", versionC.id)
		.selectAll()
		.execute();
});

bench("materializer: point lookup by entity_id", async () => {
	const lix = await openLix({});

	// Seed a reasonable set of entities in a dedicated version
	await createVersion({ lix, id: "bench_point" });

	await lix.db
		.insertInto("state_all")
		.values(
			Array.from({ length: ROWS_SIMPLE }, (_, i) => ({
				entity_id: `point_entity_${i}`,
				version_id: "bench_point",
				snapshot_content: { id: `point_entity_${i}` },
				schema_key: "bench_entity",
				file_id: "bench_file",
				plugin_key: "bench_plugin",
				schema_version: "1.0",
			}))
		)
		.execute();

	// Point query by entity_id
	await lix.db
		.selectFrom("lix_internal_state_materializer" as any)
		.where("version_id", "=", "bench_point")
		.where("entity_id", "=", "point_entity_123")
		.selectAll()
		.execute();
});
