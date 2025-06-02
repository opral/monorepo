import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createCheckpoint } from "./create-checkpoint.js";

// we should have https://github.com/opral/lix-sdk/issues/305 before this test
test.todo("creates a checkpoint from working change set elements", async () => {
	const lix = await openLixInMemory({});

	// Get initial version
	const initialVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Make some changes to create working change set elements
	await lix.db
		.insertInto("key_value")
		.values([
			{ key: "key1", value: "value1" },
			{ key: "key2", value: "value2" },
		])
		.execute();

	// Verify working change set has elements
	const workingElementsBefore = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", initialVersion.working_change_set_id)
		.selectAll()
		.execute();

	expect(workingElementsBefore.length).toBeGreaterThan(0);

	// Create checkpoint
	const checkpoint = await createCheckpoint({
		lix,
	});

	expect(checkpoint).toMatchObject({
		id: expect.any(String),
	});

	// Verify checkpoint change set was created
	const checkpointChangeSet = await lix.db
		.selectFrom("change_set")
		.where("id", "=", checkpoint.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(checkpointChangeSet).toMatchObject({
		id: checkpoint.id,
	});

	// Verify checkpoint label was applied
	const checkpointLabel = await lix.db
		.selectFrom("label")
		.where("name", "=", "checkpoint")
		.select("id")
		.executeTakeFirstOrThrow();

	const checkpointLabelAssignment = await lix.db
		.selectFrom("change_set_label")
		.where("change_set_id", "=", checkpoint.id)
		.where("label_id", "=", checkpointLabel.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(checkpointLabelAssignment).toMatchObject({
		change_set_id: checkpoint.id,
		label_id: checkpointLabel.id,
	});

	// Verify working elements were copied to checkpoint
	const checkpointElements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", checkpoint.id)
		.selectAll()
		.execute();

	expect(checkpointElements.length).toBe(workingElementsBefore.length);

	// Verify edge was created
	const edge = await lix.db
		.selectFrom("change_set_edge")
		.where("parent_id", "=", initialVersion.change_set_id)
		.where("child_id", "=", checkpoint.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(edge).toMatchObject({
		parent_id: initialVersion.change_set_id,
		child_id: checkpoint.id,
	});

	// Verify version was updated
	const updatedVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(updatedVersion.change_set_id).toBe(checkpoint.id);
	expect(updatedVersion.working_change_set_id).not.toBe(
		initialVersion.working_change_set_id
	);

	// Verify new working change set is empty
	const newWorkingElements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", updatedVersion.working_change_set_id)
		.selectAll()
		.execute();

	expect(newWorkingElements).toHaveLength(0);
});

test("creates checkpoint and returns change set", async () => {
	const lix = await openLixInMemory({});

	// Make a change
	await lix.db
		.insertInto("key_value")
		.values({ key: "test", value: "test" })
		.execute();

	// Create checkpoint
	const checkpoint = await createCheckpoint({ lix });

	expect(checkpoint).toMatchObject({
		id: expect.any(String),
	});
});

test("can create checkpoint even when working change set appears empty", async () => {
	const lix = await openLixInMemory({});

	// Create checkpoint without making explicit changes (should work with lix own changes)
	const checkpoint = await createCheckpoint({ lix });

	expect(checkpoint).toMatchObject({
		id: expect.any(String),
	});
});

// we should have https://github.com/opral/lix-sdk/issues/305 before this test
test.todo(
	"checkpoint enables clean working change set for new work",
	async () => {
		const lix = await openLixInMemory({});

		// Make initial changes
		await lix.db
			.insertInto("key_value")
			.values({ key: "before_checkpoint", value: "value" })
			.execute();

		// Create checkpoint
		const checkpoint = await createCheckpoint({
			lix,
		});

		// Make new changes after checkpoint
		await lix.db
			.insertInto("key_value")
			.values({ key: "after_checkpoint", value: "value" })
			.execute();

		// Get updated version
		const version = await lix.db
			.selectFrom("version")
			.where("name", "=", "main")
			.selectAll()
			.executeTakeFirstOrThrow();

		// Working change set should only contain post-checkpoint changes
		const workingElements = await lix.db
			.selectFrom("change_set_element")
			.where("change_set_id", "=", version.working_change_set_id)
			.selectAll()
			.execute();

		const workingKeys = workingElements.map((e) => e.entity_id);
		expect(workingKeys).toContain("after_checkpoint");
		expect(workingKeys).not.toContain("before_checkpoint");

		// Checkpoint should contain pre-checkpoint changes
		const checkpointElements = await lix.db
			.selectFrom("change_set_element")
			.where("change_set_id", "=", checkpoint.id)
			.selectAll()
			.execute();

		const checkpointKeys = checkpointElements.map((e) => e.entity_id);
		expect(checkpointKeys).toContain("before_checkpoint");
		expect(checkpointKeys).not.toContain("after_checkpoint");
	}
);

test.todo("creates proper change set ancestry chain", async () => {
	const lix = await openLixInMemory({});

	// Get initial state
	const initialVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Make changes and create first checkpoint
	await lix.db
		.insertInto("key_value")
		.values({ key: "first", value: "value" })
		.execute();

	const checkpoint1 = await createCheckpoint({
		lix,
	});

	// Make more changes and create second checkpoint
	await lix.db
		.insertInto("key_value")
		.values({ key: "second", value: "value" })
		.execute();

	const checkpoint2 = await createCheckpoint({
		lix,
	});

	// Verify edge chain: initial -> checkpoint1 -> checkpoint2
	const edges = await lix.db
		.selectFrom("change_set_edge")
		.selectAll()
		.execute();

	expect(edges).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				parent_id: initialVersion.change_set_id,
				child_id: checkpoint1.id,
			}),
			expect.objectContaining({
				parent_id: checkpoint1.id,
				child_id: checkpoint2.id,
			}),
		])
	);
});
