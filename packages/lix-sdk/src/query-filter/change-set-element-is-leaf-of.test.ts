import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { changeSetElementInAncestryOf } from "./change-set-element-in-ancestry-of.js";
import { changeSetElementIsLeafOf } from "./change-set-element-is-leaf-of.js";

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
		.where(changeSetElementIsLeafOf(cs2))
		.select(["change.id", "change.entity_id"])
		.execute();

	expect(leafChanges).toEqual([
		{ id: "c0", entity_id: "e0" },
		{ id: "c2", entity_id: "e1" },
	]);
});

test("correctly identifies leaves at different points in history", async () => {
	const lix = await openLixInMemory({});

	// Create a scenario similar to the restore-change-set test
	const snapshots = await lix.db
		.insertInto("snapshot")
		.values([
			{ content: { text: "Line 0" } },
			{ content: { text: "Line 1" } },
			{ content: { text: "Line 2" } },
			{ content: { text: "Line 2 Modified" } },
			{ content: { text: "Line 3" } },
		])
		.returning("id")
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c0",
				entity_id: "l0",
				file_id: "file1",
				schema_key: "line",
				plugin_key: "mock_plugin",
				snapshot_id: snapshots[0]!.id,
			},
			{
				id: "c1",
				entity_id: "l1",
				file_id: "file1",
				schema_key: "line",
				plugin_key: "mock_plugin",
				snapshot_id: snapshots[1]!.id,
			},
			{
				id: "c2",
				entity_id: "l2",
				file_id: "file1",
				schema_key: "line",
				plugin_key: "mock_plugin",
				snapshot_id: snapshots[2]!.id,
			},
			{
				id: "c3",
				entity_id: "l2", // Same entity as c2, but newer version
				file_id: "file1",
				schema_key: "line",
				plugin_key: "mock_plugin",
				snapshot_id: snapshots[3]!.id,
			},
			{
				id: "c4",
				entity_id: "l3", // New entity
				file_id: "file1",
				schema_key: "line",
				plugin_key: "mock_plugin",
				snapshot_id: snapshots[4]!.id,
			},
		])
		.returningAll()
		.execute();

	// Create a more complex change set graph:
	// cs0 (base) -> cs1 (modifies l2) -> cs2 (adds l3)
	//           \-> cs3 (alternative version)

	// Base change set with initial content
	const cs0 = await createChangeSet({
		lix,
		id: "cs0",
		changes: [changes[0]!, changes[1]!, changes[2]!],
	});

	// First modification - updates line 2
	const cs1 = await createChangeSet({
		lix,
		id: "cs1",
		changes: [changes[3]!], // This replaces c2 with c3 (same entity)
		parents: [cs0],
	});

	// Second modification - adds line 3
	const cs2 = await createChangeSet({
		lix,
		id: "cs2",
		changes: [changes[4]!],
		parents: [cs1],
	});

	// Alternative branch - used to demonstrate branching in the graph
	const cs3 = await createChangeSet({
		lix,
		id: "cs3",
		changes: [],
		parents: [cs0],
	});

	// Use cs3 in a query to avoid the lint error
	await lix.db
		.selectFrom("change_set")
		.where("id", "=", cs3.id)
		.select(["id"])
		.executeTakeFirst();

	// Visualize the graph structure (optional, for debugging)
	// console.log("Change Set Graph Structure:");
	// console.log("cs0 (c0,c1,c2) -> cs1 (c3) -> cs2 (c4)");
	// console.log("               -> cs3 ()");

	// Test 1: Using changeSetElementIsLeaf with ancestry of cs2
	// This should return c0, c1, c3, c4 (c3 replaces c2 since it's the same entity)
	const leafChangesCs2 = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where(changeSetElementInAncestryOf(cs2))
		.where(changeSetElementIsLeafOf(cs2))
		.select(["change.id", "change.entity_id"])
		.orderBy("change.id")
		.execute();

	// console.log(
	// 	"Leaf changes in ancestry of cs2:",
	// 	leafChangesCs2.map((c) => `${c.id} (${c.entity_id})`)
	// );

	expect(leafChangesCs2.map((c) => c.id).sort()).toEqual([
		"c0",
		"c1",
		"c3",
		"c4",
	]);

	// Test 2: Using only changeSetElementInAncestryOf without leaf filter for cs2
	// This should return all changes in the ancestry: c0, c1, c2, c3, c4
	const allChangesCs2 = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where(changeSetElementInAncestryOf(cs2))
		.select(["change.id", "change.entity_id"])
		.orderBy("change.id")
		.execute();

	// console.log(
	// 	"All changes in ancestry of cs2:",
	// 	allChangesCs2.map((c) => `${c.id} (${c.entity_id})`)
	// );

	expect(allChangesCs2.map((c) => c.id).sort()).toEqual([
		"c0",
		"c1",
		"c2",
		"c3",
		"c4",
	]);

	// Test 3: Simulating the restore scenario for cs1
	// This is why recursive mode is important - we need changes from cs0 too
	const directChangesCs1 = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where("change_set_element.change_set_id", "=", cs1.id)
		.select(["change.id", "change.entity_id"])
		.orderBy("change.id")
		.execute();

	// console.log(
	// 	"Direct changes in cs1:",
	// 	directChangesCs1.map((c) => `${c.id} (${c.entity_id})`)
	// );

	// This only has c3, but to restore cs1 we also need c0 and c1 from cs0
	expect(directChangesCs1.map((c) => c.id).sort()).toEqual(["c3"]);

	// Test 4: Demonstrating why we need recursive mode but without the leaf filter
	// To restore cs1, we need c0, c1 from cs0 and c3 from cs1
	const restoreChangesCs1Recursive = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where(changeSetElementInAncestryOf(cs1))
		// No leaf filter here
		.select(["change.id", "change.entity_id"])
		.orderBy("change.id")
		.execute();

	// console.log(
	// 	"All changes in ancestry of cs1 (needed for restore):",
	// 	restoreChangesCs1Recursive.map((c) => `${c.id} (${c.entity_id})`)
	// );

	// This includes c2, which would be replaced by c3
	expect(restoreChangesCs1Recursive.map((c) => c.id).sort()).toEqual([
		"c0",
		"c1",
		"c2",
		"c3",
	]);

	// Test 5: Demonstrating the issue - when using ancestry + leaf filter
	// This correctly includes c3 instead of c2, but for restore we'd need to handle this differently
	const leafChangesCs1 = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where(changeSetElementInAncestryOf(cs1))
		.where(changeSetElementIsLeafOf(cs1))
		.select(["change.id", "change.entity_id"])
		.orderBy("change.id")
		.execute();

	// console.log(
	// 	"Leaf changes in ancestry of cs1:",
	// 	leafChangesCs1.map((c) => `${c.id} (${c.entity_id})`)
	// );

	expect(leafChangesCs1.map((c) => c.id).sort()).toEqual(["c0", "c1", "c3"]);

	// Test 6: Demonstrating the issue with cs0 restoration
	// When restoring to cs0 but using ancestry + regular leaf filter
	// This incorrectly filters out c2 because c3 is the leaf for entity l2
	const restoreChangesCs0WithLeafAtPoint = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where(changeSetElementInAncestryOf(cs0))
		.where(changeSetElementIsLeafOf(cs0))
		.select(["change.id", "change.entity_id"])
		.orderBy("change.id")
		.execute();

	// console.log(
	// 	"Restore changes for cs0 with leaf-at-point filter:",
	// 	restoreChangesCs0WithLeafAtPoint.map((c) => `${c.id} (${c.entity_id})`)
	// );

	// This should PASS because c2 is included - it's the leaf at the point of cs0
	expect(restoreChangesCs0WithLeafAtPoint.map((c) => c.id).sort()).toEqual([
		"c0",
		"c1",
		"c2",
	]);
});
