import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createCheckpoint } from "./create-checkpoint.js";
import { commitIsAncestorOf } from "../query-filter/commit-is-ancestor-of.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";

test("creates a checkpoint from working change set elements", async () => {
	const lix = await openLix({});

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
	// Get the working commit first
	const initialWorkingCommit = await lix.db
		.selectFrom("commit")
		.where("id", "=", initialVersion.working_commit_id)
		.selectAll()
		.executeTakeFirstOrThrow();

	const workingElementsBefore = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", initialWorkingCommit.change_set_id)
		.selectAll()
		.execute();

	expect(workingElementsBefore.length).toBeGreaterThan(0);

	// Create checkpoint
	const checkpoint = await createCheckpoint({
		lix,
	});

	// Verify checkpoint label was applied to the checkpoint commit
	const checkpointLabel = await lix.db
		.selectFrom("label")
		.where("name", "=", "checkpoint")
		.select("id")
		.executeTakeFirstOrThrow();

	const checkpointLabelAssignment = await lix.db
		.selectFrom("entity_label")
		.where("entity_id", "=", checkpoint.id)
		.where("label_id", "=", checkpointLabel.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(checkpointLabelAssignment).toMatchObject({
		entity_id: checkpoint.id,
		label_id: checkpointLabel.id,
	});

	// Verify commit edge was created
	const edge = await lix.db
		.selectFrom("commit_edge")
		.where("parent_id", "=", initialVersion.commit_id)
		.where("child_id", "=", checkpoint.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(edge).toMatchObject({
		parent_id: initialVersion.commit_id,
		child_id: checkpoint.id,
	});

	// Verify version was updated
	const updatedVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	// expect(updatedVersion.change_set_id).toBe(checkpoint.id);
	expect(updatedVersion.working_commit_id).not.toBe(
		initialVersion.working_commit_id
	);

	// Verify new working change set is empty
	const newWorkingCommit = await lix.db
		.selectFrom("commit")
		.where("id", "=", updatedVersion.working_commit_id)
		.selectAll()
		.executeTakeFirstOrThrow();

	const newWorkingElements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", newWorkingCommit.change_set_id)
		.selectAll()
		.execute();

	expect(newWorkingElements).toHaveLength(0);
});

test("creates checkpoint and returns change set", async () => {
	const lix = await openLix({});

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

//
// The edge from checkpoint to new working commit is critical for history traversal.
// Without this edge, queries from the working change set cannot traverse backwards through
// checkpoints to find historical states. This ensures the change set graph remains connected
// and allows state_history queries to work correctly from any point in the graph.
test("creates edge from checkpoint to new working commit", async () => {
	const lix = await openLix({});

	// Make some changes to create working commit elements
	await lix.db
		.insertInto("key_value")
		.values({ key: "test-key", value: "test-value" })
		.execute();

	// Create checkpoint
	const checkpoint = await createCheckpoint({ lix });

	// Get updated version with new working change set
	const updatedVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Verify commit edge exists from checkpoint to new working commit
	const edgeToNewWorking = await lix.db
		.selectFrom("commit_edge")
		.where("parent_id", "=", checkpoint.id)
		.where("child_id", "=", updatedVersion.working_commit_id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(edgeToNewWorking).toMatchObject({
		parent_id: checkpoint.id,
		child_id: updatedVersion.working_commit_id,
	});

	// Verify the new working commit can traverse back to the checkpoint
	const isCheckpointAncestor = await lix.db
		.selectFrom("commit")
		.where("id", "=", checkpoint.id)
		.where(commitIsAncestorOf({ id: updatedVersion.working_commit_id }))
		.selectAll()
		.execute();

	expect(isCheckpointAncestor).toHaveLength(1);

	// Verify history traversal works from new working change set
	const historyFromWorking = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", "test-key")
		.where("schema_key", "=", "lix_key_value")
		.where("root_commit_id", "=", updatedVersion.working_commit_id)
		.selectAll()
		.execute();

	// Should find the key-value pair in history even though working set is empty
	expect(historyFromWorking.length).toBeGreaterThan(0);
	expect(historyFromWorking[0]?.snapshot_content).toEqual({
		key: "test-key",
		value: "test-value",
	});
});

test("creating a checkpoint with no changes returns current head (idempotent)", async () => {
	const lix = await openLix({});

	// Capture version before
	const before = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create checkpoint without making explicit changes → idempotent no-op
	const cp = await createCheckpoint({ lix });

	// Returns the current head commit
	expect(cp.id).toBe(before.commit_id);

	// Verify version state unchanged
	const after = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();
	expect(after.commit_id).toBe(before.commit_id);
	expect(after.working_commit_id).toBe(before.working_commit_id);
});

// we should have https://github.com/opral/lix-sdk/issues/305 before this test
test("checkpoint enables clean working change set for new work", async () => {
	const lix = await openLix({});

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
	const workingCommit = await lix.db
		.selectFrom("commit")
		.where("id", "=", version.working_commit_id)
		.selectAll()
		.executeTakeFirstOrThrow();

	const workingElements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", workingCommit.change_set_id)
		.selectAll()
		.execute();

	const workingKeys = workingElements.map((e) => e.entity_id);
	expect(workingKeys).toContain("after_checkpoint");
	expect(workingKeys).not.toContain("before_checkpoint");

	// Checkpoint should contain pre-checkpoint changes
	const checkpointElements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", checkpoint.change_set_id)
		.selectAll()
		.execute();

	const checkpointKeys = checkpointElements.map((e) => e.entity_id);
	expect(checkpointKeys).toContain("before_checkpoint");
	expect(checkpointKeys).not.toContain("after_checkpoint");
});

test("creates proper change set ancestry chain", async () => {
	const lix = await openLix({});

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

	// Verify ancestry: initial commit should be an ancestor of checkpoint1
	const initialIsAncestorOfCheckpoint1 = await lix.db
		.selectFrom("commit")
		.where("id", "=", initialVersion.commit_id)
		.where(commitIsAncestorOf({ id: checkpoint1.id }))
		.selectAll()
		.execute();

	expect(initialIsAncestorOfCheckpoint1).toHaveLength(1);

	// Verify ancestry: checkpoint1 should be an ancestor of checkpoint2
	const checkpoint1IsAncestorOfCheckpoint2 = await lix.db
		.selectFrom("commit")
		.where("id", "=", checkpoint1.id)
		.where(commitIsAncestorOf({ id: checkpoint2.id }))
		.selectAll()
		.execute();

	expect(checkpoint1IsAncestorOfCheckpoint2).toHaveLength(1);

	// Verify full chain: initial should be an ancestor of checkpoint2
	const initialIsAncestorOfCheckpoint2 = await lix.db
		.selectFrom("commit")
		.where("id", "=", initialVersion.commit_id)
		.where(commitIsAncestorOf({ id: checkpoint2.id }))
		.selectAll()
		.execute();

	expect(initialIsAncestorOfCheckpoint2).toHaveLength(1);
});

// very slow https://github.com/opral/lix-sdk/issues/311
test(
	"checkpoint should include deletion changes",
	{ timeout: 30000 },
	async () => {
		const lix = await openLix({});

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

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
			.deleteFrom("key_value_all")
			.where("key", "=", "test-key")
			.where("lixcol_version_id", "=", activeVersion.id)
			.execute();

		// Verify deletion changes were created
		const deletionChanges = await lix.db
			.selectFrom("change")
			.where("entity_id", "=", "test-key")
			.where("schema_key", "=", "lix_key_value")
			.where("snapshot_content", "is", null)
			.selectAll()
			.execute();

		expect(deletionChanges).toHaveLength(1); // key-value entity deletion

		// Create checkpoint after deletion
		const checkpointAfterDeletion = await createCheckpoint({ lix });

		// Check if deletion changes are included in the checkpoint
		const deletionChangesInCheckpoint = await lix.db
			.selectFrom("change")
			.innerJoin(
				"change_set_element_all",
				"change_set_element_all.change_id",
				"change.id"
			)
			.where(
				"change_set_element_all.change_set_id",
				"=",
				checkpointAfterDeletion.change_set_id
			)
			.where("change_set_element_all.lixcol_version_id", "=", "global")
			.where("change.entity_id", "=", "test-key")
			.where("change.schema_key", "=", "lix_key_value")
			.where("change.snapshot_content", "is", null)
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
		const lix = await openLix({
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
			.where("snapshot_content", "is", null)
			.selectAll()
			.execute();

		expect(deletionChanges).toHaveLength(2); // file entity + plugin entity deletion

		const checkpointAfterDeletion = await createCheckpoint({ lix });

		const deletionChangesInCheckpoint = await lix.db
			.selectFrom("change")
			.innerJoin(
				"change_set_element_all",
				"change_set_element_all.change_id",
				"change.id"
			)
			.where(
				"change_set_element_all.change_set_id",
				"=",
				checkpointAfterDeletion.change_set_id
			)
			.where("change_set_element_all.lixcol_version_id", "=", "global")
			.where("change.file_id", "=", "file-to-delete")
			.where("change.snapshot_content", "is", null)
			.selectAll("change")
			.execute();

		expect(deletionChangesInCheckpoint).toHaveLength(2);
	}
);

test("no orphaned commits exist after creating checkpoint", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
			},
		],
	});

	// Get initial version state before checkpoint
	const initialVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	const initialWorkingCommitId = initialVersion.working_commit_id;

	// Make some changes to create working change set elements
	await lix.db
		.insertInto("key_value")
		.values({ key: "test", value: "value" })
		.execute();

	// Get version state right before checkpoint (after making changes)
	const versionBeforeCheckpoint = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create checkpoint
	const checkpoint = await createCheckpoint({ lix });

	// Get all commits
	const allCommits = await lix.db.selectFrom("commit").selectAll().execute();

	// For each commit, verify it has at least one edge (as parent or child)
	for (const commit of allCommits) {
		const hasParentEdge = await lix.db
			.selectFrom("commit_edge")
			.where("child_id", "=", commit.id)
			.selectAll()
			.execute();

		const hasChildEdge = await lix.db
			.selectFrom("commit_edge")
			.where("parent_id", "=", commit.id)
			.selectAll()
			.execute();

		const isReferencedByVersion = await lix.db
			.selectFrom("version")
			.where((eb) =>
				eb.or([
					eb("commit_id", "=", commit.id),
					eb("working_commit_id", "=", commit.id),
				])
			)
			.selectAll()
			.execute();

		// Every commit should either:
		// 1. Have at least one parent edge (it's a child of another commit)
		// 2. Have at least one child edge (it's a parent of another commit)
		// 3. Be referenced by a version (as commit_id or working_commit_id)
		const hasConnections =
			hasParentEdge.length > 0 ||
			hasChildEdge.length > 0 ||
			isReferencedByVersion.length > 0;

		if (!hasConnections) {
			console.error(`Orphaned commit found: ${commit.id}`, {
				hasParentEdge: hasParentEdge.length,
				hasChildEdge: hasChildEdge.length,
				isReferencedByVersion: isReferencedByVersion.length,
				commit,
			});
		}

		expect(hasConnections).toBe(true);
	}

	// Additionally, verify the specific structure after checkpoint
	const version = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	// The checkpoint should have an edge from the previous commit
	const checkpointHasParent = await lix.db
		.selectFrom("commit_edge")
		.where("child_id", "=", checkpoint.id)
		.selectAll()
		.execute();

	expect(checkpointHasParent.length).toBeGreaterThan(0);

	// The checkpoint should have an edge to the new working commit
	const checkpointHasChild = await lix.db
		.selectFrom("commit_edge")
		.where("parent_id", "=", checkpoint.id)
		.where("child_id", "=", version.working_commit_id)
		.selectAll()
		.execute();

	expect(checkpointHasChild).toHaveLength(1);

	// The working commit should be referenced by the version
	expect(version.working_commit_id).toBeDefined();
	expect(version.commit_id).toBe(checkpoint.id);

	// The checkpoint ID should be the former working commit ID
	expect(checkpoint.id).toBe(initialWorkingCommitId);

	// The previous working commit should now be the version's commit
	expect(version.commit_id).toBe(initialWorkingCommitId);

	// The new working commit should be different from the checkpoint
	expect(version.working_commit_id).not.toBe(checkpoint.id);

	// There should be exactly one edge between the version's previous commit (before checkpoint) and the checkpoint
	// The edge is created from the version's commit_id at the time of checkpoint creation
	const edgesBetweenPreviousAndCheckpoint = await lix.db
		.selectFrom("commit_edge")
		.where("parent_id", "=", versionBeforeCheckpoint.commit_id)
		.where("child_id", "=", checkpoint.id)
		.selectAll()
		.execute();

	expect(edgesBetweenPreviousAndCheckpoint).toHaveLength(1);
});
