import { newLixFile, openLixInMemory, type Change } from "@lix-js/sdk";
import { test, expect } from "vitest";
import { getChangesNotInTarget } from "./getChangesNotInTarget.js";

test("it should find the changes that are not in target", async () => {
	const sourceLix = await openLixInMemory({
		blob: await newLixFile(),
	});
	const targetLix = await openLixInMemory({
		blob: await newLixFile(),
	});
	const commonChanges: Change[] = [
		{
			id: "1",
			file_id: "mock",
			operation: "create",
			plugin_key: "mock",
			type: "mock",
		},
	];
	await targetLix.db.insertInto("change").values(commonChanges).execute();
	const changesNotInTarget: Change[] = [
		{
			id: "2",
			file_id: "mock",
			operation: "create",
			plugin_key: "mock",
			type: "mock",
		},
	];
	await sourceLix.db
		.insertInto("change")
		.values([...commonChanges, ...changesNotInTarget])
		.execute();

	const result = await getChangesNotInTarget({
		sourceLix: sourceLix,
		targetLix: targetLix,
	});

	expect(result.map((c) => c.id)).toEqual(["2"]);
});
