import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeSet } from "./create-change-set.js";
import type { Change } from "../change/schema.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

test("creating a change set should succeed", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("stored_schema")
		.values({
			value: {
				"x-lix-key": "mock-schema",
				"x-lix-version": "1.0",
				type: "object",
				properties: {
					id: { type: "string" },
				},
				required: ["id"],
			} satisfies LixSchemaDefinition,
		})
		.execute();

	const mockChanges = (await lix.db
		// @ts-expect-error - internal change table
		.insertInto("internal_change")
		.values([
			{
				schema_key: "mock-schema",
				schema_version: "1.0",
				entity_id: "value1",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
			{
				schema_key: "mock-schema",
				schema_version: "1.0",
				entity_id: "value2",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute()) as Change[];

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
	const lix = await openLixInMemory({});

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

test("creating a change set with labels should associate the labels with the change set", async () => {
	const lix = await openLixInMemory({});

	// Get the active version to ensure we work in the same context
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	// Create a new label in the active version context
	await lix.db
		.insertInto("label")
		.values({
			name: "test-label",
			lixcol_version_id: activeVersion.version_id,
		})
		.execute();

	const testLabel = await lix.db
		.selectFrom("label")
		.selectAll()
		.where("name", "=", "test-label")
		.where("lixcol_version_id", "=", activeVersion.version_id)
		.executeTakeFirstOrThrow();

	// Create a change set with labels in the same version context
	const changeSet = await createChangeSet({
		lix: lix,
		elements: [],
		labels: [testLabel],
		lixcol_version_id: activeVersion.version_id,
	});

	// Verify the change set was created
	expect(changeSet.id).toBeDefined();

	// Get the labels associated with the change set
	const changeSetLabels = await lix.db
		.selectFrom("change_set_label")
		.innerJoin("label", "label.id", "change_set_label.label_id")
		.selectAll()
		.where("change_set_id", "=", changeSet.id)
		.where("label.lixcol_version_id", "=", activeVersion.version_id)
		.execute();

	// Verify both labels are associated with the change set
	expect(changeSetLabels).toHaveLength(1);
	expect(changeSetLabels.map((label) => label.name)).toEqual(
		expect.arrayContaining(["test-label"])
	);
});

test("creating a change set with parents should establish parent-child relationships", async () => {
	const lix = await openLixInMemory({});

	// Create two parent change sets
	const parentChangeSet1 = await createChangeSet({
		lix,
		elements: [],
	});

	const parentChangeSet2 = await createChangeSet({
		lix,
		elements: [],
	});

	// Create a child change set with two parents
	const childChangeSet = await createChangeSet({
		lix,
		elements: [],
		parents: [parentChangeSet1, parentChangeSet2],
	});

	// Get the parent-child relationships from the database
	const edges = await lix.db
		.selectFrom("change_set_edge")
		.selectAll()
		.where("child_id", "=", childChangeSet.id)
		.execute();

	// Verify both parent-child relationships were created
	expect(edges).toHaveLength(2);
	expect(edges.map((edge) => edge.parent_id)).toEqual(
		expect.arrayContaining([parentChangeSet1.id, parentChangeSet2.id])
	);
	expect(edges.map((edge) => edge.child_id)).toEqual([
		childChangeSet.id,
		childChangeSet.id,
	]);
});

test("creating a change set with version_id should store it in the specified version", async () => {
	const lix = await openLixInMemory({});

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
		.selectFrom("change_set")
		.selectAll()
		.where("id", "=", changeSet.id)
		.executeTakeFirstOrThrow();

	expect(storedChangeSet.lixcol_version_id).toBe(globalVersion);
});
