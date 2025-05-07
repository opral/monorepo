import { expect, test } from "vitest";
import { initPrototypeDb } from "./database-schema.js";

test("insert, update, delete on the version view", async () => {
	const db = await initPrototypeDb();

	const initial = await db.selectFrom("version").selectAll().execute();

	expect(initial).toHaveLength(0);

	await db
		.insertInto("version")
		.values([
			{ id: "peter", name: "version0", change_set_id: "change_set_id_0" },
			{ id: "paul", name: "version1", change_set_id: "change_set_id_1" },
		])
		.execute();

	const viewAfterInsert = await db
		.selectFrom("version")
		.orderBy("name", "asc")
		.selectAll()
		.execute();

	expect(viewAfterInsert).toMatchObject([
		{
			name: "version0",
			change_set_id: "change_set_id_0",
		},
		{
			name: "version1",
			change_set_id: "change_set_id_1",
		},
	]);

	await db
		.updateTable("version")
		.where("name", "=", "version0")
		.set({ change_set_id: "change_set_id_1" })
		.execute();

	const viewAfterUpdate = await db
		.selectFrom("version")
		.orderBy("name", "asc")
		.selectAll()
		.execute();

	expect(viewAfterUpdate).toMatchObject([
		{
			name: "version0",
			change_set_id: "change_set_id_1",
		},
		{
			name: "version1",
			change_set_id: "change_set_id_1",
		},
	]);

	await db.deleteFrom("version").where("name", "=", "version0").execute();

	const viewAfterDelete = await db
		.selectFrom("version")
		.orderBy("name", "asc")
		.selectAll()
		.execute();

	expect(viewAfterDelete).toMatchObject([
		{
			name: "version1",
			change_set_id: "change_set_id_1",
		},
	]);

	const changes = await db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.where("schema_key", "=", "lix_version_table")
		.orderBy("change.created_at", "asc")
		.selectAll("change")
		.select("snapshot.content")
		.execute();

	expect(changes.map((change) => change.content)).toMatchObject([
		// version 0's insert
		{
			name: "version0",
			change_set_id: "change_set_id_0",
		},
		// version 0's insert
		{
			name: "version1",
			change_set_id: "change_set_id_1",
		},
		{
			// version 0's update
			name: "version0",
			change_set_id: "change_set_id_1",
		},
		// version 0's delete
		null,
	]);
});

test("querying by id", async () => {
	const db = await initPrototypeDb();

	await db
		.insertInto("version")
		.values([
			{
				id: "version0",
				name: "version0",
				change_set_id: "change_set_id_0",
			},
			{
				id: "version1",
				name: "version1",
				change_set_id: "change_set_id_1",
			},
		])
		.execute();

	const versions = await db
		.selectFrom("version")
		.where("id", "=", "version0")
		.select("id")
		.execute();

	expect(versions).toHaveLength(1);
	expect(versions[0]?.id).toBe("version0");
});
