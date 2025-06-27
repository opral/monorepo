import { test, expect, describe } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createEntityViewsIfNotExists } from "./entity-view-builder.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

describe("createEntityViewsIfNotExists (Integration)", () => {
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

	test("should create all three views: active, _all, and _history", async () => {
		const lix = await openLix({});

		// Add stored schema
		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "test_entity",
			"x-lix-version": "1.0",
			type: "object",
			properties: {
				id: { type: "string" },
				name: { type: "string" },
				value: { type: "number" },
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		createEntityViewsIfNotExists({
			lix,
			schema: testSchema,
			overrideName: "triple_test",
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Insert data through primary view
		await lix.db
			.insertInto("triple_test" as any)
			.values({ id: "test_id", name: "test_name", value: 42 })
			.execute();

		// All three views should be queryable
		const activeResult = await lix.db
			.selectFrom("triple_test" as any)
			.selectAll()
			.execute();

		const allResult = await lix.db
			.selectFrom("triple_test_all" as any)
			.selectAll()
			.execute();

		// Get the active version's change set to query history
		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.select("version.change_set_id")
			.executeTakeFirstOrThrow();

		const historyResult = await lix.db
			.selectFrom("triple_test_history" as any)
			.where("lixcol_change_set_id", "=", activeVersion.change_set_id)
			.selectAll()
			.execute();

		// All views should return data
		expect(activeResult).toHaveLength(1);
		expect(allResult).toHaveLength(1);
		expect(historyResult).toHaveLength(1);

		// Verify business data consistency across all views
		expect(activeResult[0]).toMatchObject({
			id: "test_id",
			name: "test_name",
			value: 42,
		});
		expect(allResult[0]).toMatchObject({
			id: "test_id",
			name: "test_name",
			value: 42,
		});
		expect(historyResult[0]).toMatchObject({
			id: "test_id",
			name: "test_name",
			value: 42,
		});

		// Verify column differences between views
		expect(activeResult[0]).not.toHaveProperty("lixcol_version_id"); // Primary view hides version_id
		expect(allResult[0]).toHaveProperty("lixcol_version_id"); // _all view exposes version_id
		expect(historyResult[0]).toHaveProperty("lixcol_change_set_id"); // _history view has history columns
		expect(historyResult[0]).toHaveProperty("lixcol_depth", 0); // Current state is at depth 0
	});

	test("should handle cross-view operations", async () => {
		const lix = await openLix({});

		// Add stored schema
		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "test_entity",
			"x-lix-version": "1.0",
			type: "object",
			properties: {
				id: { type: "string" },
				name: { type: "string" },
				value: { type: "number" },
			},
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		createEntityViewsIfNotExists({
			lix,
			schema: testSchema,
			overrideName: "cross_test",
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Insert through _all view
		await lix.db
			.insertInto("cross_test_all" as any)
			.values({ id: "test_id", name: "test_name", value: 42 })
			.execute();

		// Update through primary view
		await lix.db
			.updateTable("cross_test" as any)
			.where("id", "=", "test_id")
			.set({ name: "updated_name", value: 100 })
			.execute();

		// Update again to create history
		await lix.db
			.updateTable("cross_test" as any)
			.where("id", "=", "test_id")
			.set({ name: "final_name", value: 200 })
			.execute();

		// Verify update in both CRUD views
		const primaryResult = await lix.db
			.selectFrom("cross_test" as any)
			.selectAll()
			.execute();

		const allResult = await lix.db
			.selectFrom("cross_test_all" as any)
			.selectAll()
			.execute();

		expect(primaryResult[0]).toMatchObject({ name: "final_name", value: 200 });
		expect(allResult[0]).toMatchObject({ name: "final_name", value: 200 });

		// Verify history view shows current state and can access historical data
		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.select("version.change_set_id")
			.executeTakeFirstOrThrow();

		const historyResult = await lix.db
			.selectFrom("cross_test_history" as any)
			.where("entity_id", "=", "test_id")
			.where("lixcol_change_set_id", "=", activeVersion.change_set_id)
			.orderBy("lixcol_depth", "asc")
			.selectAll()
			.execute();

		expect(historyResult.length).toBeGreaterThan(0);

		// Current state should be at depth 0
		const currentState = historyResult.find((h: any) => h.lixcol_depth === 0);
		expect(currentState).toBeDefined();
		expect(currentState).toMatchObject({
			name: "final_name",
			value: 200,
		});

		// Delete through primary view
		await lix.db
			.deleteFrom("cross_test" as any)
			.where("id", "=", "test_id")
			.execute();

		// Verify deletion in both CRUD views
		const afterDeletePrimary = await lix.db
			.selectFrom("cross_test" as any)
			.selectAll()
			.execute();

		const afterDeleteAll = await lix.db
			.selectFrom("cross_test_all" as any)
			.selectAll()
			.execute();

		expect(afterDeletePrimary).toHaveLength(0);
		expect(afterDeleteAll).toHaveLength(0);
	});

	test("should use consistent naming conventions", async () => {
		const lix = await openLix({});

		createEntityViewsIfNotExists({
			lix,
			schema: testSchema,
			// No overrideName - should use schema["x-lix-key"] as base
			pluginKey: "test_plugin",
			hardcodedFileId: "test_file",
		});

		// Should create views with default names based on schema key
		// Primary view: test_entity
		// All view: test_entity_all
		// History view: test_entity_history

		// Test primary view
		await lix.db
			.insertInto("test_entity" as any)
			.values({ id: "test_id", name: "test_name", value: 42 })
			.execute();

		const primaryResult = await lix.db
			.selectFrom("test_entity" as any)
			.selectAll()
			.execute();

		expect(primaryResult).toHaveLength(1);

		// Test _all view
		const allResult = await lix.db
			.selectFrom("test_entity_all" as any)
			.selectAll()
			.execute();

		expect(allResult).toHaveLength(1);

		// Test _history view
		const historyViews = await lix.db
			.selectFrom("test_entity_history" as any)
			.selectAll()
			.limit(1)
			.execute();

		// History view should exist (even if no results match current query)
		expect(historyViews).toBeDefined();
	});

	test("should handle validation and error cases", async () => {
		const lix = await openLix({});

		const invalidSchema: LixSchemaDefinition = {
			"x-lix-key": "invalid_schema",
			"x-lix-version": "1.0",
			type: "object",
			properties: {
				name: { type: "string" },
			},
		} as const;

		// Should throw error for all view types when schema is invalid
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
});
