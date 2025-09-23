import { test, expect } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { updateStateCache } from "./update-state-cache.js";
import { selectFromStateCache } from "./select-from-state-cache.js";

test("selecting from vtable queries per-schema physical tables", async () => {
	const lix = await openLix({});
	const engine = lix.engine!;

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
	const { rows: allRows } = engine.executeSync(
		selectFromStateCache("schema_a")
			.select(["entity_id", "schema_key", "file_id"])
			.unionAll(
				selectFromStateCache("schema_b").select([
					"entity_id",
					"schema_key",
					"file_id",
				])
			)
			.orderBy("entity_id", "asc")
			.compile()
	);

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
	const { rows: onlySchemaA } = engine.executeSync(
		selectFromStateCache("schema_a")
			.select(["entity_id", "schema_key", "file_id"])
			.orderBy("entity_id")
			.compile()
	);

	expect(onlySchemaA).toHaveLength(2);
	expect(onlySchemaA[0]?.entity_id).toBe("entity1");
	expect(onlySchemaA[1]?.entity_id).toBe("entity3");

	// Test 3: Select with entity_id filter
	const { rows: entity2Row } = engine.executeSync(
		selectFromStateCache("schema_b")
			.select(["entity_id", "schema_key", "file_id"])
			.where("entity_id", "=", "entity2")
			.compile()
	);

	expect(entity2Row).toHaveLength(1);
	expect(entity2Row[0]).toMatchObject({
		entity_id: "entity2",
		schema_key: "schema_b",
		file_id: "file2",
	});

	// Test 4: Select with multiple filters
	const { rows: filteredRow } = engine.executeSync(
		selectFromStateCache("schema_a")
			.select(["entity_id", "schema_key", "file_id"])
			.where("file_id", "=", "file3")
			.compile()
	);

	expect(filteredRow).toHaveLength(1);
	expect(filteredRow[0]?.entity_id).toBe("entity3");
});
