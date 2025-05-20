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


	const stateBeforeInsert = await lix.db
		.selectFrom("state")
		.selectAll()
		.execute();

	const leafChangeIdsBeforeInsert = JSON.parse(
		(stateBeforeInsert[0].leaf_change_ids ?? "[]") as string
	);

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

	const stateAfterInsert = await lix.db
		.selectFrom("state")
		.selectAll()
		.limit(1)
		.execute();

	const leafChangeIdsAfterInsert = JSON.parse(
		(stateAfterInsert[0].leaf_change_ids ?? "[]") as string
	);

	const diff = leafChangeIdsAfterInsert.filter(
		(changeId) => !leafChangeIdsBeforeInsert.includes(changeId)
	);

	const leafChangesAfterInsert = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.where("change.id", "in", diff)
		.selectAll("change")
		.select("snapshot.content")
		.execute();

	console.log("DIFF insert", leafChangesAfterInsert);

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

	const stateAfterUpdate = await lix.db
		.selectFrom("state")
		.selectAll()
		.limit(1)
		.execute();

	const leafChangeIdsAfterUpdate = JSON.parse(
		(stateAfterUpdate[0].leaf_change_ids ?? "[]") as string
	);

	const diffUpdate = leafChangeIdsAfterUpdate.filter(
		(changeId) => !leafChangeIdsAfterInsert.includes(changeId)
	);

	const leafChangesAfterUpdate = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.where("change.id", "in", diffUpdate)
		.selectAll("change")
		.select("snapshot.content")
		.execute();

	console.log("DIFF update", leafChangesAfterUpdate);

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
		.selectAll()
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
		] satisfies ChangeSetEdge[])
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

test("creates all changes necessary to reconstruct the state after a mutation", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("key_value")
		.values({
			key: "mock_key",
			value: "mock_value",
		})
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	const changeSetElements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", activeVersion.change_set_id)
		.innerJoin("change", "change.id", "change_set_element.change_id")
		.select("change.schema_key")
		.orderBy("change.schema_key", "asc")
		.execute();

	expect(changeSetElements).toEqual([
		// the new change set for the version
		{ schema_key: "lix_change_set" },
		// the edge from the old to new change set
		{ schema_key: "lix_change_set_edge" },
		// the change itself
		{ schema_key: "lix_key_value" },
		// the change set id update on the active version
		{ schema_key: "lix_version" },
	]);
});
