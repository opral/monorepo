import { test, expect } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { updateStateCache } from "./update-state-cache.js";

test("selecting from vtable queries per-schema physical tables", async () => {
	const lix = await openLix({});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Use the direct function to insert rows into different schemas
	updateStateCache({
		engine: lix.engine!,
		changes: [
			{
				id: "change1",
				entity_id: "entity1",
				schema_key: "schema_a",
				file_id: "file1",
				plugin_key: "plugin1",
				snapshot_content: JSON.stringify({ data: "a1" }),
				schema_version: "1.0",
				created_at: "2024-01-01",
			},
			{
				id: "change2",
				entity_id: "entity2",
				schema_key: "schema_b",
				file_id: "file2",
				plugin_key: "plugin1",
				snapshot_content: JSON.stringify({ data: "b1" }),
				schema_version: "1.0",
				created_at: "2024-01-01",
			},
			{
				id: "change3",
				entity_id: "entity3",
				schema_key: "schema_a",
				file_id: "file3",
				plugin_key: "plugin1",
				snapshot_content: JSON.stringify({ data: "a2" }),
				schema_version: "1.0",
				created_at: "2024-01-01",
			},
		],
		commit_id: "commit1",
		version_id: "v1",
	});

	// Test 1: Select test rows from vtable (filter by our specific test data)
	const allRows = await db
		.selectFrom("lix_internal_state_vtable")
		.select(["entity_id", "schema_key", "file_id"])
		.where("_pk", "like", "C%")
		.where("schema_key", "in", ["schema_a", "schema_b"])
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
		.selectFrom("lix_internal_state_vtable")
		.select(["entity_id", "schema_key", "file_id"])
		.where("_pk", "like", "C%")
		.where("schema_key", "=", "schema_a")
		.orderBy("entity_id")
		.execute();

	expect(schemaARows).toHaveLength(2);
	expect(schemaARows[0]?.entity_id).toBe("entity1");
	expect(schemaARows[1]?.entity_id).toBe("entity3");

	// Test 3: Select with entity_id filter
	const entity2Row = await db
		.selectFrom("lix_internal_state_vtable")
		.select(["entity_id", "schema_key", "file_id"])
		.where("_pk", "like", "C%")
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
		.selectFrom("lix_internal_state_vtable")
		.select(["entity_id", "schema_key", "file_id"])
		.where("_pk", "like", "C%")
		.where("schema_key", "=", "schema_a")
		.where("file_id", "=", "file3")
		.execute();

	expect(filteredRow).toHaveLength(1);
	expect(filteredRow[0]?.entity_id).toBe("entity3");
});
