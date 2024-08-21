import { newLixFile, openLixInMemory, type Change } from "@lix-js/sdk";
import { test, expect } from "vitest";
import { getLeafChangesOnlyInSource } from "./get-leaf-changes-only-in-source.js";

test("it should get the leaf changes that only exist in source", async () => {
	const sourceLix = await openLixInMemory({
		blob: await newLixFile(),
	});
	const targetLix = await openLixInMemory({
		blob: await newLixFile(),
	});
	const commonChanges: Change[] = [
		{
			id: "c1",
			file_id: "mock",
			operation: "create",
			plugin_key: "mock",
			type: "mock",
		},
		{
			id: "c2",
			file_id: "mock",
			parent_id: "c1",
			operation: "create",
			plugin_key: "mock",
			type: "mock",
		},
	];
	const changesOnlyInSource: Change[] = [
		{
			id: "s1",
			file_id: "mock",
			operation: "create",
			plugin_key: "mock",
			type: "mock",
		},
		{
			id: "s2",
			parent_id: "s1",
			file_id: "mock",
			operation: "update",
			plugin_key: "mock",
			type: "mock",
		},
		{
			id: "s3",
			parent_id: "s2",
			file_id: "mock",
			operation: "update",
			plugin_key: "mock",
			type: "mock",
		},
	];
	const changesOnlyInTarget: Change[] = [
		{
			id: "t1",
			parent_id: "c2",
			file_id: "mock",
			operation: "create",
			plugin_key: "mock",
			type: "mock",
		},
	];

	await targetLix.db
		.insertInto("change")
		.values([...commonChanges, ...changesOnlyInTarget])
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
