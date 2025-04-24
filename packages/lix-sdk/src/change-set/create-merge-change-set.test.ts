import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createMergeChangeSet } from "./create-merge-change-set.js";
import { createChangeSet } from "./create-change-set.js";

test("it should merge non-conflicting changes", async () => {
	const lix = await openLixInMemory({});

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c0",
				entity_id: "e0",
				file_id: "file0",
				plugin_key: "mock_plugin",
				schema_key: "test_schema",
				snapshot_id: "no-content",
			},
			{
				id: "c1",
				entity_id: "e1",
				file_id: "file0",
				plugin_key: "mock_plugin",
				schema_key: "test_schema",
				snapshot_id: "no-content",
			},
			{
				id: "c2",
				entity_id: "e2",
				file_id: "file0",
				plugin_key: "mock_plugin",
				schema_key: "test_schema",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	const cs0 = await createChangeSet({
		lix,
		elements: [changes[0]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	const cs1 = await createChangeSet({
		lix,
		elements: [changes[1]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	// simulating graph relation
	const cs2 = await createChangeSet({
		lix,
		elements: [changes[2]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		parents: [cs1],
	});

	const merged = await createMergeChangeSet({
		lix,
		source: cs0,
		target: cs2,
	});

	const mergedElements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_element.change_set_id", "=", merged.id)
		.selectAll()
		.execute();

	expect(mergedElements).toHaveLength(3);
	expect(mergedElements.map((e) => e.change_id).sort()).toEqual(
		[changes[0]!.id, changes[1]!.id, changes[2]!.id].sort()
	);
});

test("should handle conflicting elements with source winning (until conflicts are modeled in lix)", async () => {
	const lix = await openLixInMemory({});

	// Create initial snapshots with different content
	const snapshots = await lix.db
		.insertInto("snapshot")
		.values([
			{ content: { text: "base" } },
			{ content: { text: "target mod" } },
			{ content: { text: "source mod" } },
		])
		.returning("id")
		.execute();

	// Create changes for the different states of the same entity
	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c_base",
				entity_id: "e1",
				file_id: "file1",
				plugin_key: "mock_plugin",
				schema_key: "s1",
				snapshot_id: snapshots[0]!.id,
			},
			{
				id: "c_target",
				entity_id: "e1", // Same entity as base, different content
				file_id: "file1",
				plugin_key: "mock_plugin",
				schema_key: "s1",
				snapshot_id: snapshots[1]!.id,
			},
			{
				id: "c_source",
				entity_id: "e1", // Same entity as base, different content
				file_id: "file1",
				plugin_key: "mock_plugin",
				schema_key: "s1",
				snapshot_id: snapshots[2]!.id,
			},
		])
		.returningAll()
		.execute();

	// 1. Base change set with initial content
	const cs_base = await createChangeSet({
		lix,
		elements: [changes[0]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	// 2. Target branch - modifies e1
	const cs_target = await createChangeSet({
		lix,
		elements: [changes[1]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		parents: [cs_base],
	});

	// 3. Source branch - modifies e1 differently
	const cs_source = await createChangeSet({
		lix,
		elements: [changes[2]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		parents: [cs_base],
	});

	// 4. Merge source into target
	const merged = await createMergeChangeSet({
		lix,
		source: cs_source,
		target: cs_target,
	});

	// 5. Verify merged change set elements
	const mergedElements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_element.change_set_id", "=", merged.id)
		.selectAll()
		.execute();

	// The merge should only contain the element from the source change set due to "source wins"
	expect(mergedElements).toHaveLength(1);
	expect(mergedElements[0]).toEqual(
		expect.objectContaining({
			change_set_id: merged.id,
			change_id: changes[2]!.id,
			entity_id: changes[2]!.entity_id,
			schema_key: changes[2]!.schema_key,
			file_id: changes[2]!.file_id,
		})
	);

	// 6. Verify graph structure
	const edges = await lix.db
		.selectFrom("change_set_edge")
		.where("child_id", "=", merged.id)
		.selectAll()
		.execute();

	expect(edges).toHaveLength(2);
	expect(edges.map((e) => e.parent_id).sort()).toEqual(
		[cs_source.id, cs_target.id].sort()
	);
});
