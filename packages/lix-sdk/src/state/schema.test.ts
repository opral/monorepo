import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import { Kysely, sql } from "kysely";
import { createVersion } from "../version/create-version.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import {
	simulationTest,
	normalSimulation,
} from "../test-utilities/simulation-test/simulation-test.js";

test("dstest discovery", () => {});

simulationTest(
	"select, insert, update, delete entity",
	async ({ openSimulatedLix }) => {
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

		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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
	}
);

simulationTest(
	"validates the schema on insert",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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
	}
);

simulationTest(
	"validates the schema on update",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({});

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
	}
);

simulationTest(
	"state is separated by version",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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
	}
);

simulationTest(
	"created_at and updated_at timestamps are computed correctly",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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
	}
);

simulationTest(
	"created_at and updated_at are version specific",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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
	}
);

simulationTest(
	"state appears in both versions when they share the same commit",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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

		const sharedCommitId = versionAAfterInsert.commit_id;

		// Create version B from version A
		const versionB = await createVersion({
			lix,
			id: "version_b",
			commit_id: sharedCommitId,
		});

		expect(versionB.commit_id).toBe(sharedCommitId);

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
				commit_id: sharedCommitId,
			},
			{
				entity_id: "e0",
				schema_key: "mock_schema",
				snapshot_content: { value: "shared state" },
				version_id: "version_b",
				commit_id: sharedCommitId,
			},
		]);
	}
);

simulationTest(
	"state diverges when versions have common ancestor but different changes",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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

		// Create two versions from the same base version
		await createVersion({
			lix,
			id: "version_a",
			commit_id: baseVersionAfterInsert.commit_id,
		});

		await createVersion({
			lix,
			id: "version_b",
			commit_id: baseVersionAfterInsert.commit_id,
		});

		const versions = await lix.db
			.selectFrom("version")
			.where("id", "in", ["base_version", "version_a", "version_b"])
			.select(["id", "commit_id"])
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

simulationTest(
	"delete operations remove entries from underlying data",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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

simulationTest(
	"change.created_at and state timestamps are consistent",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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
	},
	{ simulations: [normalSimulation] }
);

simulationTest(
	"state and state_all views expose change_id for blame and diff functionality",
	async ({ expectDeterministic, openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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

		expectDeterministic(stateAllResult).toHaveLength(1);
		expect(stateAllResult[0]?.change_id).toBeDefined();
		expect(typeof stateAllResult[0]?.change_id).toBe("string");

		// Query state view (filtered by active version) to verify change_id is exposed
		const stateResult = await lix.db
			.selectFrom("state")
			.where("entity_id", "=", "change-id-test-entity")
			.where("schema_key", "=", "mock_schema")
			.selectAll()
			.execute();

		expectDeterministic(stateResult).toHaveLength(1);
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

		// Get the new change record by matching the change_id from the updated state
		const newChangeRecord = await lix.db
			.selectFrom("change")
			.where("change.id", "=", updatedStateResult[0]!.change_id)
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

simulationTest(
	"state and state_all views expose commit_id for history queries",
	async ({ expectDeterministic, openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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
		expectDeterministic(stateAllResult[0]).toHaveProperty("commit_id");
		expectDeterministic(stateAllResult[0]?.commit_id).toBe(
			activeVersionAfterInsert.commit_id
		);

		// Query state view (filtered by active version) to verify commit_id is exposed
		const stateResult = await lix.db
			.selectFrom("state")
			.where("entity_id", "=", "change-set-id-test-entity")
			.where("schema_key", "=", "mock_schema")
			.selectAll()
			.execute();

		expectDeterministic(stateResult).toHaveLength(1);
		expectDeterministic(stateResult[0]?.commit_id).toBeDefined();
		expectDeterministic(stateResult[0]?.commit_id).toBe(
			activeVersionAfterInsert.commit_id
		);

		// Verify that commit_id matches between state and state_all views
		expectDeterministic(stateResult[0]?.commit_id).toBe(
			stateAllResult[0]?.commit_id
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
			.orderBy("change_set_id")
			.execute();

		expectDeterministic(changeSetElements).toHaveLength(2);

		// Get the version to understand which change sets we're dealing with
		const version = await lix.db
			.selectFrom("version")
			.where("id", "=", activeVersionAfterInsert.id)
			.select(["id", "commit_id", "working_commit_id"])
			.executeTakeFirstOrThrow();

		// Get the change set ID from the version's commit
		const versionCommit = await lix.db
			.selectFrom("commit")
			.where("id", "=", version.commit_id)
			.selectAll()
			.executeTakeFirstOrThrow();

		// Get the change set ID from the working commit
		const workingCommit = await lix.db
			.selectFrom("commit")
			.where("id", "=", version.working_commit_id)
			.selectAll()
			.executeTakeFirstOrThrow();

		// Find which change_set_element is in the version's change set (not working)
		const versionChangeSetElement = changeSetElements.find(
			(el) => el.change_set_id === versionCommit.change_set_id
		);
		const workingChangeSetElement = changeSetElements.find(
			(el) => el.change_set_id === workingCommit.change_set_id
		);

		expectDeterministic(versionChangeSetElement).toBeDefined();
		expectDeterministic(workingChangeSetElement).toBeDefined();

		// The state view should show the commit_id from the version,
		// not related to the working change set (which is temporary and not part of the graph)
		expectDeterministic(stateResult[0]?.commit_id).toBe(version.commit_id);
		expectDeterministic(stateAllResult[0]?.commit_id).toBe(version.commit_id);

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
simulationTest(
	"write-through cache: insert operations populate cache immediately",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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
	},
	{ simulations: [normalSimulation] }
);

simulationTest(
	"write-through cache: update operations update cache immediately",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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
	},
	{ simulations: [normalSimulation] }
);

simulationTest(
	"delete operations are validated for foreign key constraints",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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
			"x-lix-foreign-keys": [
				{
					properties: ["parent_id"],
					references: {
						schemaKey: "parent_entity",
						properties: ["id"],
					},
				},
			],
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

		expectDeterministic(parentBefore).toHaveLength(1);
		expectDeterministic(childBefore).toHaveLength(1);

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

		expectDeterministic(parentAfter).toHaveLength(1);
	}
);

simulationTest(
	"child version inherits entities from parent version",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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
		expectDeterministic(childVersion.inherits_from_version_id).toBe("global");

		// The child version should inherit the entity from global
		const inheritedEntity = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "global-entity-1")
			.where("version_id", "=", childVersion.id)
			.selectAll()
			.execute();

		// This should pass - the entity should be visible in the child version via inheritance
		expectDeterministic(inheritedEntity).toHaveLength(1);
		expectDeterministic(inheritedEntity[0]?.entity_id).toBe("global-entity-1");
		expectDeterministic(inheritedEntity[0]?.version_id).toBe(childVersion.id); // Should return child version ID
		expectDeterministic(inheritedEntity[0]?.inherited_from_version_id).toBe(
			"global"
		); // Should track inheritance source
		expectDeterministic(inheritedEntity[0]?.snapshot_content).toEqual({
			id: "global-entity-1",
			name: "Global Entity",
		});
	}
);

simulationTest(
	"child version inherits then overrides with own entity",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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
			id: "child-version",
			inherits_from_version_id: "global",
		});

		// Verify the child initially sees the inherited entity
		const inheritedEntity = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "=", childVersion.id)
			.selectAll()
			.execute();

		expectDeterministic(inheritedEntity).toHaveLength(1);
		expectDeterministic(inheritedEntity[0]?.version_id).toBe(childVersion.id);
		expectDeterministic(inheritedEntity[0]?.inherited_from_version_id).toBe(
			"global"
		);
		expectDeterministic(inheritedEntity[0]?.snapshot_content).toEqual({
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

		// Verify the child now has its own version of the entity
		const childEntity = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "=", childVersion.id)
			.selectAll()
			.execute();

		expectDeterministic(childEntity).toHaveLength(1);
		expectDeterministic(childEntity[0]?.version_id).toBe(childVersion.id);
		expectDeterministic(childEntity[0]?.inherited_from_version_id).toBe(null); // No longer inherited
		expectDeterministic(childEntity[0]?.snapshot_content).toEqual({
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

		expectDeterministic(globalEntity).toHaveLength(1);
		expectDeterministic(globalEntity[0]?.version_id).toBe("global");
		expectDeterministic(globalEntity[0]?.inherited_from_version_id).toBe(null);
		expectDeterministic(globalEntity[0]?.snapshot_content).toEqual({
			id: "shared-entity",
			name: "Original Global Value",
			count: 1,
		});

		// Verify we now have 2 separate entities (one in global, one in child)
		const allEntities = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "in", ["global", childVersion.id])
			.orderBy("version_id", "asc")
			.selectAll()
			.execute();

		expectDeterministic(allEntities).toHaveLength(2);

		// Child version entity (modified)
		expectDeterministic(allEntities[0]?.version_id).toBe(childVersion.id);
		expectDeterministic(allEntities[0]?.inherited_from_version_id).toBe(null);
		expectDeterministic(allEntities[0]?.snapshot_content).toEqual({
			id: "shared-entity",
			name: "Modified in Child Version",
			count: 2,
		});

		// Global version entity (original)
		expectDeterministic(allEntities[1]?.version_id).toBe("global");
		expectDeterministic(allEntities[1]?.inherited_from_version_id).toBe(null);
		expectDeterministic(allEntities[1]?.snapshot_content).toEqual({
			id: "shared-entity",
			name: "Original Global Value",
			count: 1,
		});
	}
);

simulationTest(
	"child version deletes inherited entity via copy-on-write",
	async ({ openSimulatedLix, expectDeterministic }) => {
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

		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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

		// Verify the child initially sees the inherited entity
		const inheritedEntity = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "=", activeVersion.id)
			.selectAll()
			.execute();

		expectDeterministic(inheritedEntity).toHaveLength(1);
		expectDeterministic(inheritedEntity[0]?.version_id).toBe(activeVersion.id);
		expectDeterministic(inheritedEntity[0]?.inherited_from_version_id).toBe(
			"global"
		);

		// Delete the inherited entity in child version (should create copy-on-write deletion)
		await lix.db
			.deleteFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "=", activeVersion.id)
			.execute();

		// Verify the entity is deleted in child version
		const childEntityAfterDelete = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "=", activeVersion.id)
			.selectAll()
			.execute();

		// Entity should be deleted in child version (copy-on-write deletion)
		expectDeterministic(childEntityAfterDelete).toHaveLength(0);

		// Verify the entity still exists in global version (not affected by child deletion)
		const inheritedEntityAfterDelete = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.where("version_id", "=", "global")
			.selectAll()
			.execute();

		expectDeterministic(inheritedEntityAfterDelete).toHaveLength(1);
		expectDeterministic(
			inheritedEntityAfterDelete[0]?.snapshot_content
		).toEqual({
			id: "shared-entity",
			name: "shared Entity",
		});

		// Verify we now only see the global entity through the state view (deletion marker is hidden)
		const allEntities = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "shared-entity")
			.selectAll()
			.execute();

		// Both cache hit and cache miss scenarios should behave identically:
		// copy-on-write deletion hides the entity from child but preserves it in parent
		expectDeterministic(allEntities).toHaveLength(1);
		expectDeterministic(allEntities[0]?.version_id).toBe("global");
		expectDeterministic(allEntities[0]?.inherited_from_version_id).toBe(null); // It's the original global entity
	}
);

simulationTest(
	"deleting without filtering for the version_id deletes the entity from all versions",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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

		expectDeterministic(beforeDelete).toHaveLength(2); // One in global, one inherited in child
		expectDeterministic(beforeDelete).toMatchObject([
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
		expectDeterministic(afterDelete).toHaveLength(0);
	}
);

simulationTest(
	"untracked mutations don't trigger change control",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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
		expectDeterministic(changesAfterInsert.length).toBe(changesInitial.length);

		// Verify the untracked entity exists in state view
		const untrackedState = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "untracked-entity")
			.selectAll()
			.execute();

		expectDeterministic(untrackedState).toHaveLength(1);
		expectDeterministic(untrackedState[0]?.snapshot_content).toEqual({
			value: "untracked value",
		});
		expectDeterministic(untrackedState[0]?.untracked).toBe(1);

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
		expectDeterministic(changesAfterUpdate.length).toBe(changesInitial.length);

		// Verify the untracked entity was updated
		const updatedState = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "untracked-entity")
			.selectAll()
			.execute();

		expectDeterministic(updatedState).toHaveLength(1);
		expectDeterministic(updatedState[0]?.snapshot_content).toEqual({
			value: "untracked value updated",
		});
		expectDeterministic(updatedState[0]?.untracked).toBe(1);

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
		expectDeterministic(changesAfterDelete.length).toBe(changesInitial.length);

		// Verify the untracked entity was deleted
		const deletedState = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "untracked-entity")
			.selectAll()
			.execute();

		expectDeterministic(deletedState).toHaveLength(0);
	}
);

simulationTest(
	"tracked update to previously untracked entity deletes untracked state",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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

		expectDeterministic(untrackedState).toHaveLength(1);
		expectDeterministic(untrackedState[0]?.snapshot_content).toEqual({
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

		expectDeterministic(finalState).toHaveLength(1);
		expectDeterministic(finalState[0]?.snapshot_content).toEqual({
			value: "tracked value",
		});

		// Verify a change was created for the tracked mutation
		const changes = await lix.db
			.selectFrom("change")
			.where("entity_id", "=", "override-entity")
			.where("schema_key", "=", "mock_schema")
			.selectAll()
			.execute();

		expectDeterministic(changes.length).toBeGreaterThan(0);
	}
);

simulationTest(
	"untracked state is persisted across lix sessions",
	async ({ openSimulatedLix, expectDeterministic }) => {
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
		const lix1 = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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

		expectDeterministic(persistedState).toHaveLength(1);
		expectDeterministic(persistedState[0]?.snapshot_content).toEqual({
			value: "persistent untracked value",
		});

		await lix2.close();
	}
);

simulationTest(
	"untracked state has highest priority in UNION (untracked > tracked > inherited)",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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

		expectDeterministic(afterInit).toHaveLength(1);
		expectDeterministic(afterInit[0]?.snapshot_content).toEqual({
			value: "init",
		});

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

		expectDeterministic(afterUntrackedUpdate).toHaveLength(1);
		expectDeterministic(afterUntrackedUpdate[0]?.snapshot_content).toEqual({
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

		expectDeterministic(afterTrackedUpdate).toHaveLength(1);
		expectDeterministic(afterTrackedUpdate[0]?.snapshot_content).toEqual({
			value: "update2",
		});

		// Verify that a change was created for the final tracked mutation
		const changes = await lix.db
			.selectFrom("change")
			.where("entity_id", "=", "entity0")
			.where("schema_key", "=", "mock_schema")
			.selectAll()
			.execute();

		expectDeterministic(changes.length).toBeGreaterThan(0);
	}
);

simulationTest(
	"untracked state overrides inherited state (untracked > inherited)",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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
		expectDeterministic(childVersion.inherits_from_version_id).toBe("global");

		// Step 3: Verify child initially sees inherited entity
		const inheritedState = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "inherited-entity")
			.where("version_id", "=", childVersion.id)
			.selectAll()
			.execute();

		expectDeterministic(inheritedState).toHaveLength(1);
		expectDeterministic(inheritedState[0]?.snapshot_content).toEqual({
			value: "inherited value",
		});
		expectDeterministic(inheritedState[0]?.inherited_from_version_id).toBe(
			"global"
		);

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

		expectDeterministic(finalState).toHaveLength(1);
		expectDeterministic(finalState[0]?.snapshot_content).toEqual({
			value: "untracked override",
		});
		expectDeterministic(finalState[0]?.inherited_from_version_id).toBe(null); // Should not be inherited anymore
		expectDeterministic(finalState[0]?.version_id).toBe(childVersion.id);

		// Step 6: Verify the inherited entity still exists in global version (unchanged)
		const globalState = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "inherited-entity")
			.where("version_id", "=", "global")
			.selectAll()
			.execute();

		expectDeterministic(globalState).toHaveLength(1);
		expectDeterministic(globalState[0]?.snapshot_content).toEqual({
			value: "inherited value",
		});
		expectDeterministic(globalState[0]?.inherited_from_version_id).toBe(null);

		// Step 7: No changes should be created for untracked mutations
		const changes = await lix.db
			.selectFrom("change")
			.where("entity_id", "=", "inherited-entity")
			.where("schema_key", "=", "mock_schema")
			.selectAll()
			.execute();

		// Should only have the original change from global version, not the untracked one
		expectDeterministic(changes).toHaveLength(1);
	}
);

simulationTest(
	"untracked state inheritance",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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

		expectDeterministic(globalState).toBeDefined();

		const versionState = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "test_key")
			.where("version_id", "=", activeVersion.id)
			.select("snapshot_content")
			.executeTakeFirstOrThrow();

		expectDeterministic(versionState).toBeDefined();
		expectDeterministic(versionState).toEqual(globalState);
	}
);

simulationTest(
	"tracked state in child overrides inherited untracked state",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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

		expectDeterministic(inheritedState).toHaveLength(1);
		expectDeterministic(inheritedState[0]?.snapshot_content).toEqual({
			value: "global untracked",
		});
		expectDeterministic(inheritedState[0]?.untracked).toBe(1);

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

		expectDeterministic(finalState).toHaveLength(1);
		expectDeterministic(finalState[0]?.snapshot_content).toEqual({
			value: "child tracked",
		});
		expectDeterministic(finalState[0]?.untracked).toBe(0); // Should be tracked
	}
);

simulationTest(
	"untracked state in child overrides inherited untracked state",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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

		expectDeterministic(inheritedState).toHaveLength(1);
		expectDeterministic(inheritedState[0]?.snapshot_content).toEqual({
			value: "global untracked",
		});
		expectDeterministic(inheritedState[0]?.untracked).toBe(1);

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

		expectDeterministic(finalState).toHaveLength(1);
		expectDeterministic(finalState[0]?.snapshot_content).toEqual({
			value: "child untracked",
		});
		expectDeterministic(finalState[0]?.untracked).toBe(1);
	}
);

simulationTest(
	"untracked state has untracked change_id for both inherited and non-inherited entities",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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

		expectDeterministic(untrackedEntities).toHaveLength(2);

		// 4. Check that both entities have untracked change_id
		for (const entity of untrackedEntities) {
			expectDeterministic(entity.change_id).toBe("untracked");
		}

		// 5. Verify specific entities
		const inheritedEntity = untrackedEntities.find(
			(e) => e.entity_id === "inherited-entity"
		);
		const nonInheritedEntity = untrackedEntities.find(
			(e) => e.entity_id === "non-inherited-entity"
		);

		expectDeterministic(inheritedEntity).toBeDefined();
		expectDeterministic(nonInheritedEntity).toBeDefined();

		// Both inherited and non-inherited untracked entities should have change_id = "untracked"
		expectDeterministic(inheritedEntity?.change_id).toBe("untracked");
		expectDeterministic(nonInheritedEntity?.change_id).toBe("untracked");
	}
);

simulationTest(
	"state version_id defaults active version",
	async ({ openSimulatedLix, expectDeterministic }) => {
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

		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

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

		expectDeterministic(insertedEntity).toHaveLength(1);
		expectDeterministic(insertedEntity[0]).toMatchObject({
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

		expectDeterministic(entityInStateAll.version_id).toBe(
			activeVersion.version_id
		);

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

		expectDeterministic(updatedEntity[0]?.snapshot_content).toEqual({
			value: "updated content",
		});

		// Test delete operation
		await lix.db
			.deleteFrom("state")
			.where("entity_id", "=", "entity0")
			.execute();

		// Verify delete worked
		const deletedEntity = await lix.db
			.selectFrom("state")
			.where("entity_id", "=", "entity0")
			.selectAll()
			.execute();

		expectDeterministic(deletedEntity).toHaveLength(0);
	}
);

// https://github.com/opral/lix-sdk/issues/344
simulationTest(
	"deleting key_value entities from state should not cause infinite loop",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

		// 1. Insert key_value in global version (tracked)
		await lix.db
			.insertInto("key_value_all")
			.values({
				key: "test-key-global",
				value: "global-tracked-value",
				lixcol_version_id: "global",
			})
			.execute();

		// 2. Insert key_value in global version (untracked)
		await lix.db
			.insertInto("key_value_all")
			.values({
				key: "test-key-global-untracked",
				value: "global-untracked-value",
				lixcol_version_id: "global",
				lixcol_untracked: true,
			})
			.execute();

		// 3. Insert key_value in active version (tracked)
		await lix.db
			.insertInto("key_value")
			.values({
				key: "test-key-active",
				value: "active-tracked-value",
			})
			.execute();

		// 4. Insert key_value in active version (untracked)
		await lix.db
			.insertInto("key_value")
			.values({
				key: "test-key-active-untracked",
				value: "active-untracked-value",
				lixcol_untracked: true,
			})
			.execute();

		// Verify all entities exist before deletion (including inherited)
		const entitiesBeforeDelete = await lix.db
			.selectFrom("state")
			.where("schema_key", "=", "lix_key_value")
			.where("entity_id", "like", "test-key-%")
			.selectAll()
			.execute();

		// state view shows active version entities + inherited from global
		expectDeterministic(entitiesBeforeDelete).toHaveLength(4);

		// Delete all key_value entities
		// this is the reproduction of the infinite loop issue
		await lix.db
			.deleteFrom("state")
			.where("schema_key", "=", "lix_key_value")
			.execute();

		// Verify all entities are deleted
		const keyValueAfterDelete = await lix.db
			.selectFrom("state")
			.where("schema_key", "=", "lix_key_value")
			.where("entity_id", "like", "test-key-%")
			.selectAll()
			.execute();

		expectDeterministic(keyValueAfterDelete).toHaveLength(0);
	}
);

// see https://github.com/opral/lix-sdk/issues/359
simulationTest(
	"commit_id in state should be from the real auto-commit, not the working commit",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

		// Get the active version with its commit_id and working_commit_id
		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		// Verify we have both commit_id and working_commit_id
		expectDeterministic(activeVersion.commit_id).toBeTruthy();
		expectDeterministic(activeVersion.working_commit_id).toBeTruthy();
		expectDeterministic(activeVersion.commit_id).not.toBe(
			activeVersion.working_commit_id
		);

		const commitsBeforeInsert = await lix.db
			.selectFrom("commit")
			.select("id")
			.execute();

		// Insert some state data
		await lix.db
			.insertInto("state")
			.values({
				entity_id: "test-entity-1",
				schema_key: "test_schema",
				file_id: "test-file",
				plugin_key: "test-plugin",
				schema_version: "1.0",
				snapshot_content: { value: "initial value" },
			})
			.execute();

		const commitsAfterInsert = await lix.db
			.selectFrom("commit")
			.select("id")
			.execute();

		// two commits for the global and active version
		expectDeterministic(commitsAfterInsert.length).toBe(
			commitsBeforeInsert.length + 2
		);

		const activeVersionAfterInsert = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		// Query the state to check the commit_id
		const stateAfterInsert = await lix.db
			.selectFrom("state")
			.where("entity_id", "=", "test-entity-1")
			.select(["entity_id", "commit_id"])
			.executeTakeFirstOrThrow();

		// The commit_id should NOT be the working_commit_id
		expectDeterministic(stateAfterInsert.commit_id).not.toBe(
			activeVersionAfterInsert.working_commit_id
		);

		// The commit_id should be the auto-commit ID (not the working commit)
		expectDeterministic(stateAfterInsert.commit_id).toBe(
			activeVersionAfterInsert.commit_id
		);

		// Update the state to trigger another auto-commit
		await lix.db
			.updateTable("state")
			.where("entity_id", "=", "test-entity-1")
			.set({ snapshot_content: { value: "updated value" } })
			.execute();

		// Check the state again
		const stateAfterUpdate = await lix.db
			.selectFrom("state")
			.where("entity_id", "=", "test-entity-1")
			.select(["entity_id", "commit_id"])
			.executeTakeFirstOrThrow();

		const activeVersionAfterUpdate = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		// The commit_id should now be the new auto-commit ID
		expectDeterministic(stateAfterUpdate.commit_id).toBe(
			activeVersionAfterUpdate.commit_id
		);
		expectDeterministic(stateAfterUpdate.commit_id).not.toBe(
			activeVersion.working_commit_id
		);
	}
);

simulationTest(
	"delete ALL from state view should delete untracked entities",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

		// Create a tracked entity in state
		await lix.db
			.insertInto("state")
			.values({
				entity_id: "tracked-entity",
				schema_key: "mock_test_schema",
				file_id: "test-file",
				plugin_key: "test_plugin",
				snapshot_content: { value: "tracked" },
				schema_version: "1.0",
			})
			.execute();

		// Create an untracked entity in state_all directly with the active version
		await lix.db
			.insertInto("state")
			.values({
				entity_id: "untracked-entity",
				schema_key: "mock_test_schema",
				file_id: "test-file",
				plugin_key: "test_plugin",
				snapshot_content: { value: "untracked" },
				schema_version: "1.0",
				untracked: true,
			})
			.execute();

		// Verify we have both entities in state view
		const beforeDelete = await lix.db
			.selectFrom("state")
			.where("schema_key", "=", "mock_test_schema")
			.selectAll()
			.execute();

		expectDeterministic(beforeDelete).toHaveLength(2);
		expectDeterministic(
			beforeDelete.some((e) => e.entity_id === "tracked-entity")
		).toBe(true);
		expectDeterministic(
			beforeDelete.some((e) => e.entity_id === "untracked-entity")
		).toBe(true);

		// Delete ALL from the state view (no WHERE clause)
		await lix.db
			.deleteFrom("state")
			.where("schema_key", "=", "mock_test_schema")
			.execute();

		// Check if ALL entries were deleted including untracked
		const afterDelete = await lix.db
			.selectFrom("state")
			.where("schema_key", "=", "mock_test_schema")
			.selectAll()
			.execute();

		// This should be 0 - all entries including untracked should be deleted
		expectDeterministic(afterDelete).toHaveLength(0);

		// Also check the underlying state_all table
		const stateAfterDelete = await lix.db
			.selectFrom("state_all")
			.where("schema_key", "=", "mock_test_schema")
			.selectAll()
			.execute();

		// All entities should be gone from state_all
		expectDeterministic(stateAfterDelete).toHaveLength(0);
	}
);

simulationTest(
	"delete from state view with WHERE should delete untracked entities",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true, bootstrap: true },
					lixcol_version_id: "global",
				},
			],
		});

		// Create a tracked entity in state
		await lix.db
			.insertInto("state")
			.values({
				entity_id: "tracked-entity",
				schema_key: "mock_test_schema",
				file_id: "test-file",
				plugin_key: "test_plugin",
				snapshot_content: { value: "tracked" },
				schema_version: "1.0",
			})
			.execute();

		// Create an untracked entity in state_all directly with the active version
		await lix.db
			.insertInto("state")
			.values({
				entity_id: "untracked-entity",
				schema_key: "mock_test_schema",
				file_id: "test-file",
				plugin_key: "test_plugin",
				snapshot_content: { value: "untracked" },
				schema_version: "1.0",
				untracked: true,
			})
			.execute();

		// Verify both entities exist in the state view
		const beforeDelete = await lix.db
			.selectFrom("state")
			.where("schema_key", "=", "mock_test_schema")
			.selectAll()
			.execute();

		expectDeterministic(beforeDelete).toHaveLength(2);
		expectDeterministic(
			beforeDelete.some((e) => e.entity_id === "tracked-entity")
		).toBe(true);
		expectDeterministic(
			beforeDelete.some((e) => e.entity_id === "untracked-entity")
		).toBe(true);

		// Delete the untracked entity from the state view with WHERE clause
		await lix.db
			.deleteFrom("state")
			.where("entity_id", "=", "untracked-entity")
			.execute();

		// Check if the untracked entry was deleted
		const afterDelete = await lix.db
			.selectFrom("state")
			.where("schema_key", "=", "mock_test_schema")
			.selectAll()
			.execute();

		// Should only have the tracked entity remaining
		expectDeterministic(afterDelete).toHaveLength(1);
		expectDeterministic(afterDelete[0]?.entity_id).toBe("tracked-entity");

		// Also check the underlying state_all table to confirm deletion
		const stateAfterDelete = await lix.db
			.selectFrom("state_all")
			.where("entity_id", "=", "untracked-entity")
			.where("schema_key", "=", "mock_test_schema")
			.selectAll()
			.execute();

		// The untracked entry should be gone from state_all too
		expectDeterministic(stateAfterDelete).toHaveLength(0);
	}
);
