import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { ChangeSetEdge } from "../change-set/schema.js";

// re-enable after https://github.com/opral/lix-sdk/issues/305
// which avoids the massive chain of change sets event
test.todo(
	"creates a new change set and updates the version's change set id for mutations",
	async () => {
		const lix = await openLixInMemory({});

		const versionBeforeInsert = await lix.db
			.selectFrom("version")
			.selectAll()
			.where("name", "=", "main")
			.executeTakeFirstOrThrow();

		await lix.db
			.insertInto("key_value")
			.values({
				key: "mock_key",
				value: "mock_value",
			})
			.execute();

		const versionAfterInsert = await lix.db
			.selectFrom("version")
			.selectAll()
			.where("name", "=", "main")
			.executeTakeFirstOrThrow();

		expect(versionAfterInsert.change_set_id).not.toEqual(
			versionBeforeInsert.change_set_id
		);

		await lix.db
			.updateTable("key_value")
			.where("key", "=", "mock_key")
			.set({
				value: "mock_value_updated",
			})
			.execute();

		const versionAfterUpdate = await lix.db
			.selectFrom("version")
			.selectAll()
			.where("name", "=", "main")
			.executeTakeFirstOrThrow();

		expect(versionAfterUpdate.change_set_id).not.toEqual(
			versionAfterInsert.change_set_id
		);

		await lix.db
			.deleteFrom("key_value")
			.where("key", "=", "mock_key")
			.execute();

		const versionAfterDelete = await lix.db
			.selectFrom("version")
			.selectAll()
			.where("name", "=", "main")
			.executeTakeFirstOrThrow();

		expect(versionAfterDelete.change_set_id).not.toEqual(
			versionAfterUpdate.change_set_id
		);

		const edges = await lix.db
			.selectFrom("change_set_edge")
			.select(["parent_id", "child_id"])
			.execute();

		expect(edges).toEqual(
			expect.arrayContaining([
				{
					parent_id: versionBeforeInsert.change_set_id,
					child_id: versionAfterInsert.change_set_id,
				},
				{
					parent_id: versionAfterInsert.change_set_id,
					child_id: versionAfterUpdate.change_set_id,
				},
				{
					parent_id: versionAfterUpdate.change_set_id,
					child_id: versionAfterDelete.change_set_id,
				},
			] satisfies Omit<ChangeSetEdge, "version_id">[])
		);
	}
);

// SQLite does not provide a "before transaction commits" hook which would allow
// us to group changes of a transaction into the same change set.
//
// The workaround of using sqlite3_commit_hook is not possible because
// SQLite forbids mutations in the commit hook https://www.sqlite.org/c3ref/commit_hook.html
test.skip("groups changes of a transaction into the same change set", async () => {
	const lix = await openLixInMemory({});

	const edgesBeforeTransaction = await lix.db
		.selectFrom("change_set_edge")
		.selectAll()
		.execute();

	await lix.db.transaction().execute(async (trx) => {
		await trx
			.insertInto("key_value")
			.values({
				key: "mock_key",
				value: "mock_value",
			})
			.execute();

		await trx
			.insertInto("key_value")
			.values({
				key: "mock_key2",
				value: "mock_value2",
			})
			.execute();
	});

	const edgesAfterTransaction = await lix.db
		.selectFrom("change_set_edge")
		.selectAll()
		.execute();

	expect(edgesAfterTransaction).toHaveLength(edgesBeforeTransaction.length + 1);
});

test("should throw error when version_id is null", async () => {
	const lix = await openLixInMemory({});

	// Try to insert state with null version_id - should throw
	await expect(
		lix.db
			.insertInto("state")
			.values({
				entity_id: "test_entity",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "test_plugin",
				snapshot_content: { key: "test", value: "test" },
				schema_version: "1.0",
				version_id: null as any, // Explicitly null version_id
			})
			.execute()
	).rejects.toThrow("version_id is required");
});

test("should throw error when version_id does not exist", async () => {
	const lix = await openLixInMemory({});

	const nonExistentVersionId = "non-existent-version-id";

	// Try to insert state with non-existent version_id - should throw
	await expect(
		lix.db
			.insertInto("state")
			.values({
				entity_id: "test_entity",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "test_plugin",
				snapshot_content: { key: "test", value: "test" },
				schema_version: "1.0",
				version_id: nonExistentVersionId,
			})
			.execute()
	).rejects.toThrow(`Version with id '${nonExistentVersionId}' does not exist`);
});

// Deciding on the behavior when updating version.change_set_id is a tradeoff.
// Implicit magic of "updating change_set_id creates edges" would mutate the target change set,
// a more explicit behavior is to not create edges or orphaned change sets and the calling code should handle it.
//
//* It seems like this test is not needed anymore with the introduction of global state
//* https://github.com/opral/lix-sdk/issues/315. A version can now be freely updated without
//* effecting the change set graph of the version itself because the global version (state)
//* is updated instead.
test.skip("updating version change_set_id should not create edges or orphaned change sets in the graph of the version itself", async () => {
	const lix = await openLixInMemory({});

	// Get initial version state
	const initialVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create a target change set with some elements
	const targetChangeSetId = "target-change-set-123";
	await lix.db
		.insertInto("change_set")
		.values({ id: targetChangeSetId })
		.execute();

	// Create schema record
	await lix.db
		.insertInto("stored_schema")
		.values({
			value: {
				"x-lix-key": "test_schema",
				"x-lix-version": "1.0",
				type: "object",
				properties: {},
			},
		})
		.execute();

	// Create some changes with explicit IDs
	await lix.db
		.insertInto("change")
		.values([
			{
				id: "mock-change-0",
				entity_id: "entity1",
				schema_key: "test_schema",
				file_id: "test_file",
				plugin_key: "test_plugin",
				snapshot_id: "no-content",
				schema_version: "1.0",
			},
			{
				id: "mock-change-1",
				entity_id: "entity2",
				schema_key: "test_schema",
				file_id: "test_file",
				plugin_key: "test_plugin",
				snapshot_id: "no-content",
				schema_version: "1.0",
			},
		])
		.execute();

	// Add changes to target change set
	await lix.db
		.insertInto("change_set_element")
		.values([
			{
				change_set_id: targetChangeSetId,
				change_id: "mock-change-0",
				entity_id: "entity1",
				schema_key: "test_schema",
				file_id: "test_file",
			},
			{
				change_set_id: targetChangeSetId,
				change_id: "mock-change-1",
				entity_id: "entity2",
				schema_key: "test_schema",
				file_id: "test_file",
			},
		])
		.execute();

	const changeSetsBefore = await lix.db
		.selectFrom("change_set")
		.selectAll()
		.execute();

	const changeSetEdgesBefore = await lix.db
		.selectFrom("change_set_edge")
		.selectAll()
		.execute();

	// User updates version to point to target change set
	await lix.db
		.updateTable("version")
		.where("id", "=", initialVersion.id)
		.set({ change_set_id: targetChangeSetId })
		.execute();

	// Get updated version
	const updatedVersion = await lix.db
		.selectFrom("version")
		.where("id", "=", initialVersion.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// Version should point to the target change set (user gets what they asked for)
	expect(updatedVersion.change_set_id).toBe(targetChangeSetId);

	// NO new change sets should be created (no orphaned change sets)
	const changeSetsAfter = await lix.db
		.selectFrom("change_set")
		.selectAll()
		.execute();

	expect(changeSetsAfter).toHaveLength(changeSetsBefore.length);

	// NO new edges should be created
	const changeSetEdgesAfter = await lix.db
		.selectFrom("change_set_edge")
		.selectAll()
		.execute();

	expect(changeSetEdgesAfter).toHaveLength(changeSetEdgesBefore.length);

	// Target change set should remain unchanged
	const targetElementsAfter = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", targetChangeSetId)
		.selectAll()
		.execute();

	expect(targetElementsAfter).toHaveLength(2); // Still just mock-0 and mock-1
});

// under no circumstances should a change set contain duplicate entity changes
// given that we directly insert into internal_change and internal_snapshot,
// we need to ensure that the change set does not contain duplicates manually
test("updating a version should merge the change with the mutation handlers change", async () => {
	const lix = await openLixInMemory({});

	// Get initial version
	const initialVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Update version name - this triggers mutation handler
	await lix.db
		.updateTable("version")
		.where("id", "=", initialVersion.id)
		.set({ name: "updated-name" })
		.execute();

	const updatedVersion = await lix.db
		.selectFrom("version")
		.where("id", "=", initialVersion.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// Check how many version changes exist in the final change set
	const versionChangesInFinalSet = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change.id",
			"change_set_element.change_id"
		)
		.where(
			"change_set_element.change_set_id",
			"=",
			updatedVersion.change_set_id
		)
		.where("change.schema_key", "=", "lix_version")
		.where("change.entity_id", "=", initialVersion.id)
		.selectAll("change")
		.execute();

	// Should be only 1 version change per change set (merged change)
	expect(versionChangesInFinalSet.length).toBe(1);
});

test("updating version name should create edges (normal mutation behavior)", async () => {
	const lix = await openLixInMemory({});

	// Get initial version
	const initialVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	const initialChangeSetId = initialVersion.change_set_id;

	const changeSetsBefore = await lix.db
		.selectFrom("change_set")
		.selectAll()
		.execute();

	const changeSetEdgesBefore = await lix.db
		.selectFrom("change_set_edge")
		.selectAll()
		.execute();

	// Update version name (NOT change_set_id)
	await lix.db
		.updateTable("version")
		.where("id", "=", initialVersion.id)
		.set({ name: "feature-branch" })
		.execute();

	const updatedVersion = await lix.db
		.selectFrom("version")
		.where("id", "=", initialVersion.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// Version should have new name
	expect(updatedVersion.name).toBe("feature-branch");

	// change_set_id should be updated to new change set (normal mutation behavior)
	expect(updatedVersion.change_set_id).not.toBe(initialChangeSetId);

	// NEW change set should be created (normal mutation behavior)
	const changeSetsAfter = await lix.db
		.selectFrom("change_set")
		.selectAll()
		.execute();

	expect(changeSetsAfter.length).toBe(changeSetsBefore.length + 1);

	// NEW edge should be created (normal mutation behavior)
	const changeSetEdgesAfter = await lix.db
		.selectFrom("change_set_edge")
		.selectAll()
		.execute();

	expect(changeSetEdgesAfter.length).toBe(changeSetEdgesBefore.length + 1);

	// Verify the edge connects initial -> new change set
	const newEdge = changeSetEdgesAfter.find(
		(edge) =>
			edge.parent_id === initialChangeSetId &&
			edge.child_id === updatedVersion.change_set_id
	);
	expect(newEdge).toBeDefined();
});

test("inserts working change set elements", async () => {
	const lix = await openLixInMemory({});

	// Get initial version and working change set
	const initialVersion = await lix.db
		.selectFrom("version")
		.selectAll()
		.where("name", "=", "main")
		.executeTakeFirstOrThrow();

	// Make a mutation
	await lix.db
		.insertInto("key_value")
		.values({
			key: "test_key",
			value: "test_value",
		})
		.execute();

	// Check that working change set element was created by mutation handler
	const workingElements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", initialVersion.working_change_set_id)
		.where("entity_id", "=", "test_key")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(workingElements).toHaveLength(1);
	expect(workingElements[0]).toMatchObject({
		change_set_id: initialVersion.working_change_set_id,
		entity_id: "test_key",
		schema_key: "lix_key_value",
		file_id: "lix",
	});

	// Verify the change_id points to a real change
	const change = await lix.db
		.selectFrom("change")
		.where("id", "=", workingElements[0]!.change_id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(change.entity_id).toBe("test_key");
	expect(change.schema_key).toBe("lix_key_value");
});

test("updates working change set elements on entity updates (latest change wins)", async () => {
	const lix = await openLixInMemory({});

	// Get initial version
	const initialVersion = await lix.db
		.selectFrom("version")
		.selectAll()
		.where("name", "=", "main")
		.executeTakeFirstOrThrow();

	// Insert entity
	await lix.db
		.insertInto("key_value")
		.values({
			key: "test_key",
			value: "test_value",
		})
		.execute();

	// Get initial working element
	const initialWorkingElements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", initialVersion.working_change_set_id)
		.where("entity_id", "=", "test_key")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(initialWorkingElements).toHaveLength(1);
	const initialChangeId = initialWorkingElements[0]!.change_id;

	// Update the same entity
	await lix.db
		.updateTable("key_value")
		.where("key", "=", "test_key")
		.set({ value: "updated_value" })
		.execute();

	// Check that working change set still has only one element for this entity (latest change)
	const workingElementsAfterUpdate = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", initialVersion.working_change_set_id)
		.where("entity_id", "=", "test_key")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(workingElementsAfterUpdate).toHaveLength(1);

	// Verify the change_id was updated to latest change
	expect(workingElementsAfterUpdate[0]!.change_id).not.toBe(initialChangeId);

	// Verify the change_id points to the latest change
	const allChanges = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "test_key")
		.where("schema_key", "=", "lix_key_value")
		.orderBy("created_at", "desc")
		.selectAll()
		.execute();

	expect(allChanges).toHaveLength(2); // Insert + Update
	expect(workingElementsAfterUpdate[0]!.change_id).toBe(allChanges[0]!.id); // Latest change
});

test("mutation handler removes working change set elements on entity deletion", async () => {
	const lix = await openLixInMemory({});

	// Get initial version
	const initialVersion = await lix.db
		.selectFrom("version")
		.selectAll()
		.where("name", "=", "main")
		.executeTakeFirstOrThrow();

	// Insert entity
	await lix.db
		.insertInto("key_value")
		.values({
			key: "test_key",
			value: "test_value",
		})
		.execute();

	// Verify element exists in working change set
	const workingElementsAfterInsert = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", initialVersion.working_change_set_id)
		.where("entity_id", "=", "test_key")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(workingElementsAfterInsert).toHaveLength(1);

	// Delete the entity
	await lix.db.deleteFrom("key_value").where("key", "=", "test_key").execute();

	// Check that working change set no longer includes this entity
	const workingElementsAfterDelete = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", initialVersion.working_change_set_id)
		.where("entity_id", "=", "test_key")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(workingElementsAfterDelete).toHaveLength(0);

	// Verify the delete change was still recorded
	const allChanges = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "test_key")
		.where("schema_key", "=", "lix_key_value")
		.orderBy("created_at", "desc")
		.selectAll()
		.execute();

	expect(allChanges).toHaveLength(2); // Insert + Delete
	expect(allChanges[0]!.snapshot_id).toBe("no-content"); // Latest change is deletion
});

// slow, needs https://github.com/opral/lix-sdk/issues/311
test(
	"delete reconciliation: entities added after checkpoint then deleted are excluded from working change set",
	async () => {
		const lix = await openLixInMemory({});

		// Get initial version and working change set
		const initialVersion = await lix.db
			.selectFrom("version")
			.selectAll()
			.where("name", "=", "main")
			.executeTakeFirstOrThrow();

		// Create a checkpoint label to mark the current state
		const checkpointLabel = await lix.db
			.selectFrom("label")
			.where("name", "=", "checkpoint")
			.select("id")
			.executeTakeFirstOrThrow();

		// Add checkpoint label to the current change set (simulating a checkpoint)
		await lix.db
			.insertInto("change_set_label")
			.values({
				change_set_id: initialVersion.change_set_id,
				label_id: checkpointLabel.id,
				version_id: "global",
			})
			.execute();

		// AFTER checkpoint: Insert an entity
		await lix.db
			.insertInto("key_value")
			.values({
				key: "post_checkpoint_key",
				value: "post_checkpoint_value",
			})
			.execute();

		// Verify entity appears in working change set after insert
		const workingElementsAfterInsert = await lix.db
			.selectFrom("change_set_element")
			.where("change_set_id", "=", initialVersion.working_change_set_id)
			.where("entity_id", "=", "post_checkpoint_key")
			.where("schema_key", "=", "lix_key_value")
			.selectAll()
			.execute();

		expect(workingElementsAfterInsert).toHaveLength(1);

		// AFTER checkpoint: Delete the same entity
		await lix.db
			.deleteFrom("key_value")
			.where("key", "=", "post_checkpoint_key")
			.execute();

		// Verify entity is excluded from working change set (added after checkpoint then deleted)
		const workingElementsAfterDelete = await lix.db
			.selectFrom("change_set_element")
			.where("change_set_id", "=", initialVersion.working_change_set_id)
			.where("entity_id", "=", "post_checkpoint_key")
			.where("schema_key", "=", "lix_key_value")
			.selectAll()
			.execute();

		expect(workingElementsAfterDelete).toHaveLength(0);

		// Verify the changes were recorded
		const allChanges = await lix.db
			.selectFrom("change")
			.where("entity_id", "=", "post_checkpoint_key")
			.where("schema_key", "=", "lix_key_value")
			.orderBy("created_at", "asc")
			.selectAll()
			.execute();

		expect(allChanges).toHaveLength(2); // Insert + Delete
		expect(allChanges[1]!.snapshot_id).toBe("no-content"); // Delete change
	},
	{ timeout: 20000 }
);

// slow, needs https://github.com/opral/lix-sdk/issues/311
// this is expensive to compute because the historical state must be reconstructed
// ideally, we have a state_at read view which makes this peformant, or we find ways
// to design the working change set differently.
test.todo(
	"delete reconciliation: entities existing before checkpoint show deletions in working change set",
	async () => {
		const lix = await openLixInMemory({});

		// BEFORE checkpoint: Insert an entity
		await lix.db
			.insertInto("key_value")
			.values({
				key: "pre_checkpoint_key",
				value: "pre_checkpoint_value",
			})
			.execute();

		// Get the current version after the insert (it will have updated)
		const versionAfterInsert = await lix.db
			.selectFrom("version")
			.selectAll()
			.where("name", "=", "main")
			.executeTakeFirstOrThrow();

		// Create a checkpoint label and attach to current change set
		const checkpointLabel = await lix.db
			.selectFrom("label")
			.where("name", "=", "checkpoint")
			.select("id")
			.executeTakeFirstOrThrow();

		await lix.db
			.insertInto("change_set_label")
			.values({
				change_set_id: versionAfterInsert.change_set_id,
				label_id: checkpointLabel.id,
				version_id: "global",
			})
			.execute();

		// AFTER checkpoint: Delete the entity that existed before checkpoint
		await lix.db
			.deleteFrom("key_value")
			.where("key", "=", "pre_checkpoint_key")
			.execute();

		// Get the final version after delete
		const finalVersion = await lix.db
			.selectFrom("version")
			.selectAll()
			.where("name", "=", "main")
			.executeTakeFirstOrThrow();

		// Verify entity deletion is included in working change set
		// (because it existed before checkpoint)
		const workingElementsAfterDelete = await lix.db
			.selectFrom("change_set_element")
			.where("change_set_id", "=", finalVersion.working_change_set_id)
			.where("entity_id", "=", "pre_checkpoint_key")
			.where("schema_key", "=", "lix_key_value")
			.selectAll()
			.execute();

		// The delete should be visible in working change set because entity existed before checkpoint
		expect(workingElementsAfterDelete).toHaveLength(1);

		// Verify it's the delete change
		const deleteChange = await lix.db
			.selectFrom("change")
			.where("id", "=", workingElementsAfterDelete[0]!.change_id)
			.selectAll()
			.executeTakeFirstOrThrow();

		expect(deleteChange.snapshot_id).toBe("no-content");
	}
);

test("working change set elements are separated per version", async () => {
	const lix = await openLixInMemory({});

	// Get the initial main version
	const mainVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Make changes in the main version context
	await lix.db
		.insertInto("key_value")
		.values({
			key: "main_version_key",
			value: "main_version_value",
		})
		.execute();

	// Create a new change set and version
	await lix.db
		.insertInto("change_set")
		.values([
			{ id: "new_cs", version_id: "global" },
			{ id: "new_working_cs", version_id: "global" },
		])
		.execute();

	await lix.db
		.insertInto("version")
		.values({
			id: "new_version",
			name: "new_version",
			change_set_id: "new_cs",
			working_change_set_id: "new_working_cs",
		})
		.execute();

	// Switch to the new version and make changes
	await lix.db
		.updateTable("active_version")
		.set({ version_id: "new_version" })
		.execute();

	await lix.db
		.insertInto("key_value")
		.values({
			key: "new_version_key",
			value: "new_version_value",
		})
		.execute();

	// Check main version's working change set elements
	const mainWorkingElements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", mainVersion.working_change_set_id)
		.where("entity_id", "=", "main_version_key")
		.selectAll()
		.execute();

	// Check new version's working change set elements
	const newWorkingElements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", "new_working_cs")
		.where("entity_id", "=", "new_version_key")
		.selectAll()
		.execute();

	// Main version should see its own changes
	expect(mainWorkingElements).toHaveLength(1);
	expect(mainWorkingElements[0]).toMatchObject({
		change_set_id: mainVersion.working_change_set_id,
		entity_id: "main_version_key",
		schema_key: "lix_key_value",
		file_id: "lix",
	});

	// New version should see its own changes
	expect(newWorkingElements).toHaveLength(1);
	expect(newWorkingElements[0]).toMatchObject({
		change_set_id: "new_working_cs",
		entity_id: "new_version_key",
		schema_key: "lix_key_value",
		file_id: "lix",
	});

	// Verify isolation - main working change set should not contain new version changes
	const mainCrossCheck = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", mainVersion.working_change_set_id)
		.where("entity_id", "=", "new_version_key")
		.selectAll()
		.execute();

	// New working change set should not contain main version changes
	const newCrossCheck = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", "new_working_cs")
		.where("entity_id", "=", "main_version_key")
		.selectAll()
		.execute();

	expect(mainCrossCheck).toHaveLength(0);
	expect(newCrossCheck).toHaveLength(0);
});
