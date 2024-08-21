/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { newLixFile, openLixInMemory, type Change } from "@lix-js/sdk";
import { test, expect } from "vitest";
import { getLowestCommonAncestor } from "./get-lowest-common-ancestor.js";

test("it should find the common parent of two changes recursively", async () => {
	const sourceLix = await openLixInMemory({
		blob: await newLixFile(),
	});
	const targetLix = await openLixInMemory({
		blob: await newLixFile(),
	});

	const mockChanges: Change[] = [
		{
			id: "0",
			parent_id: undefined,
			operation: "create",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			// @ts-expect-error - type error in lix
			value: JSON.stringify(["change 0"]),
		},
		{
			id: "1",
			parent_id: "0",
			operation: "update",
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
	];

	await targetLix.db
		.insertInto("change")
		.values([mockChanges[0]!])
		.executeTakeFirst();

	await sourceLix.db
		.insertInto("change")
		// lix b has two update changes
		.values([mockChanges[0]!, mockChanges[1]!, mockChanges[2]!])
		.executeTakeFirst();

	const commonParent = await getLowestCommonAncestor({
		sourceChange: mockChanges[2]!,
		sourceLix,
		targetLix,
	});

	expect(commonParent?.id).toBe("0");
});

test("it should return undefined if no common parent exists", async () => {
	const sourceLix = await openLixInMemory({
		blob: await newLixFile(),
	});
	const targetLix = await openLixInMemory({
		blob: await newLixFile(),
	});

	const mockChanges: Change[] = [
		{
			id: "0",
			parent_id: undefined,
			operation: "create",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			// @ts-expect-error - type error in lix
			value: JSON.stringify(["change 0"]),
		},
		{
			id: "1",
			parent_id: "0",
			operation: "update",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			// @ts-expect-error - type error in lix
			value: JSON.stringify(["change 1"]),
		},
		{
			id: "2",
			parent_id: undefined,
			operation: "create",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			// @ts-expect-error - type error in lix
			value: JSON.stringify(["change 2"]),
		},
	];

	await targetLix.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[1]!])
		.executeTakeFirst();

	await sourceLix.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[1]!, mockChanges[2]!])
		.executeTakeFirst();

	const commonParent = await getLowestCommonAncestor({
		sourceChange: mockChanges[2]!,
		targetLix,
		sourceLix,
	});

	expect(commonParent?.id).toBe(undefined);
});

test("it should return the source change if its the common parent", async () => {
	const sourceLix = await openLixInMemory({
		blob: await newLixFile(),
	});
	const targetLix = await openLixInMemory({
		blob: await newLixFile(),
	});

	const mockChanges: Change[] = [
		{
			id: "0",
			parent_id: undefined,
			operation: "create",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			// @ts-expect-error - type error in lix
			value: JSON.stringify(["change 0"]),
		},
		{
			id: "1",
			parent_id: "0",
			operation: "update",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			// @ts-expect-error - type error in lix
			value: JSON.stringify(["change 1"]),
		},
	];

	await targetLix.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[1]!])
		.executeTakeFirst();

	await sourceLix.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[1]!])
		.executeTakeFirst();

	const commonParent = await getLowestCommonAncestor({
		sourceChange: mockChanges[1]!,
		targetLix,
		sourceLix,
	});

	expect(commonParent?.id).toBe(mockChanges[1]?.id);
});
