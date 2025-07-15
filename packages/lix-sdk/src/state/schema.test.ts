import { test, expect, describe } from "vitest";
import { openLix } from "../lix/open-lix.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import { Kysely, sql } from "kysely";
import { createVersion } from "../version/create-version.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { dsTest } from "../test-utilities/dst/ds-test.js";

test("dstest discovery", () => {});

dsTest("select, insert, update, delete entity", async ({ initialLix }) => {
	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		additionalProperties: false,
		properties: {
			value: {
				type: "string",
			},
		},
	};

	const lix = await openLix({ blob: initialLix });

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	await lix.db
		.insertInto("state_all")
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
		.selectFrom("state_all")
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
		.updateTable("state_all")
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
		.selectFrom("state_all")
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
		.deleteFrom("state_all")
		.where("entity_id", "=", "e0")
		.where(
			"version_id",
			"=",
			lix.db.selectFrom("active_version").select("version_id")
		)
		.where("schema_key", "=", "mock_schema")
		.execute();

	const viewAfterDelete = await lix.db
		.selectFrom("state_all")
		.where("schema_key", "=", "mock_schema")
		.selectAll()
		.execute();

	expect(viewAfterDelete).toHaveLength(0);
});

dsTest("validates the schema on insert", async ({ initialLix }) => {
	const lix = await openLix({ blob: initialLix });

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		additionalProperties: false,
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
			.insertInto("state_all")
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

dsTest("validates the schema on update", async ({ initialLix }) => {
	const lix = await openLix({ blob: initialLix });

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		additionalProperties: false,
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
		.insertInto("state_all")
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
			.updateTable("state_all")
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
		.selectFrom("state_all")
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

dsTest("state is separated by version", async ({ initialLix }) => {
	const lix = await openLix({ blob: initialLix });

	await createVersion({ lix, id: "version_a" });
	await createVersion({ lix, id: "version_b" });

	await lix.db
		.insertInto("state_all")
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
		.selectFrom("state_all")
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
		.updateTable("state_all")
		.set({
			snapshot_content: { value: "hello world from version b UPDATED" },
		})
		.where("entity_id", "=", "e0")
		.where("schema_key", "=", "mock_schema")
		.where("version_id", "=", "version_b")
		.execute();

	const stateAfterUpdate = await lix.db
		.selectFrom("state_all")
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
		.deleteFrom("state_all")
		.where("entity_id", "=", "e0")
		.where("version_id", "=", "version_b")
		.execute();

	const stateAfterDelete = await lix.db
		.selectFrom("state_all")
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

dsTest(
	"created_at and updated_at timestamps are computed correctly",
	async ({ initialLix }) => {
		const lix = await openLix({ blob: initialLix });

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
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
			.insertInto("state_all")
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
			.selectFrom("state_all")
			.where("entity_id", "=", "e0")
			.selectAll()
			.execute();

		expect(stateAfterInsert).toHaveLength(1);
		expect(stateAfterInsert[0]?.created_at).toBeDefined();
		expect(stateAfterInsert[0]?.updated_at).toBeDefined();
		expect(stateAfterInsert[0]?.created_at).toBe(
			stateAfterInsert[0]?.updated_at
		);

		// Wait a bit to ensure different timestamps
		await new Promise((resolve) => setTimeout(resolve, 1));

		// Update the entity
		await lix.db
			.updateTable("state_all")
			.set({
				snapshot_content: {
					value: "updated value",
				},
			})
			.where("entity_id", "=", "e0")
			.where("schema_key", "=", "mock_schema")
			.execute();

		const stateAfterUpdate = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "e0")
			.selectAll()
			.execute();

		expect(stateAfterUpdate).toHaveLength(1);
		expect(stateAfterUpdate[0]?.created_at).toBeDefined();
		expect(stateAfterUpdate[0]?.updated_at).toBeDefined();

		// created_at should remain the same
		expect(stateAfterUpdate[0]?.created_at).toBe(
			stateAfterInsert[0]?.created_at
		);

		// updated_at should be different (newer)
		expect(stateAfterUpdate[0]?.updated_at).not.toBe(
			stateAfterInsert[0]?.updated_at
		);

		expect(new Date(stateAfterUpdate[0]!.updated_at).getTime()).toBeGreaterThan(
			new Date(stateAfterInsert[0]!.updated_at).getTime()
		);
	}
);

dsTest(
	"created_at and updated_at are version specific",
	async ({ initialLix }) => {
		const lix = await openLix({ blob: initialLix });

		await createVersion({ lix, id: "version_a" });
		await createVersion({ lix, id: "version_b" });

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			additionalProperties: false,
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
			.insertInto("state_all")
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
			.insertInto("state_all")
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
			.selectFrom("state_all")
			.where("entity_id", "=", "e0")
			.where("version_id", "=", "version_a")
			.selectAll()
			.execute();

		const stateVersionB = await lix.db
			.selectFrom("state_all")
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

		// the same entity has been inserted but with different changes
		expect(stateVersionA[0]?.created_at).not.toBe(stateVersionB[0]?.created_at);

		// Wait and update only version B
		await new Promise((resolve) => setTimeout(resolve, 1));

		await lix.db
			.updateTable("state_all")
			.set({
				snapshot_content: {
					value: "updated value in version b",
				},
			})
			.where("entity_id", "=", "e0")
			.where("version_id", "=", "version_b")
			.execute();

		const updatedStateVersionA = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "e0")
			.where("version_id", "=", "version_a")
			.selectAll()
			.execute();

		const updatedStateVersionB = await lix.db
			.selectFrom("state_all")
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
	}
);

dsTest(
	"state appears in both versions when they share the same change set",
	async ({ initialLix }) => {
		const lix = await openLix({ blob: initialLix });

		const versionA = await createVersion({ lix, id: "version_a" });
		// Insert state into version A
		await lix.db
			.insertInto("state_all")
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

		// Create version B with the same change set as version A
		await createVersion({
			lix,
			id: "version_b",
			changeSet: { id: versionAAfterInsert.change_set_id },
		});

		const stateInBothVersions = await lix.db
			.selectFrom("state_all")
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

dsTest(
	"state diverges when versions have common ancestor but different changes",
	async ({ initialLix }) => {
		const lix = await openLix({ blob: initialLix });

		// Create base version and add initial state
		const baseVersion = await createVersion({ lix, id: "base_version" });

		await lix.db
			.insertInto("state_all")
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

		const baseVersionAfterInsert = await lix.db
			.selectFrom("version")
			.where("id", "=", baseVersion.id)
			.selectAll()
			.executeTakeFirstOrThrow();

		// Create two versions from the same base changeset
		await createVersion({
			lix,
			id: "version_a",
			changeSet: { id: baseVersionAfterInsert.change_set_id },
		});

		await createVersion({
			lix,
			id: "version_b",
			changeSet: { id: baseVersionAfterInsert.change_set_id },
		});

		const versions = await lix.db
			.selectFrom("version")
			.where("id", "in", ["base_version", "version_a", "version_b"])
			.select(["id", "change_set_id"])
			.execute();

		expect(versions).toHaveLength(3);

		// Both versions should initially see the base state
		const initialState = await lix.db
			.selectFrom("state_all")
			.where("schema_key", "=", "mock_schema")
			.where("entity_id", "=", "e0")
			.selectAll()
			.execute();

		expect(initialState).toHaveLength(3); // base, version_a, version_b

		// Update state in version A
		await lix.db
			.updateTable("state_all")
			.set({
				snapshot_content: { value: "updated in version A" },
			})
			.where("entity_id", "=", "e0")
			.where("version_id", "=", "version_a")
			.execute();

		// Update state in version B differently
		await lix.db
			.updateTable("state_all")
			.set({
				snapshot_content: { value: "updated in version B" },
			})
			.where("entity_id", "=", "e0")
			.where("version_id", "=", "version_b")
			.execute();

		const divergedState = await lix.db
			.selectFrom("state_all")
			.where("schema_key", "=", "mock_schema")
			.where("entity_id", "=", "e0")
			.selectAll()
			.orderBy("version_id")
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

dsTest(
	"delete operations remove entries from underlying data",
	async ({ initialLix }) => {
		const lix = await openLix({ blob: initialLix });

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		// Insert initial state
		await lix.db
			.insertInto("state_all")
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
			.selectFrom("state_all")
			.where("entity_id", "=", "delete-cache-entity")
			.selectAll()
			.execute();

		expect(beforeDelete).toHaveLength(1);

		// Delete the state - this creates a deletion change (doesn't physically remove cache entry)
		await lix.db
			.deleteFrom("state_all")
			.where("entity_id", "=", "delete-cache-entity")
			.where("schema_key", "=", "delete-cache-schema")
			.where("file_id", "=", "delete-cache-file")
			.where("version_id", "=", activeVersion.id)
			.execute();

		// Data should no longer be accessible through state view
		const afterDelete = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "delete-cache-entity")
			.selectAll()
			.execute();

		expect(afterDelete).toHaveLength(0);
	}
);

dsTest(
	"change.created_at and state timestamps are consistent",
	async ({ initialLix }) => {
		const lix = await openLix({ blob: initialLix });

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
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
			.insertInto("state_all")
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
		const changeRecord = await (
			lix.db as unknown as Kysely<LixInternalDatabaseSchema>
		)
			.selectFrom("internal_change")
			.where("entity_id", "=", "timestamp-test-entity")
			.where("schema_key", "=", "mock_schema")
			.select(["created_at"])
			.executeTakeFirstOrThrow();

		// Get the state cache record
		const cacheRecord = await (
			lix.db as unknown as Kysely<LixInternalDatabaseSchema>
		)
			.selectFrom("internal_state_cache")
			.where("entity_id", "=", "timestamp-test-entity")
			.where("schema_key", "=", "mock_schema")
			.select(["created_at", "updated_at"])
			.executeTakeFirstOrThrow();

		// Verify all timestamps are identical
		expect(changeRecord.created_at).toBe(cacheRecord.created_at);
		expect(changeRecord.created_at).toBe(cacheRecord.updated_at);
	}
);

dsTest(
	"state and state_all views expose change_id for blame and diff functionality",
	async ({ initialLix }) => {
		const lix = await openLix({ blob: initialLix });

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
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

		// Insert initial state using Kysely to ensure virtual table is triggered
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "change-id-test-entity",
				schema_key: "mock_schema",
				file_id: "change-id-test-file",
				plugin_key: "change-id-test-plugin",
				snapshot_content: { value: "initial value" },
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
			})
			.execute();

		// Query state_all view to verify change_id is exposed
		const stateAllResult = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "change-id-test-entity")
			.where("schema_key", "=", "mock_schema")
			.selectAll()
			.execute();

		expect(stateAllResult).toHaveLength(1);
		expect(stateAllResult[0]?.change_id).toBeDefined();
		expect(typeof stateAllResult[0]?.change_id).toBe("string");

		// Query state view (filtered by active version) to verify change_id is exposed
		const stateResult = await lix.db
			.selectFrom("state")
			.where("entity_id", "=", "change-id-test-entity")
			.where("schema_key", "=", "mock_schema")
			.selectAll()
			.execute();

		expect(stateResult).toHaveLength(1);
		expect(stateResult[0]?.change_id).toBeDefined();
		expect(typeof stateResult[0]?.change_id).toBe("string");

		// Verify that change_id matches between state and state_all views
		expect(stateResult[0]?.change_id).toBe(stateAllResult[0]?.change_id);

		// Get the actual change record to verify the change_id is correct
		const changeRecord = await lix.db
			.selectFrom("change")
			.where("entity_id", "=", "change-id-test-entity")
			.where("schema_key", "=", "mock_schema")
			.select(["change.id", "snapshot_content"])
			.executeTakeFirstOrThrow();

		// Verify that the change_id in the views matches the actual change.id
		expect(stateResult[0]?.change_id).toBe(changeRecord.id);
		expect(stateAllResult[0]?.change_id).toBe(changeRecord.id);

		// Verify that the snapshot content in the change matches the state view
		expect(changeRecord.snapshot_content).toEqual({ value: "initial value" });
		expect(stateResult[0]?.snapshot_content).toEqual({
			value: "initial value",
		});

		// Update the entity to create a new change
		await lix.db
			.updateTable("state_all")
			.set({
				snapshot_content: { value: "updated value" },
			})
			.where("entity_id", "=", "change-id-test-entity")
			.where("schema_key", "=", "mock_schema")
			.execute();

		// Query again to verify change_id updated after modification
		const updatedStateResult = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "change-id-test-entity")
			.where("schema_key", "=", "mock_schema")
			.selectAll()
			.execute();

		expect(updatedStateResult).toHaveLength(1);
		expect(updatedStateResult[0]?.change_id).toBeDefined();
		// The change_id should be different after the update (new change created)
		expect(updatedStateResult[0]?.change_id).not.toBe(
			stateResult[0]?.change_id
		);

		// Get the new change record
		const newChangeRecord = await lix.db
			.selectFrom("change")
			.where("entity_id", "=", "change-id-test-entity")
			.where("schema_key", "=", "mock_schema")
			.orderBy("created_at", "desc")
			.select(["change.id", "snapshot_content"])
			.executeTakeFirstOrThrow();

		// Verify the new change_id matches the latest change
		expect(updatedStateResult[0]?.change_id).toBe(newChangeRecord.id);

		// Verify that the updated snapshot content in the change matches the state view
		expect(newChangeRecord.snapshot_content).toEqual({
			value: "updated value",
		});
		expect(updatedStateResult[0]?.snapshot_content).toEqual({
			value: "updated value",
		});
	}
);

dsTest(
	"state and state_all views expose change_set_id for history queries",
	async ({ expectDeterministic, initialLix }) => {
		const lix = await openLix({ blob: initialLix });

		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_schema",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
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

		// Insert initial state using Kysely to ensure virtual table is triggered
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "change-set-id-test-entity",
				schema_key: "mock_schema",
				file_id: "change-set-id-test-file",
				plugin_key: "change-set-id-test-plugin",
				snapshot_content: { value: "initial value" },
				schema_version: "1.0",
				version_id: sql`(SELECT version_id FROM active_version)`,
			})
			.execute();

		const activeVersionAfterInsert = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		// Query state_all view to verify change_set_id is exposed
		const stateAllResult = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "change-set-id-test-entity")
			.where("schema_key", "=", "mock_schema")
			.selectAll()
			.execute();

		expectDeterministic(stateAllResult).toHaveLength(1);
		expectDeterministic(stateAllResult[0]).toHaveProperty("change_set_id");
		expectDeterministic(stateAllResult[0]?.change_set_id).toBe(
			activeVersionAfterInsert.change_set_id
		);

		// Query state view (filtered by active version) to verify change_set_id is exposed
		const stateResult = await lix.db
			.selectFrom("state")
			.where("entity_id", "=", "change-set-id-test-entity")
			.where("schema_key", "=", "mock_schema")
			.selectAll()
			.execute();

		expectDeterministic(stateResult).toHaveLength(1);
		expectDeterministic(stateResult[0]?.change_set_id).toBeDefined();
		expectDeterministic(stateResult[0]?.change_set_id).toBe(
			activeVersionAfterInsert.change_set_id
		);

		// Verify that change_set_id matches between state and state_all views
		expectDeterministic(stateResult[0]?.change_set_id).toBe(
			stateAllResult[0]?.change_set_id
		);

		// Get the change_set_element records - there should be two:
		// 1. One in the working change set
		// 2. One in the version's current change set (after commit)
		const changeSetElements = await lix.db
			.selectFrom("change_set_element")
			.where("entity_id", "=", "change-set-id-test-entity")
			.where("schema_key", "=", "mock_schema")
			.where("file_id", "=", "change-set-id-test-file")
			.select(["change_set_id", "change_id"])
			.execute();

		expectDeterministic(changeSetElements).toHaveLength(2);

		// Get the version to understand which change sets we're dealing with
		const version = await lix.db
			.selectFrom("version")
			.where("id", "=", activeVersionAfterInsert.id)
			.select(["id", "change_set_id", "working_change_set_id"])
			.executeTakeFirstOrThrow();

		// Find which change_set_element is in the version's change set (not working)
		const versionChangeSetElement = changeSetElements.find(
			(el) => el.change_set_id === version.change_set_id
		);
		const workingChangeSetElement = changeSetElements.find(
			(el) => el.change_set_id === version.working_change_set_id
		);

		expectDeterministic(versionChangeSetElement).toBeDefined();
		expectDeterministic(workingChangeSetElement).toBeDefined();

		// The state view should show the change_set_id from the version's change set graph,
		// not the working change set (which is temporary and not part of the graph)
		expectDeterministic(stateResult[0]?.change_set_id).toBe(
			versionChangeSetElement!.change_set_id
		);
		expectDeterministic(stateAllResult[0]?.change_set_id).toBe(
			versionChangeSetElement!.change_set_id
		);

		// Verify that the change_id also matches for consistency
		expectDeterministic(stateResult[0]?.change_id).toBe(
			versionChangeSetElement!.change_id
		);
		expectDeterministic(stateAllResult[0]?.change_id).toBe(
			versionChangeSetElement!.change_id
		);
	}
);

// Write-through cache behavior tests
dsTest(
	"write-through cache: insert operations populate cache immediately",
	async ({ initialLix }) => {
		const lix = await openLix({ blob: initialLix });

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		// Insert state data - should populate cache via write-through
		await lix.db
			.insertInto("state_all")
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
			.selectFrom("state_all")
			.where("entity_id", "=", "write-through-entity")
			.selectAll()
			.execute();

		expect(stateResults).toHaveLength(1);
		expect(stateResults[0]?.entity_id).toBe("write-through-entity");
		expect(stateResults[0]?.snapshot_content).toEqual({
			test: "write-through-data",
		});
	}
);

test("write-through cache: update operations update cache immediately", async () => {
	const lix = await openLix({});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	// Insert initial state
	await lix.db
		.insertInto("state_all")
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
		.updateTable("state_all")
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
		.selectFrom("state_all")
		.where("entity_id", "=", "update-cache-entity")
		.selectAll()
		.execute();

	expect(stateResults).toHaveLength(1);
	expect(stateResults[0]?.snapshot_content).toEqual({ updated: "value" });
	expect(stateResults[0]?.plugin_key).toBe("updated-plugin");
});

// Important to note that only a full cache clear (like during schema changes) triggers
// a cache miss and repopulation from the CTE at the moment!
//
// This is simpler, at the cost of state inconsistencies when changes are made
// without populating or invalidating the cache.
test.todo(
	"state view should work and re-populate the cache after cache is fully (!) cleared",
	async () => {
		const lix = await openLix({});

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
			.selectFrom("state_all")
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
			.selectFrom("state_all")
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
	}
);

test("delete operations are validated for foreign key constraints", async () => {
	const lix = await openLix({});

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
		.values([{ value: parentSchema }, { value: childSchema }])
		.execute();

	// Insert parent entity
	await lix.db
		.insertInto("state_all")
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
		.insertInto("state_all")
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
		.selectFrom("state_all")
		.where("entity_id", "=", "parent-1")
		.where("schema_key", "=", "parent_entity")
		.selectAll()
		.execute();

	const childBefore = await lix.db
		.selectFrom("state_all")
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
			.deleteFrom("state_all")
			.where("entity_id", "=", "parent-1")
			.where("schema_key", "=", "parent_entity")
			.execute()
	).rejects.toThrow(/foreign key/i);

	// Verify the parent still exists after failed deletion attempt
	const parentAfter = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "parent-1")
		.where("schema_key", "=", "parent_entity")
		.selectAll()
		.execute();

	expect(parentAfter).toHaveLength(1);
});

describe.each([
	{ scenario: "cache hit", clearCache: false },
	// { scenario: "cache miss", clearCache: true },
])(
	"($scenario) inheritance should work - child version should see entities from parent version",
	({ clearCache }) => {
		test("child version inherits entities from parent version", async () => {
			const lix = await openLix({});

			// Insert an entity into global version
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "global-entity-1",
					file_id: "test-file",
					schema_key: "test_schema",
					plugin_key: "test_plugin",
					version_id: "global",
					snapshot_content: {
						id: "global-entity-1",
						name: "Global Entity",
					},
					schema_version: "1.0",
				})
				.execute();

			// Create a child version that inherits from global
			const childVersion = await createVersion({
				lix,
				name: "child-version",
			});

			// Verify inheritance was set up correctly
			expect(childVersion.inherits_from_version_id).toBe("global");

			if (clearCache) {
				// Clear the state cache to force re-materialization with inheritance (CTE path)
				lix.sqlite.exec("DELETE FROM internal_state_cache");
			}
			// If clearCache is false, we test the cache hit path

			// The child version should inherit the entity from global
			const inheritedEntity = await lix.db
				.selectFrom("state_all")
				.where("entity_id", "=", "global-entity-1")
				.where("version_id", "=", childVersion.id)
				.selectAll()
				.execute();

			// This should pass - the entity should be visible in the child version via inheritance
			expect(inheritedEntity).toHaveLength(1);
			expect(inheritedEntity[0]?.entity_id).toBe("global-entity-1");
			expect(inheritedEntity[0]?.version_id).toBe(childVersion.id); // Should return child version ID
			expect(inheritedEntity[0]?.inherited_from_version_id).toBe("global"); // Should track inheritance source
			expect(inheritedEntity[0]?.snapshot_content).toEqual({
				id: "global-entity-1",
				name: "Global Entity",
			});
		});

		// Flaky cache CTE
		test.todo(
			"inherited entities should reflect changes in parent",
			async () => {
				const lix = await openLix({});

				// Get the main version
				const mainVersion = await lix.db
					.selectFrom("version")
					.where("name", "=", "main")
					.selectAll()
					.executeTakeFirstOrThrow();

				const originalChangeSetId = mainVersion.change_set_id;

				// Make a mutation to trigger version update in global context
				await lix.db
					.insertInto("key_value_all")
					.values({
						key: "cache_rebuild_test_key",
						value: "cache_rebuild_test_value",
						lixcol_version_id: mainVersion.id,
					})
					.execute();

				// Check the global version after mutation
				const globalVersionAfterMutation = await lix.db
					.selectFrom("state_all")
					.where("schema_key", "=", "lix_version")
					.where("entity_id", "=", mainVersion.id)
					.where("version_id", "=", "global")
					.selectAll()
					.executeTakeFirst();

				console.log("🌍 Global version after mutation:", {
					change_set_id: (globalVersionAfterMutation?.snapshot_content as any)
						?.change_set_id,
					original: originalChangeSetId,
				});

				if (clearCache) {
					// Clear the cache to force a rebuild from CTE
					await (lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
						.deleteFrom("internal_state_cache")
						.execute();
				}

				const state = await lix.db
					.selectFrom("state_all")
					.where("schema_key", "=", "lix_version")
					.where("entity_id", "=", mainVersion.id)
					.selectAll()
					.execute();

				console.log(
					"🔍 State query result:",
					state.map((s) => ({
						entity_id: s.entity_id,
						version_id: s.version_id,
						change_set_id: (s.snapshot_content as any).change_set_id,
						inherited_from_version_id: s.inherited_from_version_id,
					}))
				);

				// testing for cached contents first to make a cache miss test fail faster
				const cacheContents = await (
					lix.db as unknown as Kysely<LixInternalDatabaseSchema>
				)
					.selectFrom("internal_state_cache")
					.where("schema_key", "=", "lix_version")
					.where("entity_id", "=", mainVersion.id)
					.selectAll()
					.execute();

				// Both version entries should have the same updated change_set_id
				const cachedInheritedMainVersion = cacheContents.find(
					(entry) => entry.version_id === mainVersion.id
				);
				const cachedMainVersionGlobal = cacheContents.find(
					(entry) => entry.version_id === "global"
				);

				// we have copy on write deletion in place, so the cache should not contain the inherited version
				expect(cachedInheritedMainVersion).toBeUndefined();
				expect(cachedMainVersionGlobal).toBeDefined();

				// Both version entries should have the same updated change_set_id
				const inheritedMainVersion = state.find(
					(entry) => entry.version_id === mainVersion.id
				);
				const mainVersionGlobal = state.find(
					(entry) => entry.version_id === "global"
				);

				expect(inheritedMainVersion).toBeDefined();
				expect(mainVersionGlobal).toBeDefined();

				// Both should have the same change_set_id
				expect(
					(inheritedMainVersion?.snapshot_content as any).change_set_id
				).toEqual((mainVersionGlobal?.snapshot_content as any).change_set_id);

				// The change_set_id should be different from the original change_set_Id
				expect(
					(inheritedMainVersion?.snapshot_content as any).change_set_id
				).not.toEqual(originalChangeSetId);
				expect(
					(mainVersionGlobal?.snapshot_content as any).change_set_id
				).not.toEqual(originalChangeSetId);

				expect(
					(cachedMainVersionGlobal?.snapshot_content as any).change_set_id
				).toEqual(mainVersionGlobal?.snapshot_content.change_set_id);
			}
		);
	}
);

// TODO flaky test https://github.com/opral/lix-sdk/issues/308
describe.skip.each([
	{ scenario: "cache hit", clearCache: false },
	{ scenario: "cache miss", clearCache: true },
])(
	"($scenario) updating an inherited entity in child version should create a copy-on-write entity",
	() => {
		test("child version inherits then overrides with own entity", async () => {
			const lix = await openLix({});

			// Insert an entity into global version
			await lix.db
				.insertInto("state_all")
				.values({
					entity_id: "shared-entity",
					file_id: "test-file",
					schema_key: "test_schema",
					plugin_key: "test_plugin",
					version_id: "global",
					snapshot_content: {
						id: "shared-entity",
						name: "Original Global Value",
						count: 1,
					},
					schema_version: "1.0",
				})
				.execute();

			// Create a child version that inherits from global
			const childVersion = await createVersion({
				lix,
				name: "child-version",
			});

			// Note: For cache miss testing, we'll clear cache AFTER the update operation

			// Verify the child initially sees the inherited entity
			const inheritedEntity = await lix.db
				.selectFrom("state_all")
				.where("entity_id", "=", "shared-entity")
				.where("version_id", "=", childVersion.id)
				.selectAll()
				.execute();

			expect(inheritedEntity).toHaveLength(1);
			expect(inheritedEntity[0]?.version_id).toBe(childVersion.id);
			expect(inheritedEntity[0]?.inherited_from_version_id).toBe("global");
			expect(inheritedEntity[0]?.snapshot_content).toEqual({
				id: "shared-entity",
				name: "Original Global Value",
				count: 1,
			});

			// Now modify the entity in the child version (copy-on-write)
			await lix.db
				.updateTable("state_all")
				.set({
					snapshot_content: {
						id: "shared-entity",
						name: "Modified in Child Version",
						count: 2,
					},
				})
				.where("entity_id", "=", "shared-entity")
				.where("version_id", "=", childVersion.id)
				.execute();

			// Clear cache after update to test cache miss scenario
			// if (clearCache) {
			// 	lix.sqlite.exec("DELETE FROM internal_state_cache");
			// }

			// Verify the child now has its own version of the entity
			const childEntity = await lix.db
				.selectFrom("state_all")
				.where("entity_id", "=", "shared-entity")
				.where("version_id", "=", childVersion.id)
				.selectAll()
				.execute();

			expect(childEntity).toHaveLength(1);
			expect(childEntity[0]?.version_id).toBe(childVersion.id);
			expect(childEntity[0]?.inherited_from_version_id).toBe(null); // No longer inherited
			expect(childEntity[0]?.snapshot_content).toEqual({
				id: "shared-entity",
				name: "Modified in Child Version",
				count: 2,
			});

			// Verify the global version still has the original value
			const globalEntity = await lix.db
				.selectFrom("state_all")
				.where("entity_id", "=", "shared-entity")
				.where("version_id", "=", "global")
				.selectAll()
				.execute();

			expect(globalEntity).toHaveLength(1);
			expect(globalEntity[0]?.version_id).toBe("global");
			expect(globalEntity[0]?.inherited_from_version_id).toBe(null);
			expect(globalEntity[0]?.snapshot_content).toEqual({
				id: "shared-entity",
				name: "Original Global Value",
				count: 1,
			});

			// Verify we now have 2 separate entities (one in global, one in child)
			const allEntities = await lix.db
				.selectFrom("state_all")
				.where("entity_id", "=", "shared-entity")
				.selectAll()
				.execute();

			expect(allEntities).toHaveLength(2);

			// Sort by version_id for consistent ordering
			allEntities.sort((a, b) => a.version_id.localeCompare(b.version_id));

			// Child version entity (modified)
			expect(allEntities[0]?.version_id).toBe(childVersion.id);
			expect(allEntities[0]?.inherited_from_version_id).toBe(null);
			expect(allEntities[0]?.snapshot_content).toEqual({
				id: "shared-entity",
				name: "Modified in Child Version",
				count: 2,
			});

			// Global version entity (original)
			expect(allEntities[1]?.version_id).toBe("global");
			expect(allEntities[1]?.inherited_from_version_id).toBe(null);
			expect(allEntities[1]?.snapshot_content).toEqual({
				id: "shared-entity",
				name: "Original Global Value",
				count: 1,
			});
		});
	}
);

describe.each([
	{ scenario: "cache hit", clearCache: false },
	{ scenario: "cache miss", clearCache: true },
])(
	"($scenario) deleting an inherited entity should create copy-on-write deletion",
	({ clearCache }) => {
		test.todo(
			"child version deletes inherited entity via copy-on-write",
			async () => {
				const mockSchema: LixSchemaDefinition = {
					"x-lix-key": "test_schema",
					"x-lix-version": "1.0",
					type: "object",
					additionalProperties: false,
					properties: {
						id: { type: "string" },
						name: { type: "string" },
					},
				};

				const lix = await openLix({});

				const activeVersion = await lix.db
					.selectFrom("active_version")
					.innerJoin("version", "active_version.version_id", "version.id")
					.selectAll("version")
					.executeTakeFirstOrThrow();

				// Insert schema
				await lix.db
					.insertInto("stored_schema")
					.values({ value: mockSchema })
					.execute();

				// Insert an entity into global version
				await lix.db
					.insertInto("state_all")
					.values({
						entity_id: "shared-entity",
						file_id: "test-file",
						schema_key: "test_schema",
						plugin_key: "test_plugin",
						version_id: "global",
						snapshot_content: {
							id: "shared-entity",
							name: "shared Entity",
						},
						schema_version: "1.0",
					})
					.execute();

				if (clearCache) {
					// Clear the state cache to force re-materialization with inheritance (CTE path)
					lix.sqlite.exec("DELETE FROM internal_state_cache");
				}
				// If clearCache is false, we test the cache hit path

				// Verify the child initially sees the inherited entity
				const inheritedEntity = await lix.db
					.selectFrom("state_all")
					.where("entity_id", "=", "shared-entity")
					.where("version_id", "=", activeVersion.id)
					.selectAll()
					.execute();

				expect(inheritedEntity).toHaveLength(1);
				expect(inheritedEntity[0]?.version_id).toBe(activeVersion.id);
				expect(inheritedEntity[0]?.inherited_from_version_id).toBe("global");

				// Delete the inherited entity in child version (should create copy-on-write deletion)
				await lix.db
					.deleteFrom("state_all")
					.where("entity_id", "=", "shared-entity")
					.where("version_id", "=", activeVersion.id)
					.execute();

				if (clearCache) {
					// Clear cache after deletion to test CTE path for subsequent queries
					lix.sqlite.exec("DELETE FROM internal_state_cache");
				}

				// Verify the entity is deleted in child version
				const childEntityAfterDelete = await lix.db
					.selectFrom("state_all")
					.where("entity_id", "=", "shared-entity")
					.where("version_id", "=", activeVersion.id)
					.selectAll()
					.execute();

				// Entity should be deleted in child version (copy-on-write deletion)
				expect(childEntityAfterDelete).toHaveLength(0);

				// Verify the entity still exists in global version (not affected by child deletion)
				const inheritedEntityAfterDelete = await lix.db
					.selectFrom("state_all")
					.where("entity_id", "=", "shared-entity")
					.where("version_id", "=", "global")
					.selectAll()
					.execute();

				expect(inheritedEntityAfterDelete).toHaveLength(1);
				expect(inheritedEntityAfterDelete[0]?.snapshot_content).toEqual({
					id: "shared-entity",
					name: "shared Entity",
				});

				// Verify we now only see the global entity through the state view (deletion marker is hidden)
				const allEntities = await lix.db
					.selectFrom("state_all")
					.where("entity_id", "=", "shared-entity")
					.selectAll()
					.execute();

				// Debug: Log what entities we actually got in cache miss scenario
				if (clearCache && allEntities.length !== 1) {
					console.log(
						`Cache miss scenario returned ${allEntities.length} entities:`,
						allEntities.map((e) => ({
							version_id: e.version_id,
							inherited_from_version_id: e.inherited_from_version_id,
							snapshot_content: e.snapshot_content,
						}))
					);
				}

				// Both cache hit and cache miss scenarios should behave identically:
				// copy-on-write deletion hides the entity from child but preserves it in parent
				expect(allEntities).toHaveLength(1);
				expect(allEntities[0]?.version_id).toBe("global");
				expect(allEntities[0]?.inherited_from_version_id).toBe(null); // It's the original global entity
			}
		);
	}
);

// TODO flaky test (ordering of deletions)
test.todo(
	"deleting without filtering for the version_id deletes the entity from all versions",
	async () => {
		const lix = await openLix({});

		// Insert an entity into global version
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "shared-entity",
				file_id: "test-file",
				schema_key: "test_schema",
				plugin_key: "test_plugin",
				version_id: "global",
				snapshot_content: {
					id: "shared-entity",
					name: "Global Entity",
				},
				schema_version: "1.0",
			})
			.execute();

		// Create a child version that inherits from global
		const childVersion = await createVersion({
			lix,
			name: "child-version",
			inherits_from_version_id: "global",
		});

		// Verify inheritance - both global and child should see the entity
		const beforeDelete = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "in", ["global", childVersion.id])
			.selectAll()
			.execute();

		expect(beforeDelete).toHaveLength(2); // One in global, one inherited in child
		expect(beforeDelete).toMatchObject([
			{
				entity_id: "shared-entity",
				version_id: "global",
				inherited_from_version_id: null,
				snapshot_content: { id: "shared-entity", name: "Global Entity" },
			},
			{
				entity_id: "shared-entity",
				version_id: childVersion.id,
				inherited_from_version_id: "global",
				snapshot_content: { id: "shared-entity", name: "Global Entity" },
			},
		]);

		await lix.db
			.deleteFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.where("schema_key", "=", "test_schema")
			.execute();

		const afterDelete = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.selectAll()
			.execute();

		// Should be deleted from every version
		expect(afterDelete).toHaveLength(0);
	}
);

// todo @martin-lysk the insert or ignore is not working as expected
// i am not fixing this now to avoid merge conflicts in the xUpdate function
test.todo(
	"INSERT OR IGNORE into state virtual table should not throw validation errors for duplicates or update the row",
	async () => {
		const lix = await openLix({});

		// First, insert a record successfully
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "test-duplicate-entity",
				schema_key: "test_schema",
				file_id: "test",
				plugin_key: "test_plugin",
				snapshot_content: { id: "test-duplicate-entity", name: "Original" },
				schema_version: "1.0",
				version_id: "global",
			})
			.execute();

		// Verify the record exists
		const originalRecord = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "test-duplicate-entity")
			.selectAll()
			.executeTakeFirst();

		expect(originalRecord).toBeDefined();
		expect(originalRecord?.snapshot_content).toMatchObject({
			id: "test-duplicate-entity",
			name: "Original",
		});

		// Now try to INSERT OR IGNORE the same entity - this should NOT throw an error
		// but currently it does because validation runs before OR IGNORE logic
		expect(() => {
			lix.sqlite.exec(`
			INSERT OR IGNORE INTO state (
				entity_id, schema_key, file_id, plugin_key, 
				snapshot_content, schema_version, version_id
			) VALUES (
				'test-duplicate-entity', 'test_schema', 'test', 'test_plugin',
				'{"id":"test-duplicate-entity","name":"Duplicate"}', '1.0', 'global'
			)
		`);
		}).not.toThrow(); // This should not throw, but currently does

		// Verify the original record is unchanged (OR IGNORE should have ignored the duplicate)
		const afterIgnore = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "test-duplicate-entity")
			.selectAll()
			.executeTakeFirst();

		expect(afterIgnore?.snapshot_content).toMatchObject({
			id: "test-duplicate-entity",
			name: "Original", // Should still be original, not "Duplicate"
		});
	}
);

test("should emit state_commit hook when database transaction commits", async () => {
	const lix = await openLix({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		additionalProperties: false,
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

	// Set up hook listener
	let hookCallCount = 0;
	lix.hooks.onStateCommit(() => {
		hookCallCount++;
	});

	// Perform a database operation that should trigger the hook
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "test-entity",
			file_id: "test-file",
			schema_key: "mock_schema",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			version_id: sql`(SELECT version_id FROM active_version)`,
			snapshot_content: {
				value: "test value",
			},
		})
		.execute();

	// Hook should have been called once
	expect(hookCallCount).toBe(1);

	// Perform another operation
	await lix.db
		.updateTable("state_all")
		.set({
			snapshot_content: {
				value: "updated value",
			},
		})
		.where("entity_id", "=", "test-entity")
		.execute();

	// Hook should have been called twice now
	expect(hookCallCount).toBe(2);
});

test("untracked mutations don't trigger change control", async () => {
	const lix = await openLix({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		additionalProperties: false,
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

	// Count changes before any untracked mutations
	const changesInitial = await lix.db
		.selectFrom("change")
		.selectAll()
		.execute();

	// 1. INSERT untracked state
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "untracked-entity",
			file_id: "test-file",
			schema_key: "mock_schema",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			version_id: sql`(SELECT version_id FROM active_version)`,
			snapshot_content: {
				value: "untracked value",
			},
			untracked: true,
		})
		.execute();

	// Count changes after untracked insert
	const changesAfterInsert = await lix.db
		.selectFrom("change")
		.selectAll()
		.execute();

	// Number of changes should be identical (no change control for untracked)
	expect(changesAfterInsert.length).toBe(changesInitial.length);

	// Verify the untracked entity exists in state view
	const untrackedState = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "untracked-entity")
		.selectAll()
		.execute();

	expect(untrackedState).toHaveLength(1);
	expect(untrackedState[0]?.snapshot_content).toEqual({
		value: "untracked value",
	});
	expect(untrackedState[0]?.untracked).toBe(1);

	// 2. UPDATE untracked state
	await lix.db
		.updateTable("state_all")
		.where("entity_id", "=", "untracked-entity")
		.set({
			snapshot_content: {
				value: "untracked value updated",
			},
			untracked: true,
		})
		.execute();

	// Count changes after untracked update
	const changesAfterUpdate = await lix.db
		.selectFrom("change")
		.selectAll()
		.execute();

	// Number of changes should still be identical (no change control for untracked)
	expect(changesAfterUpdate.length).toBe(changesInitial.length);

	// Verify the untracked entity was updated
	const updatedState = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "untracked-entity")
		.selectAll()
		.execute();

	expect(updatedState).toHaveLength(1);
	expect(updatedState[0]?.snapshot_content).toEqual({
		value: "untracked value updated",
	});
	expect(updatedState[0]?.untracked).toBe(1);

	// 3. DELETE untracked state
	await lix.db
		.deleteFrom("state_all")
		.where("entity_id", "=", "untracked-entity")
		.execute();

	// Count changes after untracked delete
	const changesAfterDelete = await lix.db
		.selectFrom("change")
		.selectAll()
		.execute();

	// Number of changes should still be identical (no change control for untracked)
	expect(changesAfterDelete.length).toBe(changesInitial.length);

	// Verify the untracked entity was deleted
	const deletedState = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "untracked-entity")
		.selectAll()
		.execute();

	expect(deletedState).toHaveLength(0);
});

test("tracked update to previously untracked entity deletes untracked state", async () => {
	const lix = await openLix({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		additionalProperties: false,
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

	// Insert untracked state
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "override-entity",
			file_id: "test-file",
			schema_key: "mock_schema",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			version_id: sql`(SELECT version_id FROM active_version)`,
			snapshot_content: {
				value: "untracked value",
			},
			untracked: true,
		})
		.execute();

	// Verify untracked state exists
	const untrackedState = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "override-entity")
		.selectAll()
		.execute();

	expect(untrackedState).toHaveLength(1);
	expect(untrackedState[0]?.snapshot_content).toEqual({
		value: "untracked value",
	});

	// Now update the untracked entity to make it tracked (should delete from untracked table)
	await lix.db
		.updateTable("state_all")
		.set({
			snapshot_content: {
				value: "tracked value",
			},
			untracked: false,
		})
		.where("entity_id", "=", "override-entity")
		.where("schema_key", "=", "mock_schema")
		.execute();

	// Verify tracked state has overridden untracked state
	const finalState = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "override-entity")
		.selectAll()
		.execute();

	expect(finalState).toHaveLength(1);
	expect(finalState[0]?.snapshot_content).toEqual({
		value: "tracked value",
	});

	// Verify a change was created for the tracked mutation
	const changes = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "override-entity")
		.where("schema_key", "=", "mock_schema")
		.selectAll()
		.execute();

	expect(changes.length).toBeGreaterThan(0);
});

test("untracked state is persisted across lix sessions", async () => {
	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		additionalProperties: false,
		properties: {
			value: {
				type: "string",
			},
		},
	};

	// First session - create and insert untracked state
	const lix1 = await openLix({});

	await lix1.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	await lix1.db
		.insertInto("state_all")
		.values({
			entity_id: "persistent-entity",
			file_id: "test-file",
			schema_key: "mock_schema",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			version_id: sql`(SELECT version_id FROM active_version)`,
			snapshot_content: {
				value: "persistent untracked value",
			},
			untracked: true,
		})
		.execute();

	// Second session - verify untracked state persists
	const lix2 = await openLix({ blob: await lix1.toBlob() });

	const persistedState = await lix2.db
		.selectFrom("state_all")
		.where("entity_id", "=", "persistent-entity")
		.selectAll()
		.execute();

	expect(persistedState).toHaveLength(1);
	expect(persistedState[0]?.snapshot_content).toEqual({
		value: "persistent untracked value",
	});

	await lix2.close();
});

test("untracked state has highest priority in UNION (untracked > tracked > inherited)", async () => {
	const lix = await openLix({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		additionalProperties: false,
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

	// Step 1: Insert tracked state with "init"
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "entity0",
			file_id: "test-file",
			schema_key: "mock_schema",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			version_id: sql`(SELECT version_id FROM active_version)`,
			snapshot_content: {
				value: "init",
			},
			untracked: false,
		})
		.execute();

	// Verify tracked state exists
	const afterInit = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "entity0")
		.selectAll()
		.execute();

	expect(afterInit).toHaveLength(1);
	expect(afterInit[0]?.snapshot_content).toEqual({ value: "init" });

	// Step 2: Update to untracked state with "update" (should NOT delete tracked state)
	await lix.db
		.updateTable("state_all")
		.set({
			snapshot_content: {
				value: "update",
			},
			untracked: true,
		})
		.where("entity_id", "=", "entity0")
		.where("schema_key", "=", "mock_schema")
		.execute();

	// Step 3: Query should return untracked state "update" (highest priority)
	const afterUntrackedUpdate = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "entity0")
		.selectAll()
		.execute();

	expect(afterUntrackedUpdate).toHaveLength(1);
	expect(afterUntrackedUpdate[0]?.snapshot_content).toEqual({
		value: "update",
	});

	// Step 4: Update back to tracked state with "update2" (should delete untracked state)
	await lix.db
		.updateTable("state_all")
		.set({
			snapshot_content: {
				value: "update2",
			},
			untracked: false,
		})
		.where("entity_id", "=", "entity0")
		.where("schema_key", "=", "mock_schema")
		.execute();

	// Step 5: Query should return tracked state "update2"
	const afterTrackedUpdate = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "entity0")
		.selectAll()
		.execute();

	expect(afterTrackedUpdate).toHaveLength(1);
	expect(afterTrackedUpdate[0]?.snapshot_content).toEqual({ value: "update2" });

	// Verify that a change was created for the final tracked mutation
	const changes = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "entity0")
		.where("schema_key", "=", "mock_schema")
		.selectAll()
		.execute();

	expect(changes.length).toBeGreaterThan(0);
});

test("untracked state overrides inherited state (untracked > inherited)", async () => {
	const lix = await openLix({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		additionalProperties: false,
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

	// Step 1: Insert entity in global version (will be inherited by child)
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "inherited-entity",
			file_id: "test-file",
			schema_key: "mock_schema",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			version_id: "global",
			snapshot_content: {
				value: "inherited value",
			},
			untracked: false,
		})
		.execute();

	// Step 2: Create a child version that inherits from global
	const childVersion = await createVersion({ lix, name: "child-version" });

	// Verify inheritance is set up correctly
	expect(childVersion.inherits_from_version_id).toBe("global");

	// Step 3: Verify child initially sees inherited entity
	const inheritedState = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "inherited-entity")
		.where("version_id", "=", childVersion.id)
		.selectAll()
		.execute();

	expect(inheritedState).toHaveLength(1);
	expect(inheritedState[0]?.snapshot_content).toEqual({
		value: "inherited value",
	});
	expect(inheritedState[0]?.inherited_from_version_id).toBe("global");

	// Step 4: Add untracked state for same entity in child version
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "inherited-entity",
			file_id: "test-file",
			schema_key: "mock_schema",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			version_id: childVersion.id,
			snapshot_content: {
				value: "untracked override",
			},
			untracked: true,
		})
		.execute();

	// Step 5: Query should return untracked state (higher priority than inherited)
	const finalState = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "inherited-entity")
		.where("version_id", "=", childVersion.id)
		.selectAll()
		.execute();

	expect(finalState).toHaveLength(1);
	expect(finalState[0]?.snapshot_content).toEqual({
		value: "untracked override",
	});
	expect(finalState[0]?.inherited_from_version_id).toBe(null); // Should not be inherited anymore
	expect(finalState[0]?.version_id).toBe(childVersion.id);

	// Step 6: Verify the inherited entity still exists in global version (unchanged)
	const globalState = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "inherited-entity")
		.where("version_id", "=", "global")
		.selectAll()
		.execute();

	expect(globalState).toHaveLength(1);
	expect(globalState[0]?.snapshot_content).toEqual({
		value: "inherited value",
	});
	expect(globalState[0]?.inherited_from_version_id).toBe(null);

	// Step 7: No changes should be created for untracked mutations
	const changes = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "inherited-entity")
		.where("schema_key", "=", "mock_schema")
		.selectAll()
		.execute();

	// Should only have the original change from global version, not the untracked one
	expect(changes).toHaveLength(1);
});

test("untracked state inheritance", async () => {
	const lix = await openLix({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		additionalProperties: false,
		properties: {
			value: {
				type: "string",
			},
		},
	};

	await lix.db
		.insertInto("stored_schema_all")
		.values({ value: mockSchema, lixcol_version_id: "global" })
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	// inserting into the global version
	await lix.db
		.insertInto("state_all")
		.values({
			file_id: "test-file",
			schema_key: "mock_schema",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			entity_id: "test_key",
			snapshot_content: {
				value: "test_value",
			},
			version_id: "global",
			untracked: true,
		})
		.execute();

	const globalState = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "test_key")
		.where("version_id", "=", "global")
		.select("snapshot_content")
		.executeTakeFirstOrThrow();

	expect(globalState).toBeDefined();

	const versionState = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "test_key")
		.where("version_id", "=", activeVersion.id)
		.select("snapshot_content")
		.executeTakeFirstOrThrow();

	expect(versionState).toBeDefined();
	expect(versionState).toEqual(globalState);
});

test("tracked state in child overrides inherited untracked state", async () => {
	const lix = await openLix({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		additionalProperties: false,
		properties: {
			value: {
				type: "string",
			},
		},
	};

	await lix.db
		.insertInto("stored_schema") // Use stored_schema, not stored_schema_all
		.values({ value: mockSchema })
		.execute();

	const childVersion = await createVersion({ lix, name: "child" });

	// 1. Insert untracked state in global version
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "override_test",
			file_id: "f1",
			schema_key: "mock_schema",
			plugin_key: "p1",
			schema_version: "1.0",
			snapshot_content: { value: "global untracked" },
			version_id: "global",
			untracked: true,
		})
		.execute();

	// 2. Verify child inherits untracked state
	const inheritedState = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "override_test")
		.where("version_id", "=", childVersion.id)
		.selectAll()
		.execute();

	expect(inheritedState).toHaveLength(1);
	expect(inheritedState[0]?.snapshot_content).toEqual({
		value: "global untracked",
	});
	expect(inheritedState[0]?.untracked).toBe(1);

	// 3. Insert tracked state in child version for same entity
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "override_test",
			file_id: "f1",
			schema_key: "mock_schema",
			plugin_key: "p1",
			schema_version: "1.0",
			snapshot_content: { value: "child tracked" },
			version_id: childVersion.id,
			untracked: false, // Important: this is tracked state
		})
		.execute();

	// 4. Verify child now sees tracked state, not inherited untracked
	const finalState = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "override_test")
		.where("version_id", "=", childVersion.id)
		.selectAll()
		.execute();

	expect(finalState).toHaveLength(1);
	expect(finalState[0]?.snapshot_content).toEqual({ value: "child tracked" });
	expect(finalState[0]?.untracked).toBe(0); // Should be tracked
});

test("untracked state in child overrides inherited untracked state", async () => {
	const lix = await openLix({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		additionalProperties: false,
		properties: {
			value: {
				type: "string",
			},
		},
	};

	await lix.db
		.insertInto("stored_schema") // Use stored_schema
		.values({ value: mockSchema })
		.execute();

	const childVersion = await createVersion({ lix, name: "child" });

	// 1. Insert untracked state in global version
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "untracked_override_test",
			file_id: "f1",
			schema_key: "mock_schema",
			plugin_key: "p1",
			schema_version: "1.0",
			snapshot_content: { value: "global untracked" },
			version_id: "global",
			untracked: true,
		})
		.execute();

	// 2. Verify child inherits untracked state
	const inheritedState = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "untracked_override_test")
		.where("version_id", "=", childVersion.id)
		.selectAll()
		.execute();

	expect(inheritedState).toHaveLength(1);
	expect(inheritedState[0]?.snapshot_content).toEqual({
		value: "global untracked",
	});
	expect(inheritedState[0]?.untracked).toBe(1);

	// 3. Insert untracked state in child version for same entity
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "untracked_override_test",
			file_id: "f1",
			schema_key: "mock_schema",
			plugin_key: "p1",
			schema_version: "1.0",
			snapshot_content: { value: "child untracked" },
			version_id: childVersion.id,
			untracked: true,
		})
		.execute();

	// 4. Verify child now sees its own untracked state
	const finalState = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "untracked_override_test")
		.where("version_id", "=", childVersion.id)
		.selectAll()
		.execute();

	expect(finalState).toHaveLength(1);
	expect(finalState[0]?.snapshot_content).toEqual({ value: "child untracked" });
	expect(finalState[0]?.untracked).toBe(1);
});

test("untracked state has untracked change_id for both inherited and non-inherited entities", async () => {
	const lix = await openLix({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		additionalProperties: false,
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

	const childVersion = await createVersion({ lix, name: "child" });

	// 1. Insert untracked state in global version (will be inherited by child)
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "inherited-entity",
			file_id: "test-file",
			schema_key: "mock_schema",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: { value: "global untracked" },
			version_id: "global",
			untracked: true,
		})
		.execute();

	// 2. Insert untracked state directly in child version (non-inherited)
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "non-inherited-entity",
			file_id: "test-file",
			schema_key: "mock_schema",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: { value: "child untracked" },
			version_id: childVersion.id,
			untracked: true,
		})
		.execute();

	// 3. Query all untracked entities in child version
	const untrackedEntities = await lix.db
		.selectFrom("state_all")
		.where("version_id", "=", childVersion.id)
		.where("entity_id", "in", ["inherited-entity", "non-inherited-entity"])
		.where("untracked", "=", true)
		.selectAll()
		.execute();

	expect(untrackedEntities).toHaveLength(2);

	// 4. Check that both entities have untracked change_id
	for (const entity of untrackedEntities) {
		expect(entity.change_id).toBe("untracked");
	}

	// 5. Verify specific entities
	const inheritedEntity = untrackedEntities.find(
		(e) => e.entity_id === "inherited-entity"
	);
	const nonInheritedEntity = untrackedEntities.find(
		(e) => e.entity_id === "non-inherited-entity"
	);

	expect(inheritedEntity).toBeDefined();
	expect(nonInheritedEntity).toBeDefined();

	// Both inherited and non-inherited untracked entities should have change_id = "untracked"
	expect(inheritedEntity?.change_id).toBe("untracked");
	expect(nonInheritedEntity?.change_id).toBe("untracked");
});

test("state version_id defaults active version", async () => {
	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		additionalProperties: false,
		properties: {
			value: {
				type: "string",
			},
		},
	};

	const lix = await openLix({});

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	// Get the active version ID to verify it gets auto-filled
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// Insert into state view without specifying version_id
	// This should auto-fill with the active version
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "entity0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			schema_version: "1.0",
			snapshot_content: { value: "initial content" },
		})
		.execute();

	// Verify the entity was inserted with the correct version_id
	const insertedEntity = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "entity0")
		.selectAll()
		.execute();

	expect(insertedEntity).toHaveLength(1);
	expect(insertedEntity[0]).toMatchObject({
		entity_id: "entity0",
		file_id: "f0",
		schema_key: "mock_schema",
		plugin_key: "lix_own_entity",
		schema_version: "1.0",
		snapshot_content: { value: "initial content" },
	});

	// Verify the version_id was auto-filled with the active version
	const entityInStateAll = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "entity0")
		.select("version_id")
		.executeTakeFirstOrThrow();

	expect(entityInStateAll.version_id).toBe(activeVersion.version_id);

	// Test update operation
	await lix.db
		.updateTable("state")
		.where("entity_id", "=", "entity0")
		.set({
			snapshot_content: { value: "updated content" },
		})
		.execute();

	// Verify update worked
	const updatedEntity = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "entity0")
		.selectAll()
		.execute();

	expect(updatedEntity[0]?.snapshot_content).toEqual({
		value: "updated content",
	});

	// Test delete operation
	await lix.db.deleteFrom("state").where("entity_id", "=", "entity0").execute();

	// Verify delete worked
	const deletedEntity = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "entity0")
		.selectAll()
		.execute();

	expect(deletedEntity).toHaveLength(0);
});
