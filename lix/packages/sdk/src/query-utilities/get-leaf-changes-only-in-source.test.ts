import { test, expect } from "vitest";
import { getLeafChangesOnlyInSource } from "./get-leaf-changes-only-in-source.js";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import type { NewChange } from "../database/schema.js";
import { createPhantomSnapshot } from "./create-phantom-snapshot.js";

test("it should get the leaf changes that only exist in source", async () => {
	const sourceLix = await openLixInMemory({
		blob: await newLixFile(),
	});
	const targetLix = await openLixInMemory({
		blob: await newLixFile(),
	});

	const commonSnapshots = [
		createPhantomSnapshot({ id: "mock-id", color: "red" }),
		createPhantomSnapshot({ id: "mock-id", color: "blue" }),
	];

	const commonChanges: NewChange[] = [
		{
			id: "c1",
			file_id: "mock",
			entity_id: "value1",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: commonSnapshots[0]!.id,
		},
		{
			id: "c2",
			file_id: "mock",
			entity_id: "value1",
			parent_id: "c1",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: commonSnapshots[1]!.id,
		},
	];

	const snapshotsOnlyInSource = [
		createPhantomSnapshot({ id: "mock-id", color: "pink" }),
		createPhantomSnapshot({ id: "mock-id", color: "orange" }),
		createPhantomSnapshot({ id: "mock-id", color: "yellow" }),
	];

	const changesOnlyInSource: NewChange[] = [
		{
			id: "s1",
			file_id: "mock",
			entity_id: "value1",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: snapshotsOnlyInSource[0]!.id,
		},
		{
			id: "s2",
			parent_id: "s1",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: snapshotsOnlyInSource[1]!.id,
		},
		{
			id: "s3",
			parent_id: "s2",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: snapshotsOnlyInSource[2]!.id,
		},
	];

	const snapshotsOnlyInTarget = [
		createPhantomSnapshot({ id: "mock-id", color: "black" }),
	];

	const changesOnlyInTarget: NewChange[] = [
		{
			id: "t1",
			parent_id: "c2",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: snapshotsOnlyInTarget[0]!.id,
		},
	];

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

	const result = await getLeafChangesOnlyInSource({
		sourceLix: sourceLix,
		targetLix: targetLix,
	});

	// only the last change in the source is expected,
	// not s1 and s2 which are parents of s3
	expect(result.map((c) => c.id)).toEqual(["s3"]);
});
