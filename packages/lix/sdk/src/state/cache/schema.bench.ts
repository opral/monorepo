import { bench } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { Kysely, sql } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { getTimestampSync } from "../../runtime/deterministic/timestamp.js";

const ROW_NUM = 1000;

bench(`insert ${ROW_NUM} rows into cache`, async () => {
	const lix = await openLix({});

	// Generate test rows for cache
	const rows = [];

	const time = getTimestampSync({ lix });

	for (let i = 0; i < ROW_NUM; i++) {
		const snapshotContent = {
			entity_id: `entity-${i}`,
			schema_key: "lix_test",
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

		rows.push({
			entity_id: `entity-${i}`,
			schema_key: "lix_test",
			file_id: "lix",
			version_id: "global",
			change_id: `change-${i}`,
			plugin_key: "test_plugin",
			schema_version: "1.0",
			created_at: time,
			updated_at: time,
			inherited_from_version_id: null,
			inheritance_delete_marker: 0,
			snapshot_content: sql`jsonb(${JSON.stringify(snapshotContent)})`,
		});
	}

	// Insert all rows in one batch
	await (lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
		.insertInto("internal_state_cache")
		.values(rows as any)
		.execute();
});

bench("query with json_extract from cache", async () => {
	const lix = await openLix({});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// First, insert test data
	const rows = [];
	const time = getTimestampSync({ lix });

	for (let i = 0; i < ROW_NUM; i++) {
		const snapshotContent = {
			entity_id: `entity-${i}`,
			schema_key: "lix_test",
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

		rows.push({
			entity_id: `entity-${i}`,
			schema_key: "lix_test",
			file_id: "lix",
			version_id: "global",
			change_id: `change-${i}`,
			plugin_key: "test_plugin",
			schema_version: "1.0",
			created_at: time,
			updated_at: time,
			inherited_from_version_id: null,
			inheritance_delete_marker: 0,
			snapshot_content: sql`jsonb(${JSON.stringify(snapshotContent)})`,
		});
	}

	await db
		.insertInto("internal_state_cache")
		.values(rows as any)
		.execute();

	// Now perform the query with json_extract
	await db
		.selectFrom("internal_state_cache")
		.select([
			"entity_id",
			"schema_key",
			sql`json_extract(snapshot_content, '$.data.value')`.as("value"),
			sql`json_extract(snapshot_content, '$.data.index')`.as("index"),
			sql`json_extract(snapshot_content, '$.data.nested.field3')`.as("field3"),
		])
		.where("schema_key", "=", "lix_test")
		.where(sql`json_extract(snapshot_content, '$.data.nested.field3')`, "=", 1)
		.execute();
});

bench("query through resolved_state_all view", async () => {
	const lix = await openLix({});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// First, insert test data
	const rows = [];
	const time = getTimestampSync({ lix });

	for (let i = 0; i < ROW_NUM; i++) {
		const snapshotContent = {
			entity_id: `entity-${i}`,
			schema_key: "lix_test",
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

		rows.push({
			entity_id: `entity-${i}`,
			schema_key: "lix_test",
			file_id: "lix",
			version_id: "global",
			change_id: `change-${i}`,
			plugin_key: "test_plugin",
			schema_version: "1.0",
			created_at: time,
			updated_at: time,
			inherited_from_version_id: null,
			inheritance_delete_marker: 0,
			snapshot_content: sql`jsonb(${JSON.stringify(snapshotContent)})`,
		});
	}

	await db
		.insertInto("internal_state_cache")
		.values(rows as any)
		.execute();

	// Query through the resolved state view which has json() conversion
	await db
		.selectFrom("internal_resolved_state_all")
		.select([
			"entity_id",
			"schema_key",
			sql`json_extract(snapshot_content, '$.data.value')`.as("value"),
			sql`json_extract(snapshot_content, '$.data.index')`.as("index"),
		])
		.where("schema_key", "=", "lix_test")
		.where("version_id", "=", "global")
		.where(sql`json_extract(snapshot_content, '$.data.nested.field3')`, "=", 1)
		.execute();
});

bench("complex OR query (deletionReconciliation pattern)", async () => {
	const lix = await openLix({});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// First, insert test data
	const rows = [];
	const time = getTimestampSync({ lix });

	for (let i = 0; i < ROW_NUM; i++) {
		const snapshotContent = {
			entity_id: `changeset~entity-${i}`,
			schema_key: "lix_change_set_element",
			file_id: "lix",
			change_id: `change-${i}`,
			data: {
				value: `test-value-${i}`,
				index: i,
			},
		};

		rows.push({
			entity_id: `changeset~entity-${i}`,
			schema_key: "lix_change_set_element",
			file_id: "lix",
			version_id: "global",
			change_id: `change-${i}`,
			plugin_key: "test_plugin",
			schema_version: "1.0",
			created_at: time,
			updated_at: time,
			inherited_from_version_id: null,
			inheritance_delete_marker: 0,
			snapshot_content: sql`jsonb(${JSON.stringify(snapshotContent)})`,
		});
	}

	await db
		.insertInto("internal_state_cache")
		.values(rows as any)
		.execute();

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
		.selectFrom("internal_resolved_state_all")
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
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// First, insert test data
	const rows = [];
	const time = getTimestampSync({ lix });

	for (let i = 0; i < ROW_NUM / 10; i++) {
		const snapshotContent = {
			entity_id: `entity-${i}`,
			schema_key: "lix_test",
			file_id: "lix",
			data: {
				value: `test-value-${i}`,
				index: i,
			},
		};

		rows.push({
			entity_id: `entity-${i}`,
			schema_key: "lix_test",
			file_id: "lix",
			version_id: "global",
			change_id: `change-${i}`,
			plugin_key: "test_plugin",
			schema_version: "1.0",
			created_at: time,
			updated_at: time,
			inherited_from_version_id: null,
			inheritance_delete_marker: 0,
			snapshot_content: sql`jsonb(${JSON.stringify(snapshotContent)})`,
		});
	}

	await db
		.insertInto("internal_state_cache")
		.values(rows as any)
		.execute();

	// Update all rows
	for (let i = 0; i < ROW_NUM / 10; i++) {
		const updatedSnapshot = {
			entity_id: `entity-${i}`,
			schema_key: "lix_test",
			file_id: "lix",
			data: {
				value: `updated-value-${i}`,
				index: i * 10,
			},
		};

		await db
			.updateTable("internal_state_cache")
			.set({
				snapshot_content: sql`jsonb(${JSON.stringify(updatedSnapshot)})`,
				updated_at: getTimestampSync({ lix }),
			})
			.where("entity_id", "=", `entity-${i}`)
			.where("schema_key", "=", "lix_test")
			.where("file_id", "=", "lix")
			.where("version_id", "=", "global")
			.execute();
	}
});

bench(`delete ${ROW_NUM / 10} rows from cache`, async () => {
	const lix = await openLix({});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// First, insert test data
	const rows = [];
	const time = getTimestampSync({ lix });

	for (let i = 0; i < ROW_NUM / 10; i++) {
		const snapshotContent = {
			entity_id: `entity-${i}`,
			schema_key: "lix_test",
			file_id: "lix",
			data: {
				value: `test-value-${i}`,
				index: i,
			},
		};

		rows.push({
			entity_id: `entity-${i}`,
			schema_key: "lix_test",
			file_id: "lix",
			version_id: "global",
			change_id: `change-${i}`,
			plugin_key: "test_plugin",
			schema_version: "1.0",
			created_at: time,
			updated_at: time,
			inherited_from_version_id: null,
			inheritance_delete_marker: 0,
			snapshot_content: sql`jsonb(${JSON.stringify(snapshotContent)})`,
		});
	}

	await db
		.insertInto("internal_state_cache")
		.values(rows as any)
		.execute();

	// Delete all rows
	await db
		.deleteFrom("internal_state_cache")
		.where("schema_key", "=", "lix_test")
		.where("version_id", "=", "global")
		.execute();
});
