import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import { Kysely, sql } from "kysely";
import { createVersion } from "../version/create-version.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";

test("select, insert, update, delete entity", async () => {
	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			value: {
				type: "string",
			},
		},
	};

	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	await lix.db
		.insertInto("state")
		.values({
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			schema_version: "1.0",
			version_id: sql`(SELECT version_id FROM active_version)`,
			snapshot_content: {
				value: "hello world",
			},
		})
		.execute();

	const viewAfterInsert = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "mock_schema")
		.selectAll()
		.execute();

	expect(viewAfterInsert).toMatchObject([
		{
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			snapshot_content: {
				value: "hello world",
			},
		},
	]);

	await lix.db
		.updateTable("state")
		.set({
			snapshot_content: {
				value: "hello world - updated",
			},
		})
		.where("entity_id", "=", "e0")
		.where("schema_key", "=", "mock_schema")
		.where("file_id", "=", "f0")
		.execute();

	const viewAfterUpdate = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "mock_schema")
		.selectAll()
		.execute();

	expect(viewAfterUpdate).toMatchObject([
		{
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			snapshot_content: {
				value: "hello world - updated",
			},
		},
	]);

	await lix.db
		.deleteFrom("state")
		.where("entity_id", "=", "e0")
		.where(
			"version_id",
			"=",
			lix.db.selectFrom("active_version").select("version_id")
		)
		.where("schema_key", "=", "mock_schema")
		.execute();

	const viewAfterDelete = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "mock_schema")
		.selectAll()
		.execute();

	expect(viewAfterDelete).toHaveLength(0);
});

test("validates the schema on insert", async () => {
	const lix = await openLixInMemory({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			value: {
				type: "number",
			},
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();
	await expect(
		lix.db
			.insertInto("state")
			.values({
				entity_id: "e0",
				file_id: "f0",
				schema_key: "mock_schema",
				plugin_key: "lix_own_entity",
				schema_version: "1.0",
				snapshot_content: {
					value: "hello world",
				},
				version_id: sql`(SELECT version_id FROM active_version)`,
			})
			.execute()
	).rejects.toThrow(/value must be number/);
});

test("validates the schema on update", async () => {
	const lix = await openLixInMemory({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			value: {
				type: "number",
			},
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	await lix.db
		.insertInto("state")
		.values({
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			schema_version: "1.0",
			snapshot_content: {
				value: 5,
			},
			version_id: sql`(SELECT version_id FROM active_version)`,
		})
		.execute();

	await expect(
		lix.db
			.updateTable("state")
			.set({
				snapshot_content: {
					value: "hello world - updated",
				},
			})
			.where("entity_id", "=", "e0")
			.where("schema_key", "=", "mock_schema")
			.where("file_id", "=", "f0")
			.execute()
	).rejects.toThrow(/value must be number/);

	const viewAfterFailedUpdate = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "mock_schema")
		.selectAll()
		.execute();

	expect(viewAfterFailedUpdate).toMatchObject([
		{
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			snapshot_content: {
				value: 5,
			},
		},
	]);
});

test("state is separated by version", async () => {
	const lix = await openLixInMemory({});

	await createVersion({ lix, id: "version_a" });
	await createVersion({ lix, id: "version_b" });

	await lix.db
		.insertInto("state")
		.values([
			{
				entity_id: "e0",
				file_id: "f0",
				schema_key: "mock_schema",
				plugin_key: "mock_plugin",
				schema_version: "1.0",
				snapshot_content: {
					value: "hello world from version a",
				},
				version_id: "version_a",
			},
			{
				entity_id: "e0",
				file_id: "f0",
				schema_key: "mock_schema",
				plugin_key: "mock_plugin",
				schema_version: "1.0",
				snapshot_content: {
					value: "hello world from version b",
				},
				version_id: "version_b",
			},
		])
		.execute();

	const stateAfterInserts = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "mock_schema")
		.where("entity_id", "=", "e0")
		.selectAll()
		.execute();

	expect(stateAfterInserts).toMatchObject([
		{
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "mock_plugin",
			snapshot_content: {
				value: "hello world from version a",
			},
			version_id: "version_a",
		},
		{
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "mock_plugin",
			snapshot_content: {
				value: "hello world from version b",
			},
			version_id: "version_b",
		},
	]);

	// Verify timestamps are present
	expect(stateAfterInserts[0]?.created_at).toBeDefined();
	expect(stateAfterInserts[0]?.updated_at).toBeDefined();
	expect(stateAfterInserts[1]?.created_at).toBeDefined();
	expect(stateAfterInserts[1]?.updated_at).toBeDefined();

	await lix.db
		.updateTable("state")
		.set({ snapshot_content: { value: "hello world from version b UPDATED" } })
		.where("entity_id", "=", "e0")
		.where("schema_key", "=", "mock_schema")
		.where("version_id", "=", "version_b")
		.execute();

	const stateAfterUpdate = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "mock_schema")
		.where("entity_id", "=", "e0")
		.selectAll()
		.execute();

	expect(stateAfterUpdate).toMatchObject([
		{
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "mock_plugin",
			snapshot_content: {
				value: "hello world from version a",
			},
			version_id: "version_a",
		},
		{
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "mock_plugin",
			snapshot_content: {
				value: "hello world from version b UPDATED",
			},
			version_id: "version_b",
		},
	]);

	await lix.db
		.deleteFrom("state")
		.where("entity_id", "=", "e0")
		.where("version_id", "=", "version_b")
		.execute();

	const stateAfterDelete = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "mock_schema")
		.where("entity_id", "=", "e0")
		.selectAll()
		.execute();

	expect(stateAfterDelete).toMatchObject([
		{
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "mock_plugin",
			snapshot_content: {
				value: "hello world from version a",
			},
			version_id: "version_a",
		},
	]);
});

test("created_at and updated_at timestamps are computed correctly", async () => {
	const lix = await openLixInMemory({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			value: {
				type: "string",
			},
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	// Insert initial entity
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			schema_version: "1.0",
			version_id: sql`(SELECT version_id FROM active_version)`,
			snapshot_content: {
				value: "initial value",
			},
		})
		.execute();

	const stateAfterInsert = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "e0")
		.selectAll()
		.execute();

	expect(stateAfterInsert).toHaveLength(1);
	expect(stateAfterInsert[0]?.created_at).toBeDefined();
	expect(stateAfterInsert[0]?.updated_at).toBeDefined();
	expect(stateAfterInsert[0]?.created_at).toBe(stateAfterInsert[0]?.updated_at);

	// Wait a bit to ensure different timestamps
	await new Promise((resolve) => setTimeout(resolve, 1));

	// Update the entity
	await lix.db
		.updateTable("state")
		.set({
			snapshot_content: {
				value: "updated value",
			},
		})
		.where("entity_id", "=", "e0")
		.where("schema_key", "=", "mock_schema")
		.execute();

	const stateAfterUpdate = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "e0")
		.selectAll()
		.execute();

	expect(stateAfterUpdate).toHaveLength(1);
	expect(stateAfterUpdate[0]?.created_at).toBeDefined();
	expect(stateAfterUpdate[0]?.updated_at).toBeDefined();
	// created_at should remain the same
	expect(stateAfterUpdate[0]?.created_at).toBe(stateAfterInsert[0]?.created_at);
	// updated_at should be different (newer)
	expect(stateAfterUpdate[0]?.updated_at).not.toBe(
		stateAfterInsert[0]?.updated_at
	);
	expect(new Date(stateAfterUpdate[0]!.updated_at).getTime()).toBeGreaterThan(
		new Date(stateAfterInsert[0]!.updated_at).getTime()
	);
});

// needs global "version" feature
test.todo("created_at and updated_at are version specific", async () => {
	const lix = await openLixInMemory({});

	await createVersion({ lix, id: "version_a" });
	await createVersion({ lix, id: "version_b" });

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			value: {
				type: "string",
			},
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	// Insert entity in version A
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			schema_version: "1.0",
			version_id: "version_a",
			snapshot_content: {
				value: "value in version a",
			},
		})
		.execute();

	// Wait a bit to ensure different timestamps
	await new Promise((resolve) => setTimeout(resolve, 1));

	// Insert same entity in version B
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			schema_version: "1.0",
			version_id: "version_b",
			snapshot_content: {
				value: "value in version b",
			},
		})
		.execute();

	const stateVersionA = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "e0")
		.where("version_id", "=", "version_a")
		.selectAll()
		.execute();

	const stateVersionB = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "e0")
		.where("version_id", "=", "version_b")
		.selectAll()
		.execute();

	expect(stateVersionA).toHaveLength(1);
	expect(stateVersionB).toHaveLength(1);

	// Both should have timestamps
	expect(stateVersionA[0]?.created_at).toBeDefined();
	expect(stateVersionA[0]?.updated_at).toBeDefined();
	expect(stateVersionB[0]?.created_at).toBeDefined();
	expect(stateVersionB[0]?.updated_at).toBeDefined();

	// created_at should be the same for both versions (same entity)
	expect(stateVersionA[0]?.created_at).toBe(stateVersionB[0]?.created_at);

	// Wait and update only version B
	await new Promise((resolve) => setTimeout(resolve, 1));

	await lix.db
		.updateTable("state")
		.set({
			snapshot_content: {
				value: "updated value in version b",
			},
		})
		.where("entity_id", "=", "e0")
		.where("version_id", "=", "version_b")
		.execute();

	const updatedStateVersionA = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "e0")
		.where("version_id", "=", "version_a")
		.selectAll()
		.execute();

	const updatedStateVersionB = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "e0")
		.where("version_id", "=", "version_b")
		.selectAll()
		.execute();

	// Version A should remain unchanged
	expect(updatedStateVersionA[0]?.updated_at).toBe(
		stateVersionA[0]?.updated_at
	);

	// Version B should have updated timestamp
	expect(updatedStateVersionB[0]?.updated_at).not.toBe(
		stateVersionB[0]?.updated_at
	);
	expect(
		new Date(updatedStateVersionB[0]!.updated_at).getTime()
	).toBeGreaterThan(new Date(stateVersionB[0]!.updated_at).getTime());
});

// requires global "version" feature
test.todo(
	"state appears in both versions when they share the same change set",
	async () => {
		const lix = await openLixInMemory({});

		const versionA = await createVersion({ lix, id: "version_a" });

		console.log(
			"Version A changeset before state insert:",
			versionA.change_set_id
		);

		// Insert state into version A
		await lix.db
			.insertInto("state")
			.values({
				entity_id: "e0",
				file_id: "f0",
				schema_key: "mock_schema",
				plugin_key: "mock_plugin",
				schema_version: "1.0",
				snapshot_content: {
					value: "shared state",
				},
				version_id: "version_a",
			})
			.execute();

		const versionAAfterInsert = await lix.db
			.selectFrom("version")
			.where("id", "=", versionA.id)
			.selectAll()
			.executeTakeFirstOrThrow();

		console.log(
			"Version A changeset after state insert:",
			versionAAfterInsert.change_set_id
		);

		// Create version B with the same change set as version A
		const versionB = await createVersion({
			lix,
			id: "version_b",
			changeSet: { id: versionAAfterInsert.change_set_id },
		});

		console.log("Version B changeset:", versionB.change_set_id);

		const stateInBothVersions = await lix.db
			.selectFrom("state")
			.where("schema_key", "=", "mock_schema")
			.where("entity_id", "=", "e0")
			.selectAll()
			.execute();

		// Both versions should see the same state
		expect(stateInBothVersions).toMatchObject([
			{
				entity_id: "e0",
				schema_key: "mock_schema",
				snapshot_content: { value: "shared state" },
				version_id: "version_a",
			},
			{
				entity_id: "e0",
				schema_key: "mock_schema",
				snapshot_content: { value: "shared state" },
				version_id: "version_b",
			},
		]);
	}
);

// requires global "version" feature
test.todo(
	"state diverges when versions have common ancestor but different changes",
	async () => {
		const lix = await openLixInMemory({});

		// Create base version and add initial state
		// const baseVersion = await createVersion({ lix, id: "base_version" });

		await lix.db
			.insertInto("state")
			.values({
				entity_id: "e0",
				file_id: "f0",
				schema_key: "mock_schema",
				plugin_key: "mock_plugin",
				schema_version: "1.0",
				snapshot_content: {
					value: "base state",
				},
				version_id: "base_version",
			})
			.execute();

		// const baseVersionAfterInsert = await lix.db
		// 	.selectFrom("version")
		// 	.where("id", "=", baseVersion.id)
		// 	.selectAll()
		// 	.executeTakeFirstOrThrow();

		// Create two versions from the same base changeset
		// const versionA = await createVersion({
		// 	lix,
		// 	id: "version_a",
		// 	changeSet: { id: baseVersionAfterInsert.change_set_id },
		// });

		// const versionB = await createVersion({
		// 	lix,
		// 	id: "version_b",
		// 	changeSet: { id: baseVersionAfterInsert.change_set_id },
		// });

		// Both versions should initially see the base state
		const initialState = await lix.db
			.selectFrom("state")
			.where("schema_key", "=", "mock_schema")
			.where("entity_id", "=", "e0")
			.selectAll()
			.execute();

		expect(initialState).toHaveLength(3); // base, version_a, version_b

		// Update state in version A
		await lix.db
			.updateTable("state")
			.set({
				snapshot_content: { value: "updated in version A" },
			})
			.where("entity_id", "=", "e0")
			.where("version_id", "=", "version_a")
			.execute();

		// Update state in version B differently
		await lix.db
			.updateTable("state")
			.set({
				snapshot_content: { value: "updated in version B" },
			})
			.where("entity_id", "=", "e0")
			.where("version_id", "=", "version_b")
			.execute();

		const divergedState = await lix.db
			.selectFrom("state")
			.where("schema_key", "=", "mock_schema")
			.where("entity_id", "=", "e0")
			.selectAll()
			.execute();

		// All three versions should have different states
		expect(divergedState).toMatchObject([
			{
				entity_id: "e0",
				snapshot_content: { value: "base state" },
				version_id: "base_version",
			},
			{
				entity_id: "e0",
				snapshot_content: { value: "updated in version A" },
				version_id: "version_a",
			},
			{
				entity_id: "e0",
				snapshot_content: { value: "updated in version B" },
				version_id: "version_b",
			},
		]);
	}
);

// Write-through cache behavior tests
test("write-through cache: insert operations populate cache immediately", async () => {
	const lix = await openLixInMemory({});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	// Insert state data - should populate cache via write-through
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "write-through-entity",
			schema_key: "write-through-schema",
			file_id: "write-through-file",
			plugin_key: "write-through-plugin",
			snapshot_content: { test: "write-through-data" },
			schema_version: "1.0",
			version_id: activeVersion.id,
		})
		.execute();

	// Cache should be populated immediately via write-through
	const cacheEntry = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_state_cache")
		.where("entity_id", "=", "write-through-entity")
		.where("schema_key", "=", "write-through-schema")
		.where("file_id", "=", "write-through-file")
		.where("version_id", "=", activeVersion.id)
		.selectAll()
		.executeTakeFirst();

	expect(cacheEntry).toBeDefined();
	expect(cacheEntry?.entity_id).toBe("write-through-entity");
	expect(cacheEntry?.plugin_key).toBe("write-through-plugin");
	expect(cacheEntry?.snapshot_content).toEqual({
		test: "write-through-data",
	});

	// State view should return the same data (from cache)
	const stateResults = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "write-through-entity")
		.selectAll()
		.execute();

	expect(stateResults).toHaveLength(1);
	expect(stateResults[0]?.entity_id).toBe("write-through-entity");
	expect(stateResults[0]?.snapshot_content).toEqual({
		test: "write-through-data",
	});
});

test("write-through cache: update operations update cache immediately", async () => {
	const lix = await openLixInMemory({});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	// Insert initial state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "update-cache-entity",
			schema_key: "update-cache-schema",
			file_id: "update-cache-file",
			plugin_key: "initial-plugin",
			snapshot_content: { initial: "value" },
			schema_version: "1.0",
			version_id: activeVersion.id,
		})
		.execute();

	// Update the state - should update cache via write-through
	await lix.db
		.updateTable("state")
		.set({
			snapshot_content: { updated: "value" },
			plugin_key: "updated-plugin",
		})
		.where("entity_id", "=", "update-cache-entity")
		.where("schema_key", "=", "update-cache-schema")
		.where("file_id", "=", "update-cache-file")
		.where("version_id", "=", activeVersion.id)
		.execute();

	// Cache should be immediately updated
	const cacheEntry = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_state_cache")
		.where("entity_id", "=", "update-cache-entity")
		.where("schema_key", "=", "update-cache-schema")
		.where("file_id", "=", "update-cache-file")
		.where("version_id", "=", activeVersion.id)
		.selectAll()
		.executeTakeFirst();

	expect(cacheEntry).toBeDefined();
	expect(cacheEntry?.snapshot_content).toEqual({
		updated: "value",
	});
	expect(cacheEntry?.plugin_key).toBe("updated-plugin");

	// State view should return updated data
	const stateResults = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "update-cache-entity")
		.selectAll()
		.execute();

	expect(stateResults).toHaveLength(1);
	expect(stateResults[0]?.snapshot_content).toEqual({ updated: "value" });
	expect(stateResults[0]?.plugin_key).toBe("updated-plugin");
});

test("delete operations remove entries from underlying data", async () => {
	const lix = await openLixInMemory({});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	// Insert initial state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "delete-cache-entity",
			schema_key: "delete-cache-schema",
			file_id: "delete-cache-file",
			plugin_key: "delete-plugin",
			snapshot_content: { to: "delete" },
			schema_version: "1.0",
			version_id: activeVersion.id,
		})
		.execute();

	// Verify data exists
	const beforeDelete = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "delete-cache-entity")
		.selectAll()
		.execute();

	expect(beforeDelete).toHaveLength(1);

	// Delete the state - this creates a deletion change (doesn't physically remove cache entry)
	await lix.db
		.deleteFrom("state")
		.where("entity_id", "=", "delete-cache-entity")
		.where("schema_key", "=", "delete-cache-schema")
		.where("file_id", "=", "delete-cache-file")
		.where("version_id", "=", activeVersion.id)
		.execute();

	// Data should no longer be accessible through state view
	const afterDelete = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "delete-cache-entity")
		.selectAll()
		.execute();

	expect(afterDelete).toHaveLength(0);
});

test("change.created_at and state timestamps are consistent", async () => {
	const lix = await openLixInMemory({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			value: {
				type: "string",
			},
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	// Insert state data
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "timestamp-test-entity",
			schema_key: "mock_schema",
			file_id: "timestamp-test-file",
			plugin_key: "timestamp-test-plugin",
			snapshot_content: { value: "timestamp test" },
			schema_version: "1.0",
			version_id: sql`(SELECT version_id FROM active_version)`,
		})
		.execute();

	// Get the change record
	const changeRecord = await (lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
		.selectFrom("internal_change")
		.where("entity_id", "=", "timestamp-test-entity")
		.where("schema_key", "=", "mock_schema")
		.select(["created_at"])
		.executeTakeFirstOrThrow();

	// Get the state cache record
	const cacheRecord = await (lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
		.selectFrom("internal_state_cache")
		.where("entity_id", "=", "timestamp-test-entity")
		.where("schema_key", "=", "mock_schema")
		.select(["created_at", "updated_at"])
		.executeTakeFirstOrThrow();

	// Verify all timestamps are identical
	expect(changeRecord.created_at).toBe(cacheRecord.created_at);
	expect(changeRecord.created_at).toBe(cacheRecord.updated_at);
});

// Important to note that only a full cache clear (like during schema changes) triggers
// a cache miss and repopulation from the CTE at the moment!
//
// This is simpler, at the cost of state inconsistencies when changes are made 
// without populating or invalidating the cache.
test("state view should work and re-populate the cache after cache is fully (!) cleared", async () => {
	const lix = await openLixInMemory({});

	// Insert a key-value pair
	await lix.db
		.insertInto("key_value")
		.values({
			key: "test_cache_miss",
			value: "initial_value",
		})
		.execute();

	// Verify it's accessible through state view (should populate cache)
	const stateBeforeCacheClear = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "lix_key_value")
		.where("entity_id", "=", "test_cache_miss")
		.selectAll()
		.execute();

	expect(stateBeforeCacheClear).toHaveLength(1);
	expect(stateBeforeCacheClear[0]).toMatchObject({
		entity_id: "test_cache_miss",
		schema_key: "lix_key_value",
		snapshot_content: {
			key: "test_cache_miss",
			value: "initial_value",
		},
	});

	// Verify it's in the cache
	const cacheBeforeClear = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_state_cache")
		.where("schema_key", "=", "lix_key_value")
		.where("entity_id", "=", "test_cache_miss")
		.selectAll()
		.execute();

	expect(cacheBeforeClear).toHaveLength(1);

	// Simulate cache invalidation (like what happens during stored_schema insertion)
	await (lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
		.deleteFrom("internal_state_cache")
		.execute();

	// Verify cache is empty
	const cacheAfterClear = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_state_cache")
		.selectAll()
		.execute();

	expect(cacheAfterClear).toHaveLength(0);

	// Try to access the same data through state view again
	// This should trigger cache miss logic and repopulate from CTE
	const stateAfterCacheClear = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "lix_key_value")
		.where("entity_id", "=", "test_cache_miss")
		.selectAll()
		.execute();

	// This should work - if cache miss logic is working correctly
	expect(stateAfterCacheClear).toHaveLength(1);
	expect(stateAfterCacheClear[0]).toMatchObject({
		entity_id: "test_cache_miss",
		schema_key: "lix_key_value",
		snapshot_content: {
			key: "test_cache_miss",
			value: "initial_value",
		},
	});

	// Verify cache was repopulated
	const cacheAfterRefill = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_state_cache")
		.where("schema_key", "=", "lix_key_value")
		.where("entity_id", "=", "test_cache_miss")
		.selectAll()
		.execute();

	expect(cacheAfterRefill).toHaveLength(1);
});

test("delete operations are validated for foreign key constraints", async () => {
	const lix = await openLixInMemory({});

	// Define parent schema (referenced entity)
	const parentSchema: LixSchemaDefinition = {
		"x-lix-key": "parent_entity",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["id"],
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
		additionalProperties: false,
	};

	// Define child schema with foreign key to parent
	const childSchema: LixSchemaDefinition = {
		"x-lix-key": "child_entity",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["id"],
		"x-lix-foreign-keys": {
			parent_id: {
				schemaKey: "parent_entity",
				property: "id",
			},
		},
		type: "object",
		properties: {
			id: { type: "string" },
			parent_id: { type: "string" },
			value: { type: "string" },
		},
		required: ["id", "parent_id", "value"],
		additionalProperties: false,
	};

	// Register both schemas
	await lix.db
		.insertInto("stored_schema")
		.values([
			{ value: parentSchema },
			{ value: childSchema },
		])
		.execute();

	// Insert parent entity
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "parent-1",
			schema_key: "parent_entity",
			file_id: "test-file",
			plugin_key: "test-plugin",
			snapshot_content: {
				id: "parent-1",
				name: "Parent Entity",
			},
			schema_version: "1.0",
			version_id: sql`(SELECT version_id FROM active_version)`,
		})
		.execute();

	// Insert child entity that references the parent
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "child-1",
			schema_key: "child_entity",
			file_id: "test-file",
			plugin_key: "test-plugin",
			snapshot_content: {
				id: "child-1",
				parent_id: "parent-1",
				value: "Child Value",
			},
			schema_version: "1.0",
			version_id: sql`(SELECT version_id FROM active_version)`,
		})
		.execute();

	// Verify both entities exist
	const parentBefore = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "parent-1")
		.where("schema_key", "=", "parent_entity")
		.selectAll()
		.execute();

	const childBefore = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "child-1")
		.where("schema_key", "=", "child_entity")
		.selectAll()
		.execute();

	expect(parentBefore).toHaveLength(1);
	expect(childBefore).toHaveLength(1);

	// Attempting to delete the parent entity should fail due to foreign key constraint
	// because there's a child entity that references it
	await expect(
		lix.db
			.deleteFrom("state")
			.where("entity_id", "=", "parent-1")
			.where("schema_key", "=", "parent_entity")
			.execute()
	).rejects.toThrow(/foreign key/i);

	// Verify the parent still exists after failed deletion attempt
	const parentAfter = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "parent-1")
		.where("schema_key", "=", "parent_entity")
		.selectAll()
		.execute();

	expect(parentAfter).toHaveLength(1);
});
