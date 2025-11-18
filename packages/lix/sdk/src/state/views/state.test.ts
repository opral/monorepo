import { expect, test } from "vitest";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import { createSchemaCacheTable } from "../../state/cache/create-schema-cache-table.js";
import { simulationTest } from "../../test-utilities/simulation-test/simulation-test.js";
import { selectActiveVersion } from "../../version/select-active-version.js";

test("discovery", () => {});

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
					value: { enabled: true },
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
				plugin_key: "lix_sdk",
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

		expectDeterministic(insertedEntity[0]).toMatchObject({
			entity_id: "entity0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_sdk",
			schema_version: "1.0",
			snapshot_content: { value: "initial content" },
		});

		// Verify the version_id was auto-filled with the active version
		const entityInStateByVersion = await lix.db
			.selectFrom("state_by_version")
			.where("entity_id", "=", "entity0")
			.select("version_id")
			.executeTakeFirstOrThrow();

		expectDeterministic(entityInStateByVersion.version_id).toBe(
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

		expectDeterministic(
			updatedEntity.map(
				({
					change_id: _ignoredChangeId,
					commit_id: _ignoredCommitId,
					created_at: _ignoredCreatedAt,
					updated_at: _ignoredUpdatedAt,
					...rest
				}) => rest
			)[0]?.snapshot_content
		).toEqual({
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

simulationTest(
	"state view allows updating untracked entities",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_untracked_schema",
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
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		await lix.db
			.insertInto("state")
			.values({
				entity_id: "untracked-entity",
				file_id: "file-untracked",
				schema_key: mockSchema["x-lix-key"],
				plugin_key: "lix_sdk",
				schema_version: mockSchema["x-lix-version"],
				snapshot_content: { value: "initial" },
				untracked: true,
			})
			.execute();

		await expect(
			lix.db
				.updateTable("state")
				.where("entity_id", "=", "untracked-entity")
				.set({ snapshot_content: { value: "updated" } })
				.execute()
		).resolves.toBeTruthy();

		const updated = await lix.db
			.selectFrom("state")
			.where("entity_id", "=", "untracked-entity")
			.select(["snapshot_content", "untracked"])
			.executeTakeFirstOrThrow();

		expectDeterministic(updated.snapshot_content).toEqual({ value: "updated" });
		expectDeterministic(Boolean(updated.untracked)).toBe(true);
	}
);

// delete after fixing the bug
simulationTest(
	"state allows updating untracked entities VTABLE REPRODUCTION",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const mockSchema: LixSchemaDefinition = {
			"x-lix-key": "mock_untracked_schema",
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
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const activeVersion = await selectActiveVersion(lix)
			.select("version_id")
			.executeTakeFirstOrThrow();

		await lix.db
			.insertInto("stored_schema")
			.values({ value: mockSchema })
			.execute();

		if (lix.engine) {
			createSchemaCacheTable({ engine: lix.engine, schema: mockSchema });
		}

		await lix.db
			.insertInto("lix_internal_state_vtable" as any)
			.values({
				entity_id: "untracked-entity",
				file_id: "file-untracked",
				schema_key: mockSchema["x-lix-key"],
				plugin_key: "lix_sdk",
				schema_version: mockSchema["x-lix-version"],
				snapshot_content: JSON.stringify({ value: "initial" }),
				untracked: true,
				version_id: activeVersion.version_id,
			})
			.execute();

		await expect(
			lix.db
				.updateTable("lix_internal_state_vtable" as any)
				.where("version_id", "=", activeVersion.version_id)
				.where("entity_id", "=", "untracked-entity")
				.set({ snapshot_content: JSON.stringify({ value: "updated" }) })
				.execute()
		).resolves.toBeTruthy();

		const updated = await lix.db
			.selectFrom("lix_internal_state_vtable" as any)
			.where("entity_id", "=", "untracked-entity")
			.where("version_id", "=", activeVersion.version_id)
			.select(["snapshot_content", "untracked"])
			.executeTakeFirstOrThrow();

		expectDeterministic(updated.snapshot_content).toEqual({ value: "updated" });
		expectDeterministic(Boolean(updated.untracked)).toBe(true);
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
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		// 1. Insert key_value in global version (tracked)
		await lix.db
			.insertInto("key_value_by_version")
			.values({
				key: "test-key-global",
				value: "global-tracked-value",
				lixcol_version_id: "global",
			})
			.execute();

		// 2. Insert key_value in global version (untracked)
		await lix.db
			.insertInto("key_value_by_version")
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
			.orderBy("entity_id")
			.selectAll()
			.execute();

		// state view shows active version entities + inherited from global
		expect(entitiesBeforeDelete).toHaveLength(4);

		expectDeterministic(entitiesBeforeDelete).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					entity_id: "test-key-active",
					snapshot_content: {
						key: "test-key-active",
						value: "active-tracked-value",
					},
					untracked: 0,
				}),
				expect.objectContaining({
					entity_id: "test-key-active-untracked",
					snapshot_content: {
						key: "test-key-active-untracked",
						value: "active-untracked-value",
					},
					untracked: 1,
				}),
				expect.objectContaining({
					entity_id: "test-key-global",
					snapshot_content: {
						key: "test-key-global",
						value: "global-tracked-value",
					},
					untracked: 0,
				}),
				expect.objectContaining({
					entity_id: "test-key-global-untracked",
					snapshot_content: {
						key: "test-key-global-untracked",
						value: "global-untracked-value",
					},
					untracked: 1,
				}),
			])
		);

		// Delete only entities that are local to the active version.
		// Inherited rows (from global) must be filtered out now that inheritance is immutable.
		await lix.db
			.deleteFrom("state")
			.where("schema_key", "=", "lix_key_value")
			.where("entity_id", "like", "test-key-%")
			.where("inherited_from_version_id", "is", null)
			.execute();

		// Verify the local entities are deleted while inherited ones remain.
		const keyValueAfterDelete = await lix.db
			.selectFrom("state")
			.where("schema_key", "=", "lix_key_value")
			.where("entity_id", "like", "test-key-%")
			.orderBy("entity_id")
			.selectAll()
			.execute();

		expectDeterministic(keyValueAfterDelete).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					entity_id: "test-key-global",
					inherited_from_version_id: "global",
					snapshot_content: {
						key: "test-key-global",
						value: "global-tracked-value",
					},
					untracked: 0,
				}),
				expect.objectContaining({
					entity_id: "test-key-global-untracked",
					inherited_from_version_id: "global",
					snapshot_content: {
						key: "test-key-global-untracked",
						value: "global-untracked-value",
					},
					untracked: 1,
				}),
			])
		);

		expectDeterministic(keyValueAfterDelete).toHaveLength(2);
	}
);
