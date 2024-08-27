import { expect, test, vi } from "vitest";
import { openLixInMemory } from "./open/openLixInMemory.js";
import { newLixFile } from "./newLix.js";
import type { DiffReport, LixPlugin } from "./plugin.js";

test("should use queue and settled correctly", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: async ({ old }) => {
				return [
					!old
						? {
								type: "text",
								operation: "create",
								old: undefined,
								neu: {
									id: "test",
									text: "inserted text",
								},
							}
						: {
								type: "text",
								operation: "update",
								old: {
									id: "test",
									text: "inserted text",
								},
								neu: {
									id: "test",
									text: "updated text",
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
		},
	]);

	const changes = await lix.db.selectFrom("change").selectAll().execute();

	expect(changes).toEqual([
		{
			id: changes[0]?.id,
			author: null,
			created_at: changes[0]?.created_at,
			parent_id: null,
			type: "text",
			file_id: "test",
			plugin_key: "mock-plugin",
			value: {
				id: "test",
				text: "inserted text",
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

	await lix.db
		.updateTable("file")
		.set({ data: enc.encode("test updated text second update") })
		.where("id", "=", "test")
		.execute();

	const queue2 = await lix.db.selectFrom("change_queue").selectAll().execute();
	expect(queue2).toEqual([
		{
			id: 2,
			file_id: "test",
			path: "test.txt",
			data: queue2[0]?.data,
		},
		{
			id: 3,
			file_id: "test",
			path: "test.txt",
			data: queue2[1]?.data,
		},
	]);

	await lix.settled();

	expect(
		(await lix.db.selectFrom("change_queue").selectAll().execute()).length,
	).toBe(0);

	const updatedChanges = await lix.db
		.selectFrom("change")
		.selectAll()
		.execute();

	expect(updatedChanges).toEqual([
		{
			author: null,
			id: updatedChanges[0]?.id,
			created_at: updatedChanges[0]?.created_at,
			parent_id: null,
			type: "text",
			file_id: "test",
			operation: "update",
			plugin_key: "mock-plugin",
			value: {
				id: "test",
				text: "updated text",
			},
			meta: null,
			commit_id: null,
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
