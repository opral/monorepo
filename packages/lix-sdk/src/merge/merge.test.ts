import { test, expect, vi } from "vitest";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import { merge } from "./merge.js";
import type {
	ChangeEdge,
	NewChange,
	NewConflict,
	NewSnapshot,
	Snapshot,
} from "../database/schema.js";
import type { LixPlugin } from "../plugin.js";
import { mockJsonSnapshot } from "../query-utilities/mock-json-snapshot.js";

test("it should copy changes from the sourceLix into the targetLix that do not exist in targetLix yet", async () => {
	const mockSnapshots = [
		mockJsonSnapshot({ id: "mock-id", color: "red" }),
		mockJsonSnapshot({ id: "mock-id", color: "blue" }),
		mockJsonSnapshot({ id: "mock-id", color: "green" }),
	];

	const mockChanges: NewChange[] = [
		{
			id: "1",
			entity_id: "value1",
			type: "mock",
			snapshot_id: mockSnapshots[0]!.id,
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
		{
			id: "2",
			entity_id: "value1",
			type: "mock",
			snapshot_id: mockSnapshots[1]!.id,
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
		{
			id: "3",
			entity_id: "value1",
			type: "mock",
			snapshot_id: mockSnapshots[2]!.id,
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];

	const mockEdges: ChangeEdge[] = [{ parent_id: "2", child_id: "3" }];

	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
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
		.insertInto("snapshot")

		.values(
			[mockSnapshots[0]!, mockSnapshots[1]!, mockSnapshots[2]!].map((s) => {
				return { content: s.content };
			}),
		)
		.execute();

	await sourceLix.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[1]!, mockChanges[2]!])
		.execute();

	await sourceLix.db
		.insertInto("change_edge")
		.values([mockEdges[0]!])
		.execute();

	await targetLix.db
		.insertInto("snapshot")
		.values(
			[mockSnapshots[0]!].map((s) => {
				return { content: s.content };
			}),
		)
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

	const snapshots = await targetLix.db
		.selectFrom("snapshot")
		.select("id")
		.execute();

	expect(snapshots.map((c) => c.id)).toStrictEqual([
		mockSnapshots[0]?.id,
		mockSnapshots[1]?.id,
		mockSnapshots[2]?.id,
	]);

	const edges = await targetLix.db
		.selectFrom("change_edge")
		.selectAll()
		.execute();

	expect(edges).toEqual(mockEdges);

	expect(mockPlugin.applyChanges).toHaveBeenCalledTimes(1);
	expect(mockPlugin.detectConflicts).toHaveBeenCalledTimes(1);
});

test("it should save change conflicts", async () => {
	const mockSnapshots = [
		mockJsonSnapshot({ id: "mock-id", color: "red" }),
		mockJsonSnapshot({ id: "mock-id", color: "blue" }),
		mockJsonSnapshot({ id: "mock-id", color: "green" }),
	];

	const mockChanges: NewChange[] = [
		{
			id: "1",
			type: "mock",
			entity_id: "value1",
			snapshot_id: mockSnapshots[0]!.id,
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
		{
			id: "2",
			type: "mock",
			entity_id: "value1",
			snapshot_id: mockSnapshots[1]!.id,
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
		{
			id: "3",
			type: "mock",
			entity_id: "value1",
			snapshot_id: mockSnapshots[2]!.id,
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];

	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		detectConflicts: vi.fn().mockResolvedValue([
			{
				change_id: mockChanges[1]!.id!,
				conflicting_change_id: mockChanges[2]!.id!,
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

	await sourceLix.db
		.insertInto("snapshot")
		.values(
			[mockSnapshots[0]!, mockSnapshots[2]!].map((s) => {
				return { content: s.content };
			}),
		)
		.execute();

	await targetLix.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[1]!])
		.execute();

	await targetLix.db
		.insertInto("snapshot")
		.values(
			[mockSnapshots[0]!, mockSnapshots[2]!].map((s) => {
				return { content: s.content };
			}),
		)
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
	const commonSnapshots = [mockJsonSnapshot({ id: "mock-id", color: "red" })];

	const commonChanges: NewChange[] = [
		{
			id: "1",
			type: "mock",
			snapshot_id: commonSnapshots[0]!.id,
			entity_id: "value1",
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];

	const snapshotsOnlyInTargetLix: NewSnapshot[] = [];
	const changesOnlyInTargetLix: NewChange[] = [];

	const snapshotsOnlyInSourceLix: Snapshot[] = [
		mockJsonSnapshot({ id: "mock-id", color: "blue" }),
	];
	const changesOnlyInSourceLix: NewChange[] = [
		{
			id: "2",
			type: "mock",
			entity_id: "value1",
			snapshot_id: snapshotsOnlyInSourceLix[0]!.id,
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];

	const mockPluginInSourceLix: LixPlugin = {
		key: "mock-plugin",
		detectChanges: vi.fn().mockResolvedValue([]),
		detectConflicts: vi.fn().mockResolvedValue([]),
		applyChanges: vi.fn().mockResolvedValue({ fileData: new Uint8Array() }),
	};

	const mockPluginInTargetLix: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		detectChanges: vi.fn().mockResolvedValue([]),
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
		.insertInto("snapshot")
		.values(
			[...commonSnapshots, ...snapshotsOnlyInSourceLix].map((s) => {
				return { content: s.content };
			}),
		)
		.execute();

	await sourceLix.db
		.insertInto("change")
		.values([...commonChanges, ...changesOnlyInSourceLix])
		.execute();

	await targetLix.db
		.insertInto("snapshot")
		.values(
			[...commonSnapshots, ...snapshotsOnlyInTargetLix].map((s) => {
				return { content: s.content };
			}),
		)
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

	expect(mockPluginInSourceLix.detectChanges).toHaveBeenCalledTimes(0);
	// once for the mock file insert
	expect(mockPluginInTargetLix.detectChanges).toHaveBeenCalledTimes(1);
});

test("it should apply changes that are not conflicting", async () => {
	const mockSnapshots: Snapshot[] = [
		mockJsonSnapshot({ color: "red" }),
		mockJsonSnapshot({ color: "blue" }),
	];

	const mockChanges: NewChange[] = [
		{
			id: "1",
			type: "mock",
			entity_id: "value1",
			snapshot_id: mockSnapshots[0]!.id,
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
		{
			id: "2",
			entity_id: "value1",
			type: "mock",
			snapshot_id: mockSnapshots[1]!.id,
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];

	const edges: ChangeEdge[] = [{ parent_id: "1", child_id: "2" }];

	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		applyChanges: async ({ changes }) => {
			const lastChange = changes[changes.length - 1];
			const fileData = new TextEncoder().encode(
				JSON.stringify(lastChange!.content ?? {}),
			);
			return { fileData };
		},
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
		.insertInto("snapshot")
		.values(
			[mockSnapshots[0]!, mockSnapshots[1]!].map((s) => {
				return { content: s.content };
			}),
		)
		.execute();

	await sourceLix.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[1]!])
		.execute();

	await sourceLix.db.insertInto("change_edge").values([edges[0]!]).execute();

	await targetLix.db
		.insertInto("snapshot")
		.values(
			[mockSnapshots[0]!].map((s) => {
				return { content: s.content };
			}),
		)
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

	await targetLix.settled();

	await merge({ sourceLix, targetLix });
	const changes = await targetLix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll("change")
		.select("snapshot.content")
		.execute();

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
		new TextEncoder().encode(JSON.stringify(mockSnapshots[1]!.content!)),
	);
});

test("subsequent merges should not lead to duplicate changes and/or conflicts", async () => {
	const commonSnapshots = [mockJsonSnapshot({ id: "mock-id", color: "red" })];
	const commonChanges: NewChange[] = [
		{
			id: "1",
			type: "mock",
			entity_id: "value1",
			snapshot_id: commonSnapshots[0]!.id,
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];
	const snapshotsOnlyInTargetLix: NewSnapshot[] = [];
	const changesOnlyInTargetLix: NewChange[] = [];

	const snapshotsOnlyInSourceLix: Snapshot[] = [
		mockJsonSnapshot({ id: "mock-id", color: "blue" }),
	];
	const changesOnlyInSourceLix: NewChange[] = [
		{
			id: "2",
			type: "mock",
			entity_id: "value1",
			snapshot_id: snapshotsOnlyInSourceLix[0]!.id,
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];

	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		detectConflicts: vi.fn().mockResolvedValue([
			{
				change_id: commonChanges[0]!.id!,
				conflicting_change_id: changesOnlyInSourceLix[0]!.id!,
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
		.insertInto("snapshot")
		.values(
			[...commonSnapshots, ...snapshotsOnlyInSourceLix].map((s) => {
				return { content: s.content };
			}),
		)
		.execute();

	await sourceLix.db
		.insertInto("change")
		.values([...commonChanges, ...changesOnlyInSourceLix])
		.execute();

	await targetLix.db
		.insertInto("snapshot")
		.values(
			[...commonSnapshots, ...snapshotsOnlyInTargetLix].map((s) => {
				return { content: s.content };
			}),
		)
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
	const snapshotsOnlyInSourceLix: Snapshot[] = [
		mockJsonSnapshot({ id: "mock-id", color: "blue" }),
	];
	const changesOnlyInSourceLix: NewChange[] = [
		{
			id: "2",
			entity_id: "value1",
			type: "mock",
			snapshot_id: snapshotsOnlyInSourceLix[0]!.id,
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];

	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
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
		.insertInto("snapshot")
		.values(
			snapshotsOnlyInSourceLix.map((s) => {
				return { content: s.content };
			}),
		)
		.execute();

	await sourceLix.db
		.insertInto("change")
		.values(changesOnlyInSourceLix)
		.execute();

	await merge({ sourceLix, targetLix });

	const changes = await targetLix.db.selectFrom("change").selectAll().execute();

	expect(changes.length).toBe(1);
});

test("it should copy discussion and related comments and mappings", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		detectChanges: async ({ after }) => {
			return [
				{
					type: "text",
					entity_id: "test",
					snapshot: after
						? { text: new TextDecoder().decode(after?.data) }
						: undefined,
				},
			];
		},
		applyChanges: async () => ({ fileData: new Uint8Array() }),
	};

	const lix1 = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	const enc = new TextEncoder();

	await lix1.db
		.insertInto("file")
		.values({ id: "test", path: "test.txt", data: enc.encode("inserted text") })
		.execute();

	await lix1.settled();

	// The files have to be there before we merge
	const lix2 = await openLixInMemory({
		blob: await lix1.toBlob(),
		providePlugins: [mockPlugin],
	});

	const changes = await lix1.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll("change")
		.select("snapshot.content")
		.execute();

	expect(changes).toEqual([
		{
			id: changes[0]?.id,
			created_at: changes[0]?.created_at,
			snapshot_id: changes[0]?.snapshot_id,
			type: "text",
			file_id: "test",
			entity_id: "test",
			plugin_key: "mock-plugin",
			content: {
				text: "inserted text",
			},
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