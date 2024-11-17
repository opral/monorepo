import { test, expect } from "vitest";
import { changeHasLabel } from "./change-has-label.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeSet } from "../change-set/create-change-set.js";

test("should only return changes with the given label", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("change")
		.values([
			{
				id: "change1",
				snapshot_id: "no-content",
				entity_id: "mock",
				file_id: "mock",
				plugin_key: "mock",
				schema_key: "mock",
			},
			{
				id: "change2",
				snapshot_id: "no-content",
				entity_id: "mock",
				file_id: "mock",
				plugin_key: "mock",
				schema_key: "mock",
			},
		])
		.execute();

	const set = await createChangeSet({ lix, changes: [{ id: "change1" }] });

	const label = await lix.db
		.insertInto("label")
		.values({ name: "mocked" })
		.returningAll()
		.executeTakeFirstOrThrow();

	await lix.db
		.insertInto("change_set_label")
		.values({ change_set_id: set.id, label_id: label.id })
		.execute();

	const changes = await lix.db
		.selectFrom("change")
		.where(changeHasLabel("mocked"))
		.selectAll()
		.execute();

	expect(changes).toHaveLength(1);
	expect(changes[0]?.id).toBe("change1");
});
