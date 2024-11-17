import { test, expect, vi } from "vitest";
import { openLixInMemory } from "./open-lix-in-memory.js";
import { newLixFile } from "./new-lix.js";
import { merge } from "./merge.js";
import type {
	ChangeGraphEdge,
	NewChange,
	NewSnapshot,
	Snapshot,
} from "../database/schema.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";
import { mockJsonSnapshot } from "../snapshot/mock-json-snapshot.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { createDiscussion } from "../discussion/create-discussion.js";
import { createComment } from "../discussion/create-comment.js";
import { changeQueueSettled } from "../change-queue/change-queue-settled.js";

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
			schema_key: "mock",
			snapshot_id: mockSnapshots[0]!.id,
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
		{
			id: "2",
			entity_id: "value1",
			schema_key: "mock",
			snapshot_id: mockSnapshots[1]!.id,
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
		{
			id: "3",
			entity_id: "value1",
			schema_key: "mock",
			snapshot_id: mockSnapshots[2]!.id,
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];

	const mockEdges: ChangeGraphEdge[] = [{ parent_id: "2", child_id: "3" }];

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
		"no-content",
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
	// expect(mockPlugin.detectConflicts).toHaveBeenCalledTimes(1);
});

test.todo("it should save change conflicts", async () => {
	const mockSnapshots = [
		mockJsonSnapshot({ id: "mock-id", color: "red" }),
		mockJsonSnapshot({ id: "mock-id", color: "blue" }),
		mockJsonSnapshot({ id: "mock-id", color: "green" }),
	];

	const mockChanges: NewChange[] = [
		{
			id: "1",
			schema_key: "mock",
			entity_id: "value1",
			snapshot_id: mockSnapshots[0]!.id,
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
		{
			id: "2",
			schema_key: "mock",
			entity_id: "value1",
			snapshot_id: mockSnapshots[1]!.id,
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
		{
			id: "3",
			schema_key: "mock",
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
			},
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

	// const conflicts = await targetLix.db
	// 	.selectFrom("conflict")
	// 	.select(["change_id", "conflicting_change_id"])
	// 	.execute();

	// expect(conflicts.length).toBe(1);
	// expect(conflicts[0]).toEqual({
	// 	change_id: mockChanges[1]!.id,
	// 	conflicting_change_id: mockChanges[2]!.id,
	// });
});

test("diffing should not be invoked to prevent the generation of duplicate changes", async () => {
	const commonSnapshots = [mockJsonSnapshot({ id: "mock-id", color: "red" })];

	const commonChanges: NewChange[] = [
		{
			id: "1",
			schema_key: "mock",
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
			schema_key: "mock",
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
		detectChangesGlob: "*",
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

// https://github.com/opral/lix-sdk/issues/126
test.todo("it should apply changes that are not conflicting", async () => {
	const mockSnapshots: Snapshot[] = [
		mockJsonSnapshot({ color: "red" }),
		mockJsonSnapshot({ color: "blue" }),
	];

	const mockChanges: NewChange[] = [
		{
			id: "1",
			schema_key: "mock",
			entity_id: "value1",
			snapshot_id: mockSnapshots[0]!.id,
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
		{
			id: "2",
			entity_id: "value1",
			schema_key: "mock",
			snapshot_id: mockSnapshots[1]!.id,
			file_id: "mock-file",
			plugin_key: "mock-plugin",
		},
	];

	const edges: ChangeGraphEdge[] = [{ parent_id: "1", child_id: "2" }];

	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		applyChanges: async ({ lix, changes }) => {
			const lastChange = changes[changes.length - 1];
			const snapshot = await lix.db
				.selectFrom("snapshot")
				.where("id", "=", lastChange!.snapshot_id)
				.selectAll()
				.executeTakeFirstOrThrow();
			const fileData = new TextEncoder().encode(
				JSON.stringify(snapshot.content ?? {}),
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
			[mockSnapshots[0]!, mockSnapshots[1]!].map((s) => ({
				content: s.content,
			})),
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

	await changeQueueSettled({ lix: targetLix });

	await merge({ sourceLix, targetLix });
	const changes = await targetLix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll("change")
		.select("snapshot.content")
		.execute();

	// const conflicts = await targetLix.db
	// 	.selectFrom("conflict")
	// 	.selectAll()
	// 	.execute();

	const file = await targetLix.db
		.selectFrom("file")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(changes.length).toBe(2);
	// expect(conflicts.length).toBe(0);
	expect(file.data).toEqual(
		new TextEncoder().encode(JSON.stringify(mockSnapshots[1]!.content!)),
	);
});

test.todo(
	"subsequent merges should not lead to duplicate changes and/or conflicts",
	async () => {
		const commonSnapshots = [mockJsonSnapshot({ id: "mock-id", color: "red" })];
		const commonChanges: NewChange[] = [
			{
				id: "1",
				schema_key: "mock",
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
				schema_key: "mock",
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
				},
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

		const changes = await targetLix.db
			.selectFrom("change")
			.selectAll()
			.execute();

		// const conflicts = await targetLix.db
		// 	.selectFrom("conflict")
		// 	.selectAll()
		// 	.execute();

		expect(changes.length).toBe(2);
		// expect(conflicts.length).toBe(1);

		await merge({ sourceLix, targetLix });

		const changesAfterSecondMerge = await targetLix.db
			.selectFrom("change")
			.selectAll()
			.execute();

		// const conflictsAfterSecondMerge = await targetLix.db
		// 	.selectFrom("conflict")
		// 	.selectAll()
		// 	.execute();

		expect(changesAfterSecondMerge.length).toBe(2);
		// expect(conflictsAfterSecondMerge.length).toBe(1);
	},
);

test("it should naively copy changes from the sourceLix into the targetLix that do not exist in targetLix yet", async () => {
	const snapshotsOnlyInSourceLix: Snapshot[] = [
		mockJsonSnapshot({ id: "mock-id", color: "blue" }),
	];
	const changesOnlyInSourceLix: NewChange[] = [
		{
			id: "2",
			entity_id: "value1",
			schema_key: "mock",
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
		detectChangesGlob: "*",
		detectChanges: async ({ after }) => {
			return [
				{
					schema: {
						key: "text",
						type: "json",
					},
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

	await changeQueueSettled({ lix: lix1 });

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
			schema_key: "text",
			file_id: "test",
			entity_id: "test",
			plugin_key: "mock-plugin",
			content: {
				text: "inserted text",
			},
		},
	]);

	await createDiscussion({
		lix: lix1,
		changeSet: await createChangeSet({ lix: lix1, changes: [changes[0]!] }),
		content: "comment on a change",
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

	await createComment({
		lix: lix2,
		parentComment: commentsLix2AfterMerge[0]!,
		content: "wrote in lix 2",
	});
	await createComment({
		lix: lix1,
		parentComment: commentsLix2AfterMerge[0]!,
		content: "wrote in lix 1",
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

test.skip("it should copy change sets and merge memberships", async () => {
	const targetLix = await openLixInMemory({});

	const currentVersion = await targetLix.db
		.selectFrom("current_version")
		.innerJoin("version", "current_version.id", "version.id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const mockChanges = await targetLix.db
		.insertInto("change")
		.values([
			{
				schema_key: "file",
				entity_id: "value1",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
			{
				schema_key: "file",
				entity_id: "value2",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	const changeSet1 = await createChangeSet({
		lix: targetLix,
		changes: [mockChanges[0]!],
	});

	const sourceLix = await openLixInMemory({
		blob: await targetLix.toBlob(),
	});

	// expand the change set to contain another change
	// to test if the sets are merged
	await targetLix.db
		.insertInto("change_set_element")
		.values({
			change_set_id: changeSet1.id,
			change_id: mockChanges[1]!.id,
		})
		.execute();

	// create a new set just for change [1]
	const changeSet2 = await createChangeSet({
		lix: targetLix,
		changes: [mockChanges[1]!],
	});

	await merge({ sourceLix, targetLix });

	const changeSets = await targetLix.db
		.selectFrom("change_set")
		.selectAll()
		// the initial change set for a version
		.where("id", "is not", "00000000-0000-0000-0000-000000000000")
		.execute();

	const changeSet1Items = await targetLix.db
		.selectFrom("change_set_element")
		.selectAll()
		.where("change_set_id", "=", changeSet1.id)
		.execute();
	const changeSet2Items = await targetLix.db
		.selectFrom("change_set_element")
		.selectAll()
		.where("change_set_id", "=", changeSet2.id)
		.execute();

	// expect two change sets (exluding the current versiones change set)
	expect(
		changeSets.filter((s) => s.id !== currentVersion.change_set_id).length,
	).toBe(2);

	// expect merger of the change set to contain both changes
	expect(changeSet1Items.map((item) => item.change_id)).toEqual(
		expect.arrayContaining([mockChanges[0]?.id, mockChanges[1]?.id]),
	);

	// expect the second change set to contain only the second change
	expect(changeSet2Items.map((item) => item.change_id)).toEqual(
		expect.arrayContaining([mockChanges[1]?.id]),
	);
});
