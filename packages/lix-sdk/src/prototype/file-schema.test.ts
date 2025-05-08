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
				data: new TextEncoder().encode(
					JSON.stringify({
						value: "file0-value0",
					})
				),
				version_id: "version0",
			},
			{
				id: "file1",
				path: "/path/to/file.txt",
				data: new TextEncoder().encode(
					JSON.stringify({
						value: "file1-value0",
					})
				),
				version_id: "version1",
			},
		])
		.execute();

	let viewAfterInsert = await db.selectFrom("file").selectAll().execute();
	viewAfterInsert = viewAfterInsert.map((row) => ({
		...row,
		data: JSON.parse(new TextDecoder().decode(row.data)),
	}));

	expect(viewAfterInsert).toEqual([
		{
			id: "file0",
			path: "/path/to/file.txt",
			version_id: "version0",
			data: { value: "file0-value0" },
		},
		{
			id: "file1",
			path: "/path/to/file.txt",
			version_id: "version1",
			data: { value: "file1-value0" },
		},
	]);

	await db
		.updateTable("file")
		.where("id", "=", "file0")
		.where("version_id", "=", "version0")
		.set({
			path: "/path/to/renamed_file.txt",
			data: new TextEncoder().encode(JSON.stringify({ value: "file0-value1" })),
		})
		.execute();

	let viewAfterUpdate = await db
		.selectFrom("file")
		.orderBy("id")
		.selectAll()
		.execute();

	viewAfterUpdate = viewAfterUpdate.map((row) => ({
		...row,
		data: JSON.parse(new TextDecoder().decode(row.data)),
	}));

	expect(viewAfterUpdate).toEqual([
		{
			id: "file0",
			path: "/path/to/renamed_file.txt",
			version_id: "version0",
			data: { value: "file0-value1" },
		},
		{
			id: "file1",
			path: "/path/to/file.txt",
			version_id: "version1",
			data: { value: "file1-value0" },
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
		.select(["id", "path", "version_id"])
		.execute();

	expect(viewAfterDelete).toEqual([
		{
			id: "file1",
			path: "/path/to/file.txt",
			version_id: "version1",
		},
	]);

	// const changes = await db
	// 	.selectFrom("change")
	// 	.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
	// 	.select(["entity_id", "snapshot_id", "snapshot.content", "schema_key"])
	// 	.execute();

	// expect(changes).toMatchObject([
	// 	// insert
	// 	{
	// 		schema_key: "lix_file_table",
	// 		entity_id: "file0",
	// 		snapshot_id: expect.any(String),
	// 		content: expect.any(Object),
	// 	},
	// 	{
	// 		schema_key: "mock_json_property",
	// 		entity_id: "value",
	// 		content: {
	// 			value: "file0-value0",
	// 		},
	// 		snapshot_id: expect.any(String),
	// 	},
	// 	// insert
	// 	{
	// 		schema_key: "lix_file_table",
	// 		entity_id: "file1",
	// 		snapshot_id: expect.any(String),
	// 		content: expect.any(Object),
	// 	},
	// 	{
	// 		schema_key: "mock_json_property",
	// 		entity_id: "value",
	// 		content: {
	// 			value: "file1-value0",
	// 		},
	// 		snapshot_id: expect.any(String),
	// 	},
	// 	// update
	// 	{
	// 		schema_key: "lix_file_table",
	// 		entity_id: "file0",
	// 		snapshot_id: expect.any(String),
	// 		content: expect.any(Object),
	// 	},
	// 	// delete
	// 	{
	// 		schema_key: "lix_file_table",
	// 		entity_id: "file0",
	// 		snapshot_id: "no-content",
	// 		content: expect.any(Object),
	// 	},
	// ]);
});
