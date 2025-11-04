import { afterAll, bench, describe } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "../version/create-version.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

// Keep sizes moderate to avoid long CI runs while still being meaningful
const ROWS_SIMPLE = 100;
const ENTITIES_LINEAR = 50;
const COMMITS_LINEAR = 5;
const INHERIT_BASE = 50;

const BENCH_STORED_SCHEMA: LixSchemaDefinition = {
	type: "object",
	additionalProperties: false,
	properties: {
		id: { type: "string" },
		v: { type: "number" },
		rev: { type: "number" },
		src: { type: "string" },
	},
	required: ["id"],
	"x-lix-key": "bench_entity",
	"x-lix-version": "1.0",
};

async function registerBenchSchema(
	lix: Awaited<ReturnType<typeof openLix>>
): Promise<void> {
	await lix.db
		.insertInto("stored_schema")
		.values({
			value: BENCH_STORED_SCHEMA,
		})
		.execute();
}

describe("materializer: select all from single version", async () => {
	const lix = await openLix({});
	await registerBenchSchema(lix);

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

	afterAll(async () => {
		await lix.close();
	});

	describe("materializer: linear history (entities x commits)", async () => {
		const lix = await openLix({});
		await registerBenchSchema(lix);

		const linearVersion = await createVersion({ lix, id: "bench_linear" });

		for (let c = 0; c < COMMITS_LINEAR; c++) {
			await lix.db
				.insertInto("state_all")
				.values(
					Array.from({ length: ENTITIES_LINEAR }, (_, i) => ({
						entity_id: `lin_entity_${i}`,
						version_id: linearVersion.id,
						snapshot_content: { id: `lin_entity_${i}`, rev: c },
						schema_key: "bench_entity",
						file_id: "bench_file",
						plugin_key: "bench_plugin",
						schema_version: "1.0",
					}))
				)
				.execute();
		}

		afterAll(async () => {
			await lix.close();
		});

		bench("materializer: linear history (entities x commits)", async () => {
			await lix.db
				.selectFrom("lix_internal_state_materializer" as any)
				.where("version_id", "=", linearVersion.id)
				.selectAll()
				.execute();
		});
	});

	describe("materializer: inheritance (global -> A -> B -> C)", async () => {
		const lix = await openLix({});
		await registerBenchSchema(lix);

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

		await lix.db
			.insertInto("state_all")
			.values([
				...Array.from({ length: 50 }, (_, i) => ({
					entity_id: `inh_entity_${100 + i}`,
					version_id: versionC.id,
					snapshot_content: { id: `inh_entity_${100 + i}`, src: "C" },
					schema_key: "bench_entity",
					file_id: "bench_file",
					plugin_key: "bench_plugin",
					schema_version: "1.0",
				})),
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

		afterAll(async () => {
			await lix.close();
		});

		bench("materializer: inheritance (global -> A -> B -> C)", async () => {
			await lix.db
				.selectFrom("lix_internal_state_materializer" as any)
				.where("version_id", "=", versionC.id)
				.selectAll()
				.execute();
		});
	});

	describe("materializer: point lookup by entity_id", async () => {
		const lix = await openLix({});
		await registerBenchSchema(lix);

		const pointVersion = await createVersion({ lix, id: "bench_point" });

		await lix.db
			.insertInto("state_all")
			.values(
				Array.from({ length: ROWS_SIMPLE }, (_, i) => ({
					entity_id: `point_entity_${i}`,
					version_id: pointVersion.id,
					snapshot_content: { id: `point_entity_${i}` },
					schema_key: "bench_entity",
					file_id: "bench_file",
					plugin_key: "bench_plugin",
					schema_version: "1.0",
				}))
			)
			.execute();

		afterAll(async () => {
			await lix.close();
		});

		bench("materializer: point lookup by entity_id", async () => {
			await lix.db
				.selectFrom("lix_internal_state_materializer" as any)
				.where("version_id", "=", pointVersion.id)
				.where("entity_id", "=", "point_entity_123")
				.selectAll()
				.execute();
		});
	});
	bench("materializer: select all from single version", async () => {
		await lix.db
			.selectFrom("lix_internal_state_materializer" as any)
			.where("version_id", "=", "global")
			.selectAll()
			.execute();
	});
});
