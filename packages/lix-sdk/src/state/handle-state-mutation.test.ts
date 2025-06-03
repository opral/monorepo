import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { ChangeSetEdge } from "../change-set-v2/schema.js";

test("creates a new change set and updates the version's change set id for mutations", async () => {
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

	await lix.db.deleteFrom("key_value").where("key", "=", "mock_key").execute();

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
});

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
		lix.db.insertInto("state").values({
			entity_id: "test_entity",
			schema_key: "lix_key_value", 
			file_id: "lix",
			plugin_key: "test_plugin",
			snapshot_content: { key: "test", value: "test" },
			schema_version: "1.0",
			version_id: null as any // Explicitly null version_id
		}).execute()
	).rejects.toThrow("version_id is required");
});

test("should throw error when version_id does not exist", async () => {
	const lix = await openLixInMemory({});
	
	const nonExistentVersionId = "non-existent-version-id";
	
	// Try to insert state with non-existent version_id - should throw
	await expect(
		lix.db.insertInto("state").values({
			entity_id: "test_entity",
			schema_key: "lix_key_value",
			file_id: "lix", 
			plugin_key: "test_plugin",
			snapshot_content: { key: "test", value: "test" },
			schema_version: "1.0",
			version_id: nonExistentVersionId
		}).execute()
	).rejects.toThrow(`Version with id '${nonExistentVersionId}' does not exist`);
});

// Deciding on the behavior when updating version.change_set_id is a tradeoff. 
// Implicit magic of "updating change_set_id creates edges" would mutate the target change set, 
// a more explicit behavior is to not create edges or orphaned change sets and the calling code should handle it.
test("updating version change_set_id should not create edges or orphaned change sets", async () => {
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

test("lix_state_mutation_handler_skip_change_set_creation flag bypasses change set creation", async () => {
	const lix = await openLixInMemory({});

	// Get initial state
	const initialVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	const initialChangeSetId = initialVersion.change_set_id;

	// Count initial change sets and edges
	const changeSetsBefore = await lix.db
		.selectFrom("change_set")
		.selectAll()
		.execute();

	const changeSetEdgesBefore = await lix.db
		.selectFrom("change_set_edge")
		.selectAll()
		.execute();

	// Set the skip flag
	await lix.db
		.insertInto("key_value")
		.values({
			key: "lix_state_mutation_handler_skip_change_set_creation",
			value: "true",
		})
		.execute();

	// Make a change that would normally trigger mutation handler
	await lix.db
		.insertInto("key_value")
		.values({ key: "test-key", value: "test-value" })
		.execute();

	// Update version name (would normally create change sets + edges)
	await lix.db
		.updateTable("version")
		.where("id", "=", initialVersion.id)
		.set({ name: "test-branch" })
		.execute();

	// Verify NO new change sets were created (skip flag working)
	const changeSetsAfter = await lix.db
		.selectFrom("change_set")
		.selectAll()
		.execute();

	expect(changeSetsAfter).toHaveLength(changeSetsBefore.length);

	// Verify NO new edges were created (skip flag working)
	const changeSetEdgesAfter = await lix.db
		.selectFrom("change_set_edge")
		.selectAll()
		.execute();

	expect(changeSetEdgesAfter).toHaveLength(changeSetEdgesBefore.length);

	// Verify changes were still created (only edge creation is skipped)
	const updatedVersion = await lix.db
		.selectFrom("version")
		.where("id", "=", initialVersion.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(updatedVersion.name).toBe("test-branch");
	// Version change_set_id should be unchanged (no automatic updates)
	expect(updatedVersion.change_set_id).toBe(initialChangeSetId);

	const testKeyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test-key")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(testKeyValue.value).toBe("test-value");
});

