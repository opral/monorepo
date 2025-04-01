import { test, expect } from "vitest";
import { changeIsLeafV2 } from "./change-is-leaf-v2.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeSet } from "../change-set/create-change-set.js";

test("selects only the latest change in an ancestry chain", async () => {
	const lix = await openLixInMemory({});

	// Create snapshots
	const snapshot0 = await lix.db
		.insertInto("snapshot")
		.values({ content: { value: "content0" } })
		.returning("id")
		.executeTakeFirstOrThrow();

	const snapshot1 = await lix.db
		.insertInto("snapshot")
		.values({ content: { value: "content1" } })
		.returning("id")
		.executeTakeFirstOrThrow();

	const snapshot2 = await lix.db
		.insertInto("snapshot")
		.values({ content: { value: "content2" } })
		.returning("id")
		.executeTakeFirstOrThrow();

	// Create changes for the same entity/file in different change sets
	const change0 = await lix.db
		.insertInto("change")
		.values({
			entity_id: "entity-1",
			file_id: "file-1",
			plugin_key: "test",
			schema_key: "test",
			snapshot_id: snapshot0.id,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const change1 = await lix.db
		.insertInto("change")
		.values({
			entity_id: "entity-1",
			file_id: "file-1",
			plugin_key: "test",
			schema_key: "test",
			snapshot_id: snapshot1.id,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const change2 = await lix.db
		.insertInto("change")
		.values({
			entity_id: "entity-1",
			file_id: "file-1",
			plugin_key: "test",
			schema_key: "test",
			snapshot_id: snapshot2.id,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const changeSet0 = await createChangeSet({ lix, changes: [change0] });
	const changeSet1 = await createChangeSet({
		lix,
		changes: [change1],
		parents: [changeSet0],
	});
	const changeSet2 = await createChangeSet({
		lix,
		changes: [change2],
		parents: [changeSet1],
	});

	// Test the filter - should only return change2 (the latest in the ancestry chain)
	const leafChanges = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where((eb) =>
			eb.or([
				eb("change_set_element.change_set_id", "=", changeSet0.id),
				eb("change_set_element.change_set_id", "=", changeSet1.id),
				eb("change_set_element.change_set_id", "=", changeSet2.id),
			])
		)
		.where(changeIsLeafV2(changeSet2.id))
		.selectAll("change")
		.execute();

	// Should only include change2 (the latest change in the ancestry chain)
	expect(leafChanges).toHaveLength(1);
	expect(leafChanges[0]?.id).toBe(change2.id);
});


