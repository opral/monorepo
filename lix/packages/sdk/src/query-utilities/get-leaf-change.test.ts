/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { test, expect } from "vitest";
import { getLeafChange } from "./get-leaf-change.js";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import type { NewChange } from "../database/schema.js";

test("it should find the latest child of a given change", async () => {
	const lix = await openLixInMemory({
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
			id: "1",
			parent_id: undefined,
			operation: "create",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: "sn1",
		},
		{
			id: "2",
			parent_id: "1",
			operation: "update",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: "sn2",
		},
		{
			id: "3",
			parent_id: "2",
			operation: "update",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: "sn3",
		},
	];
	await lix.db.insertInto("snapshot").values(mockSnapshots).execute();
	await lix.db.insertInto("change").values(mockChanges).execute();

	const changes = await lix.db.selectFrom("change").selectAll().execute();

	const leafOfChange01 = await getLeafChange({
		change: changes[0]!,
		lix,
	});

	expect(leafOfChange01?.id).toBe("3");

	const leafOfChange2 = await getLeafChange({
		change: changes[1]!,
		lix,
	});

	expect(leafOfChange2?.id).toBe("3");

	const leafOfChange3 = await getLeafChange({
		change: changes[2]!,
		lix,
	});

	expect(leafOfChange3?.id).toBe("3");
});
