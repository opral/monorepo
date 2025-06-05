import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { changeSetElementInAncestryOf } from "./change-set-element-in-ancestry-of.js";
import { changeSetElementIsLeafOf } from "./change-set-element-is-leaf-of.js";

test("returns only leaf change_set_elements per entity", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("stored_schema")
		.values({
			value: {
				"x-lix-key": "mock_schema",
				"x-lix-version": "1.0",
				type: "object",
			},
		})
		.execute();

	// Insert 3 snapshots for the same entity
	await lix.db
		.insertInto("snapshot")
		.values([
			{ id: "s0", content: { val: "0" } },
			{ id: "s1", content: { val: "1" } },
			{ id: "s2", content: { val: "2" } },
		])
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c0",
				entity_id: "e0",
				file_id: "f1",
				schema_version: "1.0",
				schema_key: "mock_schema",
				plugin_key: "p",
				snapshot_id: "s0",
			},
			{
				id: "c1",
				entity_id: "e1",
				file_id: "f1",
				schema_version: "1.0",
				schema_key: "mock_schema",
				plugin_key: "p",
				snapshot_id: "s1",
			},
			{
				id: "c2",
				entity_id: "e1",
				file_id: "f1",
				schema_version: "1.0",
				schema_key: "mock_schema",
				plugin_key: "p",
				snapshot_id: "s2",
			},
		])
		.returningAll()
		.execute();

	const cs0 = await createChangeSet({
		lix,
		id: "cs0",
		elements: [changes[0]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	const cs1 = await createChangeSet({
		lix,
		id: "cs1",
		elements: [changes[1]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		parents: [cs0],
	});

	const cs2 = await createChangeSet({
		lix,
		id: "cs2",
		elements: [changes[2]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		parents: [cs1],
	});

	// Only c2 should be the leaf (latest definition in the ancestry)
	const leafChanges = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_element.change_set_id", "in", [cs0.id, cs1.id, cs2.id])
		.where(changeSetElementIsLeafOf(cs2))
		.select(["change_set_element.change_id", "change_set_element.entity_id"])
		.execute();

	expect(leafChanges).toEqual([
		{ change_id: "c0", entity_id: "e0" },
		{ change_id: "c2", entity_id: "e1" },
	]);
});

test("correctly identifies leaves at different points in history", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("stored_schema")
		.values({
			value: {
				"x-lix-key": "mock_schema",
				"x-lix-version": "1.0",
				type: "object",
			},
		})
		.execute();

	// Create a scenario similar to the restore-change-set test
	await lix.db
		.insertInto("snapshot")
		.values([
			{ id: "s0", content: { text: "Line 0" } },
			{ id: "s1", content: { text: "Line 1" } },
			{ id: "s2", content: { text: "Line 2" } },
			{ id: "s2-modified", content: { text: "Line 2 Modified" } },
			{ id: "s3", content: { text: "Line 3" } },
		])
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c0",
				entity_id: "l0",
				schema_version: "1.0",
				file_id: "file1",
				schema_key: "mock_schema",
				plugin_key: "mock_plugin",
				snapshot_id: "s0",
			},
			{
				id: "c1",
				entity_id: "l1",
				schema_version: "1.0",
				file_id: "file1",
				schema_key: "mock_schema",
				plugin_key: "mock_plugin",
				snapshot_id: "s1",
			},
			{
				id: "c2",
				entity_id: "l2",
				file_id: "file1",
				schema_version: "1.0",
				schema_key: "mock_schema",
				plugin_key: "mock_plugin",
				snapshot_id: "s2",
			},
			{
				id: "c3",
				entity_id: "l2", // Same entity as c2, but newer version
				file_id: "file1",
				schema_version: "1.0",
				schema_key: "mock_schema",
				plugin_key: "mock_plugin",
				snapshot_id: "s2-modified",
			},
			{
				id: "c4",
				entity_id: "l3", // New entity
				file_id: "file1",
				schema_version: "1.0",
				schema_key: "mock_schema",
				plugin_key: "mock_plugin",
				snapshot_id: "s3",
			},
		])
		.returningAll()
		.execute();

	// Create a more complex change set graph:
	// cs0 (base) <- cs1 (modifies l2) <- cs2 (adds l3)
	//           \<- cs3 (alternative version)

	// Base change set with initial content
	const cs0 = await createChangeSet({
		lix,
		id: "cs0",
		elements: [changes[0]!, changes[1]!, changes[2]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	// First modification - updates line 2
	const cs1 = await createChangeSet({
		lix,
		id: "cs1",
		elements: [changes[3]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		parents: [cs0],
	});

	// Second modification - adds line 3
	const cs2 = await createChangeSet({
		lix,
		id: "cs2",
		elements: [changes[4]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		parents: [cs1],
	});

	// Alternative branch - used to demonstrate branching in the graph
	const cs3 = await createChangeSet({
		lix,
		id: "cs3",
		elements: [],
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
		.selectFrom("change_set_element")
		.where(changeSetElementInAncestryOf([cs2]))
		.where(changeSetElementIsLeafOf([cs2]))
		.select(["change_set_element.change_id", "change_set_element.entity_id"])
		.orderBy("change_set_element.change_id")
		.execute();

	// console.log(
	// 	"Leaf changes in ancestry of cs2:",
	// 	leafChangesCs2.map((c) => `${c.change_id} (${c.entity_id})`)
	// );

	expect(leafChangesCs2.map((c) => c.change_id).sort()).toEqual([
		"c0",
		"c1",
		"c3",
		"c4",
	]);

	// Test 2: Using only changeSetElementInAncestryOf without leaf filter for cs2
	// This should return all changes in the ancestry: c0, c1, c2, c3, c4
	const allChangesCs2 = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementInAncestryOf([cs2]))
		.select(["change_set_element.change_id", "change_set_element.entity_id"])
		.orderBy("change_set_element.change_id")
		.execute();

	// console.log(
	// 	"All changes in ancestry of cs2:",
	// 	allChangesCs2.map((c) => `${c.change_id} (${c.entity_id})`)
	// );

	expect(allChangesCs2.map((c) => c.change_id).sort()).toEqual([
		"c0",
		"c1",
		"c2",
		"c3",
		"c4",
	]);

	// Test 3: Simulating the restore scenario for cs1
	// This is why recursive mode is important - we need changes from cs0 too
	const directChangesCs1 = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_element.change_set_id", "=", cs1.id)
		.select(["change_set_element.change_id", "change_set_element.entity_id"])
		.orderBy("change_set_element.change_id")
		.execute();

	// console.log(
	// 	"Direct changes in cs1:",
	// 	directChangesCs1.map((c) => `${c.change_id} (${c.entity_id})`)
	// );

	// This only has c3, but to restore cs1 we also need c0 and c1 from cs0
	expect(directChangesCs1.map((c) => c.change_id).sort()).toEqual(["c3"]);

	// Test 4: Demonstrating why we need recursive mode but without the leaf filter
	// To restore cs1, we need c0, c1 from cs0 and c3 from cs1
	const restoreChangesCs1Recursive = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementInAncestryOf([cs1]))
		// No leaf filter here
		.select(["change_set_element.change_id", "change_set_element.entity_id"])
		.orderBy("change_set_element.change_id")
		.execute();

	// console.log(
	// 	"All changes in ancestry of cs1 (needed for restore):",
	// 	restoreChangesCs1Recursive.map((c) => `${c.change_id} (${c.entity_id})`)
	// );

	// This includes c2, which would be replaced by c3
	expect(restoreChangesCs1Recursive.map((c) => c.change_id).sort()).toEqual([
		"c0",
		"c1",
		"c2",
		"c3",
	]);

	// Test 5: Demonstrating the issue - when using ancestry + leaf filter
	// This correctly includes c3 instead of c2, but for restore we'd need to handle this differently
	const leafChangesCs1 = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementInAncestryOf([cs1]))
		.where(changeSetElementIsLeafOf([cs1]))
		.select(["change_set_element.change_id", "change_set_element.entity_id"])
		.orderBy("change_set_element.change_id")
		.execute();

	// console.log(
	// 	"Leaf changes in ancestry of cs1:",
	// 	leafChangesCs1.map((c) => `${c.change_id} (${c.entity_id})`)
	// );

	expect(leafChangesCs1.map((c) => c.change_id).sort()).toEqual([
		"c0",
		"c1",
		"c3",
	]);

	// Test 6: Demonstrating the issue with cs0 restoration
	// When restoring to cs0 but using ancestry + regular leaf filter
	// This incorrectly filters out c2 because c3 is the leaf for entity l2
	const restoreChangesCs0WithLeafAtPoint = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementInAncestryOf([cs0]))
		.where(changeSetElementIsLeafOf([cs0]))
		.select(["change_set_element.change_id", "change_set_element.entity_id"])
		.orderBy("change_set_element.change_id")
		.execute();

	// console.log(
	// 	"Restore changes for cs0 with leaf-at-point filter:",
	// 	restoreChangesCs0WithLeafAtPoint.map((c) => `${c.change_id} (${c.entity_id})`)
	// );

	// This should PASS because c2 is included - it's the leaf at the point of cs0
	expect(
		restoreChangesCs0WithLeafAtPoint.map((c) => c.change_id).sort()
	).toEqual(["c0", "c1", "c2"]);
});

test("returns combined leaves from multiple target change sets", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("stored_schema")
		.values({
			value: {
				"x-lix-key": "mock_schema",
				"x-lix-version": "1.0",
				type: "object",
			},
		})
		.execute();

	// Create changes
	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c0",
				entity_id: "entity3",
				schema_version: "1.0",
				file_id: "file3",
				schema_key: "mock_schema",
				plugin_key: "mock_plugin",
				snapshot_id: "no-content",
			},
			{
				id: "c1",
				entity_id: "entity1",
				schema_version: "1.0",
				file_id: "file1",
				schema_key: "mock_schema",
				plugin_key: "mock_plugin",
				snapshot_id: "no-content",
			},
			{
				id: "c2",
				entity_id: "entity2",
				schema_version: "1.0",
				file_id: "file2",
				schema_key: "mock_schema",
				plugin_key: "mock_plugin",
				snapshot_id: "no-content",
			},
			{
				// Same entity as c2
				id: "c3",
				entity_id: "entity2",
				schema_version: "1.0",
				file_id: "file2",
				plugin_key: "mock_plugin",
				snapshot_id: "no-content",
				schema_key: "mock_schema",
			},
			{
				id: "c4",
				entity_id: "entity4",
				schema_version: "1.0",
				file_id: "file4",
				schema_key: "mock_schema",
				plugin_key: "mock_plugin",
				snapshot_id: "no-content",
			},
			{
				id: "c5",
				entity_id: "entity5",
				schema_version: "1.0",
				file_id: "file5",
				schema_key: "mock_schema",
				plugin_key: "mock_plugin",
				snapshot_id: "no-content",
			},
			{
				// Index 6 - New change for entity3
				id: "c6",
				entity_id: "entity3", // Same entity as c0
				file_id: "file3",
				schema_version: "1.0",
				schema_key: "mock_schema",
				plugin_key: "mock_plugin",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	// Create change sets with the new history:
	// cs0 <- cs1 <- cs2
	//    \
	//     <- cs3 <- cs4
	const cs0 = await createChangeSet({
		lix,
		id: "cs0",
		elements: [changes[0]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	const cs1 = await createChangeSet({
		lix,
		id: "cs1",
		elements: [changes[1]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		parents: [cs0],
	});

	const cs2 = await createChangeSet({
		lix,
		id: "cs2",
		elements: [changes[2]!, changes[6]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		parents: [cs1],
	});

	const cs3 = await createChangeSet({
		lix,
		id: "cs3",
		elements: [changes[3]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		parents: [cs0],
	});

	const cs4 = await createChangeSet({
		lix,
		id: "cs4",
		elements: [changes[4]!, changes[5]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		parents: [cs3],
	});

	// Test 1: Leaves in cs2 (Ancestry: cs0 -> cs1 -> cs2)
	const leavesCs2 = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementIsLeafOf([cs2]))
		.selectAll()
		.execute();
	// Expected leaves: c1, c2, c6 (c0 is superseded by c6)
	expect(leavesCs2.map((c) => c.change_id).sort()).toEqual(["c1", "c2", "c6"]);

	// Test 2: Leaves in cs4 branch (Ancestry: cs0 -> cs3 -> cs4)
	const leavesCs4 = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementIsLeafOf([cs4]))
		.selectAll()
		.execute();
	// Expected leaves: c0, c3, c4, c5
	expect(leavesCs4.map((c) => c.change_id).sort()).toEqual([
		"c0",
		"c3",
		"c4",
		"c5",
	]);

	// Test 3: Combined leaves from both cs2 and cs4 branches
	const combinedLeaves = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementIsLeafOf([cs2, cs4])) // Target heads are cs2 and cs4
		.selectAll()
		.execute();

	// Expected combined leaves:
	// c0 is NOT included as it's superseded by c6 in the cs2 branch
	// - c1 (entity1): leaf in cs2 ancestry
	// - c2 (entity2): leaf in cs2 ancestry (diverged from c3, BOTH LEAVES)
	// - c3 (entity2): leaf in cs4 ancestry (diverged from c2, BOTH LEAVES)
	// - c4 (entity4): leaf in cs4 ancestry
	// - c5 (entity5): leaf in cs4 ancestry
	// - c6 (entity3): leaf in cs2 ancestry, supersedes c0
	expect(combinedLeaves.map((c) => c.change_id).sort()).toEqual([
		"c1",
		"c2",
		"c3",
		"c4",
		"c5",
		"c6", // <-- Supersedes c0
	]);
	expect(combinedLeaves).toHaveLength(6);
});
