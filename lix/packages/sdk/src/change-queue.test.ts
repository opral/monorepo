/* eslint-disable unicorn/no-null */
import { expect, test, vi } from "vitest";
import { openLixInMemory } from "./open/openLixInMemory.js";
import { newLixFile } from "./newLix.js";
import type { DiffReport, LixPlugin } from "./plugin.js";

test("should use queue and settled correctly", async () => {
	const mockPlugin: LixPlugin<{
		text: { id: string; text: string };
	}> = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: async ({ old, neu }) => {
				const dec = new TextDecoder();
				// console.log("diff", neu, old?.data, neu?.data);
				const newText = dec.decode(neu?.data);
				const oldText = dec.decode(old?.data);

				if (newText === oldText) {
					return [];
				}

				return await mockPlugin.diff.text({
					old: old
						? {
								id: "test",
								text: oldText,
							}
						: undefined,
					neu: neu
						? {
								id: "test",
								text: newText,
							}
						: undefined,
				});
			},
			text: async ({ old, neu }) => {
				// console.log("text", old, neu);
				if (old?.text === neu?.text) {
					return [];
				}

				return [
					!old
						? {
								type: "text",
								operation: "create",
								old: undefined,
								neu: {
									id: "test",
									text: neu?.text,
								},
							}
						: {
								type: "text",
								operation: "update",
								old: {
									id: "test",
									text: old?.text,
								},
								neu: {
									id: "test",
									text: neu?.text,
								},
							},
				];
			},
		},
	};

	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	const enc = new TextEncoder();
	await lix.db
		.insertInto("file")
		.values({ id: "test", path: "test.txt", data: enc.encode("test") })
		.execute();

	const internalFiles = await lix.db
		.selectFrom("file_internal")
		.selectAll()
		.execute();

	expect(internalFiles).toEqual([]);

	const queue = await lix.db.selectFrom("change_queue").selectAll().execute();
	expect(queue).toEqual([
		{
			id: 1,
			file_id: "test",
			metadata: null,
			path: "test.txt",
			data: queue[0]?.data,
		},
	]);
	await lix.settled();

	expect(
		(await lix.db.selectFrom("change_queue").selectAll().execute()).length,
	).toBe(0);

	const internalFilesAfter = await lix.db
		.selectFrom("file_internal")
		.selectAll()
		.execute();

	expect(internalFilesAfter).toEqual([
		{
			data: internalFilesAfter[0]?.data,
			id: "test",
			path: "test.txt",
			metadata: null,
		},
	]);

	const changes = await lix.db.selectFrom("change").innerJoin("snapshot", "snapshot.id", "change.snapshot_id").selectAll().execute();

	expect(changes).toEqual([
		{
			id: changes[0]?.id,
			author: null,
			created_at: changes[0]?.created_at,
			snapshot_id:  changes[0]?.snapshot_id,
			parent_id: null,
			type: "text",
			file_id: "test",
			plugin_key: "mock-plugin",
			value: {
				id: "test",
				text: "test",
			},
			meta: null,
			commit_id: null,
			operation: "create",
		},
	]);

	// Test replacing uncommitted changes and multiple changes processing
	await lix.db
		.updateTable("file")
		.set({ data: enc.encode("test updated text") })
		.where("id", "=", "test")
		.execute();

	// re apply same change
	await lix.db
		.updateTable("file")
		.set({ data: enc.encode("test updated text") })
		.where("id", "=", "test")
		.execute();

	await lix.db
		.updateTable("file")
		.set({ data: enc.encode("test updated text second update") })
		.where("id", "=", "test")
		.execute();

	const queue2 = await lix.db.selectFrom("change_queue").selectAll().execute();
	expect(queue2).toEqual([
		{
			id: 3,
			file_id: "test",
			path: "test.txt",
			metadata: null,
			data: queue2[0]?.data,
		},
		{
			id: 4,
			file_id: "test",
			path: "test.txt",
			metadata: null,
			data: queue2[1]?.data,
		},
	]);

	await lix.settled();

	expect(
		(await lix.db.selectFrom("change_queue").selectAll().execute()).length,
	).toBe(0);

	const updatedChanges = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll()
		.execute();

	expect(updatedChanges).toEqual([
		{
			author: null,
			id: updatedChanges[0]?.id,
			created_at: updatedChanges[0]?.created_at,
			snapshot_id: updatedChanges[0]?.snapshot_id,
			parent_id: null,
			type: "text",
			file_id: "test",
			operation: "create",
			plugin_key: "mock-plugin",
			value: {
				id: "test",
				text: "test",
			},
			meta: null,
			commit_id: null,
		},
		{
			author: null,
			commit_id: null,
			created_at: updatedChanges[1]?.created_at,
			snapshot_id: updatedChanges[1]?.snapshot_id,
			file_id: "test",
			id: updatedChanges[1]?.id,
			meta: null,
			operation: "update",
			parent_id: updatedChanges[0]?.id,
			plugin_key: "mock-plugin",
			type: "text",
			value: {
				id: "test",
				text: "test updated text",
			},
		},
		{
			author: null,
			commit_id: null,
			created_at: updatedChanges[2]?.created_at,
			snapshot_id: updatedChanges[2]?.snapshot_id,
			file_id: "test",
			id: updatedChanges[2]?.id,
			meta: null,
			operation: "update",
			parent_id: updatedChanges[1]?.id,
			plugin_key: "mock-plugin",
			type: "text",
			value: {
				id: "test",
				text: "test updated text second update",
			},
		},
	]);

	await lix.commit({ description: "test commit" });
});

test("changes should contain the author", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: vi.fn().mockResolvedValue([
				{
					type: "mock",
					operation: "create",
					old: undefined,
					neu: {} as any,
				},
			] satisfies DiffReport[]),
		},
	};
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	await lix.currentAuthor.set("some-id");

	// testing an insert

	await lix.db
		.insertInto("file")
		.values({
			id: "mock",
			data: new Uint8Array(),
			path: "/mock-file.json",
		})
		.execute();

	await lix.settled();

	const changes1 = await lix.db.selectFrom("change").selectAll().execute();

	expect(changes1[0]?.author).toBe("some-id");

	// testing an update

	await lix.db
		.updateTable("file")
		.set({
			data: new Uint8Array(),
		})
		.where("id", "=", "mock")
		.execute();

	await lix.settled();

	const changes2 = await lix.db.selectFrom("change").selectAll().execute();

	expect(changes2[1]?.author).toBe("some-id");

	// testing setting the author
	await lix.currentAuthor.set("some-other-id");

	await lix.db
		.updateTable("file")
		.set({
			data: new Uint8Array(),
		})
		.where("id", "=", "mock")
		.execute();

	await lix.settled();

	const changes3 = await lix.db.selectFrom("change").selectAll().execute();

	expect(changes3.at(-1)?.author).toBe("some-other-id");
});
