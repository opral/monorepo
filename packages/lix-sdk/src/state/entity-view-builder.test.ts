import { test, expect, describe } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createEntityViewsIfNotExists } from "./entity-view-builder.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

describe("createEntityViewsIfNotExists", () => {
	const testSchema: LixSchemaDefinition = {
		"x-lix-key": "test_entity",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["id"],
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
			value: { type: "number" },
		},
		required: ["id", "name"],
	} as const;

	const compositeKeySchema: LixSchemaDefinition = {
		"x-lix-key": "composite_entity",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["category", "id"],
		type: "object",
		properties: {
			category: { type: "string" },
			id: { type: "string" },
			data: { type: "string" },
		},
		required: ["category", "id"],
	} as const;

	test("should throw error if schema has no primary key", async () => {
		const lix = await openLixInMemory({});

		const invalidSchema: LixSchemaDefinition = {
			"x-lix-key": "invalid_schema",
			"x-lix-version": "1.0",
			type: "object",
			properties: {
				name: { type: "string" },
			},
		} as const;

		expect(() => {
			createEntityViewsIfNotExists({
				lix,
				schema: invalidSchema,
				pluginKey: "test_plugin",
			});
		}).toThrow(
			"Schema must define 'x-lix-primary-key' for entity view generation"
		);
	});

	test("should create view with correct columns", async () => {
		const lix = await openLixInMemory({});

		createEntityViewsIfNotExists({
			lix,
			schema: testSchema,
			overrideName: "test_view",
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Insert test data and verify all expected columns exist
		await lix.db
			.insertInto("test_view" as any)
			.values({
				id: "test_id",
				name: "test_name",
				value: 42,
			})
			.execute();

		// Query the view and check all columns are present
		const result = await lix.db
			.selectFrom("test_view" as any)
			.selectAll()
			.execute();

		expect(result).toHaveLength(1);
		const entity = result[0];

		// Business logic columns
		expect(entity).toHaveProperty("id", "test_id");
		expect(entity).toHaveProperty("name", "test_name");
		expect(entity).toHaveProperty("value", 42);

		// Operational columns (regular view doesn't expose lixcol_version_id)
		expect(entity).not.toHaveProperty("lixcol_version_id");
		expect(entity).toHaveProperty("lixcol_inherited_from_version_id");
		expect(entity).toHaveProperty("lixcol_created_at");
		expect(entity).toHaveProperty("lixcol_updated_at");
		expect(entity).toHaveProperty("lixcol_file_id", "test_file");
	});

	test("should create CRUD triggers", async () => {
		const lix = await openLixInMemory({});

		createEntityViewsIfNotExists({
			lix,
			schema: testSchema,
			overrideName: "test_view",
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Test that CRUD operations work (which proves triggers exist and function)

		// INSERT trigger test
		await lix.db
			.insertInto("test_view" as any)
			.values({ id: "test_id", name: "test_name", value: 42 })
			.execute();

		let result = await lix.db
			.selectFrom("test_view" as any)
			.selectAll()
			.execute();
		expect(result).toHaveLength(1);

		// UPDATE trigger test
		await lix.db
			.updateTable("test_view" as any)
			.where("id", "=", "test_id")
			.set({ name: "updated_name" })
			.execute();

		result = await lix.db
			.selectFrom("test_view" as any)
			.selectAll()
			.execute();
		expect(result[0]).toMatchObject({ name: "updated_name" });

		// DELETE trigger test
		await lix.db
			.deleteFrom("test_view" as any)
			.where("id", "=", "test_id")
			.execute();

		result = await lix.db
			.selectFrom("test_view" as any)
			.selectAll()
			.execute();
		expect(result).toHaveLength(0);
	});

	test("should handle insert operations without defaults", async () => {
		const lix = await openLixInMemory({});

		createEntityViewsIfNotExists({
			lix,
			schema: testSchema,
			overrideName: "test_view",
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Insert data through the view
		await lix.db
			.insertInto("test_view" as any)
			.values({
				id: "test_id",
				name: "test_name",
				value: 42,
			})
			.execute();

		// Verify data was inserted into state table
		const stateData = await lix.db
			.selectFrom("state")
			.selectAll()
			.where("schema_key", "=", "test_entity")
			.execute();

		expect(stateData).toHaveLength(1);
		expect(stateData[0]).toMatchObject({
			entity_id: "test_id",
			schema_key: "test_entity",
			file_id: "test_file",
			plugin_key: "test_plugin",
			snapshot_content: {
				id: "test_id",
				name: "test_name",
				value: 42,
			},
		});

		// Verify data can be read through the view
		const viewData = await lix.db
			.selectFrom("test_view" as any)
			.selectAll()
			.execute();

		expect(viewData).toHaveLength(1);
		expect(viewData[0]).toMatchObject({
			id: "test_id",
			name: "test_name",
			value: 42,
		});
	});

	test("should handle update operations", async () => {
		const lix = await openLixInMemory({});

		createEntityViewsIfNotExists({
			lix,
			schema: testSchema,
			overrideName: "test_view",
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Insert initial data
		await lix.db
			.insertInto("test_view" as any)
			.values({
				id: "test_id",
				name: "original_name",
				value: 42,
			})
			.execute();

		// Update through the view
		await lix.db
			.updateTable("test_view" as any)
			.where("id", "=", "test_id")
			.set({
				name: "updated_name",
				value: 100,
			})
			.execute();

		// Verify update in view
		const viewData = await lix.db
			.selectFrom("test_view" as any)
			.selectAll()
			.execute();

		expect(viewData).toHaveLength(1);
		expect(viewData[0]).toMatchObject({
			id: "test_id",
			name: "updated_name",
			value: 100,
		});

		// Verify update in state table
		const stateData = await lix.db
			.selectFrom("state")
			.selectAll()
			.where("entity_id", "=", "test_id")
			.execute();

		expect(stateData[0]?.snapshot_content).toMatchObject({
			id: "test_id",
			name: "updated_name",
			value: 100,
		});
	});

	test("should handle delete operations", async () => {
		const lix = await openLixInMemory({});

		createEntityViewsIfNotExists({
			lix,
			schema: testSchema,
			overrideName: "test_view",
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Insert data
		await lix.db
			.insertInto("test_view" as any)
			.values({
				id: "test_id",
				name: "test_name",
				value: 42,
			})
			.execute();

		// Delete through the view
		await lix.db
			.deleteFrom("test_view" as any)
			.where("id", "=", "test_id")
			.execute();

		// Verify deletion in view
		const viewData = await lix.db
			.selectFrom("test_view" as any)
			.selectAll()
			.execute();

		expect(viewData).toHaveLength(0);

		// Verify deletion in state table
		const stateData = await lix.db
			.selectFrom("state")
			.selectAll()
			.where("entity_id", "=", "test_id")
			.execute();

		expect(stateData).toHaveLength(0);
	});

	test("should handle composite primary keys", async () => {
		const lix = await openLixInMemory({});

		createEntityViewsIfNotExists({
			lix,
			schema: compositeKeySchema,
			overrideName: "composite_view",
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Insert data with composite key
		await lix.db
			.insertInto("composite_view" as any)
			.values({
				category: "cat1",
				id: "id1",
				data: "test_data",
			})
			.execute();

		// Verify data was inserted with composite entity_id
		const stateData = await lix.db
			.selectFrom("state")
			.selectAll()
			.where("schema_key", "=", "composite_entity")
			.execute();

		expect(stateData).toHaveLength(1);
		expect(stateData[0]?.entity_id).toBe("cat1::id1"); // Composite key joined with ::

		// Update with composite key
		await lix.db
			.updateTable("composite_view" as any)
			.where("category", "=", "cat1")
			.where("id", "=", "id1")
			.set({ data: "updated_data" })
			.execute();

		// Verify update
		const updatedData = await lix.db
			.selectFrom("composite_view" as any)
			.selectAll()
			.execute();

		expect(updatedData[0]).toMatchObject({
			category: "cat1",
			id: "id1",
			data: "updated_data",
		});

		// Delete with composite key
		await lix.db
			.deleteFrom("composite_view" as any)
			.where("category", "=", "cat1")
			.where("id", "=", "id1")
			.execute();

		const afterDelete = await lix.db
			.selectFrom("composite_view" as any)
			.selectAll()
			.execute();

		expect(afterDelete).toHaveLength(0);
	});

	test("should handle default values", async () => {
		const lix = await openLixInMemory({});

		let defaultIdCalled = false;
		let defaultValueCalled = false;

		createEntityViewsIfNotExists({
			lix,
			schema: testSchema,
			overrideName: "test_view",
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
			defaultValues: {
				id: () => {
					defaultIdCalled = true;
					return "generated_id";
				},
				value: () => {
					defaultValueCalled = true;
					return "999";
				},
			},
		});

		// Insert without providing default values
		await lix.db
			.insertInto("test_view" as any)
			.values({
				name: "test_name",
				// id and value should use defaults
			})
			.execute();

		expect(defaultIdCalled).toBe(true);
		expect(defaultValueCalled).toBe(true);

		// Verify defaults were applied
		const viewData = await lix.db
			.selectFrom("test_view" as any)
			.selectAll()
			.execute();

		expect(viewData).toHaveLength(1);
		expect(viewData[0]).toMatchObject({
			id: "generated_id",
			name: "test_name",
			value: 999, // Should be converted to number
		});

		// Insert with explicit values (should override defaults)
		await lix.db
			.insertInto("test_view" as any)
			.values({
				id: "explicit_id",
				name: "test_name_2",
				value: 500,
			})
			.execute();

		const allData = await lix.db
			.selectFrom("test_view" as any)
			.selectAll()
			.orderBy("id")
			.execute();

		expect(allData).toHaveLength(2);
		// Find the explicit entry (ordering might vary)
		const explicitEntry = allData.find(
			(item: any) => item.id === "explicit_id"
		);
		expect(explicitEntry).toMatchObject({
			id: "explicit_id",
			name: "test_name_2",
			value: 500,
		});
	});

	test("should use dynamic file_id when not hardcoded", async () => {
		const lix = await openLixInMemory({});

		createEntityViewsIfNotExists({
			lix,
			schema: testSchema,
			overrideName: "test_view",
			pluginKey: "test_plugin",
			// No hardcodedFileId - should use lixcol_file_id from mutations
		});

		// Insert with explicit file_id
		await lix.db
			.insertInto("test_view" as any)
			.values({
				id: "test_id",
				name: "test_name",
				value: 42,
				lixcol_file_id: "dynamic_file",
			})
			.execute();

		// Verify file_id was used from the mutation
		const stateData = await lix.db
			.selectFrom("state")
			.selectAll()
			.where("entity_id", "=", "test_id")
			.execute();

		expect(stateData[0]).toMatchObject({
			file_id: "dynamic_file",
		});
	});

	test("should use schema key as default view name", async () => {
		const lix = await openLixInMemory({});

		createEntityViewsIfNotExists({
			lix,
			schema: testSchema,
			// No overrideName - should use schema["x-lix-key"]
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Test that we can query the view using the schema key name
		await lix.db
			.insertInto("test_entity" as any)
			.values({ id: "test_id", name: "test_name", value: 42 })
			.execute();

		const result = await lix.db
			.selectFrom("test_entity" as any)
			.selectAll()
			.execute();

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			id: "test_id",
			name: "test_name",
			value: 42,
		});
	});

	test("should create both primary and _all views", async () => {
		const lix = await openLixInMemory({});

		createEntityViewsIfNotExists({
			lix,
			schema: testSchema,
			overrideName: "dual_test",
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Insert data through primary view (active only)
		await lix.db
			.insertInto("dual_test" as any)
			.values({ id: "test_id", name: "test_name", value: 42 })
			.execute();

		// Both views should be queryable
		const primaryResult = await lix.db
			.selectFrom("dual_test" as any)
			.selectAll()
			.execute();

		const allResult = await lix.db
			.selectFrom("dual_test_all" as any)
			.selectAll()
			.execute();

		// Both should return the same data for active version
		expect(primaryResult).toHaveLength(1);
		expect(allResult).toHaveLength(1);
		expect(primaryResult[0]).toMatchObject({
			id: "test_id",
			name: "test_name",
			value: 42,
		});
		expect(allResult[0]).toMatchObject({
			id: "test_id",
			name: "test_name",
			value: 42,
		});

		// Verify version column visibility
		expect(primaryResult[0]).not.toHaveProperty("lixcol_version_id"); // Regular view hides version_id
		expect(allResult[0]).toHaveProperty("lixcol_version_id"); // _all view exposes version_id
	});

	test("should handle CRUD operations on both views", async () => {
		const lix = await openLixInMemory({});

		createEntityViewsIfNotExists({
			lix,
			schema: testSchema,
			overrideName: "crud_test",
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Insert through _all view
		await lix.db
			.insertInto("crud_test_all" as any)
			.values({ id: "test_id", name: "test_name", value: 42 })
			.execute();

		// Update through primary view
		await lix.db
			.updateTable("crud_test" as any)
			.where("id", "=", "test_id")
			.set({ name: "updated_name" })
			.execute();

		// Verify update in both views
		const primaryResult = await lix.db
			.selectFrom("crud_test" as any)
			.selectAll()
			.execute();

		const allResult = await lix.db
			.selectFrom("crud_test_all" as any)
			.selectAll()
			.execute();

		expect(primaryResult[0]).toMatchObject({ name: "updated_name" });
		expect(allResult[0]).toMatchObject({ name: "updated_name" });

		// Delete through primary view
		await lix.db
			.deleteFrom("crud_test" as any)
			.where("id", "=", "test_id")
			.execute();

		// Verify deletion in both views
		const afterDeletePrimary = await lix.db
			.selectFrom("crud_test" as any)
			.selectAll()
			.execute();

		const afterDeleteAll = await lix.db
			.selectFrom("crud_test_all" as any)
			.selectAll()
			.execute();

		expect(afterDeletePrimary).toHaveLength(0);
		expect(afterDeleteAll).toHaveLength(0);
	});
});
