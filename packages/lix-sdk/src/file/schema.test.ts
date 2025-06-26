import { test, expect, expectTypeOf } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createVersion } from "../version/create-version.js";
import { createCheckpoint } from "../change-set/create-checkpoint.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";
import type { LixFile } from "./schema.js";

test("insert, update, delete on the file view", async () => {
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
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
			lixcol_inherited_from_version_id: null,
			lixcol_created_at: expect.any(String),
			lixcol_updated_at: expect.any(String),
			lixcol_change_id: expect.any(String),
			data: { prop0: "file0-value0" },
			metadata: null,
		},
	]);

	await lix.db
		.updateTable("file")
		.where("id", "=", "file0")
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
			lixcol_inherited_from_version_id: null,
			lixcol_created_at: expect.any(String),
			lixcol_updated_at: expect.any(String),
			lixcol_change_id: expect.any(String),
			data: { prop0: "file0-value1" },
			metadata: null,
		},
	]);

	await lix.db.deleteFrom("file").where("id", "=", "file0").execute();

	const viewAfterDelete = await lix.db
		.selectFrom("file")
		.orderBy("id")
		.select(["id", "path"])
		.execute();

	expect(viewAfterDelete).toEqual([]);

	const changes = await lix.db
		.selectFrom("change")
		.where("file_id", "in", ["file0", "file1"])
		.select(["entity_id", "snapshot_content", "schema_key"])
		.execute();

	expect(changes).toEqual(
		expect.arrayContaining([
			// insert
			expect.objectContaining({
				schema_key: "lix_file",
				entity_id: "file0",
				snapshot_content: expect.any(Object),
			}),
			expect.objectContaining({
				schema_key: "mock_json_property",
				entity_id: "prop0",
				snapshot_content: {
					value: "file0-value0",
				},
			}),
			// update
			expect.objectContaining({
				schema_key: "lix_file",
				entity_id: "file0",
				snapshot_content: expect.any(Object),
			}),
			expect.objectContaining({
				schema_key: "mock_json_property",
				entity_id: "prop0",
				snapshot_content: {
					value: "file0-value1",
				},
			}),
			// delete (file‑level)
			expect.objectContaining({
				schema_key: "lix_file",
				entity_id: "file0",
				snapshot_content: null,
			}),
			// delete (all plugin entities that existed in the file)
			expect.objectContaining({
				schema_key: "mock_json_property",
				entity_id: "prop0",
				snapshot_content: null,
			}),
		])
	);
	expect(changes).toHaveLength(6);
});

test("file insert data materialization", async () => {
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
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
			lixcol_inherited_from_version_id: null,
			lixcol_created_at: expect.any(String),
			lixcol_updated_at: expect.any(String),
			lixcol_change_id: expect.any(String),
			data: { prop0: "file0-value0" },
			metadata: null,
		},
	]);
});

test("file ids should have a default", async () => {
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	await lix.db
		.insertInto("file")
		.values({
			path: "/mock.json",
			data: new Uint8Array(),
		})
		.execute();

	const file = await lix.db
		.selectFrom("file")
		.where("path", "=", "/mock.json")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(file.id).toBeDefined();
});

test("files should be able to have metadata", async () => {
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	await lix.db
		.insertInto("file")
		.values({
			path: "/mock.json",
			data: new Uint8Array(),
			metadata: {
				primary_key: "email",
			},
		})
		.execute();

	const file = await lix.db
		.selectFrom("file")
		.where("path", "=", "/mock.json")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(file.metadata?.primary_key).toBe("email");

	const updatedFile = await lix.db
		.updateTable("file")
		.where("path", "=", "/mock.json")
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

	await expect(
		lix.db
			.insertInto("file")
			.values({
				path: "invalid-path",
				data: new Uint8Array(),
			})
			.execute()
	).rejects.toThrowError("path must match pattern");
});

test("file_all operations are version specific and isolated", async () => {
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
		.insertInto("file_all")
		.values({
			id: "fileA",
			path: "/shared/file.json",
			data: new TextEncoder().encode(JSON.stringify({ content: "versionA" })),
			lixcol_version_id: versionA.id,
		})
		.execute();

	// Insert file in version B with same path but different content
	await lix.db
		.insertInto("file_all")
		.values({
			id: "fileB",
			path: "/shared/file.json",
			data: new TextEncoder().encode(JSON.stringify({ content: "versionB" })),
			lixcol_version_id: versionB.id,
		})
		.execute();

	// Verify both versions have their own files
	const filesInVersionA = await lix.db
		.selectFrom("file_all")
		.where("lixcol_version_id", "=", versionA.id)
		.selectAll()
		.execute();

	const filesInVersionB = await lix.db
		.selectFrom("file_all")
		.where("lixcol_version_id", "=", versionB.id)
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
		.updateTable("file_all")
		.where("id", "=", "fileA")
		.where("lixcol_version_id", "=", versionA.id)
		.set({
			data: new TextEncoder().encode(
				JSON.stringify({ content: "versionA-updated" })
			),
		})
		.execute();

	// Verify update only affected version A
	const updatedFilesA = await lix.db
		.selectFrom("file_all")
		.where("lixcol_version_id", "=", versionA.id)
		.selectAll()
		.execute();

	const unchangedFilesB = await lix.db
		.selectFrom("file_all")
		.where("lixcol_version_id", "=", versionB.id)
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
		.deleteFrom("file_all")
		.where("id", "=", "fileA")
		.where("lixcol_version_id", "=", versionA.id)
		.execute();

	// Verify deletion only affected version A
	const remainingFilesA = await lix.db
		.selectFrom("file_all")
		.where("lixcol_version_id", "=", versionA.id)
		.selectAll()
		.execute();

	const remainingFilesB = await lix.db
		.selectFrom("file_all")
		.where("lixcol_version_id", "=", versionB.id)
		.selectAll()
		.execute();

	expect(remainingFilesA).toHaveLength(0);
	expect(remainingFilesB).toHaveLength(1);
	expect(
		JSON.parse(new TextDecoder().decode(remainingFilesB[0]?.data))
	).toEqual({ content: "versionB" });
});

test("the plugin is the source of truth. the fallback plugin is not invoked if a plugin is configured for the file type", async () => {
	const mockTxtPlugin: LixPlugin = {
		key: "mock-txt",
		detectChanges: () => {
			return [];
		},
		applyChanges: () => ({ fileData: new Uint8Array() }),
		detectChangesGlob: "*.txt",
	};

	const lix = await openLixInMemory({
		providePlugins: [mockTxtPlugin],
	});

	await lix.db
		.insertInto("file")
		.values({
			id: "mock-file",
			path: "/mock.txt",
			data: new TextEncoder().encode("some content"),
		})
		.execute();

	const fileAfterInsert = await lix.db
		.selectFrom("file")
		.where("id", "=", "mock-file")
		.select("data")
		.executeTakeFirstOrThrow();

	expect(fileAfterInsert.data).toEqual(new Uint8Array());

	await lix.db
		.updateTable("file")
		.set({ data: new TextEncoder().encode("some other content") })
		.where("id", "=", "mock-file")
		.execute();

	const fileAfterUpdate = await lix.db
		.selectFrom("file")
		.where("id", "=", "mock-file")
		.select("data")
		.executeTakeFirstOrThrow();

	expect(fileAfterUpdate.data).toEqual(new Uint8Array());

	await lix.db.deleteFrom("file").where("id", "=", "mock-file").execute();

	const fileAfterDelete = await lix.db
		.selectFrom("file")
		.where("id", "=", "mock-file")
		.select("data")
		.executeTakeFirst();

	expect(fileAfterDelete).toBeUndefined();
});

test("file_history provides access to historical file data", async () => {
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	// 1. Insert file
	const initialData = { prop0: "initial-value" };
	await lix.db
		.insertInto("file")
		.values({
			id: "test-file",
			path: "/test.json",
			data: new TextEncoder().encode(JSON.stringify(initialData)),
		})
		.execute();

	// 2. Create checkpoint
	const checkpoint = await createCheckpoint({
		lix,
	});

	// 3. Update file
	const updatedData = { prop0: "updated-value" };
	await lix.db
		.updateTable("file")
		.where("id", "=", "test-file")
		.set({
			data: new TextEncoder().encode(JSON.stringify(updatedData)),
		})
		.execute();

	// 4. Query file, assert that file equals update
	const currentFile = await lix.db
		.selectFrom("file")
		.where("id", "=", "test-file")
		.selectAll()
		.executeTakeFirstOrThrow();

	const currentFileData = JSON.parse(
		new TextDecoder().decode(currentFile.data)
	);
	expect(currentFileData).toEqual(updatedData);

	// 5. Query history at checkpoint and assert is initial
	const historicalFiles = await lix.db
		.selectFrom("file_history")
		.where("id", "=", "test-file")
		.where("lixcol_change_set_id", "=", checkpoint.id)
		.where("lixcol_depth", "=", 0)
		.selectAll()
		.execute();

	expect(historicalFiles).toHaveLength(1);

	const historicalFile = historicalFiles[0]!;
	const historicalFileData = JSON.parse(
		new TextDecoder().decode(historicalFile.data)
	);

	expect(historicalFileData).toEqual(initialData);
	expect(historicalFile.id).toBe("test-file");
	expect(historicalFile.path).toBe("/test.json");

	// Verify historical file has the expected history columns
	expect(historicalFile.lixcol_change_set_id).toBe(checkpoint.id);
	expect(historicalFile.lixcol_depth).toBe(0);
	expect(historicalFile.lixcol_change_id).toBeDefined();
	expect(historicalFile.lixcol_file_id).toBeDefined();
	expect(historicalFile.lixcol_plugin_key).toBeDefined();
	expect(historicalFile.lixcol_schema_version).toBeDefined();
});

// its super annoying to work with metadata otherwise
test("file metadata is Record<string, any>", async () => {
	const mockFile: LixFile = {
		id: "test-file",
		path: "/test.json",
		data: new TextEncoder().encode(JSON.stringify({ prop0: "value0" })),
		metadata: {
			author: "test-user",
			created_at: new Date().toISOString(),
		},
	};

	expectTypeOf(mockFile.metadata).toEqualTypeOf<
		Record<string, any> | null | undefined
	>();
});

test("file and file_all views expose change_id for blame and diff functionality", async () => {
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	// Insert initial file using file view to ensure triggers are executed
	await lix.db
		.insertInto("file")
		.values({
			id: "change-id-test-file",
			path: "/test-change-id.json",
			data: new TextEncoder().encode(JSON.stringify({ prop: "initial value" })),
		})
		.execute();

	// Query file_all view to verify change_id is exposed
	const fileAllResult = await lix.db
		.selectFrom("file_all")
		.where("id", "=", "change-id-test-file")
		.selectAll()
		.execute();

	expect(fileAllResult).toHaveLength(1);
	expect(fileAllResult[0]?.lixcol_change_id).toBeDefined();
	expect(typeof fileAllResult[0]?.lixcol_change_id).toBe("string");

	// Query file view (filtered by active version) to verify change_id is exposed
	const fileResult = await lix.db
		.selectFrom("file")
		.where("id", "=", "change-id-test-file")
		.selectAll()
		.execute();

	expect(fileResult).toHaveLength(1);
	expect(fileResult[0]?.lixcol_change_id).toBeDefined();
	expect(typeof fileResult[0]?.lixcol_change_id).toBe("string");

	// Verify that change_id matches between file and file_all views
	expect(fileResult[0]?.lixcol_change_id).toBe(
		fileAllResult[0]?.lixcol_change_id
	);

	// Get the actual file entity change record to verify the change_id is correct
	const fileChangeRecord = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "change-id-test-file")
		.where("schema_key", "=", "lix_file")
		.select(["id", "snapshot_content"])
		.executeTakeFirstOrThrow();

	// Verify that the change_id in the views matches the actual file change.id
	expect(fileResult[0]?.lixcol_change_id).toBe(fileChangeRecord.id);
	expect(fileAllResult[0]?.lixcol_change_id).toBe(fileChangeRecord.id);

	// Verify that the snapshot content in the change matches the file view
	expect(fileChangeRecord.snapshot_content).toMatchObject({
		id: "change-id-test-file",
		path: "/test-change-id.json",
	});
	expect(fileResult[0]?.id).toBe("change-id-test-file");
	expect(fileResult[0]?.path).toBe("/test-change-id.json");

	// Update the file to create a new change
	await lix.db
		.updateTable("file")
		.set({
			path: "/test-change-id-updated.json",
			data: new TextEncoder().encode(JSON.stringify({ prop: "updated value" })),
		})
		.where("id", "=", "change-id-test-file")
		.execute();

	// Query again to verify change_id updated after modification
	const updatedFileResult = await lix.db
		.selectFrom("file_all")
		.where("id", "=", "change-id-test-file")
		.selectAll()
		.execute();

	expect(updatedFileResult).toHaveLength(1);
	expect(updatedFileResult[0]?.lixcol_change_id).toBeDefined();
	// The change_id should be different after the update (new change created)
	expect(updatedFileResult[0]?.lixcol_change_id).not.toBe(
		fileResult[0]?.lixcol_change_id
	);

	// Get the new file entity change record
	const newFileChangeRecord = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "change-id-test-file")
		.where("schema_key", "=", "lix_file")
		.orderBy("created_at", "desc")
		.select(["id", "snapshot_content"])
		.executeTakeFirstOrThrow();

	// Verify the new change_id matches the latest file change
	expect(updatedFileResult[0]?.lixcol_change_id).toBe(newFileChangeRecord.id);

	// Verify that the updated snapshot content in the change matches the file view
	expect(newFileChangeRecord.snapshot_content).toMatchObject({
		id: "change-id-test-file",
		path: "/test-change-id-updated.json",
	});
	expect(updatedFileResult[0]?.path).toBe("/test-change-id-updated.json");
});

test("file data updates create new change_id", async () => {
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	// Insert initial file
	await lix.db
		.insertInto("file")
		.values({
			id: "data-change-test",
			path: "/data-test.json",
			data: new TextEncoder().encode(JSON.stringify({ content: "initial" })),
		})
		.execute();

	// Get initial change_id
	const initialFile = await lix.db
		.selectFrom("file")
		.where("id", "=", "data-change-test")
		.select(["lixcol_change_id"])
		.executeTakeFirstOrThrow();

	expect(initialFile.lixcol_change_id).toBeDefined();

	// Update only the file data
	await lix.db
		.updateTable("file")
		.set({
			data: new TextEncoder().encode(
				JSON.stringify({ content: "updated data" })
			),
		})
		.where("id", "=", "data-change-test")
		.execute();

	// Get updated change_id
	const updatedFile = await lix.db
		.selectFrom("file")
		.where("id", "=", "data-change-test")
		.select(["lixcol_change_id"])
		.executeTakeFirstOrThrow();

	// Verify that updating file data created a new change_id
	expect(updatedFile.lixcol_change_id).toBeDefined();
	expect(updatedFile.lixcol_change_id).not.toBe(initialFile.lixcol_change_id);

	// Verify the change record exists - this should be for the content entity, not the file entity
	// When file data changes, it creates changes for the plugin-managed entities within the file
	const contentChangeRecord = await lix.db
		.selectFrom("change")
		.where("file_id", "=", "data-change-test")
		.where("schema_key", "=", "mock_json_property")
		.where("entity_id", "=", "content")
		.orderBy("created_at", "desc")
		.select(["id", "entity_id", "schema_key", "snapshot_content"])
		.executeTakeFirst();

	expect(contentChangeRecord).toBeDefined();
	expect(contentChangeRecord?.entity_id).toBe("content");
	expect(contentChangeRecord?.schema_key).toBe("mock_json_property");
	expect(contentChangeRecord?.snapshot_content).toEqual({
		value: "updated data",
	});
});

test("file metadata updates create new change_id", async () => {
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	// Insert initial file with metadata
	await lix.db
		.insertInto("file")
		.values({
			id: "metadata-change-test",
			path: "/metadata-test.json",
			data: new TextEncoder().encode(JSON.stringify({ content: "test" })),
			metadata: { author: "initial author" },
		})
		.execute();

	// Get initial change_id
	const initialFile = await lix.db
		.selectFrom("file")
		.where("id", "=", "metadata-change-test")
		.select(["lixcol_change_id", "path", "metadata"])
		.executeTakeFirstOrThrow();

	expect(initialFile.lixcol_change_id).toBeDefined();
	expect(initialFile.path).toBe("/metadata-test.json");
	expect(initialFile.metadata).toEqual({ author: "initial author" });

	// Update the file path (which is part of the file entity metadata)
	await lix.db
		.updateTable("file")
		.set({
			path: "/updated-metadata-test.json",
		})
		.where("id", "=", "metadata-change-test")
		.execute();

	// Get updated change_id after path change
	const updatedPathFile = await lix.db
		.selectFrom("file")
		.where("id", "=", "metadata-change-test")
		.select(["lixcol_change_id", "path"])
		.executeTakeFirstOrThrow();

	// Verify that updating file path created a new change_id
	expect(updatedPathFile.lixcol_change_id).toBeDefined();
	expect(updatedPathFile.lixcol_change_id).not.toBe(
		initialFile.lixcol_change_id
	);
	expect(updatedPathFile.path).toBe("/updated-metadata-test.json");

	// Update the file metadata
	await lix.db
		.updateTable("file")
		.set({
			metadata: { author: "updated author", version: "2.0" },
		})
		.where("id", "=", "metadata-change-test")
		.execute();

	// Get updated change_id after metadata change
	const updatedMetadataFile = await lix.db
		.selectFrom("file")
		.where("id", "=", "metadata-change-test")
		.select(["lixcol_change_id", "metadata"])
		.executeTakeFirstOrThrow();

	// Verify that updating file metadata created another new change_id
	expect(updatedMetadataFile.lixcol_change_id).toBeDefined();
	expect(updatedMetadataFile.lixcol_change_id).not.toBe(
		updatedPathFile.lixcol_change_id
	);
	expect(updatedMetadataFile.metadata).toEqual({
		author: "updated author",
		version: "2.0",
	});

	// Verify the final file entity change record exists and is correct
	const finalFileChangeRecord = await lix.db
		.selectFrom("change")
		.where("id", "=", updatedMetadataFile.lixcol_change_id)
		.where("entity_id", "=", "metadata-change-test")
		.where("schema_key", "=", "lix_file")
		.selectAll()
		.executeTakeFirst();

	expect(finalFileChangeRecord).toBeDefined();
	expect(finalFileChangeRecord?.entity_id).toBe("metadata-change-test");
	expect(finalFileChangeRecord?.schema_key).toBe("lix_file");
});
