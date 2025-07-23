import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import type { LixCommitEdge } from "../commit/schema.js";
import { switchAccount } from "../account/switch-account.js";
import { commitIsAncestorOf } from "../query-filter/commit-is-ancestor-of.js";

test("creates a new commit and updates the version's commit id for mutations", async () => {
	const lix = await openLix({});

	const versionBeforeInsert = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
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
		.where("id", "=", versionBeforeInsert.id)
		.executeTakeFirstOrThrow();

	expect(versionAfterInsert.commit_id).not.toEqual(
		versionBeforeInsert.commit_id
	);

	await lix.db
		.updateTable("key_value_all")
		.where("key", "=", "mock_key")
		.where(
			"lixcol_version_id",
			"=",
			lix.db.selectFrom("active_version").select("version_id")
		)
		.set({
			value: "mock_value_updated",
		})
		.execute();

	const versionAfterUpdate = await lix.db
		.selectFrom("version")
		.selectAll()
		.where("id", "=", versionAfterInsert.id)
		.executeTakeFirstOrThrow();

	expect(versionAfterUpdate.commit_id).not.toEqual(
		versionAfterInsert.commit_id
	);

	await lix.db.deleteFrom("key_value").where("key", "=", "mock_key").execute();

	const versionAfterDelete = await lix.db
		.selectFrom("version")
		.selectAll()
		.where("id", "=", versionAfterUpdate.id)
		.executeTakeFirstOrThrow();

	expect(versionAfterDelete.commit_id).not.toEqual(
		versionAfterUpdate.commit_id
	);

	const edges = await lix.db
		.selectFrom("commit_edge")
		.select(["parent_id", "child_id"])
		.execute();

	expect(edges).toEqual(
		expect.arrayContaining([
			{
				parent_id: versionBeforeInsert.commit_id,
				child_id: versionAfterInsert.commit_id,
			},
			{
				parent_id: versionAfterInsert.commit_id,
				child_id: versionAfterUpdate.commit_id,
			},
			{
				parent_id: versionAfterUpdate.commit_id,
				child_id: versionAfterDelete.commit_id,
			},
		] satisfies LixCommitEdge[])
	);
});

test("groups changes of a transaction into the same change set for the given version", async () => {
	const lix = await openLix({});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	const commitAncestryBefore = await lix.db
		.selectFrom("commit")
		.where(commitIsAncestorOf({ id: activeVersion.commit_id }))
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

	const activeVersionAfterTransaction = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	const commitAncestryAfter = await lix.db
		.selectFrom("commit")
		.where(commitIsAncestorOf({ id: activeVersionAfterTransaction.commit_id }))
		.selectAll()
		.execute();

	expect(commitAncestryAfter).toHaveLength(commitAncestryBefore.length + 1);
});

test("should throw error when version_id is null", async () => {
	const lix = await openLix({});

	// Try to insert state with null version_id - should throw
	await expect(
		lix.db
			.insertInto("state_all")
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
	const lix = await openLix({});

	const nonExistentVersionId = "non-existent-version-id";

	// Try to insert state with non-existent version_id - should throw
	await expect(
		lix.db
			.insertInto("state_all")
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

test("inserts working change set elements", async () => {
	const lix = await openLix({});

	// Get initial version and working change set
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Make a mutation
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "test_key",
			value: "test_value",
			lixcol_version_id: activeVersion.id,
		})
		.execute();

	// Check that working change set element was created by mutation handler
	const workingElements = await lix.db
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", activeVersion.working_change_set_id)
		.where("lixcol_version_id", "=", activeVersion.id)
		.where("entity_id", "=", "test_key")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(workingElements).toHaveLength(1);
	expect(workingElements[0]).toMatchObject({
		change_set_id: activeVersion.working_change_set_id,
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
	const lix = await openLix({});

	// Get initial version
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	// Insert entity
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "test_key",
			value: "test_value",
			lixcol_version_id: activeVersion.id,
		})
		.execute();

	// Get initial working element
	const initialWorkingElements = await lix.db
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", activeVersion.working_change_set_id)
		.where("lixcol_version_id", "=", activeVersion.id)
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
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", activeVersion.working_change_set_id)
		.where("lixcol_version_id", "=", activeVersion.id)
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
	const lix = await openLix({});

	// Get initial version
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	// Insert entity
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "test_key",
			value: "test_value",
			lixcol_version_id: activeVersion.id,
		})
		.execute();

	// Verify element exists in working change set
	const workingElementsAfterInsert = await lix.db
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", activeVersion.working_change_set_id)
		.where("lixcol_version_id", "=", activeVersion.id)
		.where("entity_id", "=", "test_key")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(workingElementsAfterInsert).toHaveLength(1);

	// Delete the entity
	await lix.db.deleteFrom("key_value").where("key", "=", "test_key").execute();

	// Check that working change set no longer includes this entity
	const workingElementsAfterDelete = await lix.db
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", activeVersion.working_change_set_id)
		.where("lixcol_version_id", "=", activeVersion.id)
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
	expect(allChanges[0]!.snapshot_content).toBe(null); // Latest change is deletion
});

// slow, needs https://github.com/opral/lix-sdk/issues/311
test(
	"delete reconciliation: entities added after checkpoint then deleted are excluded from working change set",
	async () => {
		const lix = await openLix({});

		// Get initial version and working change set
		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		// Create a checkpoint label to mark the current state
		const checkpointLabel = await lix.db
			.selectFrom("label")
			.where("name", "=", "checkpoint")
			.select("id")
			.executeTakeFirstOrThrow();

		// Get the change set from the commit to add checkpoint label
		const currentCommit = await lix.db
			.selectFrom("commit")
			.where("id", "=", activeVersion.commit_id)
			.selectAll()
			.executeTakeFirstOrThrow();

		// Add checkpoint label to the current change set (simulating a checkpoint)
		await lix.db
			.insertInto("change_set_label_all")
			.values({
				change_set_id: currentCommit.change_set_id,
				label_id: checkpointLabel.id,
				lixcol_version_id: "global",
			})
			.execute();

		// AFTER checkpoint: Insert an entity
		await lix.db
			.insertInto("key_value_all")
			.values({
				key: "post_checkpoint_key",
				value: "post_checkpoint_value",
				lixcol_version_id: activeVersion.id,
			})
			.execute();

		// Verify entity appears in working change set after insert
		const workingElementsAfterInsert = await lix.db
			.selectFrom("change_set_element_all")
			.where("change_set_id", "=", activeVersion.working_change_set_id)
			.where("lixcol_version_id", "=", activeVersion.id)
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
			.selectFrom("change_set_element_all")
			.where("change_set_id", "=", activeVersion.working_change_set_id)
			.where("lixcol_version_id", "=", activeVersion.id)
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
		expect(allChanges[1]!.snapshot_content).toBe(null); // Delete change
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
		const lix = await openLix({});

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

		// Get the change set from the commit
		const commitAfterInsert = await lix.db
			.selectFrom("commit")
			.where("id", "=", versionAfterInsert.commit_id)
			.selectAll()
			.executeTakeFirstOrThrow();

		await lix.db
			.insertInto("change_set_label_all")
			.values({
				change_set_id: commitAfterInsert.change_set_id,
				label_id: checkpointLabel.id,
				lixcol_version_id: "global",
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

		expect(deleteChange.snapshot_content).toBe(null);
	}
);

test("working change set elements are separated per version", async () => {
	const lix = await openLix({});

	// Get the initial main version
	const mainVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Make changes in the main version context
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "main_version_key",
			value: "main_version_value",
			lixcol_version_id: mainVersion.id,
		})
		.execute();

	// Create a new change set, commit and version
	await lix.db
		.insertInto("change_set_all")
		.values([
			{ id: "new_cs", lixcol_version_id: "global" },
			{ id: "new_working_cs", lixcol_version_id: "global" },
		])
		.execute();

	// Create a commit that points to the change set
	await lix.db
		.insertInto("commit_all")
		.values({
			id: "new_commit",
			change_set_id: "new_cs",
			lixcol_version_id: "global",
		})
		.execute();

	await lix.db
		.insertInto("version")
		.values({
			id: "new_version",
			name: "new_version",
			commit_id: "new_commit",
			working_change_set_id: "new_working_cs",
			inherits_from_version_id: "global",
		})
		.execute();

	// Switch to the new version and make changes
	await lix.db
		.updateTable("active_version")
		.set({ version_id: "new_version" })
		.execute();

	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "new_version_key",
			value: "new_version_value",
			lixcol_version_id: "new_version",
		})
		.execute();

	// Check main version's working change set elements
	const mainWorkingElements = await lix.db
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", mainVersion.working_change_set_id)
		.where("lixcol_version_id", "=", mainVersion.id)
		.where("entity_id", "=", "main_version_key")
		.selectAll()
		.execute();

	// Check new version's working change set elements
	const newWorkingElements = await lix.db
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", "new_working_cs")
		.where("lixcol_version_id", "=", "new_version")
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
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", mainVersion.working_change_set_id)
		.where("lixcol_version_id", "=", mainVersion.id)
		.where("entity_id", "=", "new_version_key")
		.selectAll()
		.execute();

	// New working change set should not contain main version changes
	const newCrossCheck = await lix.db
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", "new_working_cs")
		.where("lixcol_version_id", "=", "new_version")
		.where("entity_id", "=", "main_version_key")
		.selectAll()
		.execute();

	expect(mainCrossCheck).toHaveLength(0);
	expect(newCrossCheck).toHaveLength(0);
});

test("creates change_author records for insert, update, and delete operations", async () => {
	const lix = await openLix({});

	// Create test accounts
	await lix.db
		.insertInto("account")
		.values([
			{ id: "test-account-1", name: "Test User 1" },
			{ id: "test-account-2", name: "Test User 2" },
		])
		.execute();

	// Switch to single active account for insert
	await switchAccount({
		lix,
		to: [{ id: "test-account-1", name: "Test User 1" }],
	});

	// INSERT: Create initial entity
	await lix.db
		.insertInto("key_value")
		.values({
			key: "crud_test_key",
			value: "initial_value",
		})
		.execute();

	// Switch to multiple active accounts for update
	await switchAccount({
		lix,
		to: [
			{ id: "test-account-1", name: "Test User 1" },
			{ id: "test-account-2", name: "Test User 2" },
		],
	});

	// UPDATE: Modify the entity
	await lix.db
		.updateTable("key_value")
		.where("key", "=", "crud_test_key")
		.set({ value: "updated_value" })
		.execute();

	// Switch back to single account for delete
	await switchAccount({
		lix,
		to: [{ id: "test-account-2", name: "Test User 2" }],
	});

	// DELETE: Remove the entity
	await lix.db
		.deleteFrom("key_value")
		.where("key", "=", "crud_test_key")
		.execute();

	// Get all changes for this entity
	const changes = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "crud_test_key")
		.where("schema_key", "=", "lix_key_value")
		.orderBy("created_at", "asc")
		.select(["id"])
		.execute();

	expect(changes).toHaveLength(3); // Insert + Update + Delete

	const insertChangeId = changes[0]!.id;
	const updateChangeId = changes[1]!.id;
	const deleteChangeId = changes[2]!.id;

	// Verify change_author records for INSERT (single account)
	const insertAuthors = await lix.db
		.selectFrom("change_author")
		.where("change_id", "=", insertChangeId)
		.selectAll()
		.execute();

	expect(insertAuthors).toHaveLength(1);
	expect(insertAuthors[0]).toMatchObject({
		change_id: insertChangeId,
		account_id: "test-account-1",
	});

	// Verify change_author records for UPDATE (multiple accounts)
	const updateAuthors = await lix.db
		.selectFrom("change_author")
		.where("change_id", "=", updateChangeId)
		.selectAll()
		.execute();

	expect(updateAuthors).toHaveLength(2);

	// Check that both accounts are represented
	const updateAccountIds = updateAuthors.map((author) => author.account_id);
	expect(updateAccountIds).toContain("test-account-1");
	expect(updateAccountIds).toContain("test-account-2");

	// Check that all records have the correct change_id
	updateAuthors.forEach((author) => {
		expect(author).toMatchObject({
			change_id: updateChangeId,
		});
	});

	// Verify change_author records for DELETE (single account)
	const deleteAuthors = await lix.db
		.selectFrom("change_author")
		.where("change_id", "=", deleteChangeId)
		.selectAll()
		.execute();

	expect(deleteAuthors).toHaveLength(1);
	expect(deleteAuthors[0]).toMatchObject({
		change_id: deleteChangeId,
		account_id: "test-account-2",
	});
});
