import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { changeSetElementIsLeaf } from "./change-set-element-is-leaf.js";
import { changeSetElementInAncestryOf } from "./change-set-element-in-ancestry-of.js";

test("returns only leaf change_set_elements per entity", async () => {
	const lix = await openLixInMemory({});

	// Insert 3 snapshots for the same entity
	const snapshots = await lix.db
		.insertInto("snapshot")
		.values([
			{ content: { val: "0" } },
			{ content: { val: "1" } },
			{ content: { val: "2" } },
		])
		.returning("id")
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c0",
				entity_id: "e0",
				file_id: "f1",
				schema_key: "test",
				plugin_key: "p",
				snapshot_id: snapshots[0]!.id,
			},
			{
				id: "c1",
				entity_id: "e1",
				file_id: "f1",
				schema_key: "test",
				plugin_key: "p",
				snapshot_id: snapshots[1]!.id,
			},
			{
				id: "c2",
				entity_id: "e1",
				file_id: "f1",
				schema_key: "test",
				plugin_key: "p",
				snapshot_id: snapshots[2]!.id,
			},
		])
		.returningAll()
		.execute();

	const cs0 = await createChangeSet({ lix, id: "cs0", changes: [changes[0]!] });
	const cs1 = await createChangeSet({
		lix,
		id: "cs1",
		changes: [changes[1]!],
		parents: [cs0],
	});
	const cs2 = await createChangeSet({
		lix,
		id: "cs2",
		changes: [changes[2]!],
		parents: [cs1],
	});

	// Only c2 should be the leaf (latest definition in the ancestry)
	const leafChanges = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where("change_set_element.change_set_id", "in", [cs0.id, cs1.id, cs2.id])
		.where(changeSetElementIsLeaf())
		.select(["change.id", "change.entity_id"])
		.execute();

	expect(leafChanges).toEqual([
		{ id: "c0", entity_id: "e0" },
		{ id: "c2", entity_id: "e1" },
	]);
});

test("works in combination with changeSetElementInAncestryOf()", async () => {
	const lix = await openLixInMemory({});

	// Insert 3 snapshots for the same entity
	const snapshots = await lix.db
		.insertInto("snapshot")
		.values([
			{ content: { val: "0" } },
			{ content: { val: "1" } },
			{ content: { val: "2" } },
		])
		.returning("id")
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c0",
				entity_id: "e1",
				file_id: "f1",
				schema_key: "test",
				plugin_key: "p",
				snapshot_id: snapshots[0]!.id,
			},
			{
				id: "c1",
				entity_id: "e2",
				file_id: "f1",
				schema_key: "test",
				plugin_key: "p",
				snapshot_id: snapshots[1]!.id,
			},
			{
				id: "c2",
				entity_id: "e1",
				file_id: "f1",
				schema_key: "test",
				plugin_key: "p",
				snapshot_id: snapshots[2]!.id,
			},
		])
		.returningAll()
		.execute();

	const cs0 = await createChangeSet({ lix, id: "cs0", changes: [changes[0]!] });
	const cs1 = await createChangeSet({
		lix,
		id: "cs1",
		changes: [changes[1]!],
		parents: [cs0],
	});
	const cs2 = await createChangeSet({
		lix,
		id: "cs2",
		changes: [changes[2]!],
		parents: [cs1],
	});

	// Only c2 should be the leaf (latest definition in the ancestry)
	const leafChanges = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where(changeSetElementIsLeaf())
		.where(changeSetElementInAncestryOf(cs2))
		.select(["change.id", "change.entity_id"])
		.execute();

	expect(leafChanges).toEqual([
		{ id: "c1", entity_id: "e2" },
		{ id: "c2", entity_id: "e1" },
	]);
});
