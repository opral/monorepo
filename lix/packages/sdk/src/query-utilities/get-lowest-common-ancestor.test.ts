/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { test, expect } from "vitest";
import { getLowestCommonAncestor } from "./get-lowest-common-ancestor.js";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import type { NewChange } from "../database/schema.js";

test("it should find the common parent of two changes recursively", async () => {
	const sourceLix = await openLixInMemory({
		blob: await newLixFile(),
	});
	const targetLix = await openLixInMemory({
		blob: await newLixFile(),
	});
	const mockSnapshots = [
		{
			id: "sn1",
			value: ["snapshot 1"],
		},
		{
			id: "sn2",
			value: ["snaptshot 3"],
		},
		{
			id: "sn3",
			value: ["snapshot 4"],
		},
	];

	const mockChanges: NewChange[] = [
		{
			id: "0",
			parent_id: undefined,
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: "sn1",
		},
		{
			id: "1",
			parent_id: "0",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: "sn2",
		},
		{
			id: "2",
			parent_id: "1",
			file_id: "mock",
			entity_id: "value1",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: "sn3",
		},
	];

	await targetLix.db
		.insertInto("snapshot")
		.values([mockSnapshots[0]!])
		.executeTakeFirst();

	await targetLix.db
		.insertInto("change")
		.values([mockChanges[0]!])
		.executeTakeFirst();

	await sourceLix.db
		.insertInto("snapshot")
		// lix b has two update changes
		.values([mockSnapshots[0]!, mockSnapshots[1]!, mockSnapshots[2]!])
		.execute();

	await sourceLix.db
		.insertInto("change")
		// lix b has two update changes
		.values([mockChanges[0]!, mockChanges[1]!, mockChanges[2]!])
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
		{
			id: "sn1",
			value: ["change 1"],
		},
		{
			id: "sn2",
			value: ["change 2"],
		},
		{
			id: "sn3",
			value: ["change 3"],
		},
	];

	const mockChanges: NewChange[] = [
		{
			id: "0",
			// no parent == create change
			parent_id: undefined,
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: "sn1",
		},
		{
			id: "1",
			parent_id: "0",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: "sn2",
		},
		{
			id: "2",
			entity_id: "value2",
			// no parent == create change
			parent_id: undefined,
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: "sn3",
		},
	];

	await targetLix.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[1]!])
		.executeTakeFirst();

	await targetLix.db
		.insertInto("snapshot")
		.values([mockSnapshots[0]!, mockSnapshots[1]!])
		.execute();

	await sourceLix.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[1]!, mockChanges[2]!])
		.executeTakeFirst();

	await sourceLix.db
		.insertInto("snapshot")
		.values([mockSnapshots[0]!, mockSnapshots[1]!, mockSnapshots[2]!])
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
		{
			id: "sn1",
			value: ["change 1"],
		},
		{
			id: "sn2",
			value: ["change 2"],
		},
		{
			id: "sn3",
			value: ["change 3"],
		},
	];

	const mockChanges: NewChange[] = [
		{
			id: "0",
			entity_id: "value1",
			parent_id: undefined,
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: "sn1",
		},
		{
			id: "1",
			entity_id: "value1",
			parent_id: "0",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: "sn2",
		},
	];

	await targetLix.db
		.insertInto("snapshot")
		.values([mockSnapshots[0]!, mockSnapshots[1]!])
		.execute();

	await targetLix.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[1]!])
		.executeTakeFirst();

	await sourceLix.db
		.insertInto("snapshot")
		.values([mockSnapshots[0]!, mockSnapshots[1]!])
		.execute();

	await sourceLix.db
		.insertInto("change")
		.values([mockChanges[0]!, mockChanges[1]!])
		.executeTakeFirst();

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
