import { test, expect } from "vitest";
import { getLeafChange } from "./get-leaf-change.js";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import type { NewChange } from "../database/schema.js";
import { mockJsonSnapshot } from "./mock-json-snapshot.js";

test("it should find the latest child of a given change", async () => {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
	});

	const mockSnapshots = [
		mockJsonSnapshot(["change 1"]),
		mockJsonSnapshot(["change 2"]),
		mockJsonSnapshot(["change 3"]),
	];

	const mockChanges: NewChange[] = [
		{
			id: "1",
			parent_id: undefined,
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: mockSnapshots[0]!.id,
		},
		{
			id: "2",
			parent_id: "1",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: mockSnapshots[1]!.id,
		},
		{
			id: "3",
			parent_id: "2",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock",
			type: "mock",
			snapshot_id: mockSnapshots[2]!.id,
		},
	];
	await lix.db
		.insertInto("snapshot")
		.values(
			mockSnapshots.map((s) => {
				return { content: s.content };
			}),
		)
		.execute();
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
