import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createCheckpoint } from "./create-checkpoint.js";
import { changeSetIsAncestorOf } from "../query-filter/change-set-is-ancestor-of.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";
import { changeSetHasLabel } from "../query-filter/change-set-has-label.js";
import type { Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";

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

test("creating a checkpoint with no changes throws", async () => {
	const lix = await openLixInMemory({});

	// Create checkpoint without making explicit changes (should work with lix own changes)
	await expect(createCheckpoint({ lix })).rejects.toThrow();
});

// we should have https://github.com/opral/lix-sdk/issues/305 before this test
test("checkpoint enables clean working change set for new work", async () => {
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
});

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
		.where(
			"state_version_id",
			"=",
			lix.db.selectFrom("active_version").select("version_id")
		)
		.selectAll()
		.execute();

	expect(initialIsAncestorOfCheckpoint1).toHaveLength(1);

	// Verify ancestry: checkpoint1 should be an ancestor of checkpoint2
	const checkpoint1IsAncestorOfCheckpoint2 = await lix.db
		.selectFrom("change_set")
		.where("id", "=", checkpoint1.id)
		.where(changeSetIsAncestorOf({ id: checkpoint2.id }))
		.where(
			"state_version_id",
			"=",
			lix.db.selectFrom("active_version").select("version_id")
		)
		.selectAll()
		.execute();

	expect(checkpoint1IsAncestorOfCheckpoint2).toHaveLength(1);

	// Verify full chain: initial should be an ancestor of checkpoint2
	const initialIsAncestorOfCheckpoint2 = await lix.db
		.selectFrom("change_set")
		.where("id", "=", initialVersion.change_set_id)
		.where(changeSetIsAncestorOf({ id: checkpoint2.id }))
		.where(
			"state_version_id",
			"=",
			lix.db.selectFrom("active_version").select("version_id")
		)
		.selectAll()
		.execute();

	expect(initialIsAncestorOfCheckpoint2).toHaveLength(1);
});

test("debug working change set elements after insertion", async () => {
	const lix = await openLixInMemory({});

	// Try both approaches to see the difference
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.where("version.state_version_id", "=", "global")
		.executeTakeFirstOrThrow();

	const mainVersion = await lix.db
		.selectFrom("version")
		.selectAll()
		.where("name", "=", "main")
		.executeTakeFirstOrThrow();

	const cs = await lix.db
		.selectFrom("change_set")
		.where("id", "=", activeVersion.working_change_set_id)
		.selectAll()
		.execute();

	console.log("0. Change set:", cs);

	console.log("1. Active version:", activeVersion);
	console.log("1b. Main version:", mainVersion);

	// Check working change set elements BEFORE insertion
	const elementsBefore = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", activeVersion.working_change_set_id)
		.where("state_version_id", "=", "global")
		.selectAll()
		.execute();

	console.log("2. Elements before insertion:", elementsBefore);

	const elementsBeforeMain = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", mainVersion.working_change_set_id)
		.selectAll()
		.execute();
	console.log("2b. Elements before insertion (main):", elementsBeforeMain);

	// Insert a key-value pair
	await lix.db
		.insertInto("key_value")
		.values({
			key: "test-key",
			value: "test-value",
		})
		.execute();

	console.log("3. Inserted key-value pair");

	// Check working change set elements AFTER insertion
	const elementsAfter = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", activeVersion.working_change_set_id)
		.where("state_version_id", "=", activeVersion.id)
		.selectAll()
		.execute();
	console.log("4. Elements after insertion:", elementsAfter);

	const elementsAfterMain = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", mainVersion.working_change_set_id)
		.selectAll()
		.execute();
	console.log("4b. Elements after insertion (main):", elementsAfterMain);

	// Check if key-value was actually inserted
	const keyValues = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test-key")
		.selectAll()
		.execute();
	console.log("5. Key-value records:", keyValues);

	// Check internal state cache
	const stateCache = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_state_cache")
		.where("entity_id", "=", "test-key")
		.selectAll()
		.execute();
	console.log("6. State cache records:", stateCache);

	// Check changes
	const changes = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "test-key")
		.selectAll()
		.execute();
	console.log("7. Change records:", changes);

	expect(elementsAfterMain.length).toBeGreaterThan(0);
});

// very slow https://github.com/opral/lix-sdk/issues/311
test(
	"checkpoint should include deletion changes",
	{ timeout: 30000 },
	async () => {
		const lix = await openLixInMemory({});

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.selectAll("version")
			.where("version.state_version_id", "=", "global")
			.executeTakeFirstOrThrow();

		console.log("Active version:", activeVersion);

		// Insert a key-value pair
		await lix.db
			.insertInto("key_value")
			.values({
				key: "test-key",
				value: "test-value",
			})
			.execute();

		const versionAfterInsertion = await lix.db
			.selectFrom("version")
			.where("id", "=", activeVersion.id)
			.where("state_version_id", "=", "global")
			.selectAll()
			.execute();

		console.log("Version after insertion:", versionAfterInsertion);

		// Create checkpoint after insertion
		await createCheckpoint({ lix });

		const versionAfterCheckpoint = await lix.db
			.selectFrom("version")
			.where("id", "=", activeVersion.id)
			.where("state_version_id", "=", "global")
			.selectAll()
			.executeTakeFirstOrThrow();

		console.log("Version after checkpoint:", versionAfterCheckpoint);

		const ancestorsOfActiveVersion = await lix.db
			.selectFrom("change_set")
			// .where("version_id", "=", activeVersion.version_id)
			// .where(changeSetHasLabel({ name: "checkpoint" }))
			.where(
				changeSetIsAncestorOf(
					{ id: versionAfterCheckpoint.change_set_id },
					{ includeSelf: true }
				)
			)
			.where("state_version_id", "=", "global")
			.selectAll()
			.execute();

		console.log("Ancestors of active version:", ancestorsOfActiveVersion);

		const checkpointsOfActiveVersion = await lix.db
			.selectFrom("change_set")
			// .where("version_id", "=", activeVersion.version_id)
			.where(changeSetHasLabel({ name: "checkpoint" }))
			.where(
				changeSetIsAncestorOf(
					{ id: versionAfterCheckpoint.change_set_id },
					{ includeSelf: true }
				)
			)
			.where("state_version_id", "=", "global")
			.selectAll()
			.execute();

		console.log("Checkpoints of active version:", checkpointsOfActiveVersion);

		const elementsBeforeDeletion = await lix.db
			.selectFrom("change_set_element")
			.where("change_set_id", "=", versionAfterCheckpoint.working_change_set_id)
			.where("state_version_id", "=", "global")
			.selectAll()
			.execute();
		console.log("Elements before deletion:", elementsBeforeDeletion);

		// Now delete the key-value pair
		await lix.db
			.deleteFrom("key_value")
			.where("key", "=", "test-key")
			.where("state_version_id", "=", activeVersion.id)
			.execute();

		const activeVersionAfterDeletion = await lix.db
			.selectFrom("version")
			.where("id", "=", activeVersion.id)
			.where("state_version_id", "=", "global")
			.selectAll()
			.executeTakeFirstOrThrow();

		console.log("Active version after deletion:", activeVersionAfterDeletion);

		const elementsAfterDeletion = await lix.db
			.selectFrom("change_set_element")
			.where(
				"change_set_id",
				"=",
				activeVersionAfterDeletion.working_change_set_id
			)
			.where("state_version_id", "=", "global")
			.selectAll()
			.execute();

		console.log("Elements after deletion:", elementsAfterDeletion);

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
			.where("change_set_element.state_version_id", "=", "global")
			.where("change.entity_id", "=", "test-key")
			.where("change.schema_key", "=", "lix_key_value")
			.where("change.snapshot_id", "=", "no-content")
			.selectAll("change")
			.execute();

		// This should work for key-value deletions
		expect(deletionChangesInCheckpoint).toHaveLength(1);
	}
);

// very slow https://github.com/opral/lix-sdk/issues/311
test(
	"checkpoint should include file deletion changes",
	{ timeout: 30000 },
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
				state_version_id: lix.db
					.selectFrom("active_version")
					.select("version_id"),
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
			.where(
				"state_version_id",
				"=",
				lix.db.selectFrom("active_version").select("version_id")
			)
			.execute();

		await createCheckpoint({ lix });

		// Now delete the file
		await lix.db
			.deleteFrom("file")
			.where("id", "=", "file-to-delete")
			.where(
				"state_version_id",
				"=",
				lix.db.selectFrom("active_version").select("version_id")
			)
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
			.where("change_set_element.state_version_id", "=", "global")
			.where("change.file_id", "=", "file-to-delete")
			.where("change.snapshot_id", "=", "no-content")
			.selectAll("change")
			.execute();

		expect(deletionChangesInCheckpoint).toHaveLength(2);
	}
);
