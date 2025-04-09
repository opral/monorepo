import { expect, test, vi } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { newLixFile } from "../lix/new-lix.js";
import type { DetectedChange, LixPlugin } from "../plugin/lix-plugin.js";
import type { LixFile } from "../database/schema.js";
import { fileQueueSettled } from "./file-queue-settled.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";
import type { FileQueueEntry } from "./database-schema.js";

test("should use queue and settled correctly", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		detectChangesGlob: "*",
		detectChanges: async ({ before, after }) => {
			const textBefore = before
				? new TextDecoder().decode(before?.data)
				: undefined;
			const textAfter = after
				? new TextDecoder().decode(after.data)
				: undefined;

			if (textBefore === textAfter) {
				return [];
			}

			return [
				{
					schema: {
						key: "text",
						type: "json",
					},
					entity_id: "test",
					snapshot: textAfter ? { text: textAfter } : undefined,
				},
			];
		},
	};

	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	const currentVersion = await lix.db
		.selectFrom("current_version")
		.innerJoin("version", "current_version.id", "version.id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const enc = new TextEncoder();
	const dataInitial = enc.encode("insert text");
	await lix.db
		.insertInto("file")
		.values({ id: "test", path: "/test.txt", data: dataInitial })
		.execute();

	const queue = await lix.db.selectFrom("file_queue").selectAll().execute();

	expect(queue).toEqual([
		expect.objectContaining({
			id: 1,
			file_id: "test",
			path_after: "/test.txt",
			data_after: dataInitial,
			data_before: null,
		} satisfies Partial<FileQueueEntry>),
	]);

	await fileQueueSettled({ lix });

	expect(
		(await lix.db.selectFrom("file_queue").selectAll().execute()).length
	).toBe(0);

	// TODO QUEUE check if the replacement of file_internal was expected
	const internalFilesAfter = await lix.db
		.selectFrom("file")
		.selectAll()
		.execute();

	expect(internalFilesAfter).toEqual([
		expect.objectContaining({
			data: internalFilesAfter[0]!.data,
			id: "test",
			path: "/test.txt",
			metadata: null,
		}) satisfies LixFile,
	]);

	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.innerJoin("change_author", "change_author.change_id", "change.id")
		.selectAll("change")
		.select("change_author.account_id")
		.select("snapshot.content")
		.execute();

	expect(changes).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				entity_id: "test",
				schema_key: "text",
				file_id: "test",
				plugin_key: "mock-plugin",
				content: {
					text: "insert text",
				},
				account_id: expect.stringMatching(/./),
			}),
		])
	);

	const dataUpdate1 = enc.encode("updated text");
	await lix.db
		.updateTable("file")
		.set({ data: dataUpdate1 })
		.where("id", "=", "test")
		.execute();

	// const beforeQueueTick = await lix.db
	// 	.selectFrom("file_queue")
	// 	.selectAll()
	// 	.execute();

	// expect(beforeQueueTick.length).toBe(1);

	// const afterQueueTick = await lix.db
	// 	.selectFrom("file_queue")
	// 	.selectAll()
	// 	.execute();

	// expect(afterQueueTick.length).toBe(0);

	// update2 is equal to update1
	const dataUpdate2 = dataUpdate1;

	// insert same file again
	await lix.db
		.updateTable("file")
		.set({ data: dataUpdate2 })
		.where("id", "=", "test")
		.execute();

	const dataUpdate3 = enc.encode("second text update");

	await lix.db
		.updateTable("file")
		.set({ data: dataUpdate3 })
		.where("id", "=", "test")
		.execute();

	const queue2 = await lix.db.selectFrom("file_queue").selectAll().execute();

	expect(queue2).toEqual([
		// change update 1 is the same as change update 2
		// hence, only 2 fil queue entries are expected
		expect.objectContaining({
			id: 3,
			file_id: "test",
			path_after: "/test.txt",
			metadata_after: null,
			data_before: dataUpdate1,
			data_after: dataUpdate2,
		} satisfies Partial<FileQueueEntry>),
		expect.objectContaining({
			id: 4,
			file_id: "test",
			path_after: "/test.txt",
			metadata_after: null,
			data_before: dataUpdate2,
			data_after: dataUpdate3,
		} satisfies Partial<FileQueueEntry>),
	]);

	await fileQueueSettled({ lix });

	expect(
		(await lix.db.selectFrom("file_queue").selectAll().execute()).length
	).toBe(0);

	const updatedChanges = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.innerJoin("change_author", "change_author.change_id", "change.id")
		.selectAll("change")
		.where("schema_key", "=", "text")
		.select("change_author.account_id")
		.select("snapshot.content")
		.execute();

	const updatedEdges = await lix.db
		.selectFrom("change_edge")
		.selectAll()
		.execute();

	const versionChanges = await lix.db
		.selectFrom("version_change")
		.where("version_id", "=", currentVersion.id)
		.selectAll()
		.execute();

	expect(updatedChanges).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				entity_id: "test",
				schema_key: "text",
				file_id: "test",
				plugin_key: "mock-plugin",
				content: {
					text: "insert text",
				},
				account_id: expect.stringMatching(/./),
			}),
			expect.objectContaining({
				entity_id: "test",
				file_id: "test",
				plugin_key: "mock-plugin",
				schema_key: "text",
				content: {
					text: "updated text",
				},
				account_id: expect.stringMatching(/./),
			}),
			expect.objectContaining({
				file_id: "test",
				entity_id: "test",
				plugin_key: "mock-plugin",
				schema_key: "text",
				content: {
					text: "second text update",
				},
				account_id: expect.stringMatching(/./),
			}),
		])
	);

	expect(updatedEdges).toEqual(
		expect.arrayContaining([
			// 0 is the parent of 1
			// 1 is the parent of 2
			expect.objectContaining({
				parent_id: updatedChanges[0]?.id,
				child_id: updatedChanges[1]?.id,
			}),
			expect.objectContaining({
				parent_id: updatedChanges[1]?.id,
				child_id: updatedChanges[2]?.id,
			}),
		])
	);

	// the version change pointers points to the last change
	expect(versionChanges).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				version_id: currentVersion.id,
				change_id: updatedChanges[2]?.id,
			}),
		])
	);
});

test.todo("changes should contain the author", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		detectChangesGlob: "*",
		detectChanges: vi.fn().mockResolvedValue([
			{
				schema: {
					key: "mock",
					type: "json",
				},
				entity_id: "mock",
				snapshot: {
					text: "value1",
				},
			},
			{
				schema: {
					key: "mock",
					type: "json",
				},
				entity_id: "mock",
				snapshot: {
					text: "value2",
				},
			},
		] satisfies DetectedChange[]),
	};
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	// testing an insert

	await lix.db
		.insertInto("file")
		.values({
			id: "mock",
			data: new Uint8Array(),
			path: "/mock-file.json",
		})
		.execute();

	await fileQueueSettled({ lix });

	// const changes1 = await lix.db.selectFrom("change").selectAll().execute();

	// expect(changes1[0]?.author).toBe("some-id");

	// testing an update

	await lix.db
		.updateTable("file")
		.set({
			data: new Uint8Array(),
		})
		.where("id", "=", "mock")
		.execute();

	await fileQueueSettled({ lix });

	// const changes2 = await lix.db.selectFrom("change").selectAll().execute();

	// expect(changes2[1]?.author).toBe("some-id");

	await lix.db
		.updateTable("file")
		.set({
			data: new Uint8Array(),
		})
		.where("id", "=", "mock")
		.execute();

	await fileQueueSettled({ lix });

	// const changes3 = await lix.db.selectFrom("change").selectAll().execute();

	// expect(changes3.at(-1)?.author).toBe("some-other-id");
});

// lix own change control handles file deletions
test("should handle file deletions correctly", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		detectChangesGlob: "*",
		detectChanges: async ({ before, after }) => {
			const txt = new TextDecoder().decode(before ? before.data : after.data);

			return [
				{
					schema: {
						key: "text",
						type: "json",
					},
					entity_id: "test",
					snapshot: {
						text: txt,
					},
				},
			];
		},
	};

	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	const enc = new TextEncoder();
	const dataInitial = enc.encode("file to be deleted");

	// Insert initial file
	await lix.db
		.insertInto("file")
		.values({ id: "file0", path: "/delete.txt", data: dataInitial })
		.execute();

	// Queue deletion
	await fileQueueSettled({ lix });

	const changesAfterInsert = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.where("file_id", "=", "file0")
		.selectAll()
		.execute();

	expect(changesAfterInsert).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				entity_id: "test",
				file_id: "file0",
				plugin_key: "mock-plugin",
				schema_key: "text",
				content: {
					text: "file to be deleted",
				},
			}),
		])
	);

	await lix.db.deleteFrom("file").where("id", "=", "file0").execute();

	// Ensure the queue reflects the deletion entry
	const queue = await lix.db.selectFrom("file_queue").selectAll().execute();

	expect(queue).toEqual([
		expect.objectContaining({
			file_id: "file0",
			path_before: null,
			data_before: null,
			path_after: null,
			data_after: null,
		} satisfies Partial<FileQueueEntry>),
	]);

	// Run the fil queue settlement process
	await fileQueueSettled({ lix });

	// Verify the fil queue is empty
	expect(
		(await lix.db.selectFrom("file_queue").selectAll().execute()).length
	).toBe(0);

	// Verify the changes reflect the deletion
	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.innerJoin("change_author", "change_author.change_id", "change.id")
		.where("file_id", "=", "file0")
		.selectAll("change")
		.select("change_author.account_id")
		.select("snapshot.content")
		.execute();

	expect(changes).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				entity_id: "test",
				file_id: "file0",
				plugin_key: "mock-plugin",
				schema_key: "text",
				content: null, // Content is null for deletions
			}),
		])
	);

	// Verify the file no longer exists in the database
	const internalFilesAfter = await lix.db
		.selectFrom("file")
		.selectAll()
		.execute();

	expect(internalFilesAfter).toEqual([]);
});

test("handles file upserts without reporting duplicates", async () => {
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	// creating a file insert and upsert
	await lix.db
		.insertInto("file")
		.values(
			Array.from({ length: 2 }, (_, i) => ({
				id: "mock_file",
				data: new TextEncoder().encode(
					JSON.stringify({
						name: `Max${i}`,
					})
				),
				path: `/test.json`,
			}))
		)
		.onConflict((oc) =>
			oc.doUpdateSet((eb) => ({
				data: eb.ref("excluded.data"),
			}))
		)
		.returningAll()
		.executeTakeFirstOrThrow();

	await fileQueueSettled({ lix });

	// should have detected 2 changes
	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.where("file_id", "=", "mock_file")
		.select("snapshot.content")
		.execute();

	expect(changes).toEqual([
		{
			content: {
				value: "Max0",
			},
		},
		{
			content: {
				value: "Max1",
			},
		},
	]);
});