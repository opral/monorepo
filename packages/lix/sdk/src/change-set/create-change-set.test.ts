import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createChangeSet } from "./create-change-set.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

test("creating a change set should succeed", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("stored_schema")
		.values({
			value: {
				"x-lix-key": "mock_schema",
				"x-lix-version": "1.0",
				type: "object",
				properties: {
					id: { type: "string" },
				},
				required: ["id"],
				additionalProperties: false,
			} satisfies LixSchemaDefinition,
		})
		.execute();

	const mockChanges = await lix.db
		.insertInto("change")
		.values([
			{
				id: "change0",
				schema_key: "mock_schema",
				schema_version: "1.0",
				entity_id: "value1",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_content: null,
			},
			{
				id: "change1",
				schema_key: "mock_schema",
				schema_version: "1.0",
				entity_id: "value2",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_content: null,
			},
		])
		.returningAll()
		.execute();

	const changeSet = await createChangeSet({
		lix: lix,
		elements: mockChanges.map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	const changeSetMembers = await lix.db
		.selectFrom("change_set_element")
		.selectAll()
		.where("change_set_id", "=", changeSet.id)
		.execute();

	expect(changeSetMembers.map((member) => member.change_id)).toEqual(
		expect.arrayContaining([mockChanges[0]?.id, mockChanges[1]?.id])
	);
});

test("creating a change set with empty elements array should succeed", async () => {
	const lix = await openLix({});

	// Create a change set with an empty elements array
	const changeSet = await createChangeSet({
		lix: lix,
		elements: [],
	});

	// Verify the change set was created
	expect(changeSet.id).toBeDefined();

	// Verify no change_set_element records were created
	const changeSetMembers = await lix.db
		.selectFrom("change_set_element")
		.selectAll()
		.where("change_set_id", "=", changeSet.id)
		.execute();

	expect(changeSetMembers).toHaveLength(0);
});

test("creating a change set with version_id should store it in the specified version", async () => {
	const lix = await openLix({});

	// Get the global version ID
	const globalVersion = "global";

	// Create a change set explicitly in the global version
	const changeSet = await createChangeSet({
		lix,
		elements: [],
		lixcol_version_id: globalVersion,
	});

	// Verify the change set was created with the correct version_id
	expect(changeSet.id).toBeDefined();
	expect(changeSet.lixcol_version_id).toBe(globalVersion);

	// Also verify by querying the database directly
	const storedChangeSet = await lix.db
		.selectFrom("change_set_by_version")
		.selectAll()
		.where("id", "=", changeSet.id)
		.where("lixcol_version_id", "=", globalVersion)
		.executeTakeFirstOrThrow();

	expect(storedChangeSet.lixcol_version_id).toBe(globalVersion);
});
