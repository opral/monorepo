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

	// Find all change sets whose IDs do not appear as a parent_id in any edge
	const leafChangeSets = await lix.db
		.selectFrom("change_set")
		.where("change_set.id", "not in", (eb) =>
			eb
				.selectFrom("change_set_edge")
				.select("change_set_edge.parent_id")
				.distinct()
		)
		.selectAll("change_set")
		.execute();

	// There should only be one leaf change set at the end
	// plus the working change set
	expect(leafChangeSets).toHaveLength(2);
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

// Test that the file queue doesn't get stuck in a deadlock when handlers throw errors
test("file queue should not deadlock when handlers throw errors", async () => {
	// Create plugins - one that will throw errors and one that works correctly
	const errorPlugin: LixPlugin = {
		key: "error-plugin",
		detectChangesGlob: "*.error.txt", // Only process error files
		detectChanges: async () => {
			throw new Error("Simulated plugin error");
		},
	};

	const successPlugin: LixPlugin = {
		key: "success-plugin",
		detectChangesGlob: "*.success.txt", // Only process success files
		detectChanges: async () => {
			return [
				{
					schema: {
						key: "text",
						type: "json",
					},
					entity_id: "success-test",
					snapshot: { text: "success" },
				},
			];
		},
	};

	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [errorPlugin, successPlugin],
	});

	const enc = new TextEncoder();

	// Insert a file that will trigger the error
	await lix.db
		.insertInto("file")
		.values({
			id: "error-test",
			path: "/test.error.txt",
			data: enc.encode("error test"),
		})
		.execute();

	// Verify the queue entry was created
	const queueBefore = await lix.db
		.selectFrom("file_queue")
		.selectAll()
		.execute();
	expect(queueBefore.length).toBeGreaterThan(0);

	// Wait for the queue to settle
	await fileQueueSettled({ lix });

	// The queue should be empty despite the error
	const queueAfter = await lix.db
		.selectFrom("file_queue")
		.selectAll()
		.execute();
	expect(queueAfter.length).toBe(0);

	// Insert a file that should process successfully
	await lix.db
		.insertInto("file")
		.values({
			id: "success-test",
			path: "/test.success.txt",
			data: enc.encode("success test"),
		})
		.execute();

	// Wait for the queue to settle again
	await fileQueueSettled({ lix });

	// The queue should still be empty
	const queueFinal = await lix.db
		.selectFrom("file_queue")
		.selectAll()
		.execute();
	expect(queueFinal.length).toBe(0);

	// Verify a change was created for the success file
	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.where("entity_id", "=", "success-test")
		.select("snapshot.content")
		.execute();

	expect(changes.length).toBe(1);
});
