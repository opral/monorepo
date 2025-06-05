import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createCheckpoint } from "./create-checkpoint.js";
import { changeSetIsAncestorOf } from "../query-filter/change-set-is-ancestor-of.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";

test("creates a checkpoint from working change set elements", async () => {
	const lix = await openLixInMemory({});

	// Make some changes to create working change set elements
	await lix.db
		.insertInto("key_value")
		.values([
			{ key: "key1", value: "value1" },
			{ key: "key2", value: "value2" },
		])
		.execute();

	// Get initial version
	const initialVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

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

	// expect(updatedVersion.change_set_id).toBe(checkpoint.id);
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

test("creates proper change set ancestry chain", async () => {
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

	// const versionAfterCheckpoint1 = await lix.db
	// 	.selectFrom("version")
	// 	.where("id", "=", initialVersion.id)
	// 	.selectAll()
	// 	.executeTakeFirstOrThrow();

	// expect(versionAfterCheckpoint1.change_set_id).toBe(checkpoint1.id);

	// Make more changes and create second checkpoint
	await lix.db
		.insertInto("key_value")
		.values({ key: "second", value: "value" })
		.execute();

	const checkpoint2 = await createCheckpoint({
		lix,
	});

	// const versionAfterCheckpoint2 = await lix.db
	// 	.selectFrom("version")
	// 	.where("id", "=", initialVersion.id)
	// 	.selectAll()
	// 	.executeTakeFirstOrThrow();

	// expect(versionAfterCheckpoint2.change_set_id).toBe(checkpoint2.id);

	// Verify ancestry: initial change set should be an ancestor of checkpoint1
	const initialIsAncestorOfCheckpoint1 = await lix.db
		.selectFrom("change_set")
		.where("id", "=", initialVersion.change_set_id)
		.where(changeSetIsAncestorOf({ id: checkpoint1.id }))
		.selectAll()
		.execute();

	expect(initialIsAncestorOfCheckpoint1).toHaveLength(1);

	// Verify ancestry: checkpoint1 should be an ancestor of checkpoint2
	const checkpoint1IsAncestorOfCheckpoint2 = await lix.db
		.selectFrom("change_set")
		.where("id", "=", checkpoint1.id)
		.where(changeSetIsAncestorOf({ id: checkpoint2.id }))
		.selectAll()
		.execute();

	expect(checkpoint1IsAncestorOfCheckpoint2).toHaveLength(1);

	// Verify full chain: initial should be an ancestor of checkpoint2
	const initialIsAncestorOfCheckpoint2 = await lix.db
		.selectFrom("change_set")
		.where("id", "=", initialVersion.change_set_id)
		.where(changeSetIsAncestorOf({ id: checkpoint2.id }))
		.selectAll()
		.execute();

	expect(initialIsAncestorOfCheckpoint2).toHaveLength(1);
});

// very slow https://github.com/opral/lix-sdk/issues/311
test(
	"checkpoint should include deletion changes",
	async () => {
		const lix = await openLixInMemory({});

		// Insert a key-value pair
		await lix.db
			.insertInto("key_value")
			.values({
				key: "test-key",
				value: "test-value",
			})
			.execute();

		// Create checkpoint after insertion
		await createCheckpoint({ lix });

		// Now delete the key-value pair
		await lix.db
			.deleteFrom("key_value")
			.where("key", "=", "test-key")
			.execute();

		// Verify deletion changes were created
		const deletionChanges = await lix.db
			.selectFrom("change")
			.where("entity_id", "=", "test-key")
			.where("schema_key", "=", "lix_key_value")
			.where("snapshot_id", "=", "no-content")
			.selectAll()
			.execute();

		expect(deletionChanges).toHaveLength(1); // key-value entity deletion

		// Create checkpoint after deletion
		const checkpointAfterDeletion = await createCheckpoint({ lix });

		// Check if deletion changes are included in the checkpoint
		const deletionChangesInCheckpoint = await lix.db
			.selectFrom("change")
			.innerJoin(
				"change_set_element",
				"change_set_element.change_id",
				"change.id"
			)
			.where(
				"change_set_element.change_set_id",
				"=",
				checkpointAfterDeletion.id
			)
			.where("change.entity_id", "=", "test-key")
			.where("change.schema_key", "=", "lix_key_value")
			.where("change.snapshot_id", "=", "no-content")
			.selectAll("change")
			.execute();

		// This should work for key-value deletions
		expect(deletionChangesInCheckpoint).toHaveLength(1);
	},
	{ timeout: 30000 }
);

// very slow https://github.com/opral/lix-sdk/issues/311
test(
	"checkpoint should include file deletion changes",
	async () => {
		const lix = await openLixInMemory({
			providePlugins: [mockJsonPlugin],
		});

		// Insert a JSON file with content
		await lix.db
			.insertInto("file")
			.values({
				id: "file-to-delete",
				data: new TextEncoder().encode(JSON.stringify({ test: "delete-me" })),
				path: "/delete-test.json",
			})
			.execute();

		// Update the file to trigger plugin change detection
		await lix.db
			.updateTable("file")
			.set({
				data: new TextEncoder().encode(
					JSON.stringify({ test: "updated-value" })
				),
			})
			.where("id", "=", "file-to-delete")
			.execute();

		await createCheckpoint({ lix });

		// Now delete the file
		await lix.db
			.deleteFrom("file")
			.where("id", "=", "file-to-delete")
			.execute();

		// Verify deletion changes were created
		const deletionChanges = await lix.db
			.selectFrom("change")
			.where("file_id", "=", "file-to-delete")
			.where("snapshot_id", "=", "no-content")
			.selectAll()
			.execute();

		expect(deletionChanges).toHaveLength(2); // file entity + plugin entity deletion

		const checkpointAfterDeletion = await createCheckpoint({ lix });

		const deletionChangesInCheckpoint = await lix.db
			.selectFrom("change")
			.innerJoin(
				"change_set_element",
				"change_set_element.change_id",
				"change.id"
			)
			.where(
				"change_set_element.change_set_id",
				"=",
				checkpointAfterDeletion.id
			)
			.where("change.file_id", "=", "file-to-delete")
			.where("change.snapshot_id", "=", "no-content")
			.selectAll("change")
			.execute();

		expect(deletionChangesInCheckpoint).toHaveLength(2);
	},
	{ timeout: 30000 }
);
