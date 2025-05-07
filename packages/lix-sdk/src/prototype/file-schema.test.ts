import { test, expect } from "vitest";
import { initPrototypeDb } from "./database-schema.js";

test("insert, update, delete on the file view", async () => {
	const db = await initPrototypeDb();

	await db
		.insertInto("file")
		.values([
			{
				id: "file0",
				path: "/path/to/file.txt",
				version_id: "version0",
			},
			{
				id: "file1",
				path: "/path/to/file.txt",
				version_id: "version1",
			},
		])
		.execute();

	const viewAfterInsert = await db.selectFrom("file").selectAll().execute();

	expect(viewAfterInsert).toMatchObject([
		{
			id: "file0",
			path: "/path/to/file.txt",
			version_id: "version0",
		},
		{
			id: "file1",
			path: "/path/to/file.txt",
			version_id: "version1",
		},
	]);

	await db
		.updateTable("file")
		.where("id", "=", "file0")
		.where("version_id", "=", "version0")
		.set({ path: "/path/to/renamed_file.txt" })
		.execute();

	const viewAfterUpdate = await db
		.selectFrom("file")
		.orderBy("id")
		.selectAll()
		.execute();

	expect(viewAfterUpdate).toMatchObject([
		{
			id: "file0",
			path: "/path/to/renamed_file.txt",
			version_id: "version0",
		},
		{
			id: "file1",
			path: "/path/to/file.txt",
			version_id: "version1",
		},
	]);

	await db
		.deleteFrom("file")
		.where("id", "=", "file0")
		.where("version_id", "=", "version0")
		.execute();

	const viewAfterDelete = await db
		.selectFrom("file")
		.orderBy("id")
		.selectAll()
		.execute();

	expect(viewAfterDelete).toEqual([
		{
			id: "file1",
			path: "/path/to/file.txt",
			version_id: "version1",
		},
	]);

	const changes = await db
		.selectFrom("change")
		.select(["entity_id", "snapshot_id"])
		.execute();

	expect(changes).toEqual([
		// insert
		{ entity_id: "file0", snapshot_id: expect.any(String) },
		// insert
		{ entity_id: "file1", snapshot_id: expect.any(String) },
		// update
		{ entity_id: "file0", snapshot_id: expect.any(String) },
		// delete
		{ entity_id: "file0", snapshot_id: "no-content" },
	]);
});
