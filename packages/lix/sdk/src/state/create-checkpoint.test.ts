import { test } from "vitest";
import { createCheckpoint } from "./create-checkpoint.js";
import { commitIsAncestorOf } from "../query-filter/commit-is-ancestor-of.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";
import { simulationTest } from "../test-utilities/simulation-test/simulation-test.js";
import { LixCommitSchema } from "../commit/schema.js";

test("simulation test discovery", () => {});

simulationTest(
	"creates a checkpoint from working change set elements",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_untracked: true,
					lixcol_version_id: "global",
				},
			],
		});

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

		expectDeterministic(workingElementsBefore.length).toBeGreaterThan(0);

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

		expectDeterministic(checkpointLabelAssignment).toMatchObject({
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

		expectDeterministic(edge).toMatchObject({
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
		expectDeterministic(updatedVersion.working_commit_id).not.toBe(
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

		expectDeterministic(newWorkingElements).toHaveLength(0);
	}
);

simulationTest(
	"emits state_commit materialization when checkpointing",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_untracked: true,
					lixcol_version_id: "global",
				},
			],
		});

		const emitted: Array<
			Array<{
				schema_key: string;
				commit_id: string;
				snapshot_content: any;
			}>
		> = [];
		const unsubscribe = lix.hooks.onStateCommit(({ changes }) => {
			emitted.push(changes as (typeof emitted)[number]);
		});

		try {
			await lix.db
				.insertInto("key_value")
				.values({ key: "state-commit-test", value: "value" })
				.execute();

			const baselineEvents = emitted.length;

			const checkpoint = await createCheckpoint({ lix });

			const updatedVersion = await lix.db
				.selectFrom("version")
				.where("name", "=", "main")
				.selectAll()
				.executeTakeFirstOrThrow();

			const newEvents = emitted.slice(baselineEvents);
			expectDeterministic(newEvents.length).toBeGreaterThan(0);

			const containsDescriptor = newEvents.some((batch) =>
				batch.some(
					(change) =>
						change.schema_key === "lix_version_descriptor" &&
						change.commit_id === checkpoint.id
				)
			);
			expectDeterministic(containsDescriptor).toBe(true);

			const containsWorkingCommit = newEvents.some((batch) =>
				batch.some(
					(change) =>
						change.schema_key === LixCommitSchema["x-lix-key"] &&
						change.commit_id === updatedVersion.working_commit_id
				)
			);
			expectDeterministic(containsWorkingCommit).toBe(true);
		} finally {
			unsubscribe();
		}
	}
);

simulationTest(
	"creates checkpoint and returns change set",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_untracked: true,
					lixcol_version_id: "global",
				},
			],
		});

		// Make a change
		await lix.db
			.insertInto("key_value")
			.values({ key: "test", value: "test" })
			.execute();

		// Create checkpoint
		const checkpoint = await createCheckpoint({ lix });

		// Validate shape deterministically across simulations
		expectDeterministic(typeof checkpoint.id === "string").toBe(true);
	}
);

//
// The edge from checkpoint to new working commit is critical for history traversal.
// Without this edge, queries from the working change set cannot traverse backwards through
// checkpoints to find historical states. This ensures the change set graph remains connected
// and allows state_history queries to work correctly from any point in the graph.
simulationTest(
	"creates edge from checkpoint to new working commit",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_untracked: true,
					lixcol_version_id: "global",
				},
			],
		});

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

		expectDeterministic(edgeToNewWorking).toMatchObject({
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

		expectDeterministic(isCheckpointAncestor.length).toBe(1);

		// Verify history traversal works from new working change set
		const historyFromWorking = await lix.db
			.selectFrom("state_history")
			.where("entity_id", "=", "test-key")
			.where("schema_key", "=", "lix_key_value")
			.where("root_commit_id", "=", updatedVersion.working_commit_id)
			.selectAll()
			.execute();

		// Should find the key-value pair in history even though working set is empty
		expectDeterministic(historyFromWorking.length > 0).toBe(true);
		expectDeterministic(historyFromWorking[0]?.snapshot_content).toEqual({
			key: "test-key",
			value: "test-value",
		});
	}
);

simulationTest(
	"creating a checkpoint with no changes returns current head (idempotent)",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_untracked: true,
					lixcol_version_id: "global",
				},
			],
		});

		// Capture version before
		const before = await lix.db
			.selectFrom("version")
			.where("name", "=", "main")
			.selectAll()
			.executeTakeFirstOrThrow();

		// Create checkpoint without making explicit changes → idempotent no-op
		const cp = await createCheckpoint({ lix });

		// Returns the current head commit
		expectDeterministic(cp.id).toBe(before.commit_id);

		// Verify version state unchanged
		const after = await lix.db
			.selectFrom("version")
			.where("name", "=", "main")
			.selectAll()
			.executeTakeFirstOrThrow();
		expectDeterministic(after.commit_id).toBe(before.commit_id);
		expectDeterministic(after.working_commit_id).toBe(before.working_commit_id);
	}
);

//
// Parent-merge at checkpoint (concise)
//
// 1) Create cp1 from working changes.
// 2) Make one tracked change (m-2) creating F (new tip).
// 3) Create cp2: the working commit becomes cp2 and merges parents (cp1 and F).
//
// Final (complete, unpruned) graph:
//   C -> B -> A -> cp1 -> F -> cp2 [TIP]
//               \---------------|--/
//                               |
//                               \-> WC (current working commit after cp2)
//
// The test asserts cp2 has both cp1 and F as parents via commit_edge and
// parent_commit_ids.
simulationTest(
	"checkpoint merges existing working parents with previous tip",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_untracked: true,
					lixcol_version_id: "global",
				},
			],
		});

		// 1) Make some changes to create working elements, then checkpoint (cp1)
		await lix.db
			.insertInto("key_value")
			.values({ key: "m-1", value: "v-1" })
			.execute();

		const cp1 = await createCheckpoint({ lix });

		// 2) Create a tracked commit (F) by making a domain change
		await lix.db
			.insertInto("key_value")
			.values({ key: "m-2", value: "v-2" })
			.execute();

		// Read version to capture current tip (F) and working (WC2)
		const vBeforeCp2 = await lix.db
			.selectFrom("version")
			.where("name", "=", "main")
			.selectAll()
			.executeTakeFirstOrThrow();

		// Second checkpoint (cp2) - merges existing parent (cp1) and previous tip (F)
		const cp2 = await createCheckpoint({ lix });

		// Verify commit_edge includes both parents -> cp2
		const edgeFromCp1 = await lix.db
			.selectFrom("commit_edge")
			.where("parent_id", "=", cp1.id)
			.where("child_id", "=", cp2.id)
			.selectAll()
			.executeTakeFirstOrThrow();
		expectDeterministic(!!edgeFromCp1).toBe(true);

		const edgeFromPrevTip = await lix.db
			.selectFrom("commit_edge")
			.where("parent_id", "=", vBeforeCp2.commit_id)
			.where("child_id", "=", cp2.id)
			.selectAll()
			.executeTakeFirstOrThrow();
		expectDeterministic(!!edgeFromPrevTip).toBe(true);

		// Also verify parent_commit_ids contains both ids on the checkpoint commit
		const cp2Change = await lix.db
			.selectFrom("change")
			.where("entity_id", "=", cp2.id)
			.where("schema_key", "=", LixCommitSchema["x-lix-key"])
			.orderBy("created_at", "desc")
			.select(["snapshot_content"])
			.executeTakeFirstOrThrow();

		const snapshot = cp2Change.snapshot_content;
		const parents = snapshot?.parent_commit_ids ?? [];
		expectDeterministic(parents.includes(cp1.id)).toBe(true);
		expectDeterministic(parents.includes(vBeforeCp2.commit_id)).toBe(true);

		const cp2CommitState = await lix.db
			.selectFrom("commit")
			.where("id", "=", cp2.id)
			.select(["parent_commit_ids"])
			.executeTakeFirstOrThrow();

		const cachedParents = cp2CommitState.parent_commit_ids ?? [];
		expectDeterministic(cachedParents.includes(cp1.id)).toBe(true);
		expectDeterministic(cachedParents.includes(vBeforeCp2.commit_id)).toBe(
			true
		);
	}
);

// we should have https://github.com/opral/lix-sdk/issues/305 before this test
simulationTest(
	"checkpoint enables clean working change set for new work",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_untracked: true,
					lixcol_version_id: "global",
				},
			],
		});

		// Make initial changes
		await lix.db
			.insertInto("key_value")
			.values({ key: "before_checkpoint", value: "value" })
			.execute();

		// Create checkpoint
		const checkpoint = await createCheckpoint({ lix });

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
		expectDeterministic(workingKeys.includes("after_checkpoint")).toBe(true);
		expectDeterministic(workingKeys.includes("before_checkpoint")).toBe(false);

		// Checkpoint should contain pre-checkpoint changes
		const checkpointElements = await lix.db
			.selectFrom("change_set_element")
			.where("change_set_id", "=", checkpoint.change_set_id)
			.selectAll()
			.execute();

		const checkpointKeys = checkpointElements.map((e) => e.entity_id);
		expectDeterministic(checkpointKeys.includes("before_checkpoint")).toBe(
			true
		);
		expectDeterministic(checkpointKeys.includes("after_checkpoint")).toBe(
			false
		);
	}
);

simulationTest(
	"creates proper change set ancestry chain",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_untracked: true,
					lixcol_version_id: "global",
				},
			],
		});

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

		const checkpoint1 = await createCheckpoint({ lix });

		// Make more changes and create second checkpoint
		await lix.db
			.insertInto("key_value")
			.values({ key: "second", value: "value" })
			.execute();

		const checkpoint2 = await createCheckpoint({ lix });

		// Verify ancestry: initial commit should be an ancestor of checkpoint1
		const initialIsAncestorOfCheckpoint1 = await lix.db
			.selectFrom("commit")
			.where("id", "=", initialVersion.commit_id)
			.where(commitIsAncestorOf({ id: checkpoint1.id }))
			.selectAll()
			.execute();

		expectDeterministic(initialIsAncestorOfCheckpoint1.length).toBe(1);

		// Verify ancestry: checkpoint1 should be an ancestor of checkpoint2
		const checkpoint1IsAncestorOfCheckpoint2 = await lix.db
			.selectFrom("commit")
			.where("id", "=", checkpoint1.id)
			.where(commitIsAncestorOf({ id: checkpoint2.id }))
			.selectAll()
			.execute();

		expectDeterministic(checkpoint1IsAncestorOfCheckpoint2.length).toBe(1);

		// Verify full chain: initial should be an ancestor of checkpoint2
		const initialIsAncestorOfCheckpoint2 = await lix.db
			.selectFrom("commit")
			.where("id", "=", initialVersion.commit_id)
			.where(commitIsAncestorOf({ id: checkpoint2.id }))
			.selectAll()
			.execute();

		expectDeterministic(initialIsAncestorOfCheckpoint2.length).toBe(1);
	}
);

// very slow https://github.com/opral/lix-sdk/issues/311
simulationTest(
	"checkpoint should include deletion changes",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_untracked: true,
					lixcol_version_id: "global",
				},
			],
		});

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		// Insert a key-value pair
		await lix.db
			.insertInto("key_value")
			.values({ key: "test-key", value: "test-value" })
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

		expectDeterministic(deletionChanges.length).toBe(1); // key-value entity deletion

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
		expectDeterministic(deletionChangesInCheckpoint.length).toBe(1);
	}
);

// very slow https://github.com/opral/lix-sdk/issues/311
simulationTest(
	"checkpoint should include file deletion changes",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			providePlugins: [mockJsonPlugin],
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_untracked: true,
					lixcol_version_id: "global",
				},
			],
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

		expectDeterministic(deletionChanges.length).toBe(2); // file entity + plugin entity deletion

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

		expectDeterministic(deletionChangesInCheckpoint.length).toBe(2);
	}
);

simulationTest(
	"no orphaned commits exist after creating checkpoint",
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

			// Every commit should have at least one connection
			const hasConnections =
				hasParentEdge.length > 0 ||
				hasChildEdge.length > 0 ||
				isReferencedByVersion.length > 0;

			expectDeterministic(hasConnections).toBe(true);
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

		expectDeterministic(checkpointHasParent.length > 0).toBe(true);

		// The checkpoint should have an edge to the new working commit
		const checkpointHasChild = await lix.db
			.selectFrom("commit_edge")
			.where("parent_id", "=", checkpoint.id)
			.where("child_id", "=", version.working_commit_id)
			.selectAll()
			.execute();

		expectDeterministic(checkpointHasChild.length).toBe(1);

		// The working commit should be referenced by the version
		expectDeterministic(!!version.working_commit_id).toBe(true);
		expectDeterministic(version.commit_id).toBe(checkpoint.id);

		// The checkpoint ID should be the former working commit ID
		expectDeterministic(checkpoint.id).toBe(initialWorkingCommitId);

		// The previous working commit should now be the version's commit
		expectDeterministic(version.commit_id).toBe(initialWorkingCommitId);

		// The new working commit should be different from the checkpoint
		expectDeterministic(version.working_commit_id !== checkpoint.id).toBe(true);

		// There should be exactly one edge between the version's previous commit (before checkpoint) and the checkpoint
		const edgesBetweenPreviousAndCheckpoint = await lix.db
			.selectFrom("commit_edge")
			.where("parent_id", "=", versionBeforeCheckpoint.commit_id)
			.where("child_id", "=", checkpoint.id)
			.selectAll()
			.execute();

		expectDeterministic(edgesBetweenPreviousAndCheckpoint.length).toBe(1);
	}
);
