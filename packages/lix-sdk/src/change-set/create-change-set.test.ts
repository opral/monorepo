import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeSet } from "./create-change-set.js";

test("creating a change set should succeed", async () => {
	const lix = await openLixInMemory({});

	const mockChanges = await lix.db
		.insertInto("change")
		.values([
			{
				schema_key: "file",
				entity_id: "value1",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
			{
				schema_key: "file",
				entity_id: "value2",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	const changeSet = await createChangeSet({
		lix: lix,
		changes: mockChanges,
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

test("creating a change set with empty changes array should succeed", async () => {
	const lix = await openLixInMemory({});

	// Create a change set with an empty changes array
	const changeSet = await createChangeSet({
		lix: lix,
		changes: [],
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

	// Get existing labels
	const checkpointLabel = await lix.db
		.selectFrom("label")
		.selectAll()
		.where("name", "=", "checkpoint")
		.executeTakeFirstOrThrow();

	// Create a new label
	const testLabel = await lix.db
		.insertInto("label")
		.values({ name: "test-label" })
		.returningAll()
		.executeTakeFirstOrThrow();

	// Create a change set with labels
	const changeSet = await createChangeSet({
		lix: lix,
		changes: [],
		labels: [checkpointLabel, testLabel],
	});

	// Verify the change set was created
	expect(changeSet.id).toBeDefined();

	// Get the labels associated with the change set
	const changeSetLabels = await lix.db
		.selectFrom("change_set_label")
		.innerJoin("label", "label.id", "change_set_label.label_id")
		.select(["label.name"])
		.where("change_set_id", "=", changeSet.id)
		.execute();

	// Verify both labels are associated with the change set
	expect(changeSetLabels).toHaveLength(2);
	expect(changeSetLabels.map((label) => label.name)).toEqual(
		expect.arrayContaining(["test-label", "checkpoint"])
	);
});

test("creating a change set with parents should establish parent-child relationships", async () => {
	const lix = await openLixInMemory({});

	// Create two parent change sets
	const parentChangeSet1 = await createChangeSet({
		lix,
		changes: [],
	});

	const parentChangeSet2 = await createChangeSet({
		lix,
		changes: [],
	});

	// Create a child change set with two parents
	const childChangeSet = await createChangeSet({
		lix,
		changes: [],
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
