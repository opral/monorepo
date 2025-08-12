import { test, expect } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";

test("inserting into vtable creates per-schema physical table", async () => {
	// Open Lix in memory
	const lix = await openLix({});

	// Insert a row with schema_key = 'test_schema' using Kysely
	await (lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
		.insertInto("internal_state_cache_v2")
		.values({
			entity_id: "entity1",
			schema_key: "test_schema",
			file_id: "file1",
			version_id: "v1",
			plugin_key: "plugin1",
			snapshot_content: sql`jsonb(${JSON.stringify({ test: "data" })})`,
			schema_version: "1.0",
			created_at: "2024-01-01",
			updated_at: "2024-01-01",
			inherited_from_version_id: null,
			inheritance_delete_marker: 0,
			change_id: null,
			commit_id: null,
		})
		.execute();

	// Check that physical table was created
	const physicalTableExists = lix.sqlite.exec({
		sql: `SELECT name FROM sqlite_master WHERE type='table' AND name='internal_state_cache_test_schema'`,
		returnValue: "resultRows",
	});
	expect(physicalTableExists).toHaveLength(1);

	// Verify the row was inserted into the physical table
	const rows = lix.sqlite.exec({
		sql: `SELECT *, json(snapshot_content) as snapshot_json FROM internal_state_cache_test_schema`,
		returnValue: "resultRows",
		rowMode: "object",
	});
	expect(rows).toHaveLength(1);
	expect(rows[0]).toMatchObject({
		entity_id: "entity1",
		file_id: "file1",
		version_id: "v1",
		plugin_key: "plugin1",
		schema_version: "1.0",
		// snapshot_content is stored as BLOB, verify through snapshot_json
		snapshot_json: JSON.stringify({ test: "data" }),
	});
});

test("selecting from vtable queries per-schema physical tables", async () => {
	const lix = await openLix({});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Insert rows into different schemas
	await db
		.insertInto("internal_state_cache_v2")
		.values([
			{
				entity_id: "entity1",
				schema_key: "schema_a",
				file_id: "file1",
				version_id: "v1",
				plugin_key: "plugin1",
				snapshot_content: sql`jsonb(${JSON.stringify({ data: "a1" })})`,
				schema_version: "1.0",
				created_at: "2024-01-01",
				updated_at: "2024-01-01",
				inherited_from_version_id: null,
				inheritance_delete_marker: 0,
				change_id: null,
				commit_id: null,
			},
			{
				entity_id: "entity2",
				schema_key: "schema_b",
				file_id: "file2",
				version_id: "v1",
				plugin_key: "plugin1",
				snapshot_content: sql`jsonb(${JSON.stringify({ data: "b1" })})`,
				schema_version: "1.0",
				created_at: "2024-01-01",
				updated_at: "2024-01-01",
				inherited_from_version_id: null,
				inheritance_delete_marker: 0,
				change_id: null,
				commit_id: null,
			},
			{
				entity_id: "entity3",
				schema_key: "schema_a",
				file_id: "file3",
				version_id: "v1",
				plugin_key: "plugin1",
				snapshot_content: sql`jsonb(${JSON.stringify({ data: "a2" })})`,
				schema_version: "1.0",
				created_at: "2024-01-01",
				updated_at: "2024-01-01",
				inherited_from_version_id: null,
				inheritance_delete_marker: 0,
				change_id: null,
				commit_id: null,
			},
		])
		.execute();

	// Test 1: Select all rows from vtable
	const allRows = await db
		.selectFrom("internal_state_cache_v2")
		.select(["entity_id", "schema_key", "file_id"])
		.orderBy("entity_id")
		.execute();

	expect(allRows).toHaveLength(3);
	expect(allRows[0]).toMatchObject({
		entity_id: "entity1",
		schema_key: "schema_a",
		file_id: "file1",
	});
	expect(allRows[1]).toMatchObject({
		entity_id: "entity2",
		schema_key: "schema_b",
		file_id: "file2",
	});
	expect(allRows[2]).toMatchObject({
		entity_id: "entity3",
		schema_key: "schema_a",
		file_id: "file3",
	});

	// Test 2: Select with schema_key filter (should query single physical table)
	const schemaARows = await db
		.selectFrom("internal_state_cache_v2")
		.select(["entity_id", "schema_key", "file_id"])
		.where("schema_key", "=", "schema_a")
		.orderBy("entity_id")
		.execute();

	expect(schemaARows).toHaveLength(2);
	expect(schemaARows[0]?.entity_id).toBe("entity1");
	expect(schemaARows[1]?.entity_id).toBe("entity3");

	// Test 3: Select with entity_id filter
	const entity2Row = await db
		.selectFrom("internal_state_cache_v2")
		.select(["entity_id", "schema_key", "file_id"])
		.where("entity_id", "=", "entity2")
		.execute();

	expect(entity2Row).toHaveLength(1);
	expect(entity2Row[0]).toMatchObject({
		entity_id: "entity2",
		schema_key: "schema_b",
		file_id: "file2",
	});

	// Test 4: Select with multiple filters
	const filteredRow = await db
		.selectFrom("internal_state_cache_v2")
		.select(["entity_id", "schema_key", "file_id"])
		.where("schema_key", "=", "schema_a")
		.where("file_id", "=", "file3")
		.execute();

	expect(filteredRow).toHaveLength(1);
	expect(filteredRow[0]?.entity_id).toBe("entity3");
});
