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

	await lix.db
		.insertInto("file")
		.values([
			{
				id: "file0",
				path: "/path/to/file.json",
				data: new TextEncoder().encode(
					JSON.stringify({
						prop0: "file0-value0",
					})
				),
				version_id: version0.id,
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
			path: "/path/to/file.json",
			version_id: "version0",
			data: { prop0: "file0-value0" },
			metadata: null,
		},
	]);

	await lix.db
		.updateTable("file")
		.where("id", "=", "file0")
		.where("version_id", "=", "version0")
		.set({
			path: "/path/to/renamed_file.json",
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
			path: "/path/to/renamed_file.json",
			version_id: "version0",
			data: { prop0: "file0-value1" },
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

	expect(viewAfterDelete).toEqual([]);

	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.where("change.file_id", "in", ["file0", "file1"])
		.select(["entity_id", "snapshot_id", "snapshot.content", "schema_key"])
		.execute();

	expect(changes).toMatchObject([
		// insert
		{
			schema_key: "lix_file",
			entity_id: "file0",
			snapshot_id: expect.any(String),
			content: expect.any(Object),
		},
		{
			schema_key: "mock_json_property",
			entity_id: "prop0",
			content: {
				value: "file0-value0",
			},
			snapshot_id: expect.any(String),
		},
		// update
		{
			schema_key: "lix_file",
			entity_id: "file0",
			snapshot_id: expect.any(String),
			content: expect.any(Object),
		},
		{
			schema_key: "mock_json_property",
			entity_id: "prop0",
			content: {
				value: "file0-value1",
			},
			snapshot_id: expect.any(String),
		},
		// delete (file‑level)
		{
			schema_key: "lix_file",
			entity_id: "file0",
			snapshot_id: "no-content",
			content: null,
		},
		// delete (all plugin entities that existed in the file)
		{
			schema_key: "mock_json_property",
			entity_id: "prop0",
			snapshot_id: "no-content",
			content: null,
		},
	]);
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
			path: "/path/to/file.json",
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
			path: "/path/to/file.json",
			version_id: "version0",
			data: { prop0: "file0-value0" },
			metadata: null,
		},
	]);
});

test("file ids should have a default", async () => {
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
			path: "/mock.json",
			data: new Uint8Array(),
			version_id: version0.id,
		})
		.execute();

	const file = await lix.db
		.selectFrom("file")
		.where("path", "=", "/mock.json")
		.where("version_id", "=", version0.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(file.id).toBeDefined();
});

test("files should be able to have metadata", async () => {
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
			path: "/mock.json",
			data: new Uint8Array(),
			metadata: {
				primary_key: "email",
			},
			version_id: version0.id,
		})
		.execute();

	const file = await lix.db
		.selectFrom("file")
		.where("path", "=", "/mock.json")
		.where("version_id", "=", version0.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(file.metadata?.primary_key).toBe("email");

	const updatedFile = await lix.db
		.updateTable("file")
		.where("path", "=", "/mock.json")
		.where("version_id", "=", version0.id)
		.set({
			metadata: {
				primary_key: "something-else",
			},
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(updatedFile.metadata?.primary_key).toBe("something-else");
});

test("invalid file paths should be rejected", async () => {
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	const version0 = await createVersion({
		lix,
		id: "version0",
	});

	await expect(
		lix.db
			.insertInto("file")
			.values({
				path: "invalid-path",
				data: new Uint8Array(),
				version_id: version0.id,
			})
			.execute()
	).rejects.toThrowError("path must match pattern");
});

test("file operations are version specific and isolated", async () => {
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	const versionA = await createVersion({
		lix,
		id: "versionA",
	});

	const versionB = await createVersion({
		lix,
		id: "versionB",
	});

	// Insert file in version A
	await lix.db
		.insertInto("file")
		.values({
			id: "fileA",
			path: "/shared/file.json",
			data: new TextEncoder().encode(JSON.stringify({ content: "versionA" })),
			version_id: versionA.id,
		})
		.execute();

	// Insert file in version B with same path but different content
	await lix.db
		.insertInto("file")
		.values({
			id: "fileB",
			path: "/shared/file.json",
			data: new TextEncoder().encode(JSON.stringify({ content: "versionB" })),
			version_id: versionB.id,
		})
		.execute();

	// Verify both versions have their own files
	const filesInVersionA = await lix.db
		.selectFrom("file")
		.where("version_id", "=", versionA.id)
		.selectAll()
		.execute();

	const filesInVersionB = await lix.db
		.selectFrom("file")
		.where("version_id", "=", versionB.id)
		.selectAll()
		.execute();

	expect(filesInVersionA).toHaveLength(1);
	expect(filesInVersionB).toHaveLength(1);
	expect(
		JSON.parse(new TextDecoder().decode(filesInVersionA[0]?.data))
	).toEqual({ content: "versionA" });
	expect(
		JSON.parse(new TextDecoder().decode(filesInVersionB[0]?.data))
	).toEqual({ content: "versionB" });

	// Update file in version A
	await lix.db
		.updateTable("file")
		.where("id", "=", "fileA")
		.where("version_id", "=", versionA.id)
		.set({
			data: new TextEncoder().encode(
				JSON.stringify({ content: "versionA-updated" })
			),
		})
		.execute();

	// Verify update only affected version A
	const updatedFilesA = await lix.db
		.selectFrom("file")
		.where("version_id", "=", versionA.id)
		.selectAll()
		.execute();

	const unchangedFilesB = await lix.db
		.selectFrom("file")
		.where("version_id", "=", versionB.id)
		.selectAll()
		.execute();

	expect(JSON.parse(new TextDecoder().decode(updatedFilesA[0]?.data))).toEqual({
		content: "versionA-updated",
	});
	expect(
		JSON.parse(new TextDecoder().decode(unchangedFilesB[0]?.data))
	).toEqual({ content: "versionB" });

	// Delete file from version A
	await lix.db
		.deleteFrom("file")
		.where("id", "=", "fileA")
		.where("version_id", "=", versionA.id)
		.execute();

	// Verify deletion only affected version A
	const remainingFilesA = await lix.db
		.selectFrom("file")
		.where("version_id", "=", versionA.id)
		.selectAll()
		.execute();

	const remainingFilesB = await lix.db
		.selectFrom("file")
		.where("version_id", "=", versionB.id)
		.selectAll()
		.execute();

	expect(remainingFilesA).toHaveLength(0);
	expect(remainingFilesB).toHaveLength(1);
	expect(
		JSON.parse(new TextDecoder().decode(remainingFilesB[0]?.data))
	).toEqual({ content: "versionB" });
});

