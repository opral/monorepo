import { test, expect, describe } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createEntityStateHistoryView } from "./entity-state-history.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

describe("createEntityHistoryViewIfNotExists", () => {
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
		additionalProperties: false,
	} as const;

	test("should throw error if schema has no primary key", async () => {
		const lix = await openLixInMemory({});

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
			createEntityStateHistoryView({
				lix,
				schema: invalidSchema,
			});
		}).toThrow(
			"Schema must define 'x-lix-primary-key' for entity history view generation"
		);
	});

	test("should create history view with correct columns", async () => {
		const lix = await openLixInMemory({});

		createEntityStateHistoryView({
			lix,
			schema: testSchema,
			overrideName: "test_entity_history",
		});

		// Insert some test data into state to create history
		await lix.db
			.insertInto("state")
			.values({
				entity_id: "test_id",
				schema_key: "test_entity",
				file_id: "test_file",
				plugin_key: "test_plugin",
				snapshot_content: {
					id: "test_id",
					name: "test_name",
					value: 42,
				},
				schema_version: "1.0",
				version_id: lix.db.selectFrom("active_version").select("version_id"),
			})
			.execute();

		// Get the active version's change set to query history
		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.select("version.change_set_id")
			.executeTakeFirstOrThrow();

		// Query the history view
		const historyResult = await lix.db
			.selectFrom("test_entity_history" as any)
			.where("lixcol_change_set_id", "=", activeVersion.change_set_id)
			.selectAll()
			.execute();

		expect(historyResult).toHaveLength(1);
		const historyEntity = historyResult[0];

		// Business logic columns
		expect(historyEntity).toHaveProperty("id", "test_id");
		expect(historyEntity).toHaveProperty("name", "test_name");
		expect(historyEntity).toHaveProperty("value", 42);

		// History-specific columns
		expect(historyEntity).toHaveProperty("entity_id", "test_id");
		expect(historyEntity).toHaveProperty("schema_key", "test_entity");
		expect(historyEntity).toHaveProperty("lixcol_file_id", "test_file");
		expect(historyEntity).toHaveProperty("lixcol_plugin_key", "test_plugin");
		expect(historyEntity).toHaveProperty("lixcol_schema_version", "1.0");
		expect(historyEntity).toHaveProperty("lixcol_change_id");
		expect(historyEntity).toHaveProperty(
			"lixcol_change_set_id",
			activeVersion.change_set_id
		);
		expect(historyEntity).toHaveProperty("lixcol_depth", 0);
	});

	test("should use schema key + _history as default view name", async () => {
		const lix = await openLixInMemory({});

		createEntityStateHistoryView({
			lix,
			schema: testSchema,
			// No overrideName - should use schema["x-lix-key"] + "_history"
		});

		// Insert test data
		await lix.db
			.insertInto("state")
			.values({
				entity_id: "test_id",
				schema_key: "test_entity",
				file_id: "test_file",
				plugin_key: "test_plugin",
				snapshot_content: {
					id: "test_id",
					name: "test_name",
					value: 42,
				},
				schema_version: "1.0",
				version_id: lix.db.selectFrom("active_version").select("version_id"),
			})
			.execute();

		// Get the active version's change set to query history
		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.select("version.change_set_id")
			.executeTakeFirstOrThrow();

		// Test that we can query the view using the schema key + _history name
		const result = await lix.db
			.selectFrom("test_entity_history" as any)
			.where("lixcol_change_set_id", "=", activeVersion.change_set_id)
			.selectAll()
			.execute();

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			id: "test_id",
			name: "test_name",
			value: 42,
		});
	});

	test("should query historical states at different depths", async () => {
		const lix = await openLixInMemory({});

		// Add stored schema first
		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "test_entity",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
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

		createEntityStateHistoryView({
			lix,
			schema: testSchema,
			overrideName: "test_history",
		});

		// Insert initial state
		await lix.db
			.insertInto("state")
			.values({
				entity_id: "tracked_entity",
				schema_key: "test_entity",
				file_id: "test_file",
				plugin_key: "test_plugin",
				snapshot_content: { id: "tracked_entity", name: "initial", value: 1 },
				schema_version: "1.0",
				version_id: lix.db.selectFrom("active_version").select("version_id"),
			})
			.execute();

		// Update to create history
		await lix.db
			.updateTable("state")
			.set({
				snapshot_content: { id: "tracked_entity", name: "updated", value: 2 },
			})
			.where("entity_id", "=", "tracked_entity")
			.execute();

		// Update again to create more history
		await lix.db
			.updateTable("state")
			.set({
				snapshot_content: { id: "tracked_entity", name: "final", value: 3 },
			})
			.where("entity_id", "=", "tracked_entity")
			.execute();

		// Get the active version's change set to query history
		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.select("version.change_set_id")
			.executeTakeFirstOrThrow();

		// Query all history for this entity
		const historyResult = await lix.db
			.selectFrom("test_history" as any)
			.where("entity_id", "=", "tracked_entity")
			.where("lixcol_change_set_id", "=", activeVersion.change_set_id)
			.orderBy("lixcol_depth", "asc")
			.selectAll()
			.execute();

		expect(historyResult.length).toBeGreaterThan(0);

		// Current state should be at depth 0
		const currentState = historyResult.find((h: any) => h.lixcol_depth === 0);
		expect(currentState).toBeDefined();
		expect(currentState).toMatchObject({
			name: "final",
			value: 3,
		});

		// Check that different depths exist if there's history
		if (historyResult.length > 1) {
			const depthValues = historyResult.map((h: any) => h.lixcol_depth);
			expect(depthValues).toContain(0); // Current state
			expect(Math.max(...depthValues)).toBeGreaterThan(0); // At least one historical state
		}
	});

	test("should be read-only (no CRUD triggers)", async () => {
		const lix = await openLixInMemory({});

		createEntityStateHistoryView({
			lix,
			schema: testSchema,
			overrideName: "readonly_history",
		});

		// History views should be read-only, so INSERT/UPDATE/DELETE should fail
		// This test verifies that no CRUD triggers were created

		// Attempt to insert should fail (no INSERT trigger)
		await expect(
			lix.db
				.insertInto("readonly_history" as any)
				.values({
					id: "test_id",
					name: "test_name",
					value: 42,
				})
				.execute()
		).rejects.toThrow();

		// Insert some data directly into state for testing UPDATE/DELETE
		await lix.db
			.insertInto("state")
			.values({
				entity_id: "test_id",
				schema_key: "test_entity",
				file_id: "test_file",
				plugin_key: "test_plugin",
				snapshot_content: {
					id: "test_id",
					name: "test_name",
					value: 42,
				},
				schema_version: "1.0",
				version_id: lix.db.selectFrom("active_version").select("version_id"),
			})
			.execute();

		// Get the active version's change set
		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.select("version.change_set_id")
			.executeTakeFirstOrThrow();

		// Verify we can read the data
		const readResult = await lix.db
			.selectFrom("readonly_history" as any)
			.where("entity_id", "=", "test_id")
			.where("lixcol_change_set_id", "=", activeVersion.change_set_id)
			.selectAll()
			.execute();

		expect(readResult).toHaveLength(1);

		// Attempt to update should fail (no UPDATE trigger)
		await expect(
			lix.db
				.updateTable("readonly_history" as any)
				.where("entity_id", "=", "test_id")
				.set({ name: "updated_name" })
				.execute()
		).rejects.toThrow();

		// Attempt to delete should fail (no DELETE trigger)
		await expect(
			lix.db
				.deleteFrom("readonly_history" as any)
				.where("entity_id", "=", "test_id")
				.execute()
		).rejects.toThrow();
	});
});
