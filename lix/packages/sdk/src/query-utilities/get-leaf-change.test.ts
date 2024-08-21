/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { newLixFile, openLixInMemory, type Change } from "@lix-js/sdk";
import { test, expect } from "vitest";
import { getLeafChange } from "./get-leaf-change.js";

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

	const leafOfChange01 = await getLeafChange({
		change: mockChanges[0]!,
		lix,
	});

	expect(leafOfChange01?.id).toBe("3");

	const leafOfChange2 = await getLeafChange({
		change: mockChanges[1]!,
		lix,
	});

	expect(leafOfChange2?.id).toBe("3");

	const leafOfChange3 = await getLeafChange({
		change: mockChanges[2]!,
		lix,
	});

	expect(leafOfChange3?.id).toBe("3");
});
