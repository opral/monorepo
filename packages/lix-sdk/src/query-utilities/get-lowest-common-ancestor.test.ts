import { test, expect } from "vitest";
import { getLowestCommonAncestor } from "./get-lowest-common-ancestor.js";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import type { NewChange } from "../database/schema.js";
import { mockJsonSnapshot } from "./mock-json-snapshot.js";

test("it should find the common parent of two changes recursively", async () => {
	const sourceLix = await openLixInMemory({
		blob: await newLixFile(),
	});
	const targetLix = await openLixInMemory({
		blob: await newLixFile(),
	});

	const mockSnapshots = [
		mockJsonSnapshot(["change 1"]),
		mockJsonSnapshot(["change 2"]),
		mockJsonSnapshot(["change 3"]),
	];

	const mockChanges: NewChange[] = [
		{
			id: "0",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: mockSnapshots[0]!.id,
		},
		{
			id: "1",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: mockSnapshots[1]!.id,
		},
		{
			id: "2",
			file_id: "mock",
			entity_id: "value1",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: mockSnapshots[2]!.id,
		},
	];

	const edges = [
		{ parent_id: "0", child_id: "1" },
		{ parent_id: "1", child_id: "2" },
	];

	await targetLix.db
		.insertInto("snapshot")
		.values(
			[mockSnapshots[0]!].map((s) => {
				return { content: s.content };
			}),
		)
		.executeTakeFirst();

	await targetLix.db
		.insertInto("change")
		.values([mockChanges[0]!])
		.executeTakeFirst();

	await sourceLix.db
		.insertInto("snapshot")
		// lix b has two update changes
		.values(
			[mockSnapshots[0]!, mockSnapshots[1]!, mockSnapshots[2]!].map((s) => {
				return { content: s.content };
			}),
		)
		.execute();

	await sourceLix.db
		.insertInto("change")
		// lix b has two update changes
		.values([mockChanges[0]!, mockChanges[1]!, mockChanges[2]!])
		.execute();

	await sourceLix.db
		.insertInto("change_graph_edge")
		.values([edges[0]!, edges[1]!])
		.execute();

	const secondChange = await sourceLix.db
		.selectFrom("change")
		.selectAll()
		.where("id", "=", mockChanges[2]!.id!)
		.executeTakeFirstOrThrow();

	const commonAncestor = await getLowestCommonAncestor({
		sourceChange: secondChange,
		sourceLix,
		targetLix,
	});

	expect(commonAncestor?.id).toBe("0");
});

test("it should return undefined if no common parent exists", async () => {
	const sourceLix = await openLixInMemory({
		blob: await newLixFile(),
	});
	const targetLix = await openLixInMemory({
		blob: await newLixFile(),
	});

	const mockSnapshots = [
		mockJsonSnapshot(["change 1"]),
		mockJsonSnapshot(["change 2"]),
		mockJsonSnapshot(["change 3"]),
	];

	const mockChanges: NewChange[] = [
		{
			id: "0",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: mockSnapshots[0]!.id,
		},
		{
			id: "1",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: mockSnapshots[1]!.id,
		},
		{
			id: "2",
			entity_id: "value2",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: mockSnapshots[2]!.id,
		},
	];

	await targetLix.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[1]!])
		.executeTakeFirst();

	await targetLix.db
		.insertInto("snapshot")
		.values(
			[mockSnapshots[0]!, mockSnapshots[1]!].map((s) => {
				return { content: s.content };
			}),
		)
		.execute();

	await targetLix.db
		.insertInto("change_graph_edge")
		.values([{ parent_id: "0", child_id: "1" }])
		.execute();

	await sourceLix.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[1]!, mockChanges[2]!])
		.executeTakeFirst();

	await sourceLix.db
		.insertInto("snapshot")
		.values(
			[mockSnapshots[0]!, mockSnapshots[1]!, mockSnapshots[2]!].map((s) => {
				return { content: s.content };
			}),
		)
		.execute();

	await sourceLix.db
		.insertInto("change_graph_edge")
		.values([{ parent_id: "0", child_id: "1" }])
		.execute();

	const insertedChange = await sourceLix.db
		.selectFrom("change")
		.selectAll()
		.where("id", "=", mockChanges[2]!.id!)
		.executeTakeFirstOrThrow();

	const commonAncestor = await getLowestCommonAncestor({
		sourceChange: insertedChange,
		targetLix,
		sourceLix,
	});

	expect(commonAncestor?.id).toBe(undefined);
});

test("it should return the source change if its the common parent", async () => {
	const sourceLix = await openLixInMemory({
		blob: await newLixFile(),
	});
	const targetLix = await openLixInMemory({
		blob: await newLixFile(),
	});

	const mockSnapshots = [
		mockJsonSnapshot(["change 1"]),
		mockJsonSnapshot(["change "]),
		mockJsonSnapshot(["change 3"]),
	];

	const mockChanges: NewChange[] = [
		{
			id: "0",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: mockSnapshots[0]!.id,
		},
		{
			id: "1",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: mockSnapshots[1]!.id,
		},
	];

	const mockEdges = [{ parent_id: "0", child_id: "1" }];

	await targetLix.db
		.insertInto("snapshot")
		.values(
			[mockSnapshots[0]!, mockSnapshots[1]!].map((s) => {
				return { content: s.content };
			}),
		)
		.execute();

	await targetLix.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[1]!])
		.executeTakeFirst();

	await targetLix.db
		.insertInto("change_graph_edge")
		.values(mockEdges)
		.execute();

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
		.executeTakeFirst();

	await sourceLix.db
		.insertInto("change_graph_edge")
		.values(mockEdges)
		.execute();

	const changeOne = await sourceLix.db
		.selectFrom("change")
		.selectAll()
		.where("id", "=", mockChanges[1]!.id!)
		.executeTakeFirstOrThrow();

	const commonParent = await getLowestCommonAncestor({
		sourceChange: changeOne!,
		targetLix,
		sourceLix,
	});

	expect(commonParent?.id).toBe(mockChanges[1]?.id);
});
