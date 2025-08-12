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

test("deleting from vtable removes from physical table", async () => {
	const lix = await openLix({});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Insert some test data
	await db
		.insertInto("internal_state_cache_v2")
		.values([
			{
				entity_id: "entity1",
				schema_key: "delete_test",
				file_id: "file1",
				version_id: "v1",
				plugin_key: "plugin1",
				snapshot_content: sql`jsonb(${JSON.stringify({ data: "keep" })})`,
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
				schema_key: "delete_test",
				file_id: "file2",
				version_id: "v1",
				plugin_key: "plugin1",
				snapshot_content: sql`jsonb(${JSON.stringify({ data: "delete" })})`,
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

	// Verify both rows exist
	const beforeDelete = await db
		.selectFrom("internal_state_cache_v2")
		.select(["entity_id", "schema_key", "file_id"])
		.where("schema_key", "=", "delete_test")
		.orderBy("entity_id")
		.execute();
	expect(beforeDelete).toHaveLength(2);

	// Delete one row using the vtable
	await db
		.deleteFrom("internal_state_cache_v2")
		.where("entity_id", "=", "entity2")
		.where("schema_key", "=", "delete_test")
		.where("file_id", "=", "file2")
		.where("version_id", "=", "v1")
		.execute();

	// Verify only one row remains
	const afterDelete = await db
		.selectFrom("internal_state_cache_v2")
		.select(["entity_id", "schema_key", "file_id"])
		.where("schema_key", "=", "delete_test")
		.execute();
	expect(afterDelete).toHaveLength(1);
	expect(afterDelete[0]?.entity_id).toBe("entity1");

	// Also verify in the physical table directly
	const physicalRows = lix.sqlite.exec({
		sql: `SELECT entity_id FROM internal_state_cache_delete_test`,
		returnValue: "resultRows",
		rowMode: "object",
	});
	expect(physicalRows).toHaveLength(1);
	expect(physicalRows[0]).toMatchObject({ entity_id: "entity1" });
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

test("updates existing row", async () => {
	const lix = await openLix({});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// First insert a row
	await db
		.insertInto("internal_state_cache_v2")
		.values({
			entity_id: "entity1",
			schema_key: "update_schema",
			file_id: "file1",
			version_id: "v1",
			plugin_key: "plugin1",
			snapshot_content: sql`jsonb(${JSON.stringify({ original: "data" })})`,
			schema_version: "1.0",
			created_at: "2024-01-01",
			updated_at: "2024-01-01",
			inherited_from_version_id: null,
			inheritance_delete_marker: 0,
			change_id: "change1",
			commit_id: "commit1",
		})
		.execute();

	// Now update it (INSERT OR REPLACE will replace the existing row)
	await db
		.insertInto("internal_state_cache_v2")
		.values({
			entity_id: "entity1",
			schema_key: "update_schema",
			file_id: "file1",
			version_id: "v1",
			plugin_key: "plugin2",
			snapshot_content: sql`jsonb(${JSON.stringify({ updated: "data" })})`,
			schema_version: "2.0",
			created_at: "2024-01-01",
			updated_at: "2024-01-02",
			inherited_from_version_id: "parent_v1",
			inheritance_delete_marker: 0,
			change_id: "change2",
			commit_id: "commit2",
		})
		.execute();

	// Verify the row was updated
	const rows = lix.sqlite.exec({
		sql: `SELECT *, json(snapshot_content) as snapshot_json FROM internal_state_cache_update_schema`,
		returnValue: "resultRows",
		rowMode: "object",
	});
	expect(rows).toHaveLength(1);
	expect(rows[0]).toMatchObject({
		entity_id: "entity1",
		file_id: "file1",
		version_id: "v1",
		plugin_key: "plugin2", // Updated
		schema_version: "2.0", // Updated
		updated_at: "2024-01-02", // Updated
		change_id: "change2", // Updated
		commit_id: "commit2", // Updated
	});
	expect(rows[0]?.snapshot_json).toBe(JSON.stringify({ updated: "data" }));
});

test("tombstone (deletion marker)", async () => {
	const lix = await openLix({});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Insert a tombstone entry
	await db
		.insertInto("internal_state_cache_v2")
		.values({
			entity_id: "entity1",
			schema_key: "tombstone_schema",
			file_id: "file1",
			version_id: "v1",
			plugin_key: "plugin1",
			snapshot_content: null,
			schema_version: "1.0",
			created_at: "2024-01-01",
			updated_at: "2024-01-01",
			inherited_from_version_id: null,
			inheritance_delete_marker: 1, // Tombstone marker
			change_id: "change1",
			commit_id: "commit1",
		})
		.execute();

	// Verify the tombstone was inserted
	const rows = lix.sqlite.exec({
		sql: `SELECT * FROM internal_state_cache_tombstone_schema`,
		returnValue: "resultRows",
		rowMode: "object",
	});
	expect(rows).toHaveLength(1);
	expect(rows[0]).toMatchObject({
		entity_id: "entity1",
		snapshot_content: null,
		inheritance_delete_marker: 1,
	});
});

test("deletes only the specified row, leaving others intact", async () => {
	const lix = await openLix({});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Insert multiple rows
	await db
		.insertInto("internal_state_cache_v2")
		.values([
			{
				entity_id: "entity1",
				schema_key: "multi_delete",
				file_id: "file1",
				version_id: "v1",
				plugin_key: "plugin1",
				snapshot_content: sql`jsonb(${JSON.stringify({ data: "row1" })})`,
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
				schema_key: "multi_delete",
				file_id: "file2",
				version_id: "v1",
				plugin_key: "plugin1",
				snapshot_content: sql`jsonb(${JSON.stringify({ data: "row2" })})`,
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
				schema_key: "multi_delete",
				file_id: "file3",
				version_id: "v1",
				plugin_key: "plugin1",
				snapshot_content: sql`jsonb(${JSON.stringify({ data: "row3" })})`,
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

	// Delete only entity2
	await db
		.deleteFrom("internal_state_cache_v2")
		.where("entity_id", "=", "entity2")
		.where("schema_key", "=", "multi_delete")
		.where("file_id", "=", "file2")
		.where("version_id", "=", "v1")
		.execute();

	// Verify entity1 and entity3 still exist, but entity2 is gone
	const remaining = lix.sqlite.exec({
		sql: `SELECT entity_id FROM internal_state_cache_multi_delete ORDER BY entity_id`,
		returnValue: "resultRows",
		rowMode: "object",
	});
	expect(remaining).toHaveLength(2);
	expect(remaining[0]).toMatchObject({ entity_id: "entity1" });
	expect(remaining[1]).toMatchObject({ entity_id: "entity3" });
});

test("deletion is idempotent - deleting non-existent row succeeds", async () => {
	const lix = await openLix({});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Create table with one row
	await db
		.insertInto("internal_state_cache_v2")
		.values({
			entity_id: "entity1",
			schema_key: "idempotent_test",
			file_id: "file1",
			version_id: "v1",
			plugin_key: "plugin1",
			snapshot_content: null,
			schema_version: "1.0",
			created_at: "2024-01-01",
			updated_at: "2024-01-01",
			inherited_from_version_id: null,
			inheritance_delete_marker: 0,
			change_id: null,
			commit_id: null,
		})
		.execute();

	// Delete a row that doesn't exist in the table - should not throw
	await expect(
		db
			.deleteFrom("internal_state_cache_v2")
			.where("entity_id", "=", "entity_nonexistent")
			.where("schema_key", "=", "idempotent_test")
			.where("file_id", "=", "file_nonexistent")
			.where("version_id", "=", "v1")
			.execute()
	).resolves.not.toThrow();

	// Delete the same non-existent row again - should still succeed
	await expect(
		db
			.deleteFrom("internal_state_cache_v2")
			.where("entity_id", "=", "entity_nonexistent")
			.where("schema_key", "=", "idempotent_test")
			.where("file_id", "=", "file_nonexistent")
			.where("version_id", "=", "v1")
			.execute()
	).resolves.not.toThrow();

	// Verify the original row is still there
	const remaining = lix.sqlite.exec({
		sql: `SELECT entity_id FROM internal_state_cache_idempotent_test`,
		returnValue: "resultRows",
		rowMode: "object",
	});
	expect(remaining).toHaveLength(1);
	expect(remaining[0]).toMatchObject({ entity_id: "entity1" });
});
