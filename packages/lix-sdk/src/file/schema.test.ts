import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createVersion } from "../version/create-version.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";

test("insert, update, delete on the file view", async () => {
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	const version0 = await createVersion({
		lix,
		id: "version0",
	});

	const version1 = await createVersion({
		lix,
		id: "version1",
	});

	await lix.db
		.insertInto("file")
		.values([
			{
				id: "file0",
				path: "/path/to/file.txt",
				data: new TextEncoder().encode(
					JSON.stringify({
						prop0: "file0-value0",
					})
				),
				version_id: version0.id,
			},
			{
				id: "file1",
				path: "/path/to/file.txt",
				data: new TextEncoder().encode(
					JSON.stringify({
						prop0: "file1-value0",
					})
				),
				version_id: version1.id,
			},
		])
		.execute();

	let viewAfterInsert = await lix.db.selectFrom("file").selectAll().execute();
	viewAfterInsert = viewAfterInsert.map((row) => ({
		...row,
		data: JSON.parse(new TextDecoder().decode(row.data)),
	}));

	expect(viewAfterInsert).toEqual([
		{
			id: "file0",
			path: "/path/to/file.txt",
			version_id: "version0",
			data: { prop0: "file0-value0" },
			metadata: null,
		},
		{
			id: "file1",
			path: "/path/to/file.txt",
			version_id: "version1",
			data: { prop0: "file1-value0" },
			metadata: null,
		},
	]);

	await lix.db
		.updateTable("file")
		.where("id", "=", "file0")
		.where("version_id", "=", "version0")
		.set({
			path: "/path/to/renamed_file.txt",
			data: new TextEncoder().encode(JSON.stringify({ prop0: "file0-value1" })),
		})
		.execute();

	let viewAfterUpdate = await lix.db
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
			data: { prop0: "file0-value1" },
			metadata: null,
		},
		{
			id: "file1",
			path: "/path/to/file.txt",
			version_id: "version1",
			data: { prop0: "file1-value0" },
			metadata: null,
		},
	]);

	await lix.db
		.deleteFrom("file")
		.where("id", "=", "file0")
		.where("version_id", "=", "version0")
		.execute();

	const viewAfterDelete = await lix.db
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

test("file insert data materialization", async () => {
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	const version0 = await createVersion({
		lix,
		id: "version0",
	});

	await lix.db
		.insertInto("file")
		.values({
			id: "file0",
			path: "/path/to/file.txt",
			data: new TextEncoder().encode(
				JSON.stringify({
					prop0: "file0-value0",
				})
			),
			version_id: version0.id,
		})
		.execute();

	let viewAfterInsert = await lix.db.selectFrom("file").selectAll().execute();
	viewAfterInsert = viewAfterInsert.map((row) => ({
		...row,
		data: JSON.parse(new TextDecoder().decode(row.data)),
	}));

	expect(viewAfterInsert).toEqual([
		{
			id: "file0",
			path: "/path/to/file.txt",
			version_id: "version0",
			data: { prop0: "file0-value0" },
			metadata: null,
		},
	]);
});
