import { test, expect, expectTypeOf } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "../version/create-version.js";
import { createCheckpoint } from "../change-set/create-checkpoint.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";
import type { LixFile } from "./schema.js";

test("insert, update, delete on the file view", async () => {
	const lix = await openLix({
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
			lixcol_untracked: 0,
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
			lixcol_untracked: 0,
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
				schema_key: "lix_file_descriptor",
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
				schema_key: "lix_file_descriptor",
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
				schema_key: "lix_file_descriptor",
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
	const lix = await openLix({
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
			lixcol_untracked: 0,
			data: { prop0: "file0-value0" },
			metadata: null,
		},
	]);
});

test("file ids should have a default", async () => {
	const lix = await openLix({
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
	const lix = await openLix({
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
	const lix = await openLix({
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
	const lix = await openLix({
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

	const lix = await openLix({
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
	const lix = await openLix({
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
	const insertCheckpoint = await createCheckpoint({
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

	const updateCheckpoint = await createCheckpoint({
		lix,
	});

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
	const fileHistoryAtInsert = await lix.db
		.selectFrom("file_history")
		.where("id", "=", "test-file")
		.where("lixcol_change_set_id", "=", insertCheckpoint.id)
		.where("lixcol_depth", "=", 0)
		.selectAll()
		.execute();

	expect(fileHistoryAtInsert).toHaveLength(1);

	const historicalFileAtInsert = fileHistoryAtInsert[0]!;
	const historicalFileAtInsertData = JSON.parse(
		new TextDecoder().decode(historicalFileAtInsert.data)
	);

	expect(historicalFileAtInsertData).toEqual(initialData);
	expect(historicalFileAtInsert.id).toBe("test-file");
	expect(historicalFileAtInsert.path).toBe("/test.json");
	expect(historicalFileAtInsert.lixcol_change_set_id).toBe(insertCheckpoint.id);

	// 6. Query history at update checkpoint and assert is updated
	const fileHistoryAtUpdate = await lix.db
		.selectFrom("file_history")
		.where("id", "=", "test-file")
		.where("lixcol_change_set_id", "=", updateCheckpoint.id)
		.where("lixcol_depth", "=", 0)
		.selectAll()
		.execute();

	expect(fileHistoryAtUpdate).toHaveLength(1);
	const historicalFileAtUpdate = fileHistoryAtUpdate[0]!;
	const historicalFileAtUpdateData = JSON.parse(
		new TextDecoder().decode(historicalFileAtUpdate.data)
	);
	expect(historicalFileAtUpdateData).toEqual(updatedData);
	expect(historicalFileAtUpdate.id).toBe("test-file");
	expect(historicalFileAtUpdate.path).toBe("/test.json");
	expect(historicalFileAtUpdate.lixcol_change_set_id).toBe(updateCheckpoint.id);
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
	const lix = await openLix({
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
		.where("schema_key", "=", "lix_file_descriptor")
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
		.where("schema_key", "=", "lix_file_descriptor")
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
	const lix = await openLix({
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
	const lix = await openLix({
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
		.where("schema_key", "=", "lix_file_descriptor")
		.selectAll()
		.executeTakeFirst();

	expect(finalFileChangeRecord).toBeDefined();
	expect(finalFileChangeRecord?.entity_id).toBe("metadata-change-test");
	expect(finalFileChangeRecord?.schema_key).toBe("lix_file_descriptor");
});

test("file descriptor updates with untracked state", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	// Count changes before untracked insert
	const changesBefore = await lix.db.selectFrom("change").selectAll().execute();

	// Insert file with untracked=true
	await lix.db
		.insertInto("file")
		.values({
			id: "untracked-file",
			path: "/untracked-test.json",
			data: new TextEncoder().encode(JSON.stringify({ prop: "value" })),
			lixcol_untracked: true,
		})
		.execute();

	// Count changes after untracked insert
	const changesAfterInsert = await lix.db
		.selectFrom("change")
		.selectAll()
		.execute();

	// Verify no changes were created (untracked bypasses change control)
	expect(changesAfterInsert.length).toBe(changesBefore.length);

	// Verify file exists in view
	const fileResult = await lix.db
		.selectFrom("file")
		.where("id", "=", "untracked-file")
		.selectAll()
		.execute();

	expect(fileResult).toHaveLength(1);
	expect(fileResult[0]?.lixcol_untracked).toBe(1);
	expect(fileResult[0]?.path).toBe("/untracked-test.json");

	// Verify file data was processed by plugin
	const decodedData = JSON.parse(new TextDecoder().decode(fileResult[0]?.data));
	expect(decodedData).toEqual({ prop: "value" });

	// Update file with untracked=true
	await lix.db
		.updateTable("file")
		.where("id", "=", "untracked-file")
		.set({
			path: "/updated-untracked-test.json",
			data: new TextEncoder().encode(JSON.stringify({ prop: "updated" })),
			lixcol_untracked: true,
		})
		.execute();

	// Count changes after untracked update
	const changesAfterUpdate = await lix.db
		.selectFrom("change")
		.selectAll()
		.execute();

	// Verify no new changes were created (untracked bypasses change control)
	expect(changesAfterUpdate.length).toBe(changesBefore.length);

	// Verify file was updated
	const updatedFile = await lix.db
		.selectFrom("file")
		.where("id", "=", "untracked-file")
		.selectAll()
		.execute();

	expect(updatedFile).toHaveLength(1);
	expect(updatedFile[0]?.lixcol_untracked).toBe(1);
	expect(updatedFile[0]?.path).toBe("/updated-untracked-test.json");

	// Verify updated file data was processed by plugin
	const updatedData = JSON.parse(
		new TextDecoder().decode(updatedFile[0]?.data)
	);
	expect(updatedData).toEqual({ prop: "updated" });

	// Delete the untracked file
	await lix.db.deleteFrom("file").where("id", "=", "untracked-file").execute();

	// Count changes after untracked delete
	const changesAfterDelete = await lix.db
		.selectFrom("change")
		.selectAll()
		.execute();

	// Verify no new changes were created (untracked bypasses change control)
	expect(changesAfterDelete.length).toBe(changesBefore.length);

	// Verify file was deleted
	const deletedFile = await lix.db
		.selectFrom("file")
		.where("id", "=", "untracked-file")
		.selectAll()
		.execute();

	expect(deletedFile).toHaveLength(0);
});

test("file data updates with untracked state", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	// Count changes before any operations
	const changesInitial = await lix.db
		.selectFrom("change")
		.selectAll()
		.execute();

	// Insert file with untracked=true from the start
	await lix.db
		.insertInto("file")
		.values({
			id: "untracked-data-file",
			path: "/untracked-data.json",
			data: new TextEncoder().encode(JSON.stringify({ content: "initial" })),
			lixcol_untracked: true,
		})
		.execute();

	// Count changes after untracked insert
	const changesAfterInsert = await lix.db
		.selectFrom("change")
		.selectAll()
		.execute();

	// Verify no changes were created (untracked bypasses change control)
	expect(changesAfterInsert.length).toBe(changesInitial.length);

	// Verify file was inserted and is untracked
	const insertedFile = await lix.db
		.selectFrom("file")
		.where("id", "=", "untracked-data-file")
		.selectAll()
		.execute();

	expect(insertedFile).toHaveLength(1);
	expect(insertedFile[0]?.lixcol_untracked).toBe(1);

	// Verify file data was processed by plugin
	const initialData = JSON.parse(
		new TextDecoder().decode(insertedFile[0]?.data)
	);
	expect(initialData).toEqual({ content: "initial" });

	// Update file data with untracked=true
	await lix.db
		.updateTable("file")
		.where("id", "=", "untracked-data-file")
		.set({
			data: new TextEncoder().encode(JSON.stringify({ content: "updated" })),
			lixcol_untracked: true,
		})
		.execute();

	// Count changes after untracked update
	const changesAfterUpdate = await lix.db
		.selectFrom("change")
		.selectAll()
		.execute();

	// Verify no new changes were created (untracked bypasses change control)
	expect(changesAfterUpdate.length).toBe(changesInitial.length);

	// Verify file data was updated and is still untracked
	const updatedFile = await lix.db
		.selectFrom("file")
		.where("id", "=", "untracked-data-file")
		.selectAll()
		.execute();

	expect(updatedFile).toHaveLength(1);
	expect(updatedFile[0]?.lixcol_untracked).toBe(1);

	// Verify file data was updated and processed by plugin
	const updatedData = JSON.parse(
		new TextDecoder().decode(updatedFile[0]?.data)
	);
	expect(updatedData).toEqual({ content: "updated" });

	// Delete the untracked file
	await lix.db
		.deleteFrom("file")
		.where("id", "=", "untracked-data-file")
		.execute();

	// Count changes after untracked delete
	const changesAfterDelete = await lix.db
		.selectFrom("change")
		.selectAll()
		.execute();

	// Verify no new changes were created (untracked bypasses change control)
	expect(changesAfterDelete.length).toBe(changesInitial.length);

	// Verify file was deleted
	const deletedFile = await lix.db
		.selectFrom("file")
		.where("id", "=", "untracked-data-file")
		.selectAll()
		.execute();

	expect(deletedFile).toHaveLength(0);
});

test("file history", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	// Insert a JSON file
	const data = {
		name: "My Project",
		version: "1.0.0",
	};

	await lix.db
		.insertInto("file")
		.values({
			path: "/config.json",
			data: new TextEncoder().encode(JSON.stringify(data)),
		})
		.execute();

	// Make a change
	data.name = "My Cool Project";
	data.version = "1.1.0";

	await lix.db
		.updateTable("file")
		.where("path", "=", "/config.json")
		.set({
			data: new TextEncoder().encode(JSON.stringify(data)),
		})
		.execute();

	// 1. Get the last two versions of the JSON file from history
	const fileHistory = await lix.db
		.selectFrom("file_history")
		.where("file_history.path", "=", "/config.json")
		.where(
			"lixcol_change_set_id",
			"=",
			lix.db
				.selectFrom("version")
				.select("change_set_id")
				.where("version.name", "=", "main")
		)
		.orderBy("lixcol_depth", "asc")
		.selectAll()
		.execute();

	expect(fileHistory).toHaveLength(2);

	const afterState = JSON.parse(new TextDecoder().decode(fileHistory[0]!.data));
	const beforeState = JSON.parse(
		new TextDecoder().decode(fileHistory[1]!.data)
	);

	expect(afterState).toEqual({
		name: "My Cool Project",
		version: "1.1.0",
	});
	expect(beforeState).toEqual({
		name: "My Project",
		version: "1.0.0",
	});
});

// This test verifies that file_history correctly reconstructs files when only some properties change.
// The bug occurred when querying file_history at depth=0 after a partial update:
// - Changed entities appeared at depth=0
// - Unchanged entities remained at depth=1+
// The old implementation only returned entities at the exact depth, missing unchanged properties.
test("file_history handles partial updates correctly", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	await lix.db
		.insertInto("file")
		.values({
			id: "abcdefg",
			path: "/test.json",
			data: new TextEncoder().encode(
				JSON.stringify({
					name: "test-item",
					value: 100,
				})
			),
		})
		.execute();

	const checkpoint0 = await createCheckpoint({ lix });

	await lix.db
		.updateTable("file")
		.where("path", "=", "/test.json")
		.set({
			data: new TextEncoder().encode(
				JSON.stringify({
					name: "test-item",
					value: 105,
				})
			),
		})
		.execute();

	const checkpoint1 = await createCheckpoint({ lix });

	const beforeFile = await lix.db
		.selectFrom("file_history")
		.where("path", "=", "/test.json")
		.where("lixcol_change_set_id", "=", checkpoint0.id)
		.where("lixcol_depth", "=", 0)
		.select("data")
		.executeTakeFirstOrThrow();

	const afterFile = await lix.db
		.selectFrom("file_history")
		.where("path", "=", "/test.json")
		.where("lixcol_change_set_id", "=", checkpoint1.id)
		.where("lixcol_depth", "=", 0)
		.select("data")
		.executeTakeFirstOrThrow();

	const beforeData = new TextDecoder().decode(beforeFile.data);
	const afterData = new TextDecoder().decode(afterFile.data);

	const beforeDoc = JSON.parse(beforeData);
	const afterDoc = JSON.parse(afterData);

	expect(beforeDoc).toEqual({
		name: "test-item",
		value: 100,
	});

	expect(afterDoc).toEqual({
		name: "test-item",
		value: 105,
	});
});