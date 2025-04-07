import { test, expect } from "vitest";
import { changeIsLeafV3 } from "./change-is-leaf-v2.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeSet } from "../change-set/create-change-set.js";

test("selects only the leaf changes in recursive mode", async () => {
	const lix = await openLixInMemory({});

	const snapshots = await lix.db
		.insertInto("snapshot")
		.values([
			{ content: { value: "content0" } },
			{ content: { value: "content1" } },
			{ content: { value: "content2" } },
		])
		.returning("id")
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c0",
				entity_id: "entity-1",
				file_id: "file-1",
				plugin_key: "test",
				schema_key: "test",
				// purposefully out of order
				created_at: "2023-01-01T00:00:00.000Z",
				snapshot_id: snapshots[0]!.id,
			},
			{
				id: "c1",
				entity_id: "entity-1",
				file_id: "file-1",
				plugin_key: "test",
				schema_key: "test",
				created_at: "2022-01-01T00:00:00.000Z",
				snapshot_id: snapshots[1]!.id,
			},
			{
				id: "c2",
				entity_id: "entity-1",
				file_id: "file-1",
				plugin_key: "test",
				schema_key: "test",
				created_at: "2021-01-01T00:00:00.000Z",
				snapshot_id: snapshots[2]!.id,
			},
		])
		.returningAll()
		.execute();

	const cs0 = await createChangeSet({
		lix,
		parents: [],
		changes: [changes[0]!],
	});
	const cs1 = await createChangeSet({
		lix,
		parents: [cs0],
		changes: [changes[1]!],
	});
	const cs2 = await createChangeSet({
		lix,
		parents: [cs1],
		changes: [changes[2]!],
	});

	// should only return change2 (the leaf change)
	const leafChanges = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where("change_set_element.change_set_id", "=", cs2.id)
		.where(changeIsLeafV3())
		.select("change.id")
		.execute();

	expect(leafChanges).toEqual([{ id: "c2" }]);
});

test("leaf changes with different entity ids", async () => {
	const lix = await openLixInMemory({});

	const snapshots = await lix.db
		.insertInto("snapshot")
		.values([
			{ content: { text: "Line 0" } },
			{ content: { text: "Line 1" } },
			{ content: { text: "Line 2" } },
		])
		.returning("id")
		.execute();

	// Create changes for different lines
	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c0",
				file_id: "file-1",
				plugin_key: "text.plugin",
				entity_id: "l0", // Line 0
				schema_key: "line",
				snapshot_id: snapshots[0]!.id,
			},
			{
				id: "c1",
				file_id: "file-1",
				plugin_key: "text.plugin",
				entity_id: "l1", // Line 1
				schema_key: "line",
				snapshot_id: snapshots[1]!.id,
			},
			{
				id: "c2",
				file_id: "file-1",
				plugin_key: "text.plugin",
				entity_id: "l2", // Line 2
				schema_key: "line",
				snapshot_id: snapshots[2]!.id,
			},
		])
		.returningAll()
		.execute();

	// Create change sets in a chain: cs0 -> cs1 -> cs2
	const cs0 = await createChangeSet({
		lix,
		changes: [changes[0]!], // Line 0
	});

	const cs1 = await createChangeSet({
		lix,
		changes: [changes[1]!], // Line 1
		parents: [cs0],
	});

	const cs2 = await createChangeSet({
		lix,
		changes: [changes[2]!], // Line 2
		parents: [cs1],
	});

	// Test the filter with cs2 - should return leaf changes from the entire ancestry
	const leafChanges = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where("change_set_element.change_set_id", "in", [cs0.id, cs1.id, cs2.id])
		.where(changeIsLeafV3())
		.selectAll("change")
		.execute();

	// should include all three changes
	// by traversing cs2 -> cs1 -> cs0
	expect(leafChanges).toHaveLength(3);
});

test("ignores leaf changes of child change sets if the change sets are filtered", async () => {
	const lix = await openLixInMemory({});

	const snapshots = await lix.db
		.insertInto("snapshot")
		.values([{ content: { text: "Line 0" } }, { content: { text: "Line 1" } }])
		.returning("id")
		.execute();

	// Create changes for different lines
	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c0",
				entity_id: "l0",
				file_id: "file0",
				plugin_key: "mock_plugin",
				schema_key: "line",
				snapshot_id: snapshots[0]!.id,
				created_at: "2023-01-01T01:00:00.000Z",
			},
			{
				id: "c1",
				entity_id: "l1",
				file_id: "file0",
				plugin_key: "mock_plugin",
				schema_key: "line",
				snapshot_id: snapshots[0]!.id,
				created_at: "2023-01-01T00:00:00.000Z",
			},
		])
		.returningAll()
		.execute();

	// Create change set
	const cs0 = await createChangeSet({
		lix,
		id: "cs0",
		changes: [changes[0]!],
	});

	await createChangeSet({
		lix,
		id: "cs1",
		changes: [changes[1]!],
		parents: [cs0],
	});

	const leafChanges = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where("change_set_element.change_set_id", "=", cs0.id)
		.where(changeIsLeafV3())
		.select("change.id")
		.execute();

	// should ignore the leaf changes in cs1
	expect(leafChanges).toEqual([{ id: "c0" }]);
});