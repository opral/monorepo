import { test, expect } from "vitest";
import { changeIsLeafChange } from "./change-is-leaf-change.js";
import { openLixInMemory } from "../open/openLixInMemory.js";

test("should only return the leaf change", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("change")
		.values([
			{
				id: "change1",
				snapshot_id: "empty-content",
				entity_id: "mock1",
				file_id: "mock",
				plugin_key: "mock",
				type: "mock",
			},
			{
				id: "change2",
				snapshot_id: "empty-content",
				entity_id: "mock2",
				file_id: "mock",
				plugin_key: "mock",
				type: "mock",
			},
			{
				id: "change3",
				snapshot_id: "empty-content",
				entity_id: "mock2",
				file_id: "mock",
				plugin_key: "mock",
				type: "mock",
			},
		])
		.execute();

	await lix.db
		.insertInto("change_graph_edge")
		.values([{ parent_id: "change2", child_id: "change3" }])
		.execute();

	const changes = await lix.db
		.selectFrom("change")
		.where(changeIsLeafChange())
		.selectAll()
		.execute();

	expect(changes).toHaveLength(2);
	expect(changes.map((c) => c.id)).toEqual(["change1", "change3"]);
});
