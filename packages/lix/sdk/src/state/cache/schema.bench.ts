import { bench } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { Kysely, sql } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { getTimestamp } from "../../engine/functions/timestamp.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import { updateStateCache } from "./update-state-cache.js";

const ROW_NUM = 1000;

const TEST_STATE_SCHEMA: LixSchemaDefinition = {
	type: "object",
	additionalProperties: false,
	properties: {
		entity_id: { type: "string" },
		schema_key: { type: "string" },
		file_id: { type: "string" },
		data: {
			type: "object",
			additionalProperties: false,
			properties: {
				value: { type: "string" },
				index: { type: "number" },
				nested: {
					type: "object",
					additionalProperties: false,
					properties: {
						field1: { type: "string" },
						field2: { type: "number" },
						field3: { type: "boolean" },
					},
					required: ["field1", "field2", "field3"],
				},
			},
			required: ["value", "index", "nested"],
		},
	},
	required: ["entity_id", "schema_key", "file_id", "data"],
	"x-lix-key": "test_state",
	"x-lix-version": "1.0",
};

const LIX_CHANGE_SET_ELEMENT_SCHEMA: LixSchemaDefinition = {
	type: "object",
	additionalProperties: false,
	properties: {
		entity_id: { type: "string" },
		schema_key: { type: "string" },
		file_id: { type: "string" },
		change_id: { type: "string" },
		data: {
			type: "object",
			additionalProperties: false,
			properties: {
				value: { type: "string" },
				index: { type: "number" },
			},
			required: ["value", "index"],
		},
	},
	required: ["entity_id", "schema_key", "file_id", "change_id", "data"],
	"x-lix-key": "lix_change_set_element",
	"x-lix-version": "1.0",
};

async function registerCacheSchemas(
	lix: Awaited<ReturnType<typeof openLix>>
): Promise<void> {
	await lix.db
		.insertInto("stored_schema")
		.values([{ value: TEST_STATE_SCHEMA }])
		.execute();
}

bench(`insert ${ROW_NUM} rows into cache`, async () => {
	const lix = await openLix({});
	await registerCacheSchemas(lix);

	// Generate test rows for cache
	const changes = [];

	const time = await getTimestamp({ lix });

	for (let i = 0; i < ROW_NUM; i++) {
		const snapshotContent = {
			entity_id: `entity-${i}`,
			schema_key: "test_state",
			file_id: "lix",
			data: {
				value: `test-value-${i}`,
				index: i,
				nested: {
					field1: `field1-${i}`,
					field2: i * 2,
					field3: i % 2 === 0,
				},
			},
		};

		changes.push({
			id: `change-${i}`,
			entity_id: `entity-${i}`,
			schema_key: "test_state",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "test_plugin",
			snapshot_content: JSON.stringify(snapshotContent),
			created_at: time,
			lixcol_version_id: "global",
			lixcol_commit_id: `commit-${i}`,
		});
	}

	updateStateCache({
		engine: lix.engine!,
		changes,
	});
});

bench("query with json_extract from cache", async () => {
	try {
		const lix = await openLix({});
		await registerCacheSchemas(lix);
		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		// First, insert test data
		const changes = [];
		const time = await getTimestamp({ lix });

		for (let i = 0; i < ROW_NUM; i++) {
			const snapshotContent = {
				entity_id: `entity-${i}`,
				schema_key: "test_state",
				file_id: "lix",
				data: {
					value: `test-value-${i}`,
					index: i,
					nested: {
						field1: `field1-${i}`,
						field2: i * 2,
						field3: i % 2 === 0,
					},
				},
			};

			changes.push({
				id: `change-${i}`,
				entity_id: `entity-${i}`,
				schema_key: "test_state",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "test_plugin",
				snapshot_content: JSON.stringify(snapshotContent),
				created_at: time,
				lixcol_version_id: "global",
				lixcol_commit_id: `commit-${i}`,
			});
		}

		updateStateCache({
			engine: lix.engine!,
			changes,
		});

		// Now perform the query with json_extract
		await db
			.selectFrom("lix_internal_state_vtable")
			.select([
				"entity_id",
				"schema_key",
				sql`json_extract(snapshot_content, '$.data.value')`.as("value"),
				sql`json_extract(snapshot_content, '$.data.index')`.as("index"),
				sql`json_extract(snapshot_content, '$.data.nested.field3')`.as(
					"field3"
				),
			])
			.where("_pk", "like", "C%")
			.where("schema_key", "=", "test_state")
			.where(
				sql`json_extract(snapshot_content, '$.data.nested.field3')`,
				"=",
				1
			)
			.execute();
	} catch (error) {
		console.error("Error during benchmark:", error);
		throw error;
	}
});

bench("complex OR query (deletionReconciliation pattern)", async () => {
	const lix = await openLix({});
	await registerCacheSchemas(lix);
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// First, insert test data
	const time = await getTimestamp({ lix });
	const rows = Array.from({ length: ROW_NUM }, (_, i) => ({
		id: `bench-change-elements-${i}`,
		entity_id: `changeset~entity-${i}`,
		schema_key: "lix_change_set_element",
		schema_version: "1.0",
		file_id: "lix",
		plugin_key: "test_plugin",
		snapshot_content: JSON.stringify({
			entity_id: `changeset~entity-${i}`,
			schema_key: "lix_change_set_element",
			file_id: "lix",
			change_id: `change-${i}`,
			data: {
				value: `test-value-${i}`,
				index: i,
			},
		}),
		created_at: time,
		lixcol_version_id: "global",
		lixcol_commit_id: `commit-${i}`,
	}));

	updateStateCache({
		engine: lix.engine!,
		changes: rows,
	});

	// Simulate the deletionReconciliation pattern with complex OR conditions
	const userChanges: any = [];
	for (let i = 0; i < ROW_NUM / 10; i++) {
		userChanges.push({
			entity_id: `changeset~entity-${i}`,
			schema_key: "lix_change_set_element",
			file_id: "lix",
		});
	}

	// This mimics the query from deletionReconciliation
	await db
		.selectFrom("lix_internal_state_vtable")
		.select([
			"_pk",
			sql`json_extract(snapshot_content, '$.entity_id')`.as("entity_id"),
			sql`json_extract(snapshot_content, '$.schema_key')`.as("schema_key"),
			sql`json_extract(snapshot_content, '$.file_id')`.as("file_id"),
		])
		.where("entity_id", "like", "changeset~%")
		.where("schema_key", "=", "lix_change_set_element")
		.where("file_id", "=", "lix")
		.where("version_id", "=", "global")
		.where((eb) =>
			eb.or(
				userChanges.map((change: any) =>
					eb.and([
						eb(
							sql`json_extract(snapshot_content, '$.entity_id')`,
							"=",
							change.entity_id
						),
						eb(
							sql`json_extract(snapshot_content, '$.schema_key')`,
							"=",
							change.schema_key
						),
						eb(
							sql`json_extract(snapshot_content, '$.file_id')`,
							"=",
							change.file_id
						),
					])
				)
			)
		)
		.execute();
});

bench(`update ${ROW_NUM / 10} rows in cache`, async () => {
	const lix = await openLix({});
	await registerCacheSchemas(lix);

	// First, insert test data
	const baseTimestamp = await getTimestamp({ lix });
	const initialChanges = Array.from({ length: ROW_NUM / 10 }, (_, i) => ({
		id: `update-bench-change-${i}`,
		entity_id: `entity-${i}`,
		schema_key: "test_state",
		schema_version: "1.0",
		file_id: "lix",
		plugin_key: "test_plugin",
		snapshot_content: JSON.stringify({
			entity_id: `entity-${i}`,
			schema_key: "test_state",
			file_id: "lix",
			data: {
				value: `test-value-${i}`,
				index: i,
			},
		}),
		created_at: baseTimestamp,
		lixcol_version_id: "global",
		lixcol_commit_id: `update-bench-commit-${i}`,
	}));

	updateStateCache({
		engine: lix.engine!,
		changes: initialChanges,
	});

	const updatedTimestamp = await getTimestamp({ lix });
	const updatedChanges = initialChanges.map((change, i) => ({
		id: `${change.id}-updated`,
		entity_id: change.entity_id,
		schema_key: change.schema_key,
		schema_version: change.schema_version,
		file_id: change.file_id,
		plugin_key: change.plugin_key,
		snapshot_content: JSON.stringify({
			entity_id: `entity-${i}`,
			schema_key: "test_state",
			file_id: "lix",
			data: {
				value: `updated-value-${i}`,
				index: i * 10,
			},
		}),
		created_at: updatedTimestamp,
		lixcol_version_id: "global",
		lixcol_commit_id: `${change.lixcol_commit_id}-updated`,
	}));

	updateStateCache({
		engine: lix.engine!,
		changes: updatedChanges,
	});
});

bench(`delete ${ROW_NUM / 10} rows from cache`, async () => {
	const lix = await openLix({});
	await registerCacheSchemas(lix);

	// First, insert test data
	const time = await getTimestamp({ lix });
	const changes = Array.from({ length: ROW_NUM / 10 }, (_, i) => ({
		id: `delete-bench-change-${i}`,
		entity_id: `entity-${i}`,
		schema_key: "test_state",
		schema_version: "1.0",
		file_id: "lix",
		plugin_key: "test_plugin",
		snapshot_content: JSON.stringify({
			entity_id: `entity-${i}`,
			schema_key: "test_state",
			file_id: "lix",
			data: {
				value: `test-value-${i}`,
				index: i,
			},
		}),
		created_at: time,
		lixcol_version_id: "global",
		lixcol_commit_id: `delete-bench-commit-${i}`,
	}));

	updateStateCache({
		engine: lix.engine!,
		changes,
	});

	const deleteTimestamp = await getTimestamp({ lix });
	const tombstones = changes.map((change, i) => ({
		id: `${change.id}-delete`,
		entity_id: change.entity_id,
		schema_key: change.schema_key,
		schema_version: change.schema_version,
		file_id: change.file_id,
		plugin_key: change.plugin_key,
		snapshot_content: null,
		created_at: deleteTimestamp,
		lixcol_version_id: "global",
		lixcol_commit_id: `${change.lixcol_commit_id}-delete`,
	}));

	updateStateCache({
		engine: lix.engine!,
		changes: tombstones,
	});
});
