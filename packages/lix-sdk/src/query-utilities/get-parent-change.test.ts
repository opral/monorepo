import { test, expect } from "vitest";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import type { ChangeEdge, NewChange, NewConflict } from "../database/schema.js";
import { getParentChange } from "./get-parent-change.js";

test("it should return the parent change of a change", async () => {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
	});

	const mockChanges: NewChange[] = [
		{
			id: "change1",
			file_id: "mock",
			entity_id: "value1",
			plugin_key: "mock",
			snapshot_id: "sn1",
			type: "mock",
		},
		{
			id: "change2",
			file_id: "mock",
			entity_id: "value1",
			plugin_key: "mock",
			snapshot_id: "sn2",
			type: "mock",
		},
		{
			id: "change3",
			file_id: "mock",
			entity_id: "value1",
			plugin_key: "mock",
			snapshot_id: "sn3",
			type: "mock",
		},
	];

	const mockEdges: ChangeEdge[] = [
		{ parent_id: "change1", child_id: "change3" },
		{ parent_id: "change2", child_id: "change3" },
	];

	const mockConflicts: NewConflict[] = [
		{ change_id: "change1", conflicting_change_id: "change2" },
	];

	await lix.db.insertInto("change").values(mockChanges).execute();
	await lix.db.insertInto("change_edge").values(mockEdges).execute();
	await lix.db.insertInto("conflict").values(mockConflicts).execute();

	const parentChange = await getParentChange({
		lix,
		change: { id: "change3" },
	});

	// expecting change 1 because while change 2 exists, it's conflicting
	// and is not applied.
	expect(parentChange?.id).toEqual("change1");
});
