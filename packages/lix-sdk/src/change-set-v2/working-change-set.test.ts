import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";

test("working change set elements are computed from changes since last checkpoint", async () => {
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

	// Check that working change set element is computed
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

	// Delete the entity
	await lix.db.deleteFrom("key_value").where("key", "=", "test_key").execute();

	// Check that working change set no longer includes this entity (deletions are excluded)
	const workingElementsAfterDelete = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", initialVersion.working_change_set_id)
		.where("entity_id", "=", "test_key")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(workingElementsAfterDelete).toHaveLength(0);

	// Verify the delete change was recorded
	const allChangesAfterDelete = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "test_key")
		.where("schema_key", "=", "lix_key_value")
		.orderBy("created_at", "desc")
		.selectAll()
		.execute();

	expect(allChangesAfterDelete).toHaveLength(3); // Insert + Update + Delete
	expect(allChangesAfterDelete[0]!.snapshot_id).toBe("no-content"); // Latest change is deletion
});

test("delete reconciliation: entities added after checkpoint then deleted are excluded from working change set", async () => {
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
});

test("delete reconciliation: entities existing before checkpoint show deletions in working change set", async () => {
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
});

// TODO needs global version to work properly
test.todo("working change set elements are separated per version", async () => {
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
		.values([{ id: "new_cs" }, { id: "new_working_cs" }])
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
