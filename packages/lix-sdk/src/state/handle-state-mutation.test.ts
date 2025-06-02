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

