import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import { simulationTest } from "../../test-utilities/simulation-test/simulation-test.js";

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
