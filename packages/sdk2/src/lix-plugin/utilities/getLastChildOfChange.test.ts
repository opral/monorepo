/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { newLixFile, openLixInMemory, type Change } from "@lix-js/sdk";
import { test, expect } from "vitest";
import { getLastChildOfChange } from "./getLastChildOfChange.js";

test("it should find the latest child of a given change", async () => {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
	});

	const mockChanges: Change[] = [
		{
			id: "1",
			parent_id: undefined,
			operation: "create",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			// @ts-expect-error - type error in lix
			value: JSON.stringify(["change 1"]),
		},
		{
			id: "2",
			parent_id: "1",
			operation: "update",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			// @ts-expect-error - type error in lix
			value: JSON.stringify(["change 2"]),
		},
		{
			id: "3",
			parent_id: "2",
			operation: "update",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			// @ts-expect-error - type error in lix
			value: JSON.stringify(["change 3"]),
		},
	];

	await lix.db.insertInto("change").values(mockChanges).executeTakeFirst();

	const lastChangeOf1 = await getLastChildOfChange({
		change: mockChanges[0]!,
		lix,
	});

	expect(lastChangeOf1?.id).toBe("3");

	const lastChangeOf2 = await getLastChildOfChange({
		change: mockChanges[1]!,
		lix,
	});

	expect(lastChangeOf2?.id).toBe("3");

	const lastChangeOf3 = await getLastChildOfChange({
		change: mockChanges[2]!,
		lix,
	});

	expect(lastChangeOf3?.id).toBe("3");
});
