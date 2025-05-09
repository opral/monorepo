import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";

test("insert, update, delete on the change set view", async () => {
	const lix = await openLixInMemory({});

	const initial = await lix.db.selectFrom("change_set").selectAll().execute();

	expect(initial).toHaveLength(0);

	await lix.db
		.insertInto("change_set")
		.values([{ id: "cs0" }, { id: "cs1" }])
		.execute();

	const viewAfterInsert = await lix.db
		.selectFrom("change_set")
		.orderBy("id", "asc")
		.selectAll()
		.execute();

	expect(viewAfterInsert).toEqual([
		{
			id: "cs0",
			metadata: null,
		},
		{
			id: "cs1",
			metadata: null,
		},
	]);

	await lix.db
		.updateTable("change_set")
		.where("id", "=", "cs0")
		.set({ metadata: JSON.stringify({ foo: "bar" }) })
		.execute();

	const viewAfterUpdate = await lix.db
		.selectFrom("change_set")
		.orderBy("id", "asc")
		.selectAll()
		.execute();

	expect(viewAfterUpdate).toEqual([
		{
			id: "cs0",
			metadata: { foo: "bar" },
		},
		{
			id: "cs1",
			metadata: null,
		},
	]);

	await lix.db.deleteFrom("change_set").where("id", "=", "cs0").execute();

	const viewAfterDelete = await lix.db
		.selectFrom("change_set")
		.orderBy("id", "asc")
		.selectAll()
		.execute();

	expect(viewAfterDelete).toEqual([
		{
			id: "cs1",
			metadata: null,
		},
	]);

	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.where("schema_key", "=", "lix_change_set")
		.orderBy("change.created_at", "asc")
		.selectAll("change")
		.select("snapshot.content")
		.execute();

	expect(changes.map((change) => change.content)).toEqual([
		// insert
		{
			id: "cs0",
			metadata: null,
		},
		// insert
		{
			id: "cs1",
			metadata: null,
		},
		// update
		{
			id: "cs0",
			metadata: { foo: "bar" },
		},
		// delete
		null,
	]);
});
