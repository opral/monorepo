/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { test, expect, vi } from "vitest";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import { merge } from "./merge.js";
import type { NewChange, NewCommit, NewConflict } from "../database/schema.js";
import type { LixPlugin } from "../plugin.js";

test("it should copy changes from the sourceLix into the targetLix that do not exist in targetLix yet", async () => {
	const mockChanges: NewChange[] = [
		{
			id: "1",
			operation: "create",
			type: "mock",
			value: { id: "mock-id", color: "red" },
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
		{
			id: "2",
			operation: "update",
			type: "mock",
			value: { id: "mock-id", color: "blue" },
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
		{
			id: "3",
			operation: "update",
			type: "mock",
			value: { id: "mock-id", color: "green" },
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];

	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: vi.fn(),
		},
		detectConflicts: vi.fn().mockResolvedValue([]),
		applyChanges: vi.fn().mockResolvedValue({ fileData: new Uint8Array() }),
	};

	const sourceLix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	const targetLix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	await sourceLix.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[1]!, mockChanges[2]!])
		.execute();

	await targetLix.db.insertInto("change").values([mockChanges[0]!]).execute();

	await targetLix.db
		.insertInto("file")
		.values({
			id: "mock-file",
			path: "/mock-file.json",
			data: new TextEncoder().encode(JSON.stringify({})),
		})
		.execute();

	await merge({ sourceLix, targetLix });

	const changes = await targetLix.db
		.selectFrom("change")
		.select("id")
		.execute();

	expect(changes.map((c) => c.id)).toStrictEqual([
		mockChanges[0]?.id,
		mockChanges[1]?.id,
		mockChanges[2]?.id,
	]);

	expect(mockPlugin.applyChanges).toHaveBeenCalledTimes(1);
	expect(mockPlugin.detectConflicts).toHaveBeenCalledTimes(1);
});

test("it should save change conflicts", async () => {
	const mockChanges: NewChange[] = [
		{
			id: "1",
			operation: "create",
			type: "mock",
			value: { id: "mock-id", color: "red" },
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
		{
			id: "2",
			operation: "update",
			type: "mock",
			value: { id: "mock-id", color: "blue" },
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
		{
			id: "3",
			operation: "update",
			type: "mock",
			value: { id: "mock-id", color: "green" },
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];

	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: vi.fn(),
		},
		detectConflicts: vi.fn().mockResolvedValue([
			{
				change_id: mockChanges[1]!.id,
				conflicting_change_id: mockChanges[2]!.id,
			} satisfies NewConflict,
		]),
		applyChanges: vi.fn().mockResolvedValue({ fileData: new Uint8Array() }),
	};

	const sourceLix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	const targetLix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	await sourceLix.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[2]!])
		.execute();

	await targetLix.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[1]!])
		.execute();

	await targetLix.db
		.insertInto("file")
		.values({
			id: "mock-file",
			path: "/mock-file.json",
			data: new TextEncoder().encode(JSON.stringify({})),
		})
		.execute();

	await merge({ sourceLix, targetLix });

	const conflicts = await targetLix.db
		.selectFrom("conflict")
		.select(["change_id", "conflicting_change_id"])
		.execute();

	expect(conflicts.length).toBe(1);
	expect(conflicts[0]).toEqual({
		change_id: mockChanges[1]!.id,
		conflicting_change_id: mockChanges[2]!.id,
	});
});

test("diffing should not be invoked to prevent the generation of duplicate changes", async () => {
	const commonChanges: NewChange[] = [
		{
			id: "1",
			operation: "create",
			type: "mock",
			value: { id: "mock-id", color: "red" },
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];

	const changesOnlyInTargetLix: NewChange[] = [];
	const changesOnlyInSourceLix: NewChange[] = [
		{
			id: "2",
			operation: "update",
			type: "mock",
			value: { id: "mock-id", color: "blue" },
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];

	const mockPluginInSourceLix: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: vi.fn(),
		},
		detectConflicts: vi.fn().mockResolvedValue([]),
		applyChanges: vi.fn().mockResolvedValue({ fileData: new Uint8Array() }),
	};

	const mockPluginInTargetLix: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: vi.fn(),
		},
		detectConflicts: vi.fn().mockResolvedValue([]),
		applyChanges: vi.fn().mockResolvedValue({ fileData: new Uint8Array() }),
	};

	const sourceLix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPluginInSourceLix],
	});

	const targetLix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPluginInTargetLix],
	});

	await sourceLix.db
		.insertInto("change")
		.values([...commonChanges, ...changesOnlyInSourceLix])
		.execute();

	await targetLix.db
		.insertInto("change")
		.values([...commonChanges, ...changesOnlyInTargetLix])
		.execute();

	await targetLix.db
		.insertInto("file")
		.values({
			id: "mock-file",
			path: "/mock-file.json",
			data: new TextEncoder().encode(JSON.stringify({})),
		})
		.execute();

	await merge({ sourceLix, targetLix });

	expect(mockPluginInSourceLix.diff.file).toHaveBeenCalledTimes(0);
	// once for the mock file insert
	expect(mockPluginInTargetLix.diff.file).toHaveBeenCalledTimes(1);
});

test("it should apply changes that are not conflicting", async () => {
	const mockChanges: NewChange[] = [
		{
			id: "1",
			operation: "create",
			type: "mock",
			value: { id: "mock-id", color: "red" },
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
		{
			id: "2",
			operation: "update",
			type: "mock",
			value: { id: "mock-id", color: "blue" },
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
		{
			id: "3",
			operation: "update",
			type: "mock",
			value: { id: "mock-id", color: "green" },
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];

	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: vi.fn(),
		},
		detectConflicts: vi.fn().mockResolvedValue([]),
		applyChanges: vi.fn().mockResolvedValue({
			fileData: new TextEncoder().encode(
				// @ts-expect-error - expects parsed json
				mockChanges[1]!.value,
			),
		}),
	};

	const sourceLix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	const targetLix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	await sourceLix.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[1]!])
		.execute();

	await targetLix.db.insertInto("change").values([mockChanges[0]!]).execute();

	await targetLix.db
		.insertInto("file")
		.values({
			id: "mock-file",
			path: "/mock-file.json",
			data: new TextEncoder().encode(JSON.stringify({})),
		})
		.execute();

	await merge({ sourceLix, targetLix });

	const changes = await targetLix.db.selectFrom("change").selectAll().execute();
	const conflicts = await targetLix.db
		.selectFrom("conflict")
		.selectAll()
		.execute();

	const file = await targetLix.db
		.selectFrom("file")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(changes.length).toBe(2);
	expect(conflicts.length).toBe(0);
	expect(file.data).toEqual(
		new TextEncoder().encode(
			// @ts-expect-error - expects parsed json
			mockChanges[1]!.value,
		),
	);
});

test("subsequent merges should not lead to duplicate changes and/or conflicts", async () => {
	const commonChanges: NewChange[] = [
		{
			id: "1",
			operation: "create",
			type: "mock",
			value: { id: "mock-id", color: "red" },
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];
	const changesOnlyInTargetLix: NewChange[] = [];
	const changesOnlyInSourceLix: NewChange[] = [
		{
			id: "2",
			operation: "update",
			type: "mock",
			value: { id: "mock-id", color: "blue" },
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];

	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: vi.fn(),
		},
		detectConflicts: vi.fn().mockResolvedValue([
			{
				change_id: commonChanges[0]!.id,
				conflicting_change_id: changesOnlyInSourceLix[0]!.id,
			} satisfies NewConflict,
		]),
		applyChanges: vi.fn().mockResolvedValue({ fileData: new Uint8Array() }),
	};

	const sourceLix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	const targetLix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	await sourceLix.db
		.insertInto("change")
		.values([...commonChanges, ...changesOnlyInSourceLix])
		.execute();

	await targetLix.db
		.insertInto("change")
		.values([...commonChanges, ...changesOnlyInTargetLix])
		.execute();

	await targetLix.db
		.insertInto("file")
		.values({
			id: "mock-file",
			path: "/mock-file.json",
			data: new TextEncoder().encode(JSON.stringify({})),
		})
		.execute();

	await merge({ sourceLix, targetLix });

	const changes = await targetLix.db.selectFrom("change").selectAll().execute();

	const conflicts = await targetLix.db
		.selectFrom("conflict")
		.selectAll()
		.execute();

	expect(changes.length).toBe(2);
	expect(conflicts.length).toBe(1);

	await merge({ sourceLix, targetLix });

	const changesAfterSecondMerge = await targetLix.db
		.selectFrom("change")
		.selectAll()
		.execute();

	const conflictsAfterSecondMerge = await targetLix.db
		.selectFrom("conflict")
		.selectAll()
		.execute();

	expect(changesAfterSecondMerge.length).toBe(2);
	expect(conflictsAfterSecondMerge.length).toBe(1);
});

test("it should naively copy changes from the sourceLix into the targetLix that do not exist in targetLix yet", async () => {
	const changesOnlyInSourceLix: NewChange[] = [
		{
			id: "2",
			operation: "update",
			commit_id: "commit-1",
			type: "mock",
			value: { id: "mock-id", color: "blue" },
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];

	const commitsOnlyInSourceLix: NewCommit[] = [
		{
			id: "commit-1",
			description: "",
			parent_id: "0",
		},
	];

	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: vi.fn(),
		},
		detectConflicts: vi.fn().mockResolvedValue([]),
		applyChanges: vi.fn().mockResolvedValue({ fileData: new Uint8Array() }),
	};

	const sourceLix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	const targetLix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	await targetLix.db
		.insertInto("file")
		.values({ id: "mock-file", path: "", data: new Uint8Array() })
		.execute();

	await sourceLix.db
		.insertInto("change")
		.values(changesOnlyInSourceLix)
		.execute();

	await sourceLix.db
		.insertInto("commit")
		.values(commitsOnlyInSourceLix)
		.execute();

	await merge({ sourceLix, targetLix });

	const changes = await targetLix.db.selectFrom("change").selectAll().execute();
	const commits = await targetLix.db.selectFrom("commit").selectAll().execute();

	expect(changes.length).toBe(1);
	expect(commits.length).toBe(1);
	expect(changes[0]?.commit_id).toBe("commit-1");
});

test("it should copy discussion and related comments and mappings", async () => {
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
		detectConflicts: vi.fn().mockResolvedValue([]),
		applyChanges: vi.fn().mockResolvedValue({ fileData: new Uint8Array() }),
	};
	const lix1 = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	lix1.currentAuthor.set("Test User");

	const enc = new TextEncoder();

	await lix1.db
		.insertInto("file")
		.values({ id: "test", path: "test.txt", data: enc.encode("test") })
		.execute();

	await lix1.settled();

	// The files have to be there before we merge
	const lix2 = await openLixInMemory({
		blob: await lix1.toBlob(),
		providePlugins: [mockPlugin],
	});

	lix2.currentAuthor.set("Test User 2");

	const changes = await lix1.db.selectFrom("change").selectAll().execute();

	// console.log(await lix.db.selectFrom("queue").selectAll().execute());

	expect(changes).toEqual([
		{
			id: changes[0]?.id,
			author: "Test User",
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

	await lix1.createDiscussion({
		changeIds: [changes[0]!.id],
		body: "comment on a change",
	});

	await merge({ sourceLix: lix1, targetLix: lix2 });

	const commentsLix2AfterMerge = await lix2.db
		.selectFrom("comment")
		.selectAll()
		.execute();
	const commentsLix1 = await lix1.db
		.selectFrom("comment")
		.selectAll()
		.execute();

	// lix 2 has no comments yet so after lix 1 into 2 we should be in sync
	expect(commentsLix1).toEqual(commentsLix2AfterMerge);

	await lix2.addComment({
		parentCommentId: commentsLix2AfterMerge[0]!.id,
		body: "wrote in lix 2",
	});
	await lix1.addComment({
		parentCommentId: commentsLix2AfterMerge[0]!.id,
		body: "wrote in lix 1",
	});

	const commentsLix1OnSecondMerge = await lix1.db
		.selectFrom("comment")
		.selectAll()
		.execute();

	await merge({ sourceLix: lix1, targetLix: lix2 });

	const commentsLix2AfterSecondMerge = await lix2.db
		.selectFrom("comment")
		.selectAll()
		.execute();

	// lix should know the ne comment from lix 1 but lix 1 should miss the new comment in lix2
	expect(commentsLix2AfterSecondMerge.length).toBe(
		commentsLix1OnSecondMerge.length + 1,
	);

	await merge({ sourceLix: lix1, targetLix: lix2 });

	// TODO add test for discussions and discussion maps
});