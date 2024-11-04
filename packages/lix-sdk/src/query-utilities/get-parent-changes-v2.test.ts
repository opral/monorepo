import { test, expect } from "vitest";
import { openLixInMemory } from "../open/openLixInMemory.js";
import type { ChangeGraphEdge, NewChange } from "../database/schema.js";
import { getParentChangesV2 } from "./get-parent-changes-v2.js";

test("it should return the parent change of a change", async () => {
	const lix = await openLixInMemory({});

	const mockChanges: NewChange[] = [
		{
			id: "change0",
			file_id: "mock",
			entity_id: "value0",
			plugin_key: "mock",
			snapshot_id: "no-content",
			type: "mock",
		},
		{
			id: "change1",
			file_id: "mock",
			entity_id: "value1",
			plugin_key: "mock",
			snapshot_id: "no-content",
			type: "mock",
		},
		{
			id: "change2",
			file_id: "mock",
			entity_id: "value1",
			plugin_key: "mock",
			snapshot_id: "no-content",
			type: "mock",
		},
		{
			id: "change3",
			file_id: "mock",
			entity_id: "value1",
			plugin_key: "mock",
			snapshot_id: "no-content",
			type: "mock",
		},
		{
			id: "change4",
			file_id: "mock",
			entity_id: "value1",
			plugin_key: "mock",
			snapshot_id: "no-content",
			type: "mock",
		},
	];

	const mockEdges: ChangeGraphEdge[] = [
		// including a grandparent to ensure the function is
		// not including this as parent of change3
		{ parent_id: "change0", child_id: "change1" },
		// actual parents of change 3
		{ parent_id: "change1", child_id: "change3" },
		{ parent_id: "change2", child_id: "change3" },
		// included for re-assurance that the function is
		// not including this as parent of change3
		{ parent_id: "change3", child_id: "change4" },
	];

	await lix.db.insertInto("change").values(mockChanges).execute();
	await lix.db.insertInto("change_graph_edge").values(mockEdges).execute();

	const parentChanges = await getParentChangesV2({
		lix,
		change: { id: "change3" },
	});

	expect(parentChanges.map((change) => change.id)).toStrictEqual([
		"change1",
		"change2",
	]);
});
