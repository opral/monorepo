import { test, expect } from "vitest";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { createChangeSet } from "./create-change-set.js";

test("creating a change set should succeed", async () => {
	const lix = await openLixInMemory({});

	const mockChanges = await lix.db
		.insertInto("change")
		.values([
			{
				type: "file",
				entity_id: "value1",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "sn1",
			},
			{
				type: "file",
				entity_id: "value2",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "sn2",
			},
		])
		.returningAll()
		.execute();

	const changeSet = await createChangeSet({
		lix,
		changeIds: mockChanges.map((change) => change.id),
	});

	const changeSetMembers = await lix.db
		.selectFrom("change_set_membership")
		.selectAll()
		.where("change_set_id", "=", changeSet.id)
		.execute();

	expect(changeSetMembers.map((member) => member.change_id)).toStrictEqual([
		mockChanges[0]?.id,
		mockChanges[1]?.id,
	]);
});
