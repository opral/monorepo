import { test, expect, describe } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createEntityStateAllView } from "./entity-state-all.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

describe("createEntityAllViewIfNotExists", () => {
	const testSchema: LixSchemaDefinition = {
		"x-lix-key": "test_entity",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["id"],
		type: "object",
		additionalProperties: false,
		properties: {
			id: { type: "string" },
			name: { type: "string" },
			value: { type: "number" },
		},
		required: ["id", "name"],
	} as const;

	test("should throw error if schema has no primary key", async () => {
		const lix = await openLix({});

		const invalidSchema: LixSchemaDefinition = {
			"x-lix-key": "invalid_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				name: { type: "string" },
			},
		} as const;

		expect(() => {
			createEntityStateAllView({
				engine: lix.engine!,
				schema: invalidSchema,
				pluginKey: "test_plugin",
			});
		}).toThrow(
			"Schema must define 'x-lix-primary-key' for entity view generation"
		);
	});

	test("should create view with correct columns (including lixcol_version_id)", async () => {
		const lix = await openLix({});

		createEntityStateAllView({
			engine: lix.engine!,
			schema: testSchema,
			overrideName: "test_view_all",
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Insert test data and verify all expected columns exist
		await lix.db
			.insertInto("test_view_all" as any)
			.values({
				id: "test_id",
				name: "test_name",
				value: 42,
				lixcol_version_id: lix.db
					.selectFrom("active_version")
					.select("version_id"),
			})
			.execute();

		// Query the view and check all columns are present
		const result = await lix.db
			.selectFrom("test_view_all" as any)
			.selectAll()
			.execute();

		expect(result).toHaveLength(1);
		const entity = result[0];

		// Business logic columns
		expect(entity).toHaveProperty("id", "test_id");
		expect(entity).toHaveProperty("name", "test_name");
		expect(entity).toHaveProperty("value", 42);

		// Operational columns (_all view exposes lixcol_version_id)
		expect(entity).toHaveProperty("lixcol_version_id");
		expect(entity).toHaveProperty("lixcol_inherited_from_version_id");
		expect(entity).toHaveProperty("lixcol_created_at");
		expect(entity).toHaveProperty("lixcol_updated_at");
		expect(entity).toHaveProperty("lixcol_file_id", "test_file");
	});

	test("should create CRUD triggers for _all view", async () => {
		const lix = await openLix({});

		createEntityStateAllView({
			engine: lix.engine!,
			schema: testSchema,
			overrideName: "test_view_all",
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Test that CRUD operations work (which proves triggers exist and function)

		// INSERT trigger test
		await lix.db
			.insertInto("test_view_all" as any)
			.values({
				id: "test_id",
				name: "test_name",
				value: 42,
				lixcol_version_id: lix.db
					.selectFrom("active_version")
					.select("version_id"),
			})
			.execute();

		let result = await lix.db
			.selectFrom("test_view_all" as any)
			.selectAll()
			.execute();
		expect(result).toHaveLength(1);

		// UPDATE trigger test
		await lix.db
			.updateTable("test_view_all" as any)
			.where("id", "=", "test_id")
			.where("lixcol_version_id", "=", result[0]!.lixcol_version_id)
			.set({ name: "updated_name" })
			.execute();

		result = await lix.db
			.selectFrom("test_view_all" as any)
			.selectAll()
			.execute();
		expect(result[0]).toMatchObject({ name: "updated_name" });

		// DELETE trigger test
		await lix.db
			.deleteFrom("test_view_all" as any)
			.where("id", "=", "test_id")
			.execute();

		result = await lix.db
			.selectFrom("test_view_all" as any)
			.selectAll()
			.execute();
		expect(result).toHaveLength(0);
	});

	test("should handle explicit version_id in _all view", async () => {
		const lix = await openLix({});

		createEntityStateAllView({
			engine: lix.engine!,
			schema: testSchema,
			overrideName: "test_view_all",
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Get active version to test with
		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirstOrThrow();

		// Insert with explicit version_id
		await lix.db
			.insertInto("test_view_all" as any)
			.values({
				id: "test_id",
				name: "test_name",
				value: 42,
				lixcol_version_id: activeVersion.version_id,
			})
			.execute();

		// Verify explicit version_id was used
		const stateData = await lix.db
			.selectFrom("state_all")
			.selectAll()
			.where("entity_id", "=", "test_id")
			.execute();

		expect(stateData[0]).toMatchObject({
			version_id: activeVersion.version_id,
		});

		// Verify version_id is visible in _all view
		const viewData = await lix.db
			.selectFrom("test_view_all" as any)
			.selectAll()
			.execute();

		expect(viewData[0]).toHaveProperty(
			"lixcol_version_id",
			activeVersion.version_id
		);
	});

	test("should handle default values in _all view", async () => {
		const lix = await openLix({});

		let defaultIdCalled = false;
		let defaultValueCalled = false;

		createEntityStateAllView({
			engine: lix.engine!,
			schema: testSchema,
			overrideName: "test_view_all",
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

		// Get active version
		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirstOrThrow();

		// Insert without providing default values
		await lix.db
			.insertInto("test_view_all" as any)
			.values({
				name: "test_name",
				lixcol_version_id: activeVersion.version_id,
				// id and value should use defaults
			})
			.execute();

		expect(defaultIdCalled).toBe(true);
		expect(defaultValueCalled).toBe(true);

		// Verify defaults were applied
		const viewData = await lix.db
			.selectFrom("test_view_all" as any)
			.selectAll()
			.execute();

		expect(viewData).toHaveLength(1);
		expect(viewData[0]).toMatchObject({
			id: "generated_id",
			name: "test_name",
			value: 999, // Should be converted to number
		});

		// Verify version_id is present
		expect(viewData[0]).toHaveProperty("lixcol_version_id");
	});

	test("should use schema key + _all as default view name", async () => {
		const lix = await openLix({});

		createEntityStateAllView({
			engine: lix.engine!,
			schema: testSchema,
			// No overrideName - should use schema["x-lix-key"] + "_all"
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Get active version
		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirstOrThrow();

		// Test that we can query the view using the schema key + _all name
		await lix.db
			.insertInto("test_entity_all" as any)
			.values({
				id: "test_id",
				name: "test_name",
				value: 42,
				lixcol_version_id: activeVersion.version_id,
			})
			.execute();

		const result = await lix.db
			.selectFrom("test_entity_all" as any)
			.selectAll()
			.execute();

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			id: "test_id",
			name: "test_name",
			value: 42,
		});
		expect(result[0]).toHaveProperty("lixcol_version_id");
	});

	test("should handle cross-version operations", async () => {
		const lix = await openLix({});

		createEntityStateAllView({
			engine: lix.engine!,
			schema: testSchema,
			overrideName: "cross_version_test",
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Get current active version
		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirstOrThrow();

		// Insert with explicit version
		await lix.db
			.insertInto("cross_version_test" as any)
			.values({
				id: "test_id",
				name: "test_name",
				value: 42,
				lixcol_version_id: activeVersion.version_id,
			})
			.execute();

		// Verify we can query cross-version data
		const allVersionData = await lix.db
			.selectFrom("cross_version_test" as any)
			.selectAll()
			.execute();

		expect(allVersionData).toHaveLength(1);
		expect(allVersionData[0]).toMatchObject({
			id: "test_id",
			name: "test_name",
			value: 42,
			lixcol_version_id: activeVersion.version_id,
		});

		// Update with version-specific information
		await lix.db
			.updateTable("cross_version_test" as any)
			.where("id", "=", "test_id")
			.where("lixcol_version_id", "=", activeVersion.version_id)
			.set({ name: "updated_cross_version" })
			.execute();

		const updatedData = await lix.db
			.selectFrom("cross_version_test" as any)
			.selectAll()
			.execute();

		expect(updatedData[0]).toMatchObject({
			name: "updated_cross_version",
			lixcol_version_id: activeVersion.version_id,
		});
	});

	test("should expose lixcol_untracked column for untracked state operations", async () => {
		const lix = await openLix({});

		createEntityStateAllView({
			engine: lix.engine!,
			schema: testSchema,
			overrideName: "test_view_all",
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Get active version
		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirstOrThrow();

		// Insert tracked entity (default)
		await lix.db
			.insertInto("test_view_all" as any)
			.values({
				id: "tracked_entity",
				name: "tracked",
				value: 100,
				lixcol_version_id: activeVersion.version_id,
			})
			.execute();

		// Insert untracked entity
		await lix.db
			.insertInto("test_view_all" as any)
			.values({
				id: "untracked_entity",
				name: "untracked",
				value: 200,
				lixcol_version_id: activeVersion.version_id,
				lixcol_untracked: true,
			})
			.execute();

		// Query all entities
		const allEntities = await lix.db
			.selectFrom("test_view_all" as any)
			.selectAll()
			.orderBy("id")
			.execute();

		expect(allEntities).toHaveLength(2);

		// Verify tracked entity
		const trackedEntity = allEntities.find(
			(e: any) => e.id === "tracked_entity"
		);
		expect(trackedEntity).toBeDefined();
		expect(trackedEntity!.lixcol_untracked).toBe(0); // false

		// Verify untracked entity
		const untrackedEntity = allEntities.find(
			(e: any) => e.id === "untracked_entity"
		);
		expect(untrackedEntity).toBeDefined();
		expect(untrackedEntity!.lixcol_untracked).toBe(1); // true

		// Query only untracked entities
		const onlyUntracked = await lix.db
			.selectFrom("test_view_all" as any)
			.where("lixcol_untracked", "=", true)
			.selectAll()
			.execute();

		expect(onlyUntracked).toHaveLength(1);
		expect(onlyUntracked[0]?.id).toBe("untracked_entity");

		// Query only tracked entities
		const onlyTracked = await lix.db
			.selectFrom("test_view_all" as any)
			.where("lixcol_untracked", "=", false)
			.selectAll()
			.execute();

		expect(onlyTracked).toHaveLength(1);
		expect(onlyTracked[0]?.id).toBe("tracked_entity");
	});

	test("should expose lixcol_commit_id for history queries", async () => {
		const lix = await openLix({});

		// Store the test schema
		await lix.db
			.insertInto("stored_schema")
			.values({ value: testSchema })
			.execute();

		createEntityStateAllView({
			engine: lix.engine!,
			schema: testSchema,
			overrideName: "test_view_all",
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Get the active version ID
		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirst();

		// Insert test data through the view
		await lix.db
			.insertInto("test_view_all" as any)
			.values({
				id: "test_id",
				name: "test_name",
				value: 42,
				lixcol_version_id: activeVersion?.version_id,
			})
			.execute();

		// Query the view and verify lixcol_commit_id is exposed
		const result = await lix.db
			.selectFrom("test_view_all" as any)
			.selectAll()
			.execute();

		expect(result).toHaveLength(1);
		const entity = result[0];

		// Verify that lixcol_commit_id is exposed
		expect(entity).toHaveProperty("lixcol_commit_id");
		expect(entity?.lixcol_commit_id).toBeDefined();
		expect(typeof entity?.lixcol_commit_id).toBe("string");

		// Verify we can query by lixcol_commit_id
		const queryByChangeSetId = await lix.db
			.selectFrom("test_view_all" as any)
			.where("lixcol_commit_id", "=", entity?.lixcol_commit_id)
			.where("lixcol_version_id", "=", activeVersion?.version_id)
			.selectAll()
			.execute();

		expect(queryByChangeSetId).toHaveLength(1);
		expect(queryByChangeSetId[0]?.id).toBe("test_id");

		// Also verify it's exposed alongside other lixcol columns
		expect(entity).toHaveProperty("lixcol_version_id");
		expect(entity).toHaveProperty("lixcol_inherited_from_version_id");
		expect(entity).toHaveProperty("lixcol_created_at");
		expect(entity).toHaveProperty("lixcol_updated_at");
		expect(entity).toHaveProperty("lixcol_file_id");
		expect(entity).toHaveProperty("lixcol_change_id");
		expect(entity).toHaveProperty("lixcol_untracked");
	});

	test("should expose lixcol_entity_id, lixcol_schema_key, lixcol_file_id, and lixcol_plugin_key in _all view", async () => {
		const lix = await openLix({});

		createEntityStateAllView({
			engine: lix.engine!,
			schema: testSchema,
			overrideName: "test_view_all",
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Get active version
		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirstOrThrow();

		// Insert test data
		await lix.db
			.insertInto("test_view_all" as any)
			.values({
				id: "test_id",
				name: "test_name",
				value: 42,
				lixcol_version_id: activeVersion.version_id,
			})
			.execute();

		// Query the view to verify all entity identification columns are exposed
		const result = await lix.db
			.selectFrom("test_view_all" as any)
			.select([
				"id",
				"name",
				"lixcol_entity_id",
				"lixcol_schema_key",
				"lixcol_file_id",
				"lixcol_plugin_key",
				"lixcol_version_id", // _all views also have version_id
			])
			.executeTakeFirst();

		expect(result).toBeDefined();

		// Verify all required lixcol_ columns are present and have correct values
		expect(result?.lixcol_entity_id).toBe("test_id");
		expect(result?.lixcol_schema_key).toBe("test_entity");
		expect(result?.lixcol_file_id).toBe("test_file");
		expect(result?.lixcol_plugin_key).toBe("test_plugin");
		expect(result?.lixcol_version_id).toBeDefined();
	});

	test("DELETE with version_id only affects the specified version", async () => {
		const lix = await openLix({});

		// Create the entity view
		createEntityStateAllView({
			engine: lix.engine!,
			schema: testSchema,
			overrideName: "test_view_all",
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Create parent and child versions
		const { createVersion } = await import("../version/create-version.js");
		const parentVersion = await createVersion({ lix, id: "parent-version" });

		await createVersion({
			lix,
			id: "child-version",
			inheritsFrom: parentVersion,
		});

		// Insert entity into parent version
		await lix.db
			.insertInto("test_view_all" as any)
			.values({
				id: "shared-entity",
				name: "parent-value",
				value: 100,
				lixcol_version_id: "parent-version",
			})
			.execute();

		// Verify entity exists in parent version's state_all
		const parentStateBefore = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "=", "parent-version")
			.selectAll()
			.execute();

		expect(parentStateBefore).toHaveLength(1);
		expect(parentStateBefore[0]!.snapshot_content).toEqual({
			id: "shared-entity",
			name: "parent-value",
			value: 100,
		});

		// Attempt to delete the entity from child version
		// This should not affect any data since the entity doesn't exist in child version
		await lix.db
			.deleteFrom("test_view_all" as any)
			.where("id", "=", "shared-entity")
			.where("lixcol_version_id", "=", "child-version")
			.execute();

		// Verify parent version still has the entity
		const parentStateAfter = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "=", "parent-version")
			.selectAll()
			.execute();

		expect(parentStateAfter).toHaveLength(1);
		expect(parentStateAfter[0]!.snapshot_content).toEqual({
			id: "shared-entity",
			name: "parent-value",
			value: 100,
		});

		// Verify child version has no entry
		const childState = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "=", "child-version")
			.selectAll()
			.execute();

		expect(childState).toHaveLength(0);
	});
});
