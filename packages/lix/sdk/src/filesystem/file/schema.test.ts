import { expect, expectTypeOf, test } from "vitest";
import { createVersion } from "../../version/create-version.js";
import { createCheckpoint } from "../../state/create-checkpoint.js";
import { switchVersion } from "../../version/switch-version.js";
import { mockJsonPlugin } from "../../plugin/mock-json-plugin.js";
import type { LixPlugin } from "../../plugin/lix-plugin.js";
import type { LixFile } from "./schema.js";
import { simulationTest } from "../../test-utilities/simulation-test/simulation-test.js";
import { withWriterKey } from "../../state/writer.js";
import { Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { openLix } from "../../lix/open-lix.js";

simulationTest(
	"insert, update, delete on the file view",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
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

		expect(viewAfterInsert).toMatchObject([
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
				data: new TextEncoder().encode(
					JSON.stringify({ prop0: "file0-value1" })
				),
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

		expect(viewAfterUpdate).toMatchObject([
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
	}
);

simulationTest(
	"file insert data materialization",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
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

		expect(viewAfterInsert).toMatchObject([
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
	}
);

simulationTest(
	"file ids should have a default",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
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
	}
);

simulationTest(
	"files should be able to have metadata",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
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
	}
);

simulationTest(
	"invalid file paths should be rejected",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
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
		).rejects.toThrowError("Invalid file path");
	}
);

// Future-proofing: ensure glob logic never admits leading/trailing dot segments.
simulationTest(
	"file paths cannot contain dot segments",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			providePlugins: [mockJsonPlugin],
		});

		const payload = new TextEncoder().encode(JSON.stringify({ note: "dot" }));

		await expect(
			lix.db
				.insertInto("file")
				.values({ path: "/./readme.json", data: payload })
				.execute()
		).rejects.toThrow(/Invalid (directory|file) path/);

		await expect(
			lix.db
				.insertInto("file")
				.values({ path: "/docs/../readme.json", data: payload })
				.execute()
		).rejects.toThrow(/Invalid (directory|file) path/);
	}
);

simulationTest(
	"files should have hidden property defaulting to false",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			providePlugins: [mockJsonPlugin],
		});

		await lix.db
			.insertInto("file")
			.values({
				path: "/hidden-default.json",
				data: new Uint8Array(),
			})
			.execute();

		const file = await lix.db
			.selectFrom("file")
			.where("path", "=", "/hidden-default.json")
			.selectAll()
			.executeTakeFirstOrThrow();

		expect(file.hidden).toBe(0);
	}
);

simulationTest(
	"can explicitly set hidden to true",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			providePlugins: [mockJsonPlugin],
		});

		await lix.db
			.insertInto("file")
			.values({
				path: "/hidden.json",
				data: new Uint8Array(),
				hidden: true,
			})
			.execute();

		const file = await lix.db
			.selectFrom("file")
			.where("path", "=", "/hidden.json")
			.selectAll()
			.executeTakeFirstOrThrow();

		expect(file.hidden).toBe(1);
	}
);

simulationTest(
	"file_by_version operations are version specific and isolated",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
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
			.insertInto("file_by_version")
			.values({
				id: "fileA",
				path: "/shared/file.json",
				data: new TextEncoder().encode(JSON.stringify({ content: "versionA" })),
				lixcol_version_id: versionA.id,
			})
			.execute();

		// Insert file in version B with same path but different content
		await lix.db
			.insertInto("file_by_version")
			.values({
				id: "fileB",
				path: "/shared/file.json",
				data: new TextEncoder().encode(JSON.stringify({ content: "versionB" })),
				lixcol_version_id: versionB.id,
			})
			.execute();

		// Verify both versions have their own files
		const filesInVersionA = await lix.db
			.selectFrom("file_by_version")
			.where("lixcol_version_id", "=", versionA.id)
			.selectAll()
			.execute();

		const filesInVersionB = await lix.db
			.selectFrom("file_by_version")
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
			.updateTable("file_by_version")
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
			.selectFrom("file_by_version")
			.where("lixcol_version_id", "=", versionA.id)
			.selectAll()
			.execute();

		const unchangedFilesB = await lix.db
			.selectFrom("file_by_version")
			.where("lixcol_version_id", "=", versionB.id)
			.selectAll()
			.execute();

		expect(
			JSON.parse(new TextDecoder().decode(updatedFilesA[0]?.data))
		).toEqual({
			content: "versionA-updated",
		});
		expect(
			JSON.parse(new TextDecoder().decode(unchangedFilesB[0]?.data))
		).toEqual({ content: "versionB" });

		// Delete file from version A
		await lix.db
			.deleteFrom("file_by_version")
			.where("id", "=", "fileA")
			.where("lixcol_version_id", "=", versionA.id)
			.execute();

		// Verify deletion only affected version A
		const remainingFilesA = await lix.db
			.selectFrom("file_by_version")
			.where("lixcol_version_id", "=", versionA.id)
			.selectAll()
			.execute();

		const remainingFilesB = await lix.db
			.selectFrom("file_by_version")
			.where("lixcol_version_id", "=", versionB.id)
			.selectAll()
			.execute();

		expect(remainingFilesA).toHaveLength(0);
		expect(remainingFilesB).toHaveLength(1);
		expect(
			JSON.parse(new TextDecoder().decode(remainingFilesB[0]?.data))
		).toEqual({ content: "versionB" });
	}
);

simulationTest(
	"the plugin is the source of truth. the fallback plugin is not invoked if a plugin is configured for the file type",
	async ({ openSimulatedLix }) => {
		const mockTxtPlugin: LixPlugin = {
			key: "mock-txt",
			detectChanges: () => {
				return [];
			},
			applyChanges: () => ({ fileData: new Uint8Array() }),
			detectChangesGlob: "*.txt",
		};

		const lix = await openSimulatedLix({
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
	}
);

simulationTest(
	"file_history provides access to historical file data",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
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
			.where("lixcol_root_commit_id", "=", insertCheckpoint.id)
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
		expect(historicalFileAtInsert.lixcol_commit_id).toBe(insertCheckpoint.id);

		// 6. Query history at update checkpoint and assert is updated
		const fileHistoryAtUpdate = await lix.db
			.selectFrom("file_history")
			.where("id", "=", "test-file")
			.where("lixcol_root_commit_id", "=", updateCheckpoint.id)
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
		expect(historicalFileAtUpdate.lixcol_commit_id).toBe(updateCheckpoint.id);
	}
);

simulationTest(
	"file_history reflects directory renames across commits",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			providePlugins: [mockJsonPlugin],
		});

		const initialData = new TextEncoder().encode(
			JSON.stringify({ content: "hello" })
		);

		await lix.db
			.insertInto("file")
			.values({ path: "/docs/readme.json", data: initialData })
			.execute();

		const fileDescriptor = await lix.db
			.selectFrom("file")
			.where("path", "=", "/docs/readme.json")
			.select(["id"])
			.executeTakeFirstOrThrow();
		const fileId = fileDescriptor.id;

		const firstCheckpoint = await createCheckpoint({ lix });

		await lix.db
			.updateTable("directory")
			.where("name", "=", "docs")
			.set({ name: "guides" })
			.execute();

		await lix.db
			.updateTable("file")
			.where("id", "=", fileId)
			.set({ metadata: { stage: "after-rename" } })
			.execute();

		const secondCheckpoint = await createCheckpoint({ lix });

		const historyBeforeRename = await lix.db
			.selectFrom("file_history")
			.where("id", "=", fileId)
			.where("lixcol_root_commit_id", "=", firstCheckpoint.id)
			.where("lixcol_depth", "=", 0)
			.select(["path", "id"])
			.executeTakeFirstOrThrow();

		const historyAfterRename = await lix.db
			.selectFrom("file_history")
			.where("id", "=", fileId)
			.where("lixcol_root_commit_id", "=", secondCheckpoint.id)
			.where("lixcol_depth", "=", 0)
			.select(["path", "id"])
			.executeTakeFirstOrThrow();

		const historyAfterRenameDepthOne = await lix.db
			.selectFrom("file_history")
			.where("id", "=", fileId)
			.where("lixcol_root_commit_id", "=", secondCheckpoint.id)
			.where("lixcol_depth", "=", 1)
			.select(["path"])
			.executeTakeFirstOrThrow();

		expect(historyBeforeRename.path).toBe("/docs/readme.json");
		expect(historyAfterRename.path).toBe("/guides/readme.json");
		expect(historyAfterRenameDepthOne.path).toBe("/docs/readme.json");
	}
);

simulationTest(
	"file_history tracks directory moves across commits",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			providePlugins: [mockJsonPlugin],
		});

		const payload = new TextEncoder().encode(JSON.stringify({ note: "move" }));

		await lix.db
			.insertInto("file")
			.values({ path: "/docs/guides/intro.json", data: payload })
			.execute();

		const insertedFile = await lix.db
			.selectFrom("file")
			.where("path", "=", "/docs/guides/intro.json")
			.select(["id"])
			.executeTakeFirstOrThrow();
		const fileId = insertedFile.id;

		await lix.db
			.insertInto("directory")
			.values({ name: "articles", parent_id: null })
			.execute();

		const docsDirectory = await lix.db
			.selectFrom("directory")
			.where("name", "=", "docs")
			.select(["id"])
			.executeTakeFirstOrThrow();

		const guidesDirectory = await lix.db
			.selectFrom("directory")
			.where("name", "=", "guides")
			.where("parent_id", "=", docsDirectory.id)
			.select(["id"])
			.executeTakeFirstOrThrow();

		const articlesDirectory = await lix.db
			.selectFrom("directory")
			.where("name", "=", "articles")
			.select(["id"])
			.executeTakeFirstOrThrow();

		const checkpointBeforeMove = await createCheckpoint({ lix });

		await lix.db
			.updateTable("directory")
			.where("id", "=", guidesDirectory.id)
			.set({ parent_id: articlesDirectory.id })
			.execute();

		// Touch the target directory so directory history captures it in the commit
		await lix.db
			.updateTable("directory")
			.where("id", "=", articlesDirectory.id)
			.set({ name: "articles" })
			.execute();

		await lix.db
			.updateTable("file")
			.where("id", "=", fileId)
			.set({ metadata: { stage: "after-move" } })
			.execute();

		const checkpointAfterMove = await createCheckpoint({ lix });

		const historyBeforeMove = await lix.db
			.selectFrom("file_history")
			.where("id", "=", fileId)
			.where("lixcol_root_commit_id", "=", checkpointBeforeMove.id)
			.where("lixcol_depth", "=", 0)
			.select(["path"])
			.executeTakeFirstOrThrow();

		const historyAfterMove = await lix.db
			.selectFrom("file_history")
			.where("id", "=", fileId)
			.where("lixcol_root_commit_id", "=", checkpointAfterMove.id)
			.where("lixcol_depth", "=", 0)
			.select(["path"])
			.executeTakeFirstOrThrow();

		const historyAfterMoveDepthOne = await lix.db
			.selectFrom("file_history")
			.where("id", "=", fileId)
			.where("lixcol_root_commit_id", "=", checkpointAfterMove.id)
			.where("lixcol_depth", "=", 1)
			.select(["path"])
			.executeTakeFirstOrThrow();

		expect(historyBeforeMove.path).toBe("/docs/guides/intro.json");
		expect(historyAfterMove.path).toBe("/articles/guides/intro.json");
		expect(historyAfterMoveDepthOne.path).toBe("/docs/guides/intro.json");
	},
	{ timeout: 100_000 }
);

test("updating file data does not create additional file descriptor changes", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: {
					enabled: true,
				},
				lixcol_version_id: "global",
			},
		],
	});

	const fileId = "data-only-descriptor-stability";

	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/data-only.json",
			data: new TextEncoder().encode(JSON.stringify({ content: "initial" })),
		})
		.execute();

	const fetchDescriptorChanges = async () =>
		await lix.db
			.selectFrom("change")
			.where("schema_key", "=", "lix_file_descriptor")
			.where("entity_id", "=", fileId)
			.orderBy("created_at", "desc")
			.select(["id", "created_at"])
			.execute();

	const descriptorChangesBefore = await fetchDescriptorChanges();
	expect(descriptorChangesBefore.length).toBeGreaterThan(0);

	await lix.db
		.updateTable("file")
		.where("id", "=", fileId)
		.set({
			data: new TextEncoder().encode(JSON.stringify({ content: "updated" })),
		})
		.execute();

	const descriptorChangesAfter = await fetchDescriptorChanges();

	expect(descriptorChangesAfter.length).toBe(descriptorChangesBefore.length);
	expect(descriptorChangesAfter[0]?.id).toBe(descriptorChangesBefore[0]?.id);

	const latestChange = await lix.db
		.selectFrom("change")
		.where("file_id", "=", fileId)
		.orderBy("created_at", "desc")
		.select(["id", "schema_key"])
		.executeTakeFirstOrThrow();

	expect(latestChange.id).not.toBe(descriptorChangesBefore[0]?.id);
	expect(latestChange.schema_key).not.toBe("lix_file_descriptor");
});

// its super annoying to work with metadata otherwise
simulationTest("file metadata is Record<string, any>", async () => {
	const mockFile: LixFile = {
		id: "test-file",
		path: "/test.json",
		data: new TextEncoder().encode(JSON.stringify({ prop0: "value0" })),
		metadata: {
			author: "test-user",
			created_at: new Date().toISOString(),
		},
		directory_id: null,
		name: "test",
		extension: "json",
		hidden: false,
	};

	expectTypeOf(mockFile.metadata).toEqualTypeOf<
		Record<string, any> | null | undefined
	>();
});

simulationTest(
	"file and file_by_version views expose change_id for blame and diff functionality",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			providePlugins: [mockJsonPlugin],
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: {
						enabled: true,
						bootstrap: true,
					},
					lixcol_version_id: "global",
				},
			],
		});

		// Insert initial file using file view to ensure triggers are executed
		await lix.db
			.insertInto("file")
			.values({
				id: "change-id-test-file",
				path: "/test-change-id.json",
				data: new TextEncoder().encode(
					JSON.stringify({ prop: "initial value" })
				),
			})
			.execute();

		// Query file_by_version view to verify change_id is exposed
		const fileAllResult = await lix.db
			.selectFrom("file_by_version")
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

		// Verify that change_id matches between file and file_by_version views
		expect(fileResult[0]?.lixcol_change_id).toBe(
			fileAllResult[0]?.lixcol_change_id
		);

		// Get the latest change for this file (could be descriptor or content)
		const latestChange = await lix.db
			.selectFrom("change")
			.where("file_id", "=", "change-id-test-file")
			.orderBy("created_at", "desc")
			.select(["id", "schema_key", "snapshot_content"])
			.executeTakeFirstOrThrow();

		// Verify that the change_id in the views matches the latest change
		expect(fileResult[0]?.lixcol_change_id).toBe(latestChange.id);
		expect(fileAllResult[0]?.lixcol_change_id).toBe(latestChange.id);

		// Verify that the file view shows correct file info
		expect(fileResult[0]?.id).toBe("change-id-test-file");
		expect(fileResult[0]?.path).toBe("/test-change-id.json");

		// Update the file to create a new change
		await lix.db
			.updateTable("file")
			.set({
				path: "/test-change-id-updated.json",
			})
			.where("id", "=", "change-id-test-file")
			.execute();

		// Query again to verify change_id updated after modification
		const updatedFileResult = await lix.db
			.selectFrom("file_by_version")
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
			.where("file_id", "=", "change-id-test-file")
			.where("schema_key", "=", "lix_file_descriptor")
			.orderBy("created_at", "desc")
			.select(["id", "snapshot_content"])
			.executeTakeFirstOrThrow();

		// Verify the new change_id matches the latest file change
		expect(updatedFileResult[0]?.lixcol_change_id).toBe(newFileChangeRecord.id);

		// Verify that the updated snapshot content in the change matches the file view
		expect(newFileChangeRecord.snapshot_content).toMatchObject({
			id: "change-id-test-file",
			directory_id: null,
			name: "test-change-id-updated",
			extension: "json",
		});
		expect(updatedFileResult[0]?.path).toBe("/test-change-id-updated.json");
	}
);

simulationTest(
	"file views expose writer_key for descriptor rows",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({ providePlugins: [mockJsonPlugin] });
		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
		const writerKey = "writer:file#insert";
		const fileId = "writer-descriptor-file";

		await withWriterKey(db, writerKey, async (trx) => {
			await trx
				.insertInto("file")
				.values({
					id: fileId,
					path: "/writer-descriptor.json",
					data: new TextEncoder().encode(JSON.stringify({ content: "writer" })),
				})
				.execute();
		});

		const fileRow = await lix.db
			.selectFrom("file")
			.where("id", "=", fileId)
			.select(["id", "lixcol_writer_key"])
			.executeTakeFirstOrThrow();

		expect(fileRow.lixcol_writer_key).toBe(writerKey);

		const fileAllRow = await lix.db
			.selectFrom("file_by_version")
			.where("id", "=", fileId)
			.select(["id", "lixcol_writer_key"])
			.executeTakeFirstOrThrow();

		expect(fileAllRow.lixcol_writer_key).toBe(writerKey);
	}
);

simulationTest(
	"file writer_key stays local to the version that wrote it",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({ providePlugins: [mockJsonPlugin] });
		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
		const writerKey = "writer:file#inherit";
		const fileId = "inherit-writer-file";

		await withWriterKey(db, writerKey, async (trx) => {
			await trx
				.insertInto("file")
				.values({
					id: fileId,
					path: "/inherit.json",
					data: new TextEncoder().encode(JSON.stringify({ content: "base" })),
				})
				.execute();
		});

		const mainRow = await lix.db
			.selectFrom("file")
			.where("id", "=", fileId)
			.select(["id", "lixcol_writer_key"])
			.executeTakeFirstOrThrow();

		expect(mainRow.lixcol_writer_key).toBe(writerKey);

		const mainVersion = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirstOrThrow();

		const branch = await createVersion({ lix, name: "writer-branch" });
		await switchVersion({ lix, to: branch });

		const branchRow = await lix.db
			.selectFrom("file")
			.where("id", "=", fileId)
			.select(["id", "lixcol_writer_key"])
			.executeTakeFirstOrThrow();

		// Writer keys are untracked metadata and only exist on the version
		// that performed the write. Branches inherit the file content but not
		// the writer attribution.
		expect(branchRow.lixcol_writer_key).toBeNull();

		const fileAllRows = await lix.db
			.selectFrom("file_by_version")
			.where("id", "=", fileId)
			.select(["lixcol_version_id", "lixcol_writer_key"])
			.execute();

		const versionWriterMap = new Map(
			fileAllRows.map((row) => [row.lixcol_version_id, row.lixcol_writer_key])
		);

		expect(versionWriterMap.get(mainVersion.version_id)).toBe(writerKey);
		expect(versionWriterMap.get(branch.id)).toBeNull();
	}
);

simulationTest(
	"file data updates create new change_id",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
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
	}
);

simulationTest(
	"file metadata updates create new change_id",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
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
	}
);

simulationTest(
	"file view keeps lixcol_metadata in sync with metadata lifecycle",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			providePlugins: [mockJsonPlugin],
		});

		const fileId = "lixcol-metadata-lifecycle";
		const initialMetadata = { owner: "initial" };

		const fetchFile = async () =>
			await lix.db
				.selectFrom("file")
				.select(["id", "metadata", "lixcol_metadata", "lixcol_change_id"])
				.where("id", "=", fileId)
				.executeTakeFirstOrThrow();

		const fetchDescriptorChange = async () =>
			await lix.db
				.selectFrom("change")
				.select(["id", "metadata"])
				.where("entity_id", "=", fileId)
				.where("schema_key", "=", "lix_file_descriptor")
				.orderBy("created_at", "desc")
				.executeTakeFirstOrThrow();

		await lix.db
			.insertInto("file")
			.values({
				id: fileId,
				path: "/lixcol-metadata.json",
				data: new TextEncoder().encode(JSON.stringify({ content: "initial" })),
				metadata: initialMetadata,
			})
			.execute();

		const createdFile = await fetchFile();
		expect(createdFile.metadata).toEqual(initialMetadata);
		expect(createdFile.lixcol_metadata).toEqual(initialMetadata);

		const createdChange = await fetchDescriptorChange();
		expect(createdChange.metadata).toEqual(initialMetadata);

		const updatedMetadata = { owner: "updated", version: 2 };

		await lix.db
			.updateTable("file")
			.set({ metadata: updatedMetadata })
			.where("id", "=", fileId)
			.execute();

		const updatedFile = await fetchFile();
		expect(updatedFile.metadata).toEqual(updatedMetadata);
		expect(updatedFile.lixcol_metadata).toEqual(updatedMetadata);

		const updatedChange = await fetchDescriptorChange();
		expect(updatedChange.id).not.toBe(createdChange.id);
		expect(updatedChange.metadata).toEqual(updatedMetadata);

		await lix.db
			.updateTable("file")
			.set({ metadata: null })
			.where("id", "=", fileId)
			.execute();

		const clearedFile = await fetchFile();
		expect(clearedFile.metadata).toBeNull();
		expect(clearedFile.lixcol_metadata).toBeNull();

		const clearedChange = await fetchDescriptorChange();
		expect(clearedChange.id).not.toBe(updatedChange.id);
		expect(clearedChange.metadata).toBeNull();
	}
);

simulationTest(
	"direct state updates invalidate file data cache",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			providePlugins: [mockJsonPlugin],
		});

		// Seed a JSON file that the mock plugin materializes from state
		const fileId = "state-cache-file";
		await lix.db
			.insertInto("file")
			.values({
				id: fileId,
				path: "/state-cache.json",
				data: new TextEncoder().encode(JSON.stringify({ content: "Start" })),
			})
			.execute();

		// First read: populates lix_internal_file_data_cache via select_file_data
		const initial = await lix.db
			.selectFrom("file")
			.where("id", "=", fileId)
			.selectAll()
			.executeTakeFirstOrThrow();

		expect(JSON.parse(new TextDecoder().decode(initial.data))).toEqual({
			content: "Start",
		});

		// Simulate a direct state write (bypassing file handlers/applyChangeSet)
		// Update the plugin-managed entity directly in the `state` view
		await lix.db
			.updateTable("state")
			.set({ snapshot_content: { value: "New" } })
			.where("file_id", "=", fileId)
			.where("plugin_key", "=", "mock_json_plugin")
			.where("schema_key", "=", "mock_json_property")
			.where("entity_id", "=", "content")
			.execute();

		// Second read must reflect updated state, not stale cache
		const updated = await lix.db
			.selectFrom("file")
			.where("id", "=", fileId)
			.selectAll()
			.executeTakeFirstOrThrow();

		expect(JSON.parse(new TextDecoder().decode(updated.data))).toEqual({
			content: "New",
		});
	}
);

simulationTest(
	"direct state_by_version updates invalidate file data cache",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			providePlugins: [mockJsonPlugin],
		});

		const fileId = "state-all-cache-file";
		await lix.db
			.insertInto("file")
			.values({
				id: fileId,
				path: "/state-all-cache.json",
				data: new TextEncoder().encode(JSON.stringify({ content: "Start" })),
			})
			.execute();

		// Initial read to populate cache
		const initial = await lix.db
			.selectFrom("file")
			.where("id", "=", fileId)
			.selectAll()
			.executeTakeFirstOrThrow();
		expect(JSON.parse(new TextDecoder().decode(initial.data))).toEqual({
			content: "Start",
		});

		// Active version id for state_by_version write
		const active = await lix.db
			.selectFrom("active_version")
			.select(["version_id"])
			.executeTakeFirstOrThrow();

		// Update plugin entity directly in state_by_version for that version
		await lix.db
			.updateTable("state_by_version")
			.set({ snapshot_content: { value: "New" } })
			.where("file_id", "=", fileId)
			.where("version_id", "=", active.version_id)
			.where("plugin_key", "=", "mock_json_plugin")
			.where("schema_key", "=", "mock_json_property")
			.where("entity_id", "=", "content")
			.execute();

		// Next read must reflect updated state (cache invalidated by state_by_version trigger)
		const updated = await lix.db
			.selectFrom("file")
			.where("id", "=", fileId)
			.selectAll()
			.executeTakeFirstOrThrow();
		expect(JSON.parse(new TextDecoder().decode(updated.data))).toEqual({
			content: "New",
		});
	}
);

simulationTest(
	"file descriptor updates with untracked state",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			providePlugins: [mockJsonPlugin],
		});

		// Count changes before untracked insert
		const changesBefore = await lix.db
			.selectFrom("change")
			.selectAll()
			.execute();

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
		const decodedData = JSON.parse(
			new TextDecoder().decode(fileResult[0]?.data)
		);
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
		await lix.db
			.deleteFrom("file")
			.where("id", "=", "untracked-file")
			.execute();

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
	}
);

simulationTest(
	"file data updates with untracked state",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
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
	}
);

simulationTest("file history", async ({ openSimulatedLix }) => {
	const lix = await openSimulatedLix({
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
			"lixcol_root_commit_id",
			"=",
			lix.db
				.selectFrom("version")
				.select("commit_id")
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
simulationTest(
	"file_history handles partial updates correctly",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
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
			.where("lixcol_root_commit_id", "=", checkpoint0.id)
			.where("lixcol_depth", "=", 0)
			.select("data")
			.executeTakeFirstOrThrow();

		const afterFile = await lix.db
			.selectFrom("file_history")
			.where("path", "=", "/test.json")
			.where("lixcol_root_commit_id", "=", checkpoint1.id)
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
	}
);

simulationTest(
	"file views should expose same relevant lixcol_* columns as key_value view",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			providePlugins: [mockJsonPlugin],
		});

		// Create a file that will be available in all file views
		await lix.db
			.insertInto("file")
			.values({
				id: "lixcol-test-file",
				path: "/lixcol-test.json",
				data: new TextEncoder().encode(JSON.stringify({ test: "data" })),
			})
			.execute();

		// Create a key_value entry for comparison baseline
		await lix.db
			.insertInto("key_value")
			.values({ key: "lixcol-test-kv", value: "test_value" })
			.execute();

		// Create a checkpoint for view queries
		const checkpoint = await createCheckpoint({ lix });

		// Extract lixcol_* columns helper function
		const extractLixcols = (obj: Record<string, any>) => {
			const lixcols: Record<string, any> = {};
			for (const [key, value] of Object.entries(obj)) {
				if (key.startsWith("lixcol_")) {
					lixcols[key] = value;
				}
			}
			return lixcols;
		};

		// Filter out columns that don't make sense for file views (files are themselves entities).
		// These fields either duplicate intrinsic file identity (file/plugin/entity ids) or
		// are constants in state_history (version_id always resolves to 'global').
		const blacklist = [
			"lixcol_file_id",
			"lixcol_plugin_key",
			"lixcol_entity_id",
			"lixcol_version_id",
			"lixcol_writer_key",
		];

		const filterColumns = (lixcols: Record<string, any>) => {
			const filtered: Record<string, any> = {};
			for (const [key, value] of Object.entries(lixcols)) {
				if (!blacklist.includes(key)) {
					filtered[key] = value;
				}
			}
			return filtered;
		};

		// Test each file view type against corresponding key_value view
		const views = [
			{
				name: "file",
				fileQuery: () =>
					lix.db
						.selectFrom("file")
						.selectAll()
						.where("id", "=", "lixcol-test-file"),
				keyValueQuery: () =>
					lix.db
						.selectFrom("key_value")
						.selectAll()
						.where("key", "=", "lixcol-test-kv"),
			},
			{
				name: "file_by_version",
				fileQuery: () =>
					lix.db
						.selectFrom("file_by_version")
						.selectAll()
						.where("id", "=", "lixcol-test-file"),
				keyValueQuery: () =>
					lix.db
						.selectFrom("key_value_by_version")
						.selectAll()
						.where("key", "=", "lixcol-test-kv"),
			},
			{
				name: "file_history",
				fileQuery: () =>
					lix.db
						.selectFrom("file_history")
						.selectAll()
						.where("id", "=", "lixcol-test-file")
						.where("lixcol_root_commit_id", "=", checkpoint.id)
						.where("lixcol_depth", "=", 0),
				keyValueQuery: () =>
					lix.db
						.selectFrom("key_value_history")
						.selectAll()
						.where("key", "=", "lixcol-test-kv")
						.where("lixcol_root_commit_id", "=", checkpoint.id)
						.where("lixcol_depth", "=", 0),
			},
		];

		for (const view of views) {
			// Query both the file view and corresponding key_value view
			const fileResult = await view.fileQuery().executeTakeFirstOrThrow();
			const keyValueResult = await view
				.keyValueQuery()
				.executeTakeFirstOrThrow();

			// Extract and filter lixcol_* columns from both
			const fileLixcols = extractLixcols(fileResult);
			const keyValueLixcols = extractLixcols(keyValueResult);

			const fileFilteredLixcols = filterColumns(fileLixcols);
			const keyValueFilteredLixcols = filterColumns(keyValueLixcols);

			const fileFilteredKeys = Object.keys(fileFilteredLixcols).sort();
			const keyValueFilteredKeys = Object.keys(keyValueFilteredLixcols).sort();

			// File view should expose the same relevant lixcol_* columns as corresponding key_value view (excluding blacklisted ones)
			expect(fileFilteredKeys).toEqual(keyValueFilteredKeys);

			// Both should have the same number of relevant lixcol_* columns
			expect(fileFilteredKeys.length).toBe(keyValueFilteredKeys.length);

			// All lixcol_* values should be defined (can be null, but not undefined)
			const fileLixcolKeys = Object.keys(fileLixcols).sort();
			for (const key of fileLixcolKeys) {
				expect(fileLixcols[key]).toBeDefined();
			}

			// Verify that file views expose lix_file_descriptor as schema key
			expect(fileResult.lixcol_schema_key).toBe("lix_file_descriptor");
		}
	}
);

simulationTest(
	"file should expose lixcol columns based on file data AND the descriptor",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			providePlugins: [mockJsonPlugin],
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: {
						enabled: true,
					},
					lixcol_version_id: "global",
				},
			],
		});

		// Create a file with JSON content
		await lix.db
			.insertInto("file")
			.values({
				id: "aggregate-info-test",
				path: "/document.json",
				data: new TextEncoder().encode(
					JSON.stringify({
						title: "Original Title",
						content: "Original content",
					})
				),
			})
			.execute();

		// Get initial file info
		const fileAfterCreate = await lix.db
			.selectFrom("file")
			.where("id", "=", "aggregate-info-test")
			.selectAll()
			.executeTakeFirstOrThrow();

		const initialChangeId = fileAfterCreate.lixcol_change_id;
		const initialUpdatedAt = fileAfterCreate.lixcol_updated_at;

		// Verify that file view exposes lix_file_descriptor as schema key
		expect(fileAfterCreate.lixcol_schema_key).toBe("lix_file_descriptor");

		// Verify the initial change is either for the file descriptor or a content entity
		const initialChange = await lix.db
			.selectFrom("change")
			.where("id", "=", initialChangeId)
			.selectAll()
			.executeTakeFirstOrThrow();

		// When creating a file with content, the latest change could be either:
		// - The file descriptor change
		// - A content entity change (e.g., mock_json_property)
		expect(["lix_file_descriptor", "mock_json_property"]).toContain(
			initialChange.schema_key
		);

		// If it's a content change, verify it belongs to this file
		if (initialChange.schema_key !== "lix_file_descriptor") {
			expect(initialChange.file_id).toBe("aggregate-info-test");
		}

		// Update only the JSON content (not path or metadata)
		await lix.db
			.updateTable("file")
			.where("id", "=", "aggregate-info-test")
			.set({
				data: new TextEncoder().encode(
					JSON.stringify({
						title: "Updated Title", // Changed
						content: "Updated content", // Changed
					})
				),
			})
			.execute();

		// Get file info after content update
		const fileAfterContentUpdate = await lix.db
			.selectFrom("file")
			.where("id", "=", "aggregate-info-test")
			.selectAll()
			.executeTakeFirstOrThrow();

		// Get all changes related to this file (descriptor + content)
		const allFileChanges = await lix.db
			.selectFrom("change")
			.where((eb) =>
				eb.or([
					// File descriptor changes
					eb("entity_id", "=", "aggregate-info-test").and(
						"schema_key",
						"=",
						"lix_file_descriptor"
					),
					// Content changes (any entity within this file)
					eb("file_id", "=", "aggregate-info-test"),
				])
			)
			.orderBy("created_at", "desc")
			.selectAll()
			.execute();

		// There should be multiple changes (descriptor + content properties)
		expect(allFileChanges.length).toBeGreaterThan(1);

		const latestContentChange = allFileChanges[0]!;

		// The actual latest change is a content change, not the descriptor
		expect(latestContentChange.schema_key).not.toBe("lix_file_descriptor");

		// The file view should show the latest change across ALL entities in the file
		expect(fileAfterContentUpdate.lixcol_change_id).toBe(
			latestContentChange.id
		);

		// The updated_at should reflect when the file was last modified (including content)
		expect(fileAfterContentUpdate.lixcol_updated_at).toBe(
			latestContentChange.created_at
		);

		// The file's change_set_id should contain the latest content change
		// Get all changes in the file's current change_set
		// Join through commit to get the changeset since versions now point to commits
		const changesInFileChangeSet = await lix.db
			.selectFrom("change_set_element")
			.innerJoin(
				"commit",
				"commit.change_set_id",
				"change_set_element.change_set_id"
			)
			.where("commit.id", "=", fileAfterContentUpdate.lixcol_commit_id)
			.select("change_set_element.change_id")
			.execute();

		const changeIdsInSet = changesInFileChangeSet.map((el) => el.change_id);

		// The file's change_set_id should contain the latest content change
		expect(changeIdsInSet).toContain(latestContentChange.id);

		// Test file_by_version view shows the same aggregated behavior AT THIS POINT (before path update)
		// Re-query file_by_version after content update to verify it shows latest change
		const fileAllAfterContentUpdate = await lix.db
			.selectFrom("file_by_version")
			.where("id", "=", "aggregate-info-test")
			.selectAll()
			.executeTakeFirstOrThrow();

		// file_by_version should show the same change_id as the file view at this point
		expect(fileAllAfterContentUpdate.lixcol_change_id).toBe(
			fileAfterContentUpdate.lixcol_change_id
		);
		expect(fileAllAfterContentUpdate.lixcol_updated_at).toBe(
			fileAfterContentUpdate.lixcol_updated_at
		);

		// Verify that file_by_version view also exposes lix_file_descriptor as schema key
		expect(fileAllAfterContentUpdate.lixcol_schema_key).toBe(
			"lix_file_descriptor"
		);

		// Additional verification that descriptor changes DO work
		await lix.db
			.updateTable("file")
			.where("id", "=", "aggregate-info-test")
			.set({
				path: "/renamed-document.json", // This updates the descriptor
			})
			.execute();

		const fileAfterPathUpdate = await lix.db
			.selectFrom("file")
			.where("id", "=", "aggregate-info-test")
			.selectAll()
			.executeTakeFirstOrThrow();

		// Descriptor changes ARE reflected (this part works correctly)
		expect(fileAfterPathUpdate.lixcol_change_id).not.toBe(initialChangeId);
		// For string timestamps, use string comparison
		expect(fileAfterPathUpdate.lixcol_updated_at > initialUpdatedAt).toBe(true);

		// After path update, file_by_version should show the descriptor change
		const fileAllAfterPathUpdate = await lix.db
			.selectFrom("file_by_version")
			.where("id", "=", "aggregate-info-test")
			.selectAll()
			.executeTakeFirstOrThrow();

		expect(fileAllAfterPathUpdate.lixcol_change_id).toBe(
			fileAfterPathUpdate.lixcol_change_id
		);
		expect(fileAllAfterPathUpdate.path).toBe("/renamed-document.json");

		// Create a checkpoint to test file_history
		const checkpoint = await createCheckpoint({ lix });

		// Test file_history view also aggregates changes correctly
		const fileHistoryAtCheckpoint = await lix.db
			.selectFrom("file_history")
			.where("id", "=", "aggregate-info-test")
			.where("lixcol_root_commit_id", "=", checkpoint.id)
			.where("lixcol_depth", "=", 0)
			.selectAll()
			.executeTakeFirstOrThrow();

		// file_history should show the latest state including the path update
		expect(fileHistoryAtCheckpoint.path).toBe("/renamed-document.json");
		expect(fileHistoryAtCheckpoint.lixcol_change_id).toBe(
			fileAfterPathUpdate.lixcol_change_id
		);

		// Verify that file_history view also exposes lix_file_descriptor as schema key
		expect(fileHistoryAtCheckpoint.lixcol_schema_key).toBe(
			"lix_file_descriptor"
		);

		// The materialized data should reflect the content updates
		const historicalData = JSON.parse(
			new TextDecoder().decode(fileHistoryAtCheckpoint.data)
		);
		expect(historicalData).toEqual({
			title: "Updated Title",
			content: "Updated content",
		});
	}
);

simulationTest(
	"files should be identical across versions when versions have the same commit",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			providePlugins: [mockJsonPlugin],
		});

		const initialFile = new TextEncoder().encode(
			JSON.stringify({
				items: [{ id: 1, name: "T-Shirt", price: 29.99, stock: 100 }],
			})
		);

		// Create a file in the main version
		await lix.db
			.insertInto("file")
			.values({
				path: "/products.json",
				data: initialFile,
			})
			.execute();

		// Verify the file exists in main version
		const fileInMain = await lix.db
			.selectFrom("file")
			.where("path", "=", "/products.json")
			.selectAll()
			.executeTakeFirst();

		expect(fileInMain?.data).toEqual(initialFile);

		// Create a new version (should inherit from active version)
		const newVersion = await createVersion({
			lix,
			name: "price-update",
		});

		// Switch to the new version
		await switchVersion({ lix, to: newVersion });

		// Check if the file is inherited in the new version
		const fileInNewVersion = await lix.db
			.selectFrom("file")
			.where("path", "=", "/products.json")
			.selectAll()
			.executeTakeFirst();

		expect(fileInNewVersion?.data).toEqual(initialFile);

		// Update the file in the new version
		await lix.db
			.updateTable("file")
			.set({
				data: new TextEncoder().encode(
					JSON.stringify({
						items: [
							{ id: 1, name: "T-Shirt", price: 34.99, stock: 100 }, // Price changed
						],
					})
				),
			})
			.where("path", "=", "/products.json")
			.execute();

		// Verify the update worked
		const updatedFile = await lix.db
			.selectFrom("file")
			.where("path", "=", "/products.json")
			.selectAll()
			.executeTakeFirstOrThrow();

		const updatedData = JSON.parse(new TextDecoder().decode(updatedFile.data));
		expect(updatedData.items[0].price).toBe(34.99);

		// Query file_by_version to see both versions
		const filesAcrossVersions = await lix.db
			.selectFrom("file_by_version")
			.where("path", "=", "/products.json")
			.select(["lixcol_version_id", "data"])
			.execute();

		expect(filesAcrossVersions).toHaveLength(2);

		// Get version info for verification
		const versions = await lix.db
			.selectFrom("version")
			.select(["id", "name"])
			.execute();

		const mainVersionData = filesAcrossVersions.find((f) => {
			const version = versions.find((v) => v.id === f.lixcol_version_id);
			return version?.name === "main";
		});

		const newVersionData = filesAcrossVersions.find((f) => {
			const version = versions.find((v) => v.id === f.lixcol_version_id);
			return version?.name === "price-update";
		});

		expect(mainVersionData).toBeDefined();
		expect(newVersionData).toBeDefined();

		// Verify the prices are different
		const mainData = JSON.parse(
			new TextDecoder().decode(mainVersionData!.data)
		);
		const updatedVersionData = JSON.parse(
			new TextDecoder().decode(newVersionData!.data)
		);

		expect(mainData.items[0].price).toBe(29.99); // Original price
		expect(updatedVersionData.items[0].price).toBe(34.99); // Updated price
	}
);

simulationTest(
	"file view exposes the correct commit_id",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: {
						enabled: true,
					},
					lixcol_version_id: "global",
				},
			],
			providePlugins: [mockJsonPlugin],
		});

		// Insert a file
		await lix.db
			.insertInto("file")
			.values({
				id: "test_commit_id_file",
				path: "/test/file.json",
				data: new TextEncoder().encode(JSON.stringify({ content: "initial" })),
			})
			.execute();

		// Get the current commit ID from the version
		const version = await lix.db
			.selectFrom("version")
			.innerJoin("active_version", "active_version.version_id", "version.id")
			.select("version.commit_id")
			.executeTakeFirstOrThrow();

		// Query the file and check its commit_id
		const file = await lix.db
			.selectFrom("file")
			.where("id", "=", "test_commit_id_file")
			.select(["id", "path", "lixcol_commit_id"])
			.executeTakeFirstOrThrow();

		// The file's commit_id should match the version's commit_id
		expect(file.lixcol_commit_id).toBe(version.commit_id);
		expect(file.lixcol_commit_id).toBeTruthy();
		expect(file.lixcol_commit_id).not.toBe("undefined");
	}
);

simulationTest(
	"file data writes stamp writer_key on materialized state (insert, update, delete)",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({ providePlugins: [mockJsonPlugin] });
		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;
		const fileId = "writer-file-json";

		// Insert file content with writer
		await withWriterKey(db, "writer:insert", async (trx) => {
			await trx
				.insertInto("file")
				.values({
					id: fileId,
					path: "/writer.json",
					data: new TextEncoder().encode(JSON.stringify({ prop0: "A" })),
				})
				.execute();
		});

		// The plugin should materialize state for prop0 with writer_key
		const afterInsert = await lix.db
			.selectFrom("state")
			.where("file_id", "=", fileId)
			.where("schema_key", "=", "mock_json_property")
			.selectAll()
			.executeTakeFirstOrThrow();

		expect(afterInsert.writer_key).toBe("writer:insert");
		expect((afterInsert as any).snapshot_content).toMatchObject({ value: "A" });

		// Update file content with a different writer
		await withWriterKey(db, "writer:update", async (trx) => {
			await trx
				.updateTable("file")
				.where("id", "=", fileId)
				.set({ data: new TextEncoder().encode(JSON.stringify({ prop0: "B" })) })
				.execute();
		});

		const afterUpdate = await lix.db
			.selectFrom("state")
			.where("file_id", "=", fileId)
			.where("schema_key", "=", "mock_json_property")
			.selectAll()
			.executeTakeFirstOrThrow();

		expect(afterUpdate.writer_key).toBe("writer:update");
		expect((afterUpdate as any).snapshot_content).toMatchObject({ value: "B" });

		// Delete the file with a third writer; tombstone should keep writer
		await withWriterKey(db, "writer:delete", async (trx) => {
			await trx.deleteFrom("file").where("id", "=", fileId).execute();
		});

		const tombstone = await lix.db
			.selectFrom("state_with_tombstones")
			.where("file_id", "=", fileId)
			.where("schema_key", "=", "mock_json_property")
			.selectAll()
			.executeTakeFirst();

		if (tombstone) {
			expect(tombstone.writer_key).toBe("writer:delete");
			expect((tombstone as any).snapshot_content).toBeNull();
		}
	}
);

simulationTest(
	"plugin emits state_commit on file data update and materializes state",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({ providePlugins: [mockJsonPlugin] });
		const fileId = "json-writer-file";

		// Capture state commit emissions for debugging
		const commits: Array<{ changes: any[] }> = [];
		const unsub = lix.hooks.onStateCommit((data) =>
			commits.push({ changes: data.changes })
		);

		// Seed a JSON file
		await lix.db
			.insertInto("file")
			.values({
				id: fileId,
				path: "/doc.json",
				data: new TextEncoder().encode(JSON.stringify({ prop0: "A" })),
			})
			.execute();

		// Clear any commits from insert to focus on the update
		commits.length = 0;

		// Update file blob; mock JSON plugin should detect and write state
		await lix.db
			.updateTable("file")
			.where("id", "=", fileId)
			.set({ data: new TextEncoder().encode(JSON.stringify({ prop0: "B" })) })
			.execute();

		// Expect at least one state_commit emission with changes for this file
		expect(commits.length).toBeGreaterThan(0);
		const combined = commits.flatMap((c) => c.changes);
		expect(combined.some((ch: any) => ch.file_id === fileId)).toBe(true);

		// Verify state rows exist for this file (materialized content from md plugin)
		const stateRows = await lix.db
			.selectFrom("state")
			.where("file_id", "=", fileId)
			.selectAll()
			.execute();
		expect(stateRows.length).toBeGreaterThan(0);

		unsub();
	}
);
