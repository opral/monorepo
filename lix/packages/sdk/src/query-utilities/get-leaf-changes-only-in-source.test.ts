import { test, expect } from "vitest";
import { getLeafChangesOnlyInSource } from "./get-leaf-changes-only-in-source.js";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import type { NewChange } from "../database/schema.js";

test("it should get the leaf changes that only exist in source", async () => {
	const sourceLix = await openLixInMemory({
		blob: await newLixFile(),
	});
	const targetLix = await openLixInMemory({
		blob: await newLixFile(),
	});

	const commonSnapshots = [{
		id: 'snc1',
		value: { id: "mock-id", color: "red" },
	},{
		id: 'snc2',
		value: { id: "mock-id", color: "blue" },
	}]

	const commonChanges: NewChange[] = [
		{
			id: "c1",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: "snc1",
		},
		{
			id: "c2",
			file_id: "mock",
			parent_id: "c1",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: "snc2",
		},
	];

	const snapshotsOnlyInSource = [
		{
			id: "sns1",
			value: { id: "mock-id", color: "pink" },
		},
		{
			id: "sns2",
			value: { id: "mock-id", color: "orange" },
		},
		{
			id: "sns3",
			value: { id: "mock-id", color: "yellow" },
		},
	];

	const changesOnlyInSource: NewChange[] = [
		{
			id: "s1",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: "sns1",
		},
		{
			id: "s2",
			parent_id: "s1",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: "sns2",
		},
		{
			id: "s3",
			parent_id: "s2",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: "sns3",
		},
	];

	const snapshotsOnlyInTarget = [{
		id: 'snt1',
		value: { id: "mock-id", color: "black" },
	}]
	

	const changesOnlyInTarget: NewChange[] = [
		{
			id: "t1",
			parent_id: "c2",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: "snt1",
		},
	];

	await targetLix.db
		.insertInto("snapshot")
		.values([...commonSnapshots, ...snapshotsOnlyInTarget])
		.execute();

	await targetLix.db
		.insertInto("change")
		.values([...commonChanges, ...changesOnlyInTarget])
		.execute();

	await sourceLix.db
		.insertInto("snapshot")
		.values([...commonSnapshots, ...snapshotsOnlyInSource])
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
