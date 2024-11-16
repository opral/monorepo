import { test, expect } from "vitest";
import { getLeafChangesOnlyInSource } from "./merge.get-leaf-changes-only-in-source.js";
import { openLixInMemory } from "./open-lix-in-memory.js";
import { newLixFile } from "./new-lix.js";
import type { NewChange } from "../database/schema.js";
import { mockJsonSnapshot } from "../snapshot/mock-json-snapshot.js";

test("it should get the leaf changes that only exist in source", async () => {
	const sourceLix = await openLixInMemory({
		blob: await newLixFile(),
	});
	const targetLix = await openLixInMemory({
		blob: await newLixFile(),
	});

	const commonSnapshots = [
		mockJsonSnapshot({ id: "mock-id", color: "red" }),
		mockJsonSnapshot({ id: "mock-id", color: "blue" }),
	];

	const commonChanges: NewChange[] = [
		{
			id: "c1",
			file_id: "mock",
			entity_id: "value1",
			plugin_key: "mock",
			schema_key: "mock",
			snapshot_id: commonSnapshots[0]!.id,
		},
		{
			id: "c2",
			file_id: "mock",
			entity_id: "value1",
			plugin_key: "mock",
			schema_key: "mock",
			snapshot_id: commonSnapshots[1]!.id,
		},
	];

	const commonChangesEdges = [{ parent_id: "c1", child_id: "c2" }];

	const snapshotsOnlyInSource = [
		mockJsonSnapshot({ id: "mock-id", color: "pink" }),
		mockJsonSnapshot({ id: "mock-id", color: "orange" }),
		mockJsonSnapshot({ id: "mock-id", color: "yellow" }),
	];

	const changesOnlyInSource: NewChange[] = [
		{
			id: "s1",
			file_id: "mock",
			entity_id: "value1",
			plugin_key: "mock",
			schema_key: "mock",
			snapshot_id: snapshotsOnlyInSource[0]!.id,
		},
		{
			id: "s2",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			schema_key: "mock",
			snapshot_id: snapshotsOnlyInSource[1]!.id,
		},
		{
			id: "s3",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			schema_key: "mock",
			snapshot_id: snapshotsOnlyInSource[2]!.id,
		},
	];

	const changesOnlyInSourceEdges = [
		{ parent_id: "s1", child_id: "s2" },
		{ parent_id: "s2", child_id: "s3" },
	];

	const snapshotsOnlyInTarget = [
		mockJsonSnapshot({ id: "mock-id", color: "black" }),
	];

	const changesOnlyInTarget: NewChange[] = [
		{
			id: "t1",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			schema_key: "mock",
			snapshot_id: snapshotsOnlyInTarget[0]!.id,
		},
	];

	const changesOnlyInTargetEdges = [{ parent_id: "c2", child_id: "t1" }];

	await targetLix.db
		.insertInto("snapshot")
		.values(
			[...commonSnapshots, ...snapshotsOnlyInTarget].map((s) => {
				return { content: s.content };
			}),
		)
		.execute();

	await targetLix.db
		.insertInto("change")
		.values([...commonChanges, ...changesOnlyInTarget])
		.execute();

	await targetLix.db
		.insertInto("change_edge")
		.values([...commonChangesEdges, ...changesOnlyInTargetEdges])
		.execute();

	await sourceLix.db
		.insertInto("snapshot")
		.values(
			[...commonSnapshots, ...snapshotsOnlyInSource].map((s) => {
				return { content: s.content };
			}),
		)
		.execute();

	await sourceLix.db
		.insertInto("change")
		.values([...commonChanges, ...changesOnlyInSource])
		.execute();

	await sourceLix.db
		.insertInto("change_edge")
		.values([...commonChangesEdges, ...changesOnlyInSourceEdges])
		.execute();

	const result = await getLeafChangesOnlyInSource({
		sourceLix: sourceLix,
		targetLix: targetLix,
	});

	// only the last change in the source is expected,
	// not s1 and s2 which are parents of s3
	expect(result.map((c) => c.id)).toEqual(["s3"]);
});
