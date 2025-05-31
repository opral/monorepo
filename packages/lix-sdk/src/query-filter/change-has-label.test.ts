import { test, expect } from "vitest";
import { changeHasLabel } from "./change-has-label.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeSet } from "../change-set/create-change-set.js";

test.todo("should only return changes with the given label", async () => {
	const lix = await openLixInMemory({});

	const changes0 = await lix.db
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
		.returningAll()
		.execute();

	const set = await createChangeSet({
		lix,
		elements: [
			{
				change_id: changes0[0]!.id,
				entity_id: changes0[0]!.entity_id,
				schema_key: changes0[0]!.schema_key,
				file_id: changes0[0]!.file_id,
			},
		],
		labels: [],
	});

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
		.where(changeHasLabel({ name: "mocked" }))
		.selectAll()
		.execute();

	expect(changes).toHaveLength(1);
	expect(changes[0]?.id).toBe("change1");
});
